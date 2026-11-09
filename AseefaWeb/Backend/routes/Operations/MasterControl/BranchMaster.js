const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

router.post('/deletebranch', async (req, res) => {
    const { BranchId, DeletedBy, DeletedDate } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('BranchId', sql.Int, BranchId)    
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.[WebDeleteBranchMaster]');

        res.status(200).json({
            success: true,
            message: 'Branch deleted successfully',
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

router.get('/getbranch', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetBranchMaster');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertbranch', async (req, res) => {

    const {
        BranchId,
        BranchName,
        Address,
        Country,
        State,
        District,
        City,
        Pincode,
        Phoneno,
        Mobileno,
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
            .input('BranchId', sql.Int, BranchId)
            .input('BranchName', sql.VarChar(sql.MAX), BranchName)
            .input('Address', sql.VarChar(sql.MAX), Address)
            .input('Country', sql.VarChar(sql.MAX), Country)
            .input('State', sql.VarChar(sql.MAX), State)
            .input('District', sql.VarChar(sql.MAX), District)
            .input('City', sql.VarChar(sql.MAX), City)
            .input('Pincode', sql.VarChar(sql.MAX), Pincode)
            .input('Phoneno', sql.VarChar(sql.MAX), Phoneno)
            .input('Mobileno', sql.VarChar(sql.MAX), Mobileno)
            .input('CompanyID', sql.Int, parseInt(CompanyID))  // Ensure proper conversion to Int
            .input('CreatedBy', sql.Int, parseInt(CreatedBy))  // Ensure proper conversion to Int
            .input('CreatedDate', sql.DateTime, CreatedDate || new Date())
            .input('ModifiedBy', sql.Int, ModifiedBy || null)
            .input('ModifiedDate', sql.DateTime, ModifiedDate || null)
            .input('IsDeleted', sql.Int, IsDeleted || 0)
            .execute('[WebInsertUpdateBranchMaster]');

        res.status(200).json({ message: 'Branch inserted successfully' });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(500).json({ error: 'Failed to insert data', details: error });
    }
});

router.post('/updatebranch', async (req, res) => {
    const {
        BranchId,
        BranchName,
        Address,
        Country,
        State,
        District,
        City,
        Pincode,
        Phoneno,
        Mobileno,
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
        request.input('BranchId', sql.Int, BranchId)
            .input('BranchName', sql.VarChar(sql.MAX), BranchName)
            .input('Address', sql.VarChar(sql.MAX), Address)
            .input('Country', sql.VarChar(sql.MAX), Country)
            .input('State', sql.VarChar(sql.MAX), State)
            .input('District', sql.VarChar(sql.MAX), District)
            .input('City', sql.VarChar(sql.MAX), City)
            .input('Pincode', sql.VarChar(sql.MAX), Pincode)
            .input('Phoneno', sql.VarChar(sql.MAX), Phoneno)
            .input('Mobileno', sql.VarChar(sql.MAX), Mobileno)
            .input('CompanyID', sql.Int, CompanyID) // Include CompanyID
            .input('ModifiedBy', sql.Int, ModifiedBy) // Use Empid (ModifiedBy)
            .input('ModifiedDate', sql.DateTime, modifiedDate)
            .input('IsDeleted', sql.Int, IsDeleted || 0);

        // Conditionally add input parameters for creation
        if (!BranchId || BranchId === 0) {
            request.input('CreatedBy', sql.Int, CreatedBy || ModifiedBy) // Use ModifiedBy if CreatedBy is not provided
                .input('CreatedDate', sql.DateTime, CreatedDate || createdDate);
        }

        let result = await request.execute('WebInsertUpdateBranchMaster');

        res.status(200).json({
            success: true,
            message: 'Branch entry processed successfully',
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

router.get('/getdistributor', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('webGetDistributors');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/saveEmployeeDistributor', async (req, res) => {
    const { companyID, data } = req.body;

    if (!companyID || !data || data.length === 0) {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    try {
        await sql.connect(dbConfig);

        for (const item of data) {
            const request = new sql.Request();
            request.output('EmpDistID', sql.Int, item.EmpDistID || 0); // Use output with initial value
            request.input('EmployeeID', sql.Int, item.EmployeeID);
            request.input('DistributorID', sql.Int, item.DistributorID);
            request.input('CompanyID', sql.Int, companyID);
            request.input('CreatedBy', sql.Int, item.CreatedBy || null);
            request.input('CreatedDate', sql.DateTime, item.CreatedDate || null);
            request.input('ModifiedBy', sql.Int, item.ModifiedBy || null);
            request.input('ModifiedDate', sql.DateTime, item.ModifiedDate || null);
            request.input('IsDeleted', sql.Int, item.IsDeleted || 0);

            await request.execute('WebInsertUpdateEmployeeDistributors');
        }

        res.status(200).json({ message: 'Data saved successfully' });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/GetEmployeeDistributors', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('webGetEmployeeDistributors');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertupdatevehicle', async (req, res) => {
    const { VID, VRegNo, IsDeleted, CompID, BranchId } = req.body;

    try {
        // Connect to SQL Server
        const pool = await sql.connect(dbConfig);

        // Prepare request
        const request = pool.request();
        request.input('VID', sql.Int, VID); // If null/undefined, default to 0
        request.input('VRegNo', sql.VarChar(sql.MAX), VRegNo);
        request.input('IsDeleted', sql.Int, IsDeleted);
        request.input('CompID', sql.Int, CompID);
        request.input('BranchId', sql.Int, BranchId);
        // request.output('VID', sql.Int); // Output param

        // Execute stored procedure
        const result = await request.execute('WebInsertUpdateVehicle');

        // Respond with output VID
        res.json({
            success: true,
            message: VID === 0 ? 'Vehicle inserted successfully' : 'Vehicle updated successfully',
            VID: result.output.VID
        });

    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
});


module.exports = router;
