const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.post('/InsertUpdateEnquiry', async (req, res) => {
    const {
        EnqID,
        Customer,
        EnqDate,
        EnqType,
        Address,
        Mob,
        Narration,
        Status,
        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        DeletedBy,
        DeletedDate,
        IsDeleted,
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        request.input('EnqID', sql.Int, EnqID || 0);
        request.input('Customer', sql.Int, Customer);   // If customer is string, use sql.VarChar(200)
        request.input('EnqDate', sql.DateTime, EnqDate || null);
        request.input('EnqType', sql.Int, EnqType);     // If enquiry type is string, use sql.VarChar(100)
        request.input('Address', sql.VarChar(sql.MAX), Address || '');
        request.input('Mob', sql.VarChar(20), Mob || '');
        request.input('Narration', sql.VarChar(sql.MAX), Narration || '');
        request.input('Status', sql.Int, Status);       // If status is text, use sql.VarChar(50)
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('DeletedBy', sql.Int, DeletedBy || null);
        request.input('DeletedDate', sql.DateTime, DeletedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('WebInsertUpdateEnquiry');

        res.status(200).json({
            message: 'Enquiry inserted/updated successfully',
            EnqID: result.output?.EnqID || EnqID
        });
    } catch (error) {
        console.error('Error inserting/updating Enquiry:', error);
        res.status(500).json({
            error: 'Failed to insert/update Enquiry',
            details: error.message
        });
    }
});

router.get('/GetEnquiry', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().execute('WebGetEnquiry');
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error fetching Enquiries:', error);
        res.status(500).json({
            error: 'Failed to fetch Enquiries',
            details: error.message
        });
    }
});

module.exports = router;