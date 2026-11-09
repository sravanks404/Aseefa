const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.post('/InsertUpdateProductionAlloc', async (req, res) => {
    const {
        JobCardId,
        AllocNo,
        AllocDate,
        Department,
        Narration,
        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,
        Items // <-- Expecting array of items
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Convert Items array to JSON string for SQL
        const itemsJson = JSON.stringify(Items || []);

        request.input('JobCardId', sql.Int, JobCardId || 0);
        request.input('AllocNo', sql.VarChar(50), AllocNo || null);
        request.input('AllocDate', sql.DateTime, AllocDate || null);
        request.input('Department', sql.Int, Department || null);
        request.input('Narration', sql.NVarChar(sql.MAX), Narration || '');
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || null);
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);
        request.input('Items', sql.NVarChar(sql.MAX), itemsJson);

        const result = await request.execute('WebInsertUpdateProductionAllocation');

        res.status(200).json({
            message: 'Job Card saved successfully',
            JobCardId: JobCardId || result.returnValue || null
        });
    } catch (error) {
        console.error('Error inserting/updating Job Card:', error);
        res.status(500).json({
            error: 'Failed to insert/update Job Card',
            details: error.message
        });
    }
});

router.get('/GetitemName', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('WebGetItemName');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetitemType', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('webGetItemType');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/webgetproductionalloc', async (req, res) => {
    try {
        const { CompanyID } = req.query;
        if (!CompanyID) {
            return res.status(400).json({ error: "CompanyID is required" });
        }

        const parsedCompanyID = parseInt(CompanyID, 10);
        if (isNaN(parsedCompanyID)) {
            return res.status(400).json({ error: "CompanyID must be an integer" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('CompanyID', sql.Int, parsedCompanyID)
            .execute('webGetProductionAllocation');

        res.json(result.recordset);
    } catch (err) {
        console.error('webGetProductionAlloc error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/webdeleteproalloc', async (req, res) => {
    const { JobCardId } = req.body; // ✅ match stored procedure

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('JobCardId', sql.Int, JobCardId) // ✅ only JobCardId
            .execute('dbo.WebDeleteProductionAlloc');

        res.status(200).json({
            success: true,
            message: 'Job Card deleted successfully',
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


router.get('/webProallocNo', async (req, res) => {
    const { CompanyID } = req.query;

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .execute('dbo.[webGetProAllocNo]');

        res.status(200).json({
            success: true,
            message: 'Allocation number generated',
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


router.post('/InsertUpdateQcMaster', async (req, res) => {
    const {
        Qcid = 0,
        Itemtype,
        Itemid,
        QcName,

        Value,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        CompanyID,
        IsDeleted = 0
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Correct usage of OUTPUT param
        request.input('Qcid', sql.Int, Qcid);

        // Inputs
        request.input('Itemtype', sql.Int, Itemtype);
        request.input('Itemid', sql.Int, Itemid);
        request.input('QcName', sql.VarChar(sql.MAX), QcName);
        request.input('Value', sql.NVarChar(sql.MAX), Value);
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
        request.input('CompanyID', sql.Int, CompanyID || null);
        request.input('IsDeleted', sql.Bit, IsDeleted);

        // Execute stored procedure
        const result = await request.execute('WebInsertUpdateQcMaster');
        const returnId = result.output?.Qcid || Qcid;

        res.status(200).json({ success: true, Qcid: returnId });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});


router.get('/GetQcMaster', async (req, res) => {
    try {
        const { CompanyID } = req.query;
        if (!CompanyID) {
            return res.status(400).json({ error: "CompanyID is required" });
        }

        const parsedCompanyID = parseInt(CompanyID, 10);
        if (isNaN(parsedCompanyID)) {
            return res.status(400).json({ error: "CompanyID must be an integer" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('CompanyID', sql.Int, parsedCompanyID)
            .execute('WebGetQcMaster');

        res.json(result.recordset);
    } catch (err) {
        console.error('WebGetQcMaster error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/DeleteQcmaster', async (req, res) => {
    const { Qcid, DeletedBy, DeletedDate } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('Qcid', sql.Int, Qcid)
            .input('DeletedBy', sql.Int, DeletedBy)
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.WebDeleteQcMaster');

        res.status(200).json({
            success: true,
            message: 'Qc deleted successfully',
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


router.get('/webgetproductionallocDetails', async (req, res) => {
    try {
        const { JobCardId } = req.query;
        if (!JobCardId) {
            return res.status(400).json({ error: "JobCardId is required" });
        }

        const parsedCompanyID = parseInt(JobCardId, 10);
        if (isNaN(parsedCompanyID)) {
            return res.status(400).json({ error: "JobCardId must be an integer" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('JobCardId', sql.Int, parsedCompanyID)
            .execute('webGetProductionAllocDetails');

        res.json(result.recordset);
    } catch (err) {
        console.error('webGetProductionAllocDetails error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


router.post('/InsertBatch', async (req, res) => {
    const {
        BatchName,
        BatExpiryDate,
        CompanyID,
        CreatedBy,
        IsDeleted = 0
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Input parameters
        request.input('BatchName', sql.VarChar(255), BatchName);
        request.input('BatExpiryDate', sql.Date, BatExpiryDate);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CreatedBy', sql.Int, CreatedBy);
        request.input('IsDeleted', sql.Bit, IsDeleted);

        // Output parameter
        request.output('BatchId', sql.Int);

        // Execute the stored procedure
        const result = await request.execute('[WebInsertBatch]');
        
        const newBatchId = result.output.BatchId;

        res.status(200).json({
            message: 'Batch saved successfully',
            BatchId: newBatchId
        });
    } catch (error) {
        console.error('Error inserting Batch:', error);
        res.status(500).json({
            error: 'Failed to insert Batch',
            details: error.message
        });
    }
});


router.get('/WebgetBatch', async (req, res) => {
    try {
        const { CompanyID } = req.query;
        if (!CompanyID) {
            return res.status(400).json({ error: "CompanyID is required" });
        }

        const parsedCompanyID = parseInt(CompanyID, 10);
        if (isNaN(parsedCompanyID)) {
            return res.status(400).json({ error: "CompanyID must be an integer" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('CompanyID', sql.Int, parsedCompanyID)
            .execute('[WebGetBatch]');

        res.json(result.recordset);
    } catch (err) {
        console.error('WebGetBatch error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;