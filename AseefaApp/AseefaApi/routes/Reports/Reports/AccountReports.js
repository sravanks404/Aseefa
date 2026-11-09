const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

 
router.get('/PurchaseReturnReport', async (req, res) => {
    const { FromDate, ToDate, CompanyID } = req.query;

    try {
        // Validate input parameters
        if (!FromDate || !ToDate || !CompanyID) {
            return res.status(400).json({ error: 'Missing required parameters: FromDate, ToDate, and CompanyID are required' });
        }

        // Validate date format
        const fromDateParsed = new Date(FromDate);
        const toDateParsed = new Date(ToDate);
        if (isNaN(fromDateParsed) || isNaN(toDateParsed)) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Connect to database
        await sql.connect(dbConfig);
        const request = new sql.Request();
        
        // Set input parameters for stored procedure
        request.input('From', sql.DateTime, FromDate);
        request.input('To', sql.DateTime, ToDate);
        request.input('CompanyID', sql.Int, parseInt(CompanyID));

        // Execute stored procedure
        const result = await request.execute('webGetPurchaceReturn');
        
        // Send response
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    } 
});



module.exports = router;
