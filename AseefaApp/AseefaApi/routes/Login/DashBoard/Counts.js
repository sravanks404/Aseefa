const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.get('/routeCustomer', async (req, res) => {
    const { CompanyID,activeUserId} = req.query;

    // Get the current day of the week
    const daysOfWeek = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ];
    const currentDay = daysOfWeek[new Date().getDay()]; // Get the current day as string

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('DayOfWeek', sql.NVarChar(20), currentDay);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line
        request.input('AppDatabase', sql.NVarChar(128), dbConfig.AppDatabase);
        
        

        const result = await request.execute('webGetActivecustomerdaywise');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/salecount', async (req, res) => {
    const { CompanyID,activeUserId } = req.query;


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line

        

        const result = await request.execute('webGetSaleStatusCount');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/routeCustomerloc', async (req, res) => {
    const { CompanyID } = req.query;

    // Get the current day of the week
    const daysOfWeek = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
    ];
    const currentDay = daysOfWeek[new Date().getDay()]; // Get the current day as string

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('DayOfWeek', sql.NVarChar(20), currentDay);
        request.input('AppDatabase', sql.NVarChar(128), dbConfig.AppDatabase);


        const result = await request.execute('webGetActivecustomerdaywiseloc');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/CusItemCount', async (req, res) => {
    const { CompanyID,activeUserId } = req.query;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        // Connect to SQL Server
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Add input parameter
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId);
        

        // Execute stored procedure
        const result = await request.execute('webGetDashboardCounts');

        // Consolidate results into a single object
        const consolidatedResults = {
            TotalRoute: result.recordsets[0][0]?.TotalRoute || 0,
            TotalCustomer: result.recordsets[1][0]?.TotalCustomer || 0,
            TotalCategory: result.recordsets[2][0]?.TotalCategory || 0,
            TotalItem: result.recordsets[3][0]?.TotalItem || 0,
        };

        // Send response
        res.json(consolidatedResults);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


module.exports = router;
