// const sql = require("mssql");
// const path = require("path");
// const dbConfig = require("../../config/mssql");

// const getRentalTransactions = async (req, res) => {
//   try {
//     const { CompanyID, PropertyID, RentID } = req.query;

//     if (!CompanyID || !PropertyID) {
//       return res.status(400).json({
//         success: false,
//         message: "CompanyID and PropertyID are required",
//       });
//     }

//     const pool = await sql.connect(dbConfig);

//     const result = await pool
//       .request()
//       .input("CompanyID", sql.Int, Number(CompanyID))
//       .input("PropertyID", sql.Int, Number(PropertyID))
//       .input("RentID", RentID ? Number(RentID) : null)
//       .input("UserID", sql.Int, null)
//       .execute("GetRentalTransactions");

//     // Ensure clean, sequential numbering per TransactionType without duplicates
//     const typeCounters = {};
//     const transactions = (result.recordset || []).map((t) => {
//       const rawType = (t.TransactionType || "Cheque").trim();
//       const canonicalType =
//         rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
//       const typeKey = canonicalType.toLowerCase();

//       typeCounters[typeKey] = (typeCounters[typeKey] || 0) + 1;
//       const computedSeq = typeCounters[typeKey];

//       // Use stored sequence if valid and matches position, otherwise use computed sequential number
//       const seq =
//         t.Sequence && Number(t.Sequence) === computedSeq
//           ? Number(t.Sequence)
//           : computedSeq;

//       const label = `${canonicalType} ${seq}`;

//       return {
//         ...t,
//         TransactionType: canonicalType,
//         Sequence: seq,
//         Label: label,
//       };
//     });

//     res.json({
//       success: true,
//       transactions,
//     });
//   } catch (error) {
//     console.error("getRentalTransactions:", error);

//     res.status(500).json({
//       success: false,
//       message: "Error loading rental transactions",
//     });
//   }
// };

// const saveRentalTransactions = async (req, res) => {
//   try {
//     const { CompanyID, PropertyID, RentID, UserID, TransactionsJson } =
//       req.body;

//     if (!CompanyID) {
//       return res.status(400).json({
//         success: false,
//         message: "CompanyID is required",
//       });
//     }

//     if (!PropertyID) {
//       return res.status(400).json({
//         success: false,
//         message: "PropertyID is required",
//       });
//     }

//     if (!RentID) {
//       return res.status(400).json({
//         success: false,
//         message: "RentID is required",
//       });
//     }

//     let rows = [];
//     try {
//       rows = JSON.parse(TransactionsJson || "[]");
//     } catch {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid TransactionsJson payload",
//       });
//     }

//     if (!Array.isArray(rows) || rows.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No transactions to save",
//       });
//     }

//     // Map uploaded files by field name: file_<RowId> → relative path
//     const fileByRow = {};
//     (req.files || []).forEach((f) => {
//       const m = /^file_(.+)$/.exec(f.fieldname);
//       if (m) {
//         fileByRow[m[1]] = path
//           .relative(path.join(__dirname, ".."), f.path)
//           .replace(/\\/g, "/");
//       }
//     });

//     const pool = await sql.connect(dbConfig);

//     // Fetch existing active transactions using the stored procedure to get the current sequence base
//     const existingResult = await pool
//       .request()
//       .input("CompanyID", sql.Int, Number(CompanyID))
//       .input("PropertyID", sql.Int, Number(PropertyID))
//       .input("RentID", sql.Int, Number(RentID))
//       .input("UserID", sql.Int, null)
//       .execute("GetRentalTransactions");

//     const existingRows = existingResult.recordset || [];
//     const seqCounterByType = {};
//     existingRows.forEach((tx) => {
//       const rawType = (tx.TransactionType || "Cheque").trim();
//       const typeKey = rawType.toLowerCase();
//       seqCounterByType[typeKey] = (seqCounterByType[typeKey] || 0) + 1;
//     });

//     const savedRows = [];

//     for (const r of rows) {
//       if (!r.TransactionType) continue;

//       const rawType = (r.TransactionType || "Cheque").trim();
//       const canonicalType =
//         rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
//       const typeKey = canonicalType.toLowerCase();

//       // If new transaction, auto-generate next sequence for this type
//       let finalSeq;
//       let finalLabel;
//       if (!r.TransactionID || Number(r.TransactionID) === 0) {
//         seqCounterByType[typeKey] = (seqCounterByType[typeKey] || 0) + 1;
//         finalSeq = seqCounterByType[typeKey];
//         finalLabel = `${canonicalType} ${finalSeq}`;
//       } else {
//         finalSeq = r.Sequence ? Number(r.Sequence) : 1;
//         finalLabel = r.Label || `${canonicalType} ${finalSeq}`;
//       }

//       const uploadedPath =
//         r.RowId && fileByRow[r.RowId] ? fileByRow[r.RowId] : null;

//       const finalPath = uploadedPath || r.ExistingPath || null;

