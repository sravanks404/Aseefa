const express = require('express');
const sql     = require('mssql');
const router  = express.Router();
const dbConfig = require('../../../config/mssql');



router.post('/insertupdateinvoiceseries', async (req, res) => {
    try {
        const { SID, Series, FYearID, CompanyID, InvType, CBY,Branchid } = req.body;

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('SID', sql.Int, SID || 0)
            .input('Series', sql.VarChar(100), Series)
            .input('FYearID', sql.Int, FYearID)
            .input('CompanyID', sql.Int, CompanyID)
            .input('InvType', sql.VarChar(50), InvType)
            .input('CBY', sql.Int, CBY)
            .input('Branchid',sql.Int,Branchid)
            .execute('WebInsertUpdateInvoiceSeries');

        res.json({
            success: true,
            SID: result.recordset[0].SID
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});


router.get('/webgetinvoiceseries', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .execute('WebGetInvoiceSeries');

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});

router.delete('/deleteinvoiceseries/:SID', async (req, res) => {
    try {
        const SID = parseInt(req.params.SID);

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('SID', sql.Int, SID)
            .execute('WebDeleteInvoiceSeries');

        res.json({
            success: true,
            SID: result.recordset[0].SID
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});

module.exports = router;