const sql = require("mssql");
const dbConfig = require("../../config/mssql");

const getPropertyMaster = async (req, res) => {
  try {
    const { CompanyID, PropertyID } = req.query;

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required",
      });
    }

    if (!PropertyID) {
      return res.status(400).json({
        success: false,
        message: "PropertyID is required", // 1.Micro@admin123
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("CompanyID", sql.Int, CompanyID)
      .input("PropertyID", sql.Int, PropertyID)
      .execute("GetPropertyMaster");

    const data = (result.recordset || []).map((row) => ({
      ...row,
      RoomID: row.RecordID,
      RoomNo: row.FlatNo,
      TypeID: row.RecordID,
      RoomType: row.FlatType,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Property Master Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get Property Master",
      error: error.message,
    });
  }
};

const getPropertyMasterByID = async (req, res) => {
  try {
    const { RecordID, CompanyID, PropertyID } = req.query;

    if (!RecordID) {
      return res.status(400).json({
        success: false,
        message: "RecordID is required",
      });
    }
    if (!PropertyID) {
      return res.status(400).json({
        success: false,
        message: "PropertyID is required",
      });
    }

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()

      .input("RecordID", sql.Int, RecordID)

      .input("CompanyID", sql.Int, CompanyID)
      .input("PropertyID", sql.Int, PropertyID)

      .execute("GetPropertyMasterByID");

    const baseRow =
      result.recordsets[0] && result.recordsets[0].length > 0
        ? result.recordsets[0][0]
        : null;

    const rowData = baseRow
      ? {
          ...baseRow,
          RoomID: baseRow.RecordID,
          RoomNo: baseRow.FlatNo,
          TypeID: baseRow.RecordID,
          RoomType: baseRow.FlatType,
        }
      : null;

    return res.status(200).json({
      success: true,
      data: rowData,
      cheques: result.recordsets[1] || [],
    });
  } catch (error) {
    console.error("Get Property Master By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get Property Master",
      error: error.message,
    });
  }
};

const insertUpdatePropertyMasterData = async (req, res) => {
  try {
    const {
      RecordID = 0,
      CompanyID,
      PropertyID,
      UserID,

      FlatNo,
      TenantName,
      FlatType,

      RentalAmount,
      CashReceived,

      Remarks,

      Cheques = [],
    } = req.body;

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required",
      });
    }

    if (!PropertyID) {
      return res.status(400).json({
        success: false,
        message: "PropertyID is required",
      });
    }

    if (!UserID) {
      return res.status(400).json({
        success: false,
        message: "UserID is required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()

      .input("RecordID", sql.Int, RecordID)

      .input("CompanyID", sql.Int, CompanyID)
      .input("PropertyID", sql.Int, PropertyID)

      .input("UserID", sql.Int, UserID)

      .input("FlatNo", sql.NVarChar(50), FlatNo || null)

      .input("TenantName", sql.NVarChar(150), TenantName || null)

      .input("FlatType", sql.NVarChar(50), FlatType || null)

      .input("RentalAmount", sql.Decimal(18, 2), RentalAmount || 0)

      .input("CashReceived", sql.Decimal(18, 2), CashReceived || 0)

      .input("Remarks", sql.NVarChar(500), Remarks || null)

      .input(
        "ChequesJson",
        sql.NVarChar(sql.MAX),
        JSON.stringify(Cheques || []),
      )

      .execute("InsertUpdatePropertyMasterData");

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Insert Update Property Master Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save Property Master",
      error: error.message,
    });
  }
};

const deletePropertyMaster = async (req, res) => {
  try {
    const { RecordID, PropertyID, CompanyID, UserID } = req.body;

    /* ============================================
           VALIDATION
           ============================================ */

    if (!RecordID) {
      return res.status(400).json({
        success: false,
        message: "RecordID is required",
      });
    }

    if (!PropertyID) {
      return res.status(400).json({
        success: false,
        message: "PropertyID is required",
      });
    }

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required",
      });
    }

    if (!UserID) {
      return res.status(400).json({
        success: false,
        message: "UserID is required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()

      .input("RecordID", sql.Int, RecordID)

      .input("CompanyID", sql.Int, CompanyID)
      .input("PropertyID", sql.Int, PropertyID)

      .input("UserID", sql.Int, UserID)

      .execute("DeletePropertyMaster");

    return res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Delete Property Master Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete Property Master",
      error: error.message,
    });
  }
};

