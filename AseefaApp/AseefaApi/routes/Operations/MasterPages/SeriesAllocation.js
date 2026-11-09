const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post('/deleteAllocation', async (req, res) => {
    const { AlocId } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('AlocId', sql.Int, AlocId)
            .execute('dbo.WebDeleteAllocation');

        res.status(200).json({
            success: true,
            message: 'Allocation deleted successfully',
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

router.get('/getAllocation', async (req, res) => {


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('WebGetAllocation');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.post('/insertUpdateAllocation', async (req, res) => {
    const {
        AlocId, // Optional input, you can remove this if not used
        B2CSeries,
        B2BSeries,
        VanID,
        UserId,
        Date,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Setup input/output parameters matching the stored procedure
        request.output('AlocId', sql.Int);
        request.input('B2CSeries', sql.VarChar(50), B2CSeries);
        request.input('B2BSeries', sql.VarChar(50), B2BSeries);
        request.input('VanID', sql.Int, VanID);
        request.input('UserId', sql.Int, UserId);
        request.input('Date', sql.DateTime, Date || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('WebInsertUpdateAllocation');

        const returnedAlocId = result.output.AlocId;

        res.status(200).json({
            message: AlocId ? 'Allocation updated successfully' : 'Allocation inserted   successfully',
            AlocId: returnedAlocId
        });
    } catch (error) {
        console.error('Error inserting/updating Allocation:', error);
        res.status(500).json({
            error: 'Failed to insert/update Allocation',
            details: error.message
        });
    }
});


router.post('/insertAllocation', async (req, res) => {
    const {
        AlocId,
        B2CSeries,
        B2BSeries,
        VanID,
        UserId,
        Date,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Matching the stored procedure parameters
        request.output('AlocId', sql.Int);
        request.input('B2CSeries', sql.VarChar(50), B2CSeries);
        request.input('B2BSeries', sql.VarChar(50), B2BSeries);
        request.input('VanID', sql.Int, VanID);
        request.input('UserId', sql.Int, UserId || null);
        request.input('Date', sql.DateTime, Date || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('WebInsertUpdateAllocation');

        res.status(200).json({
            message: 'Allocation inserted successfully',
            AlocId: result.output.AlocId
        });
    } catch (error) {
        console.error('Error inserting Allocation:', error);
        res.status(500).json({
            error: 'Failed to insert/update Allocation',
            details: error.message
        });
    }
});

router.post('/updateAllocation', async (req, res) => {
    const {
        AlocId,
        B2CSeries,
        B2BSeries,
        VanID,
        Date,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Required output
        request.input('AlocId', sql.Int, AlocId); // ✅ Use input if required

        // Required inputs
        request.input('B2CSeries', sql.VarChar(50), B2CSeries);
        request.input('B2BSeries', sql.VarChar(50), B2BSeries);
        request.input('VanID', sql.Int, VanID);
        request.input('UserId', sql.Int, UserId || null);
        request.input('Date', sql.DateTime, Date || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);


        const result = await request.execute('WebInsertUpdateAllocation');

        res.status(200).json({
            success: true,
            message: 'Allocation processed successfully',
            AlocId: result.output.AlocId
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update Allocation',
            error: err.message
        });
    }
});


router.get('/GetVehicle', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('[WebGetVehicle]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
})










module.exports = router;