//       const result = await pool
//         .request()
//         .input(
//           "TransactionID",
//           sql.Int,
//           r.TransactionID ? Number(r.TransactionID) : 0,
//         )
//         .input("RentID", sql.Int, Number(RentID))
//         .input("PropertyID", sql.Int, Number(PropertyID))
//         .input("RecordID", sql.Int, r.RecordID ? Number(r.RecordID) : null)
//         .input("CompanyID", sql.Int, Number(CompanyID))
//         .input("UserID", sql.Int, UserID ? Number(UserID) : null)
//         .input("TransactionType", sql.NVarChar(20), canonicalType)
//         .input("Sequence", sql.Int, finalSeq)
//         .input("Label", sql.NVarChar(100), finalLabel)
//         .input("Amount", sql.Decimal(18, 2), r.Amount ? Number(r.Amount) : 0)
//         .input("TransactionDate", sql.Date, r.TransactionDate || null)
//         .input("ChequeNo", sql.NVarChar(100), r.ChequeNo || null)
//         .input("ChequeFile", sql.NVarChar(500), finalPath)
//         .input("CashReference", sql.NVarChar(100), r.CashReference || null)
//         .input("TenancyStartDate", sql.Date, r.TenancyStartDate || null)
//         .input("TenancyEndDate", sql.Date, r.TenancyEndDate || null)
//         .input("TenancyNotes", sql.NVarChar(500), r.TenancyNotes || null)
//         .input("Notes", sql.NVarChar(500), r.Notes || null)
//         .execute("InsertUpdateRentalTransaction");

//       const saved = result.recordset?.[0] || {};

//       savedRows.push({
//         RowId: r.RowId,
//         TransactionID: saved.TransactionID,
//         TransactionType: canonicalType,
//         Sequence: finalSeq,
//         Label: finalLabel,
//         Path: finalPath,
//       });
//     }

//     res.json({
//       success: true,
//       message: "Transactions saved successfully",
//       saved: savedRows,
//     });
//   } catch (error) {
//     console.error("saveRentalTransactions:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message || "Error saving rental transactions",
//     });
//   }
// };

// const deleteRentalTransaction = async (req, res) => {
//   try {
//     const { TransactionID, UserID } = req.body;

//     if (!TransactionID) {
//       return res.status(400).json({
//         success: false,
//         message: "TransactionID is required",
//       });
//     }

//     const pool = await sql.connect(dbConfig);

//     const result = await pool
//       .request()
//       .input("TransactionID", sql.Int, Number(TransactionID))
//       .input("UserID", sql.Int, UserID ? Number(UserID) : null)
//       .execute("DeleteRentalTransaction");

//     res.json({
//       success: true,
//       message: "Transaction deleted successfully",
//     });
//   } catch (error) {
//     console.error("deleteRentalTransaction:", error);

//     res.status(500).json({
//       success: false,
//       message: "Error deleting transaction",
//     });
//   }
// };

// module.exports = {
//   getRentalTransactions,
//   saveRentalTransactions,
//   deleteRentalTransaction,
// };
const sql = require("mssql");
const path = require("path");
const dbConfig = require("../../config/mssql");

