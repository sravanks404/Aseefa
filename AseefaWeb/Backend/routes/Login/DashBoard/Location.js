const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');



router.post('/userlastlive', async (req, res) => {
    const { CompanyID, activeUserId } = req.body;  // Changed from req.query to req.body

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId);

        const result = await request.execute('webGetUserliveloc');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/userlive', async (req, res) => {
    const { CompanyID , Date ,UserID} = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('UserID', sql.Int, UserID);
        request.input('Date', sql.Date, Date);
        request.input('CompanyID', sql.Int, CompanyID);
        const result = await request.execute('webGetEmplive');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/LiveLocEmp', async (req, res) => {
    const {  Date } = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input("FilterDate", sql.Date, Date || null) ;
        const result = await request.execute('webGetLocEmployeesByDate');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});




module.exports = router;