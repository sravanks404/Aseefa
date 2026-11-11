const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
 
    const src = { ...req.query, ...req.body };
    src.SID ??= src.SID;
    try {
        const SID = parseInt(src.SID);

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
    const src = { ...req.query, ...req.body };
    src.SID ??= req.params.SID;
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
})
router.post('/deleteinvoiceseries/:SID', async (req, res) => {
    const src = { ...req.query, ...req.body };
    src.SID ??= req.params.SID;
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