const getPropertyMasterCheque = async (req, res) => {
  try {
    const { RentID, CompanyID } = req.query;

    if (!RentID) {
      return res.status(400).json({
        success: false,
        message: "RentID is required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("RentID", sql.Int, parseInt(RentID, 10))
      .input("CompanyID", sql.Int, CompanyID ? parseInt(CompanyID, 10) : null)
      .execute("WebGetPropertyMasterCheque");

    return res.status(200).json({
      success: true,
      data: result.recordset || [],
    });
  } catch (error) {
    console.error("getPropertyMasterCheque:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── POST insert or update one cheque ─────────────────────────
const insertUpdatePropertyMasterCheque = async (req, res) => {
  try {
    const {
      ChequeID = 0,
      RecordID,
      PropertyID,
      RentID,
      SequenceNo,
      ChequeAmount,
      ChequeDate,
      UserID,
    } = req.body;

    if (!RentID || !PropertyID) {
      return res.status(400).json({
        success: false,
        message: "RentID and PropertyID are required",
      });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.output("ChequeID", sql.Int, ChequeID ? parseInt(ChequeID, 10) : 0);

    // request.input('ChequeID',     sql.Int,           ChequeID ? parseInt(ChequeID, 10) : 0);
    request.input(
      "RecordID",
      sql.Int,
      RecordID ? parseInt(RecordID, 10) : null,
    );
    request.input("PropertyID", sql.Int, parseInt(PropertyID, 10));
    request.input("RentID", sql.Int, parseInt(RentID, 10));
    request.input(
      "SequenceNo",
      sql.Int,
      SequenceNo ? parseInt(SequenceNo, 10) : null,
    );
    request.input(
      "ChequeAmount",
      sql.Decimal(18, 2),
      ChequeAmount != null && ChequeAmount !== ""
        ? parseFloat(ChequeAmount)
        : null,
    );
    request.input("ChequeDate", sql.Date, ChequeDate || null);
    request.input(
      "CreatedBy",
      sql.Int,
      ChequeID ? null : UserID ? parseInt(UserID, 10) : null,
    );
    request.input("ModifiedBy", sql.Int, UserID ? parseInt(UserID, 10) : null);

    const result = await request.execute("WebInsertUpdatePropertyMasterCheque");

    return res.status(200).json({
      success: true,
      ChequeID: result.output.ChequeID,
      message: ChequeID ? "Cheque updated" : "Cheque created",
    });
  } catch (error) {
    console.error("insertUpdatePropertyMasterCheque:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── DELETE one cheque ────────────────────────────────────────
const deletePropertyMasterCheque = async (req, res) => {
  try {
    const { ChequeID, RentID, CompanyID, UserID } = req.body;

    if (!ChequeID || !RentID) {
      return res.status(400).json({
        success: false,
        message: "ChequeID and RentID are required",
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool
      .request()
      .input("ChequeID", sql.Int, parseInt(ChequeID, 10))
      .input("RentID", sql.Int, parseInt(RentID, 10))
      .input("CompanyID", sql.Int, CompanyID ? parseInt(CompanyID, 10) : null)
      .input("DeletedBy", sql.Int, UserID ? parseInt(UserID, 10) : null)
      .execute("WebDeletePropertyMasterCheque");

    return res.status(200).json({
      success: true,
      message: "Cheque deleted",
    });
  } catch (error) {
    console.error("deletePropertyMasterCheque:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPropertyMaster,
  getPropertyMasterByID,
  insertUpdatePropertyMasterData,
  deletePropertyMaster,
  getPropertyMasterCheque,
  insertUpdatePropertyMasterCheque,
  deletePropertyMasterCheque,
};
