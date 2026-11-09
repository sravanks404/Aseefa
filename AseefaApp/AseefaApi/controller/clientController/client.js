const sql = require("mssql");
const dbConfig = require("../../config/mssql");
const toDate = (val) => (val && val.toString().trim() !== "" ? val : null);
const toStr = (val) => (val ?? "").toString().trim();

const insertClient = async (req, res) => {
  try {
    const {
      CompanyName,
      UserId,
      CompanyId,
      CustomerSuitAppsId,
      Email,
      Phone,
      ProjectLocation,
      Latitude,
      Longitude,
      Remark,
      Image,
      ContactPersons,
    } = req.body;

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("CompanyName", sql.NVarChar(200), CompanyName)
      .input("UserId", sql.Int, UserId)
      .input("CompanyId", sql.Int, CompanyId)
      .input("CustomerSuitAppsId", sql.BigInt, CustomerSuitAppsId ?? null)
      .input("Email", sql.NVarChar(200), Email ?? null)
      .input("Phone", sql.NVarChar(50), Phone ?? null)
      .input("ProjectLocation", sql.NVarChar(200), ProjectLocation ?? null)
      .input("Latitude", sql.Decimal(18, 8), Latitude ?? null)
      .input("Longitude", sql.Decimal(18, 8), Longitude ?? null)
      .input("Remark", sql.NVarChar(sql.MAX), Remark ?? null)
      .input(
        "Image",
        sql.VarBinary(sql.MAX),
        Image
          ? Buffer.from(Image.replace(/^data:image\/\w+;base64,/, ""), "base64")
          : null,
      )
      .input(
        "ContactPersons",
        sql.NVarChar(sql.MAX),
        Array.isArray(ContactPersons) ? JSON.stringify(ContactPersons) : null,
      )
      .execute("APPInsertClient");

    return res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (error) {
    console.error("Insert Client Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCustomersByCompanyid = async (req, res) => {
  const { Companyid } = req.query;

  if (!Companyid) {
    return res.status(400).json({
      success: false,
      message: "Companyid is required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("Companyid", sql.Int, parseInt(Companyid))
      .execute("APP_GetCustomerNew");

    res.json({
      success: true,
      customers: result.recordset
    });

  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// const getClientDetails = async (req, res) => {
//   try {
//     const { CompanyId, AccountID } = req.body;

//     const pool = await sql.connect(dbConfig);

//     const request = pool.request();

//     request.input("CompanyId", sql.Int, CompanyId || null);

//     request.input("AccountID", sql.Int, AccountID || null);

//     const result = await request.execute("APPGetClientDetails");

//     const clients = result.recordset.map((item) => {
//       return {
//         AccountID: item.AccountID,
//         CompanyName: item.CompanyName,
//         Email: item.Email,
//         Phone: item.Phone,
//         ProjectLocation: item.ProjectLocation,
//         Remark: item.Remark,

//         // convert image binary to base64
//         Image: item.Image
//           ? `data:image/jpeg;base64,${Buffer.from(item.Image).toString("base64")}`
//           : null,

//         Latitude: item.Latitude,
//         Longitude: item.Longitude,
//         Status: item.Status,
//         CreatedDateAndTime: item.CreatedDateAndTime,

//         ContactPersons: item.ContactPersons
//           ? JSON.parse(item.ContactPersons)
//           : [],
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: clients,
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: "Error getting client details",
//       error: error.message,
//     });
//   }
// };
const getClientDetails = async (req, res) => {
  try {
    const { CompanyId, AccountID } = req.query;

    if (!CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CompanyId is required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const request = pool.request();

    request.input("CompanyId", sql.Int, parseInt(CompanyId));
    request.input(
      "AccountID",
      sql.Int,
      AccountID ? parseInt(AccountID) : null
    );

    const result = await request.execute("APPGetClientDetails");

    const clients = result.recordset.map((item) => ({
      AccountID: item.AccountID,
      CompanyName: item.CompanyName,
      Email: item.Email,
      Phone: item.Phone,
      ProjectLocation: item.ProjectLocation,
      Remark: item.Remark,
      Image: item.Image
        ? `data:image/jpeg;base64,${Buffer.from(item.Image).toString("base64")}`
        : null,
      Latitude: item.Latitude,
      Longitude: item.Longitude,
      Status: item.Status,
      CreatedDateAndTime: item.CreatedDateAndTime,
      ContactPersons: item.ContactPersons
        ? JSON.parse(item.ContactPersons)
        : [],
    }));

    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error getting client details",
      error: error.message,
    });
  }
};

const getTodayClientSupplierCount = async (req, res) => {
  try {
    const createdBy = req.query.createdBy;

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("CreatedBy", sql.Int, createdBy)
      .execute("APPGetClientCount");

    return res.status(200).json({
      success: true,

      summary: result.recordsets[0][0], // today count

      chart: result.recordsets[1], // last 7 days
    });
  } catch (err) {
    console.log("Count Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const insertRequirement = async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    try {
      // First detail insert (creates ClientRequirements row)
      const firstDetail = req.body.Details[0];

      let request = new sql.Request(transaction);

      request.input("ClientID", sql.Int, req.body.ClientID);
      request.input(
        "ClientName",
        sql.NVarChar(200),
        toStr(req.body.ClientName),
      );
      request.input(
        "ProjectName",
        sql.NVarChar(200),
        toStr(req.body.ProjectName),
      );
      request.input("Date", sql.Date, toDate(req.body.Date)); // ✅ null if empty
      request.input(
        "ProjectLocation",
        sql.NVarChar(300),
        toStr(req.body.ProjectLocation),
      );
      request.input(
        "MobilizationDate",
        sql.Date,
        toDate(req.body.MobilizationDate),
      ); // ✅ null if empty
      request.input("Remark", sql.NVarChar(sql.MAX), toStr(req.body.Remark));
      request.input("CreatedBy", sql.Int, req.body.CreatedBy);

      request.input("RoleName", sql.NVarChar(200), toStr(firstDetail.RoleName));
      request.input("RoleID", sql.Int, firstDetail.RoleID);
      request.input("Quantity", sql.Int, firstDetail.Quantity);
      request.input(
        "DetailRemark",
        sql.NVarChar(sql.MAX),
        toStr(firstDetail.DetailRemark),
      );

      let result = await request.execute("APPInsertClientRequirement");

      let RequirementID = result.recordset[0].RequirementID;

      // Remaining details — direct INSERT
      for (let i = 1; i < req.body.Details.length; i++) {
        let detail = req.body.Details[i];

        let detailRequest = new sql.Request(transaction);

        detailRequest.input("RequirementID", sql.Int, RequirementID);
        detailRequest.input(
          "RoleName",
          sql.NVarChar(200),
          toStr(detail.RoleName),
        );
        detailRequest.input("RoleID", sql.Int, detail.RoleID);
        detailRequest.input("Quantity", sql.Int, detail.Quantity);
        detailRequest.input(
          "Remark",
          sql.NVarChar(sql.MAX),
          toStr(detail.DetailRemark),
        );

        await detailRequest.query(`
                    INSERT INTO ClientRequirementDetails
                    (
                        RequirementID,
                        RoleName,
                        RoleID,
                        Quantity,
                        Remark
                    )
                    VALUES
                    (
                        @RequirementID,
                        @RoleName,
                        @RoleID,
                        @Quantity,
                        @Remark
                    )
                `);
      }

      await transaction.commit();

      res.json({
        success: true,
        RequirementID,
      });
    } catch (innerError) {
      // ✅ Rollback was missing — without this a failed mid-loop
      // insert would leave a dangling open transaction on the pool
      await transaction.rollback();

      res.status(500).json({
        success: false,
        message: innerError.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getChartData = async (req, res) => {
  try {
    const CreatedBy = req.query.createdBy;

    if (!CreatedBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy is required",
      });
    }

    let FromDate = req.query.fromDate;
    let ToDate = req.query.toDate;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    //  AUTO LAST 7 DAYS IF NOT PROVIDED
    if (!FromDate || !ToDate) {
      const past = new Date();
      past.setDate(past.getDate() - 6);

      FromDate = past.toISOString().split("T")[0];
      ToDate = todayStr;
    }

    const from = new Date(FromDate);
    const to = new Date(ToDate);

    //  invalid date check
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    //  future date check
    if (from > today || to > today) {
      return res.status(400).json({
        success: false,
        message: "Future dates are not allowed",
      });
    }

    //  from > to check
    if (from > to) {
      return res.status(400).json({
        success: false,
        message: "FromDate cannot be greater than ToDate",
      });
    }

    // VALIDATION END

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("CreatedBy", sql.Int, CreatedBy)
      .input("FromDate", sql.Date, FromDate)
      .input("ToDate", sql.Date, ToDate)
      .execute("APPGetChartData");

    return res.status(200).json({
      success: true,
      data: result.recordset,
      range: {
        from: FromDate,
        to: ToDate,
      },
    });
  } catch (error) {
    console.error("Chart API Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  insertClient,
  getClientDetails,
  insertRequirement,
  getTodayClientSupplierCount,
  getChartData,
  getCustomersByCompanyid,
};
