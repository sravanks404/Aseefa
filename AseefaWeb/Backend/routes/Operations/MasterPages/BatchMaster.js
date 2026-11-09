const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.get('/getbatch', async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CompanyId is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("CompanyId", sql.Int, parseInt(CompanyId))
      .execute("WebGetBatchDetailes");

    res.status(200).json({
      success: true,
      message: "Batch data fetched successfully",
      data: result.recordset
    });

  } catch (error) {

    console.error("Full error:", error);  // ← shows full error object

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      detail: error.toString()  // ← ADD THIS LINE temporarily
    });
  }
});


router.delete('/deletebatch', async (req, res) => {
  try {

    const { BatchId, DeletedBy } = req.body;

    if (!BatchId || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "BatchId and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("BatchId", sql.Int, parseInt(BatchId))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteBatchDetailes");

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting batch:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});


router.post('/insertupdatebatch', async (req, res) => {
  try {

    const { BatchId, BatchName, BatExpiryDate, CreatedBy, CompanyId } = req.body;

    console.log("Request body:", req.body);

    if (!BatchName || !CreatedBy || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "BatchName, CreatedBy and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("BatchId", sql.Int, parseInt(BatchId || 0))
      .input("BatchName", sql.VarChar(100), BatchName)
      .input("BatExpiryDate", sql.Date, BatExpiryDate ? new Date(BatExpiryDate) : null)
      .input("CreatedBy", sql.Int, parseInt(CreatedBy))
      .input("CompanyId", sql.Int, parseInt(CompanyId))   // ✅ FIXED
      .execute("WebInsertUpdateBatchDetailes");

    res.status(200).json({
      success: true,
      message: BatchId == 0 ? "Batch inserted successfully" : "Batch updated successfully"
    });

  } catch (error) {

    console.error("Error saving batch details:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      detail: error.toString()
    });

  }
});




module.exports = router;