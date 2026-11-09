const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.get('/TotalSale', async (req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line

        const result = await request.execute('webGetTotalSale');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/TotalOrder', async (req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetTotalOrder');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/TotalOutstand', async (req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetOutstanding');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/TotalReceipt', async (req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetTotalReceipt');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/empsale', async(req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetEmpsales');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/prodsales', async(req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetprodsales');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/Customerbill', async(req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
         request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetCustomerbill');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/b2cb2bsale', async(req, res) => {
    const { CompanyID, FromDate, activeUserId } = req.query;

    const currentDate = new Date();
    const toDate = currentDate.toISOString().split('T')[0]; 


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
         request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, toDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId); // Added line


        const result = await request.execute('webGetb2cb2bsale');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
