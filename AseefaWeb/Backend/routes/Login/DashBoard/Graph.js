const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');


router.post('/SaleGraph', async(req, res) => {
    const { CompanyID, activeUserId } = req.body;  // Changed from req.query to req.body

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId);

        const result = await request.execute('webGetSaleGraph');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/OrderGraph', async(req, res) => {
    const { CompanyID, activeUserId } = req.body;  // Changed from req.query to req.body

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId);

        const result = await request.execute('webGetOrdergraph');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/ReceiptChart', async(req, res) => {
    const { CompanyID, activeUserId } = req.body;  // Changed from req.query to req.body

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId);

        const result = await request.execute('webGetReceiptChart');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});



module.exports = router;