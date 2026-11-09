const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post('/deleteZone', async (req, res) => {
    const { ZoneId, DeletedBy, DeletedDate } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('ZoneId', sql.Int, ZoneId)
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.[WebDeleteZoneMaster]');

        res.status(200).json({
            success: true,
            message: 'Zone deleted successfully',
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

router.get('/getZone', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetZoneMaster');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertZone', async (req, res) => {

    const {
        ZoneId,
        ZoneName,
        Area,
        Country,
        State,
        CreatedBy,
        CompanyID,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('ZoneId', sql.Int, ZoneId)
            .input('ZoneName', sql.VarChar(sql.MAX), ZoneName)
            .input('Area', sql.VarChar(sql.MAX), Area)
            .input('Country', sql.VarChar(sql.MAX), Country)
            .input('State', sql.VarChar(sql.MAX), State)
            .input('CompanyID', sql.Int, parseInt(CompanyID))  // Ensure proper conversion to Int
            .input('CreatedBy', sql.Int, parseInt(CreatedBy))  // Ensure proper conversion to Int
            .input('CreatedDate', sql.DateTime, CreatedDate || new Date())
            .input('ModifiedBy', sql.Int, ModifiedBy || null)
            .input('ModifiedDate', sql.DateTime, ModifiedDate || null)
            .input('IsDeleted', sql.Int, IsDeleted || 0)
            .execute('[WebInsertUpdateZoneMaster]');

        res.status(200).json({ message: 'Zone master inserted successfully' });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Failed to insert data', details: error });
    }
});

router.post('/updateZone', async (req, res) => {
    const {
        ZoneId,
        ZoneName,
        Area,
        Country,
        State,
        CreatedBy,
        CreatedDate,
        ModifiedDate,
        ModifiedBy, // From frontend (Empid)
        IsDeleted,
        CompanyID // Make sure CompanyID is included
    } = req.body;

    const createdDate = new Date();
    const modifiedDate = ModifiedDate || createdDate;

    try {
        let pool = await sql.connect(dbConfig);
        let request = pool.request();

        // Common input parameters
        request.input('ZoneId', sql.Int, ZoneId)
            .input('ZoneName', sql.VarChar(sql.MAX), ZoneName)
            .input('Area', sql.VarChar(sql.MAX), Area)
            .input('Country', sql.VarChar(sql.MAX), Country)
            .input('State', sql.VarChar(sql.MAX), State)
            .input('CompanyID', sql.Int, CompanyID) // Include CompanyID
            .input('ModifiedBy', sql.Int, ModifiedBy) // Use Empid (ModifiedBy)
            .input('ModifiedDate', sql.DateTime, modifiedDate)
            .input('IsDeleted', sql.Int, IsDeleted || 0);

        // Conditionally add input parameters for creation
        if (!ZoneId || ZoneId === 0) {
            request.input('CreatedBy', sql.Int, CreatedBy || ModifiedBy) // Use ModifiedBy if CreatedBy is not provided
                .input('CreatedDate', sql.DateTime, CreatedDate || createdDate);
        }

        let result = await request.execute('WebInsertUpdateZoneMaster');

        res.status(200).json({
            success: true,
            message: 'Zone entry Updated successfully',
            data: result.recordset,
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack // Provide stack trace for better debugging
        });
    }
});




module.exports = router;
