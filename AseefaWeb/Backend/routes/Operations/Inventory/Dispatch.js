const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post('/deleteDispatch', async (req, res) => {
    const { DisId, DeletedBy, DeletedDate } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('DisId', sql.Int, DisId)
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.[WebDeleteDispatch]');

        res.status(200).json({
            success: true,
            message: 'Dispatch deleted successfully',
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

router.get('/getDispatch', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetDispatch');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

// ✅ Insert Dispatch
router.post('/insertDispatch', async (req, res) => {
    const {
        DisId,
        AccountId,
        RouteId,
        Incharge,
        Date,
        DeliveryMode,
        Qty,
        TeamMembers,
        NotesFromAc,
        NotesFromProduction,
        Rate,
        DispatchStatus,
        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Inputs
        request.input('DisId', sql.Int, DisId || 0); // OUT param for new insert
        request.input('AccountId', sql.Int, AccountId);
        request.input('RouteId', sql.Int, RouteId);
        request.input('Incharge', sql.Int, Incharge);
        request.input('Date', sql.DateTime, Date || new Date());
        request.input('DeliveryMode', sql.Int, DeliveryMode);
        request.input('Qty', sql.Int, Qty);
        request.input('TeamMembers', sql.NVarChar(sql.MAX), TeamMembers);
        request.input('NotesFromAc', sql.VarChar(sql.MAX), NotesFromAc);
        request.input('NotesFromProduction', sql.VarChar(sql.MAX), NotesFromProduction);
        request.input('Rate', sql.Money, Rate);
        request.input('DispatchStatus', sql.Int, DispatchStatus);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy);
        request.input('CreatedDate', sql.DateTime, CreatedDate || new Date());
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('WebInsertUpdateDispatch');

        res.status(200).json({
            success: true,
            message: 'Dispatch inserted successfully',
            newDisId: result.output?.DisId // return newly created ID
        });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Failed to insert data', details: error.message });
    }
});

// ✅ Update Dispatch (same SP, but passes DisId > 0)
router.post('/updateDispatch', async (req, res) => {
    const {
        DisId,
        AccountId,
        RouteId,
        Incharge,
        Date,
        DeliveryMode,
        Qty,
        TeamMembers,
        NotesFromAc,
        NotesFromProduction,
        Rate,
        DispatchStatus,
        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        request.input('DisId', sql.Int, DisId); // existing record
        request.input('AccountId', sql.Int, AccountId);
        request.input('RouteId', sql.Int, RouteId);
        request.input('Incharge', sql.Int, Incharge);
        request.input('Date', sql.DateTime, Date || new Date());
        request.input('DeliveryMode', sql.Int, DeliveryMode);
        request.input('Qty', sql.Int, Qty);
        request.input('TeamMembers', sql.NVarChar(sql.MAX), TeamMembers);
        request.input('NotesFromAc', sql.VarChar(sql.MAX), NotesFromAc);
        request.input('NotesFromProduction', sql.VarChar(sql.MAX), NotesFromProduction);
        request.input('Rate', sql.Money, Rate);
        request.input('DispatchStatus', sql.Int, DispatchStatus);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('ModifiedBy', sql.Int, ModifiedBy);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || new Date());
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('WebInsertUpdateDispatch');

        res.status(200).json({
            success: true,
            message: 'Dispatch updated successfully',
            data: result.recordset
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({
            success: false,
            message: err.message,
            stack: err.stack
        });
    }
});




module.exports = router;
