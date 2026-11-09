const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');
const { ConnectionPool } = require('mssql');


router.get('/webGetUsertriporder', async (req, res) => {
    const { UserId, CompanyId, Date } = req.query;

    // Validate required parameters
    if (!UserId || !CompanyId || !Date) {
        return res.status(400).json({ error: 'EmpID, CompanyId, and Date are required' });
    }


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert values to correct types before passing to SQL
        request.input('EmpID', sql.Int, parseInt(UserId, 10));
        request.input('CompanyID', sql.Int, parseInt(CompanyId, 10));
        request.input('Date', sql.Date, Date); 

        const result = await request.execute('webGetUsertriporder');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/webGetTripreceipt', async (req, res) => {
    const { UserId, CompanyId, Date } = req.query;

    // Validate required parameters
    if (!UserId || !CompanyId || !Date) {
        return res.status(400).json({ error: 'UserId, CompanyId, and Date are required' });
    }


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert values to correct types before passing to SQL
        request.input('EmpID', sql.Int, parseInt(UserId, 10));
        request.input('CompanyID', sql.Int, parseInt(CompanyId, 10));
        request.input('Date', sql.Date, Date); 

        const result = await request.execute('webGetTripreceipt');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/webGetUsertripsale', async (req, res) => {
    const { UserId, CompanyId, Date } = req.query;

    // Validate required parameters
    if (!UserId || !CompanyId || !Date) {
        return res.status(400).json({ error: 'UserId, CompanyId, and Date are required' });
    }


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert values to correct types before passing to SQL
        request.input('EmpID', sql.Int, parseInt(UserId, 10));
        request.input('CompanyID', sql.Int, parseInt(CompanyId, 10));
        request.input('Date', sql.Date, Date); 

        const result = await request.execute('webGetUsertripsale');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/TripReport', async (req, res) => {
    const { EmpID, FromDate, ToDate } = req.query;

    // Validate required parameters
    if (!EmpID || !FromDate || !ToDate) {
        return res.status(400).json({ error: 'EmpID, FromDate, and ToDate are required' });
    }


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert values to correct types before passing to SQL
        request.input('EMPID', sql.Int, parseInt(EmpID, 10));
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);

        const result = await request.execute('webGetTripReport');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

router.get('/AllEmpTripReport', async (req, res) => {
    const {FromDate, ToDate } = req.query;

    // Validate required parameters
    if (!FromDate || !ToDate) {
        return res.status(400).json({ error: 'FromDate, and ToDate are required' });
    }


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert values to correct types before passing to SQL
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);

        const result = await request.execute('webGetAllEmpTripReport');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});




module.exports = router;
