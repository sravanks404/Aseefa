const express = require('express');
const sql     = require('mssql');
const router  = express.Router();
const dbConfig = require('../../../config/mssql');


router.post('/insertupdateallocation', async (req, res) => {
  try {
    const {
      AlocId,
      UserId,
      Status,
      VanID,
      datealoctn,
      B2CSeries,
      B2BSeries,
      SaleReturnSeries
    } = req.body;

    // ✅ Validation
    if (!UserId || !VanID) {
      return res.status(400).json({
        success: false,
        message: "UserId and VanID are required"
      });
    }

    // ✅ Normalize values
    const parsedAlocId = parseInt(AlocId) || 0;
    const parsedUserId = parseInt(UserId);
    const parsedVanId = parseInt(VanID);

    // ✅ IMPORTANT: Status handling (your logic: 1 = active, 0 = deleted)
    const parsedStatus = (Status === 0 || Status === '0') ? '0' : '1';

    const pool = await sql.connect(dbConfig);

const result = await pool.request()
  .input("AlocId", sql.Int, parsedAlocId)
  .output("AlocId", sql.Int)
  .input("UserId", sql.Int, parsedUserId)
  .input("Status", sql.VarChar(10), String(parsedStatus || '1'))   // ✅ FIXED
  .input("VanID", sql.Int, parsedVanId)
  .input("datealoctn", sql.DateTime, datealoctn ? new Date(datealoctn) : new Date())
  .input("B2CSeries", sql.VarChar(50), B2CSeries || '')
  .input("B2BSeries", sql.VarChar(50), B2BSeries || '')
  .input("SaleReturnSeries", sql.VarChar(50), SaleReturnSeries || '')
  .execute("WebInsertUpdateAllocation");
    res.status(200).json({
      success: true,
      message: parsedAlocId === 0 
        ? "Allocation created successfully"
        : "Allocation updated successfully",
      data: result.recordset[0]   // { AlocId }
    });

  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get('/getVehicleAllocation', async (req, res) => {
  try {
  
    
   

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      
      .execute("WebGetVehicleAllocations");

    res.status(200).json({
      success: true,
      message: "Vehicle allocation data fetched successfully",
      data: result.recordset
    });

  } catch (error) {
    console.error("Error fetching vehicle allocation:", error);
    
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get('/getAllocation', async (req, res) => {
  try {

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .execute("WebGetAllocation");

    res.status(200).json({
      success: true,
      message: "Allocation data fetched successfully",
      data: result.recordset
    });

  } catch (error) {
    console.error("Error fetching allocation:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});



router.post('/deleteAllocation', async (req, res) => {
  try {

    const { AlocId } = req.body;

    // Validation
    if (!AlocId) {
      return res.status(400).json({
        success: false,
        message: "AlocId is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("AlocId", sql.Int, parseInt(AlocId))
      .execute("WebDeleteAllocation");

    res.status(200).json({
      success: true,
      message: "Allocation deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting allocation:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get('/getVehicles', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .execute("WebGetVehicles");

    res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      data: result.recordset
    });

  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});
module.exports = router;
