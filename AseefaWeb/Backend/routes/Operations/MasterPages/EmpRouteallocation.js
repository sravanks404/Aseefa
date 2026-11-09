const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.post("/insertupdateemproute", async (req, res) => {
  const records = Array.isArray(req.body) ? req.body : [req.body];

  try {
    const pool = await sql.connect(dbConfig);
    const results = [];

    for (const record of records) {
      const {
        Slno ,
        EmpID,
        RouteID,
        Mon = 0,
        Tue = 0,
        Wed = 0,
        Thu = 0,
        Fri = 0,
        Sat = 0,
        Sun = 0,
        Ex = 0,
        Isdeleted = 0,
        DeletedBy = null,
        DeletedDate = null,
        CreatedBy = null,
        CreatedDate = null,
        CompanyID,
        ModifiedDate = null,
        ModifiedBy = null,
        Target = 0,
      } = record;

      const request = pool.request();

      // Add OUTPUT parameter for Slno
     // request.input("Slno", sql.Int, Slno);
      request.output("Slno", sql.Int,Slno); // This captures the OUTPUT value

      // Rest of your input parameters...
      request.input("EmpID", sql.Int, EmpID);
      request.input("RootID", sql.Int, RouteID);
      request.input("Mon", sql.Int, Mon);
      request.input("Tue", sql.Int, Tue);
      request.input("Wed", sql.Int, Wed);
      request.input("Thur", sql.Int, Thu);
      request.input("Fri", sql.Int, Fri);
      request.input("Sat", sql.Int, Sat);
      request.input("Sun", sql.Int, Sun);
      request.input("Ex", sql.Int, Ex);
      request.input("Isdeleted", sql.Int, Isdeleted);
      request.input("DeletedBy", sql.Int, DeletedBy);
      request.input("DeletedDate", sql.DateTime, DeletedDate);
      request.input("CreatedBy", sql.Int, CreatedBy);
      request.input("CreatedDate", sql.DateTime, CreatedDate);
      request.input("CompanyID", sql.Int, CompanyID);
      request.input("ModifiedDate", sql.DateTime, ModifiedDate);
      request.input("ModifiedBy", sql.Int, ModifiedBy);
      request.input("Target", sql.Float, Target);

      await request.execute("WebInsertUpdateEmpRoute");
      
      // Get the updated Slno (will be same for updates, new for inserts)
      const updatedSlno = request.parameters.Slno.value;
      results.push({ ...record, Slno: updatedSlno });
    }

    res.json({ 
      success: true, 
      message: "Operation completed successfully",
      updatedRecords: results 
    });

  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({
      success: false,
      message: "Database operation failed",
      error: err.message,
    });
  }
});


router.get('/GetUserByrole', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('[webGetUserByRole]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.get('/GetRouteallocatedemp', async (req, res) => {
    const CompanyID = parseInt(req.query.CompanyID);
    const EmpID = parseInt(req.query.EmpID);

    if (!CompanyID || !EmpID) {
        return res.status(400).send('CompanyID and EmpID are required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('EmpID', sql.Int, EmpID);

        const result = await request.execute('[webGetAllocatedEmp]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;