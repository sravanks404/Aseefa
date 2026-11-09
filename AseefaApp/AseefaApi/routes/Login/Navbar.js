const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../config/mssql');


router.get('/getcompanynav', async (req, res) => {
    const { CompanyID } = req.query;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        let pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .execute('GetCompanyInfobyID');

        if (result.recordset.length > 0) {
            if (result.recordset[0].Logo) {
                result.recordset[0].CompanyLogo = Buffer.from(result.recordset[0].Logo).toString('base64');
            }

            res.json(result.recordset);
        } else {
            res.status(200).json([]);
        }
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

router.get('/getUserbyid', async (req, res) => {
    const { UserId } = req.query;

    if (!UserId) {
        return res.status(400).send('UserId is required');
    }
    try {
        let pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('UserId', sql.Int, UserId)
            .execute('webGetUserByID');

        if (result.recordset.length > 0) {
            if (result.recordset[0].Image) {
                result.recordset[0].Image = Buffer.from(result.recordset[0].Image).toString('base64');
            }
            res.json(result.recordset);
        } else {
            // Instead of 404, return a 200 status with an empty array or message
            res.status(200).json([]);
        }
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

router.get('/getfinancialbyid', async (req, res) => {

    const { CompanyID } = req.query;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('webGetFYearByCompanyID');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


module.exports = router;
