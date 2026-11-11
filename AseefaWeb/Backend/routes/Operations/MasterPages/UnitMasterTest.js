const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
 
    const src = { ...req.query, ...req.body };
  try {

    const { UnitID, DeletedBy } = src;

    if (!UnitID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "UnitID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteUnit");

    res.status(200).json({
      success: true,
      message: "Unit deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
false,
      message: "Server error",
      error: error.message,
      detail: error.toString()  
    });
  }
});

// post
router.post('/insertupdateunit', async (req, res) => {
  try {

    const { UnitID, UnitName, CreatedBy, CompanyId } = req.body;

    if (!UnitName || !CreatedBy || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "UnitName, CreatedBy and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID || 0))
      .input("UnitName", sql.VarChar(50), UnitName)
      .input("CreatedBy", sql.Int, parseInt(CreatedBy))
      .input("CompanyId", sql.Int, parseInt(CompanyId))
      .execute("WebInsertUpdateUnit");

    res.status(200).json({
      success: true,
      message: UnitID == 0 ? "Unit inserted successfully" : "Unit updated successfully"
    });

  } catch (error) {

    console.error("Error saving unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});



router.delete('/deleteunittest', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { UnitID, DeletedBy } = src;

    if (!UnitID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "UnitID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteUnit");

    res.status(200).json({
      success: true,
      message: "Unit deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
})
router.post('/deleteunittest', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { UnitID, DeletedBy } = src;

    if (!UnitID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "UnitID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteUnit");

    res.status(200).json({
      success: true,
      message: "Unit deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});

// router.post('/updateunitmaster', async (req, res) => {

//     try {

//         const {
//             UnitID,
//             UnitName,
//             CompanyId,
//             CreatedBy
//         } = req.body;

//         if (!UnitID || !UnitName) {

//             return res.status(400).json({
//                 success: false,
//                 message: 'UnitID and UnitName are required'
//             });

//         }

//         const pool = await sql.connect(dbConfig);

//         await pool.request()
//             .input('UnitID', sql.Int, parseInt(UnitID))
//             .input('UnitName', sql.VarChar(50), UnitName)
//             .query(`
//                 UPDATE UnitMaster
//                 SET UnitName = @UnitName
//                 WHERE UnitID = @UnitID
//             `);

//         return res.status(200).json({
//             success: true,
//             message: 'Updated successfully'
//         });

//     } catch (error) {

//         console.log(error);

//         return res.status(500).json({
//             success: false,
//             message: 'Server error',
//             error: error.message
//         });

//     }

// });


module.exports = router;