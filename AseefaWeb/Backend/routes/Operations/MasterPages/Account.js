const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post('/deleteAccount', async (req, res) => {
    const { AccountCode, DeletedBy, DeletedDate } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('AccountCode', sql.Int, AccountCode)
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.WebDeleteAccount');

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
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

router.get('/getAccount', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetAccount');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertaccount', async (req, res) => {
    const {
        AccountCode,
        AccountName,
        AccountParent,
        SuitAppsId,
        Type,
        AccountID,

        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,

        Address,
        Email,
        Mob,
        city,
        country,
        Phone,
        CreatedDateAndTime,
        MoifiedDateAndTime,
        RootId,
        RateType,
        PinNo,
        GSTinNo,
        Place,
        CustomerType
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Matching the stored procedure parameters
        request.output('AccountCode', sql.Int);
        request.input('AccountName', sql.VarChar(50), AccountName);
        request.input('AccountParent', sql.Int, AccountParent);
        request.input('SuitAppsId', sql.VarChar(50), SuitAppsId);
        request.input('Type', sql.VarChar(50), Type);
        request.input('AccountID', sql.Int, AccountID);

        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        request.input('Address', sql.VarChar(250), Address);
        request.input('Email', sql.VarChar(100), Email);
        request.input('Mob', sql.VarChar(20), Mob);
        request.input('city', sql.VarChar(100), city);
        request.input('country', sql.VarChar(100), country);
        request.input('Phone', sql.VarChar(20), Phone);
        request.input('CreatedDateAndTime', sql.DateTime, CreatedDateAndTime);
        request.input('MoifiedDateAndTime', sql.DateTime, MoifiedDateAndTime);
        request.input('RootId', sql.Int, RootId);
        request.input('RateType', sql.VarChar(50), RateType);
        request.input('PinNo', sql.VarChar(50), PinNo);
        request.input('GSTinNo', sql.VarChar(50), GSTinNo);
        request.input('Place', sql.VarChar(100), Place);
        request.input('CustomerType', sql.VarChar(50), CustomerType);

        const result = await request.execute('[WebInsertUpdateAccount]');

        res.status(200).json({
            message: 'Account inserted/updated successfully',
            AccountCode: result.output.AccountCode
        });
    } catch (error) {
        console.error('Error inserting/updating account:', error);
        res.status(500).json({
            error: 'Failed to insert/update account',
            details: error.message
        });
    }
});



router.post('/updateaccount', async (req, res) => {
    const {
        AccountCode,
        AccountName,
        AccountParent,
        SuitAppsId,
        Type,
        AccountID,
        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,
        Address,
        Email,
        Mob,
        city,
        country,
        Phone,
        CreatedDateAndTime,
        MoifiedDateAndTime,
        RootId,
        RateType,
        PinNo,
        GSTinNo,
        Place,
        CustomerType
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Required output
        request.input('AccountCode', sql.Int, AccountCode); // ✅ Use input if required

        // Required inputs
        request.input('AccountName', sql.VarChar(50), AccountName);
        request.input('AccountParent', sql.Int, AccountParent);
        request.input('SuitAppsId', sql.VarChar(50), SuitAppsId);
        request.input('Type', sql.VarChar(50), Type);
        request.input('AccountID', sql.Int, AccountID);
        request.input('CompanyID', sql.Int, CompanyID);

        // Optional metadata
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        // Optional fields used in Accout insert/update
        request.input('Address', sql.VarChar(250), Address);
        request.input('Email', sql.VarChar(100), Email);
        request.input('Mob', sql.VarChar(20), Mob);
        request.input('city', sql.VarChar(100), city);
        request.input('country', sql.VarChar(100), country);
        request.input('Phone', sql.VarChar(20), Phone);
        request.input('CreatedDateAndTime', sql.DateTime, CreatedDateAndTime);
        request.input('MoifiedDateAndTime', sql.DateTime, MoifiedDateAndTime);
        request.input('RootId', sql.Int, RootId);
        request.input('RateType', sql.VarChar(50), RateType);
        request.input('PinNo', sql.VarChar(50), PinNo);
        request.input('GSTinNo', sql.VarChar(50), GSTinNo);
        request.input('Place', sql.VarChar(100), Place);
        request.input('CustomerType', sql.VarChar(50), CustomerType);



        const result = await request.execute('WebInsertUpdateAccount');

        res.status(200).json({
            success: true,
            message: 'Account processed successfully',
            AccountCode: result.output.AccountCode
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update account',
            error: err.message
        });
    }
});



router.post('/insertaccountexcel', async (req, res) => {
    const {
        AccountCode,
        AccountName,
        AccountParent,
        SuitAppsId,
        Type,
        AccountID,

        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,

        Address,
        Email,
        Mob,
        city,
        country,
        Phone,
        CreatedDateAndTime,
        MoifiedDateAndTime,
        RootId,
        RateType,
        PinNo,
        GSTinNo,
        Place,
        CustomerType
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Matching the stored procedure parameters
        request.output('AccountCode', sql.Int);
        request.input('AccountName', sql.NVarChar(sql.MAX), AccountName);
        request.input('AccountParent', sql.Int, AccountParent);
        request.input('SuitAppsId', sql.VarChar(50), SuitAppsId);
        request.input('Type', sql.VarChar(50), Type);
        request.input('AccountID', sql.Int, AccountID);

        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        request.input('Address', sql.VarChar(250), Address);
        request.input('Email', sql.VarChar(100), Email);
        request.input('Mob', sql.VarChar(20), String(Mob));
        request.input('city', sql.VarChar(100), city);
        request.input('country', sql.VarChar(100), country);
        request.input('Phone', sql.VarChar(20), String(Phone));
        request.input('CreatedDateAndTime', sql.DateTime, CreatedDateAndTime);
        request.input('MoifiedDateAndTime', sql.DateTime, MoifiedDateAndTime);
        request.input('RootId', sql.Int, RootId);
        request.input('RateType', sql.VarChar(50), RateType);
        request.input('PinNo', sql.VarChar(50), String(PinNo));
        request.input('GSTinNo', sql.VarChar(50), GSTinNo);
        request.input('Place', sql.VarChar(100), Place);
        request.input('CustomerType', sql.VarChar(50), CustomerType);

        const result = await request.execute('[WebInsertUpdateAccount]');

        res.status(200).json({
            message: 'Account inserted/updated successfully',
            AccountCode: result.output.AccountCode
        });
    } catch (error) {
        console.error('Error inserting/updating account:', error);
        res.status(500).json({
            error: 'Failed to insert/update account',
            details: error.message
        });
    }
});










module.exports = router;