const getRentalTransactions = async (req, res) => {
  try {
    const { CompanyID, PropertyID, RentID } = req.query;

    if (!CompanyID || !PropertyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID and PropertyID are required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("CompanyID", sql.Int, Number(CompanyID))
      .input("PropertyID", sql.Int, Number(PropertyID))
      .input("RentID", sql.Int, RentID ? Number(RentID) : null)
      .input("UserID", sql.Int, null)
      .execute("GetRentalTransactions");

    // Ensure clean, sequential numbering per TransactionType without duplicates
    const typeCounters = {};
    const transactions = (result.recordset || []).map((t) => {
      const rawType = (t.TransactionType || "Cheque").trim();
      const canonicalType =
        rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      const typeKey = canonicalType.toLowerCase();

      typeCounters[typeKey] = (typeCounters[typeKey] || 0) + 1;
      const computedSeq = typeCounters[typeKey];

      // Use stored sequence if valid and matches position, otherwise use computed sequential number
      const seq =
        t.Sequence && Number(t.Sequence) === computedSeq
          ? Number(t.Sequence)
          : computedSeq;

      const label = `${canonicalType} ${seq}`;

      return {
        ...t,
        TransactionType: canonicalType,
        Sequence: seq,
        Label: label,
      };
    });

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("getRentalTransactions:", error);

    res.status(500).json({
      success: false,
      message: "Error loading rental transactions",
    });
  }
};

const saveRentalTransactions = async (req, res) => {
  try {
    const { CompanyID, PropertyID, RentID, UserID, TransactionsJson } =
      req.body;

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

    if (!RentID) {
      return res.status(400).json({
        success: false,
        message: "RentID is required",
      });
    }

    let rows = [];
    try {
      rows = JSON.parse(TransactionsJson || "[]");
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid TransactionsJson payload",
      });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No transactions to save",
      });
    }

    // Map uploaded files by field name: file_<RowId> → relative path
    const fileByRow = {};
    (req.files || []).forEach((f) => {
      const m = /^file_(.+)$/.exec(f.fieldname);
      if (m) {
        fileByRow[m[1]] = path
          .relative(path.join(__dirname, ".."), f.path)
          .replace(/\\/g, "/");
      }
    });

    const pool = await sql.connect(dbConfig);

    // Resolve the tenant's current lease (RentID currently holds the tenant UserId)
    let rentalId = req.body.RentalID ? Number(req.body.RentalID) : null;
    if (!rentalId) {
      const lease = await pool
        .request()
        .input("UserId", sql.Int, Number(RentID))
        .input("CompanyID", sql.Int, Number(CompanyID))
        .query(`
          SELECT u.RentalID
          FROM dbo.UserTable u
          JOIN dbo.PropertyRental pr ON pr.RentalID = u.RentalID AND pr.IsDeleted = 0
          WHERE u.UserId = @UserId AND u.CompanyID = @CompanyID
        `);
      rentalId = lease.recordset[0]?.RentalID || null;
    }

    // Fetch existing active transactions using the stored procedure to get the current sequence base
    const existingResult = await pool
      .request()
      .input("CompanyID", sql.Int, Number(CompanyID))
      .input("PropertyID", sql.Int, Number(PropertyID))
      .input("RentID", sql.Int, Number(RentID))
      .input("UserID", sql.Int, null)
      .execute("GetRentalTransactions");

    const existingRows = existingResult.recordset || [];
    const seqCounterByType = {};
    existingRows.forEach((tx) => {
      const rawType = (tx.TransactionType || "Cheque").trim();
      const typeKey = rawType.toLowerCase();
      seqCounterByType[typeKey] = (seqCounterByType[typeKey] || 0) + 1;
    });

    const savedRows = [];

    for (const r of rows) {
      if (!r.TransactionType) continue;

      const rawType = (r.TransactionType || "Cheque").trim();
      const canonicalType =
        rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
      const typeKey = canonicalType.toLowerCase();

      // If new transaction, auto-generate next sequence for this type
      let finalSeq;
      let finalLabel;
      if (!r.TransactionID || Number(r.TransactionID) === 0) {
        seqCounterByType[typeKey] = (seqCounterByType[typeKey] || 0) + 1;
        finalSeq = seqCounterByType[typeKey];
        finalLabel = `${canonicalType} ${finalSeq}`;
      } else {
        finalSeq = r.Sequence ? Number(r.Sequence) : 1;
        finalLabel = r.Label || `${canonicalType} ${finalSeq}`;
      }

      const uploadedPath =
        r.RowId && fileByRow[r.RowId] ? fileByRow[r.RowId] : null;

      const finalPath = uploadedPath || r.ExistingPath || null;

      const result = await pool
        .request()
        .input(
          "TransactionID",
          sql.Int,
          r.TransactionID ? Number(r.TransactionID) : 0,
        )
        .input("RentID", sql.Int, Number(RentID))
        .input("RentalID", sql.Int, rentalId)
        .input("PropertyID", sql.Int, Number(PropertyID))
        .input("RecordID", sql.Int, r.RecordID ? Number(r.RecordID) : null)
        .input("CompanyID", sql.Int, Number(CompanyID))
        .input("UserID", sql.Int, UserID ? Number(UserID) : null)
        .input("TransactionType", sql.NVarChar(20), canonicalType)
        .input("Sequence", sql.Int, finalSeq)
        .input("Label", sql.NVarChar(100), finalLabel)
        .input("Amount", sql.Decimal(18, 2), r.Amount ? Number(r.Amount) : 0)
        .input("TransactionDate", sql.Date, r.TransactionDate || null)
        .input("ChequeNo", sql.NVarChar(100), r.ChequeNo || null)
        .input("ChequeFile", sql.NVarChar(500), finalPath)
        .input("CashReference", sql.NVarChar(100), r.CashReference || null)
        .input("TenancyStartDate", sql.Date, r.TenancyStartDate || null)
        .input("TenancyEndDate", sql.Date, r.TenancyEndDate || null)
        .input("TenancyNotes", sql.NVarChar(500), r.TenancyNotes || null)
        .input("Notes", sql.NVarChar(500), r.Notes || null)
        .execute("InsertUpdateRentalTransaction");

      const saved = result.recordset?.[0] || {};

      savedRows.push({
        RowId: r.RowId,
        TransactionID: saved.TransactionID,
        TransactionType: canonicalType,
        Sequence: finalSeq,
        Label: finalLabel,
        Path: finalPath,
      });
    }

    res.json({
      success: true,
      message: "Transactions saved successfully",
      saved: savedRows,
    });
  } catch (error) {
    console.error("saveRentalTransactions:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Error saving rental transactions",
    });
  }
};

const deleteRentalTransaction = async (req, res) => {
  try {
    const { TransactionID, UserID } = req.body;

    if (!TransactionID) {
      return res.status(400).json({
        success: false,
        message: "TransactionID is required",
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .input("TransactionID", sql.Int, Number(TransactionID))
      .input("UserID", sql.Int, UserID ? Number(UserID) : null)
      .execute("DeleteRentalTransaction");

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("deleteRentalTransaction:", error);

    res.status(500).json({
      success: false,
      message: "Error deleting transaction",
    });
  }
};

module.exports = {
  getRentalTransactions,
  saveRentalTransactions,
  deleteRentalTransaction,
};