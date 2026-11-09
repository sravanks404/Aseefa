const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.get('/Closingstock', async(req, res) => {
    const { CompanyID,FromDate,ToDate } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
         request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        

        const result = await request.execute('WebGetclosingstockReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.get('/stockvalue', async(req, res) => {
    const { CompanyID,FromDate,ToDate } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
         request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        

        const result = await request.execute('WebGetstockvalueReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});






router.get('/balancestock', async (req, res) => {
    const { companyid } = req.query;

    if (!companyid) {
        return res.status(400).json({ error: 'Missing required parameter: companyid' });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('companyid', sql.Int, parseInt(companyid));

        const result = await request.execute('[WebGetBalancestock]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    } finally {
        await sql.close(); // always clean up
    }
});

router.get("/get-vtstock", async (req, res) => {
    const { vanId, ItemID, fromDate, toDate } = req.query;

    if (!vanId || !ItemID || !fromDate || !toDate) {
        return res
            .status(400)
            .json({ error: "vanId, itemId, fromDate, and toDate are required" });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool
            .request()
            .input("VanId", sql.Int, parseInt(vanId))
            .input("ItemId", sql.Int, parseInt(ItemID))
            .input("FromDate", sql.Date, fromDate)
            .input("ToDate", sql.Date, toDate)
            .execute("webGetVanloadByVtStock");

        res.json(result.recordset);
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ error: "Error retrieving VTStock data from database" });
    }
});


router.get('/getVanstock', async (req, res) => {
    const { VanId, Date: vanDate, companyID, UserId } = req.query;  // ✅ Extract query params

    if (!VanId || !vanDate || !companyID) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    let pool;

    try {
        pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('VanId', sql.Int, parseInt(VanId, 10))
            .input('Date', sql.DateTime, new Date(vanDate))
            .input('CompanyID', sql.Int, parseInt(companyID, 10))
            //.input('UserId', sql.Int, parseInt(UserId, 10))
            .execute('[webGetVanloadReport]');

        res.status(200).json({
            success: true,
            data: result.recordsets
        });

    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });

    } 
});

router.get('/getVanstockByDate', async (req, res) => {
    const { VanId, Date, ToDate, CompanyID } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        request.input('VanId', sql.Int, VanId);
        request.input('Date', sql.Date, Date);
        request.input('ToDate', sql.Date, ToDate);
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('webGetVanloadReportdate');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetVanLoadingAnalysis', async (req, res) => {
    const { Month, CompanyId } = req.query;  // ✅ Extract query params

    if (!Month || !CompanyId) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    let pool;

    try {
        pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('Month', sql.Int, Month)
            .input('CompanyId', sql.Int, parseInt(CompanyId, 10))
            .execute('[WebGetVanLoadingAnalysis]');

        res.status(200).json({
            success: true,
            data: result.recordsets
        });

    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });

    } 
});

router.get('/GetVehicleMaster', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('[WebGetVehicleMaster]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
})

module.exports = router;
