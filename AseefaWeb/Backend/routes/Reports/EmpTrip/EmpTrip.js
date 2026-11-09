const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');
const { ConnectionPool } = require('mssql');



router.get('/Getodometer', async (req, res) => {
    try {
        let { UserId, CompanyId, Date } = req.query;

        let pool = await sql.connect(dbConfig);
        let request = pool.request();

        // Add parameters if provided
        request.input('UserId', sql.Int, UserId);
        request.input('CompanyId', sql.Int, CompanyId);
        request.input('Date', sql.Date, Date);

        let result = await request.execute('webGetOdometer');

        if (result.recordset.length > 0) {
            result.recordset = result.recordset.map((record) => {
                if (record.EndingPic) {
                    record.EndingPic = Buffer.from(record.EndingPic).toString('base64');
                }
                if (record.StartingPic) {
                    record.StartingPic = Buffer.from(record.StartingPic).toString('base64');
                }
                return record;
            });
            res.json(result.recordset);
        } else {
            res.status(200).json([]);
        }
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send(`Server error: ${err.message}`);
    }
});

router.get('/EmpView', async (req, res) => {
    const { CompanyID } = req.query;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    try {
        let pool = await sql.connect(dbConfig);

        let result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .execute('WebGetOdometerUser');

        if (result.recordset.length > 0) {
            if (result.recordset[0].IMAGE) {
                result.recordset[0].IMAGE = Buffer.from(result.recordset[0].IMAGE).toString('base64');
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

router.get('/Usertripdetails', async (req, res) => {
    const { CompanyID, EmpID, Date, FromDate } = req.query;

    if (!CompanyID || !EmpID || !Date || !FromDate) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Explicitly map parameters
        request.input('EmpID', sql.Int, parseInt(EmpID));
        request.input('CompanyID', sql.Int, parseInt(CompanyID));
        request.input('Date', sql.Date, Date);
        request.input('FromDate', sql.Date, FromDate);

        // Use .query() to call the procedure with named parameters
        const query = `
            EXEC webGetUsertripdetails 
                @EmpID = @EmpID, 
                @CompanyID = @CompanyID, 
                @Date = @Date, 
                @FromDate = @FromDate;
        `;

        const result = await request.query(query);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ 
            error: 'Server error', 
            message: err.message 
        });
    }
});

router.get('/GetTripMap', async (req, res) => {
    const { CompanyId, UserId, Date } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyId);
        request.input('EmpID', sql.Int, UserId);
        request.input('Date', sql.Date, Date);
        const result = await request.execute('webGetTripMap');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.get('/TripCount', async (req, res) => {
    const { UserID, Date } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('EmpID', sql.Int, UserID);
        request.input('Date', sql.Date, Date);
        const result = await request.execute('webGetTripCount');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});







module.exports = router;
