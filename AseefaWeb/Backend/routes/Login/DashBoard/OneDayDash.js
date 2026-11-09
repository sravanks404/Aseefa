const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');



router.post('/getSaleone', async (req, res) => {

    const { CompanyID, Date, activeUserId } = req.body;

    try {

        await sql.connect(dbConfig);

        const request = new sql.Request();

        request.input('CompanyID', sql.Int, CompanyID);

        request.input('Date', sql.Date, Date);

        request.input(
            'activeUserId',
            sql.NVarChar(sql.MAX),
            activeUserId
        );

        const result = await request.execute('webGetoneAllSaleReport');

        res.json(result.recordset);

    } catch (err) {

        console.error('SQL error:', err);

        res.status(500).send('Server error');
    }
});



router.get('/Taskdash', async(req, res) => {
    const { CompanyID,activeUserId } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line
        

        const result = await request.execute('webGetTasksdash');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/EmpMessage', async(req, res) => {
    const { CompanyID, activeUserId } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetEmpMessage');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});



router.get('/stockDashboard', async (req, res) => {
    const { CompanyID, FromDate, ToDate } = req.query;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

  

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
      
        const result = await request.execute('WebGetclosingstock');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});







module.exports = router;