const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql'); // ✅ fixed path

// ================= INSERT / UPDATE ACCOUNT =================
router.get('/GetSaleSummary', async (req, res) => {
    const { TodayDate, UserID, UserRoleid, CompanyId } = req.query;

    // Validate required parameters
    if (!TodayDate) {
        return res.status(400).send('TodayDate is required');
    }
    if (!UserID) {
        return res.status(400).send('UserID is required');
    }
    if (!UserRoleid) {
        return res.status(400).send('UserRoleid is required');
    }
    if (!CompanyId) {
        return res.status(400).send('CompanyId is required');
    }

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('TodayDate',  sql.Date, TodayDate)
            .input('UserID',     sql.Int,  parseInt(UserID))
            .input('UserRoleid', sql.Int,  parseInt(UserRoleid))
            .input('CompanyId',  sql.Int,  parseInt(CompanyId))
            .execute('APPGetSaleSummary');

        res.json(result.recordset);

    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Something went wrong');
    }
});


module.exports = router;