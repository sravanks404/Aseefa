const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
 
    const src = { ...req.query, ...req.body };
  try {

    const { TaxID, DeletedBy } = src;

    if (!TaxID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "TaxID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("TaxID", sql.Int, parseInt(TaxID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteTaxSettings");

    res.status(200).json({
      success: true,
      message: "Tax deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting tax:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }

      success: false,
      message: "Server error",
      error: error.message,
      detail: error.toString()  // ← ADD THIS LINE temporarily
    });
  }
});

router.delete('/deletetax', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { TaxID, DeletedBy } = src;

    if (!TaxID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "TaxID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("TaxID", sql.Int, parseInt(TaxID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteTaxSettings");

    res.status(200).json({
      success: true,
      message: "Tax deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting tax:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
})
router.post('/deletetax', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { TaxID, DeletedBy } = src;

    if (!TaxID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "TaxID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("TaxID", sql.Int, parseInt(TaxID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteTaxSettings");

    res.status(200).json({
      success: true,
      message: "Tax deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting tax:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});


router.post('/insertupdatetax', async (req, res) => {
  try {
    const { TaxID, TaxName, TaxParent, TaxType, CreatedBy, Companyid } = req.body;

    console.log("Request body:", req.body);  // ← ADD THIS

    if (!TaxName || !CreatedBy || !Companyid) {
      return res.status(400).json({
        success: false,
        message: "TaxName, CreatedBy and Companyid are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("TaxID",     sql.Int,         parseInt(TaxID || 0))
      .input("TaxName",   sql.VarChar(100), TaxName)
      .input("TaxParent", sql.Int,         TaxParent ? parseInt(TaxParent) : null)  // ← FIXED
      .input("TaxType",   sql.VarChar(50),  TaxType || null)
      .input("CreatedBy", sql.Int,         parseInt(CreatedBy))
      .input("Companyid", sql.Int,         parseInt(Companyid))
      .execute("WebInsertUpdateTaxSettings");

    res.status(200).json({
      success: true,
      message: TaxID == 0 ? "Tax inserted successfully" : "Tax updated successfully"
    });

  } catch (error) {
    console.error("Error saving tax settings:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      detail: error.toString()   // ← ADD THIS to see error in browser Network tab
    });
  }
});
module.exports = router;