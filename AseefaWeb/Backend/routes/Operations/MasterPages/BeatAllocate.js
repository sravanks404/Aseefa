const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post("/WebInsertUpdateEmpRoute", async (req, res) => {
  const records = Array.isArray(req.body) ? req.body : [req.body];

  try {
    const pool = await sql.connect(dbConfig);
    const results = [];

    for (const record of records) {
        const {
        SlNo = 0,
        EmpID,
        RootID,
        Mon = 0,
        Tue = 0,
        Wed = 0,
        Thur = 0,
        Fri = 0,           // ← note: using Fri here (you had Friday in payload)
        Sat = 0,
        Sun = 0,
        Ex = 0,
        Isdeleted = 0,
        DeletedBy = null,
        DeletedDate = null,
        CreatedBy,
        CreatedDate = new Date(),
        CompanyID,
        ModifiedDate = new Date(),
        ModifiedBy,
        Target = 0
      } = record;

      const request = pool.request();

      // ───────────────────────────────────────────────
      // Only declare as INPUT
      // We will read the OUTPUT value after execution
      // ───────────────────────────────────────────────
      request.input("SlNo", sql.Int, SlNo);
      request.input("EmpID", sql.Int, EmpID);
      request.input("RootID", sql.Int, RootID);
      request.input("Mon", sql.Int, Mon);
      request.input("Tue", sql.Int, Tue);
      request.input("Wed", sql.Int, Wed);
      request.input("Thur", sql.Int, Thur);
      request.input("Fri", sql.Int, Fri);           // ← Fri, not Friday
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
      request.input("Target", sql.Int, Target);

 

      const result = await request.execute("WebInsertUpdateEmpRoute");

      // Get the returned Slno (new id or same if update)
      const returnedSlno = result.output.Slno;

      results.push({
        ...record,
        Slno: returnedSlno
      });
    }

    res.json({
      success: true,
      message: "EmpRoute Insert/Update successful",
      data: results
    });

  } catch (err) {
    console.error("EmpRoute API Error:", err);
    res.status(500).json({
      success: false,
      message: "EmpRoute operation failed",
      error: err.message,
      errorCode: err.code || err.number
    });
  }
});

router.get('/WebGetEmpRoute', async (req, res) => {
  const EmpID = parseInt(req.query.EmpID);
  const CompanyID = parseInt(req.query.CompanyID);
 
  if (!EmpID || !CompanyID) {
    return res.status(400).json({
      success: false,
      message: "EmpID and CompanyID required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('EmpID', sql.Int, EmpID);
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('WebGetEmpRoute');

    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });

  } catch (error) {
    console.error('WebGetEmpRoute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee route',
      error: error.message
    });
  }
});

router.post('/WebDeleteEmpRoute', async (req, res) => {
  const { EmpID, CompanyID, RootID, DeletedBy } = req.body;

  if (!EmpID || !CompanyID || !RootID || !DeletedBy) {
    return res.status(400).json({
      success: false,
      message: "EmpID, CompanyID, RootID and DeletedBy are required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('EmpID', sql.Int, EmpID)
      .input('RootID', sql.Int, RootID)
      .input('CompanyID', sql.Int, CompanyID)
      .input('DeletedBy', sql.Int, DeletedBy)
      .execute('Webdeleteemproute');

    res.json({
      success: true,
      message: 'EmpRoute deleted successfully'
    });

  } catch (error) {
    console.error('WebDeleteEmpRoute Error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});
 
router.get('/webGetUserByRole', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).json({ error: 'CompanyID is required' });
    } 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('[webGetUserByRole]');
        
        if (!result.recordset || result.recordset.length === 0) {
            return res.json([]);
        }
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/WebGetRootMastername', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).json({
            success: false,
            message: 'CompanyID is required'
        });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        request.input('CompanyID', sql.Int, parseInt(CompanyID, 10));

        const result = await request.execute('WebGetRootMaster');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (error) {
        console.error('GetRootMaster error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch RootMaster',
            error: error.message
        });
    }
});


module.exports = router; 