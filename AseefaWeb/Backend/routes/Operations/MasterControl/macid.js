const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.post("/insertUpdateMAC", async (req, res) => {
  const {
    Id,
    Bluetooth,
    CreatedBy,
    ModifiedBy,
    Remark,
    UserId,
    Active,
    CompanyID,
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.output("Id", sql.Int, Id); // important
    request.input("Bluetooth", sql.VarChar(sql.MAX), Bluetooth);
    request.input("CreatedBy", sql.Int, CreatedBy || null);
    request.input("ModifiedBy", sql.Int, ModifiedBy || null);
    request.input("IsDeleted", sql.Int, 0);
    request.input("Remark", sql.VarChar(sql.MAX), Remark || null);
    request.input("UserId", sql.Int, UserId);
    request.input("Active", sql.Int, Active);
    request.input("CompanyID", sql.Int, CompanyID);

    const result = await request.execute("WebInsertUpdateMAC");

    const returnedId =
      result.output.Id ||
      result.recordset?.[0]?.NewId ||
      result.recordset?.[0]?.UpdatedId;

    res.json({
      success: true,
      message: Id === 0 ? "Inserted successfully" : "Updated successfully",
      id: returnedId,
    });
  } catch (err) {
    console.error("Error executing stored procedure:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


router.get("/GetMac", async (req, res) => {
  const CompanyID = parseInt(req.query.CompanyID); // ✅ Get from query string

  if (!CompanyID || isNaN(CompanyID)) {
    return res.status(400).json({ success: false, message: "CompanyID is required and must be a number" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("CompanyID", sql.Int, CompanyID)
      .execute("[webGetMAC]");

    res.json({
      success: true,
      data: result.recordset || [],
    });
  } catch (err) {
    console.error("Error executing webGetMAC:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/deleteMAC', async (req, res) => {
    const { Id, DeletedBy, DeletedDate } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('Id', sql.Int, Id)
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.[WebDeleteMac]');

        res.status(200).json({
            success: true,
            message: 'MAC deleted successfully',
            data: result.recordset
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;