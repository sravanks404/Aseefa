
 const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
    const src = { ...req.query, ...req.body };
  try {

    const { CategoryID, Group, DeletedBy, CompanyId } = src;

    console.log("Request body:", src);

    if (!CategoryID || !DeletedBy || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CategoryID, DeletedBy and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("CategoryID",  sql.Int,      parseInt(CategoryID))
      .input("Group",       sql.Int,      parseInt(Group  || 0))  // ✅ 0 = cascade to children
      .input("DeletedBy",   sql.Int,      parseInt(DeletedBy))
      .input("DeletedDate", sql.DateTime, new Date())              // ✅ set server-side
      .input("CompanyId",   sql.Int,      parseInt(CompanyId))
      .execute("WebDeleteItemCategory");

    res.status(200).json({
      success: true,
      message: "Item category deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting item category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:   error.message
    });
  }
.execute("WebInsertUpdateItemCategory");

    res.status(200).json({
      success:    true,
      message:    parseInt(CategoryID || 0) === 0
                    ? "Category inserted successfully"
                    : "Category updated successfully",
      CategoryID: result.output.CategoryID
    });

  } catch (error) {
    console.error("Error saving item category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:   error.message,
      detail:  error.toString()
    });
  }
});

router.get('/getitemcategory', async (req, res) => {
  try {

    console.log("Request query:", req.query);

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .execute("WebGetItemCategory");   // ✅ No parameters

    res.status(200).json({ 
      success: true,
      message: "Item categories fetched successfully",
      data: result.recordset
    });

  } catch (error) {

    console.error("❌ Error fetching item categories:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});


router.delete('/deleteitemcategory', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { CategoryID, Group, DeletedBy, CompanyId } = src;

    console.log("Request body:", src);

    if (!CategoryID || !DeletedBy || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CategoryID, DeletedBy and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("CategoryID",  sql.Int,      parseInt(CategoryID))
      .input("Group",       sql.Int,      parseInt(Group  || 0))  // ✅ 0 = cascade to children
      .input("DeletedBy",   sql.Int,      parseInt(DeletedBy))
      .input("DeletedDate", sql.DateTime, new Date())              // ✅ set server-side
      .input("CompanyId",   sql.Int,      parseInt(CompanyId))
      .execute("WebDeleteItemCategory");

    res.status(200).json({
      success: true,
      message: "Item category deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting item category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:   error.message
    });
  }
})
router.post('/deleteitemcategory', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { CategoryID, Group, DeletedBy, CompanyId } = src;

    console.log("Request body:", src);

    if (!CategoryID || !DeletedBy || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CategoryID, DeletedBy and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("CategoryID",  sql.Int,      parseInt(CategoryID))
      .input("Group",       sql.Int,      parseInt(Group  || 0))  // ✅ 0 = cascade to children
      .input("DeletedBy",   sql.Int,      parseInt(DeletedBy))
      .input("DeletedDate", sql.DateTime, new Date())              // ✅ set server-side
      .input("CompanyId",   sql.Int,      parseInt(CompanyId))
      .execute("WebDeleteItemCategory");

    res.status(200).json({
      success: true,
      message: "Item category deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting item category:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:   error.message
    });
  }
});


module.exports = router;