const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post('/deleteInvoiceSeries', async (req, res) => {
    const { SID, DeletedBy, DeletedDate } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('SID', sql.Int, SID)
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.WebDeleteInvoiceSeries');

        res.status(200).json({
            success: true,
            message: 'InvoiceSeries deleted successfully',
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

router.get('/getInvoiceSeries', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetInvoiceSeries');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetFinancialYear', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().execute('WebGetFinancialYear');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.post('/insertInvoiceSeries', async (req, res) => {
    const {
        SID,
        Series,
        InvType,
        FYearID,
        CompanyID,
        CreatedBy,
        CreatedDate,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Matching the stored procedure parameters
        request.output('SID', sql.Int);
        request.input('Series', sql.VarChar(50), Series);
        request.input('InvType', sql.VarChar(50), InvType);
        request.input('FYearID', sql.Int, FYearID);

        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('WebInsertUpdateInvoiceSeries');

        res.status(200).json({
            message: 'InvoiceSeries inserted successfully',
            SID: result.output.SID
        });
    } catch (error) {
        console.error('Error inserting InvoiceSeries:', error);
        res.status(500).json({
            error: 'Failed to insert/update InvoiceSeries',
            details: error.message
        });
    }
});

router.post('/updateInvoiceSeries', async (req, res) => {
    const {
        SID,
        Series,
        InvType,
        FYearID,
        CompanyID,
        CreatedBy,
        CreatedDate,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Required output
        request.input('SID', sql.Int, SID); // ✅ Use input if required

        // Required inputs
        request.input('Series', sql.VarChar(50), Series);
        request.input('InvType', sql.VarChar(50), InvType);
        request.input('FYearID', sql.Int, FYearID);

        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);


        const result = await request.execute('WebInsertUpdateInvoiceSeries');

        res.status(200).json({
            success: true,
            message: 'InvoiceSeries processed successfully',
            SID: result.output.SID
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update InvoiceSeries',
            error: err.message
        });
    }
});









module.exports = router;
