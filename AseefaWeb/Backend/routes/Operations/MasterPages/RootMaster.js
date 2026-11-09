const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');


router.post('/WebInsertUpdateRootMaster', async (req, res) => {
    const {
        RootId = 0,
        RootName,
        PlaceName,
        FromPlace,
        ToPlace,
        SuitApps_id = null,
        StateID = null,
        DistrictID = null,
        TalukID = null,
        JunctionID = null,
        CompanyID = null,
        UserId
    } = req.body;

    try {
        const poolConn = await sql.connect(dbConfig);
        const request = poolConn.request();

        // ONLY input (SP already defines OUTPUT)
        request.input('RootId', sql.Int, RootId);
        request.input('RootName', sql.VarChar(100), RootName);
        request.input('PlaceName', sql.VarChar(100), PlaceName);
        request.input('FromPlace', sql.VarChar(100), FromPlace);
        request.input('ToPlace', sql.VarChar(100), ToPlace);

        request.input('SuitApps_id', sql.Int, SuitApps_id);
        request.input('StateID', sql.Int, StateID);
        request.input('DistrictID', sql.Int, DistrictID);
        request.input('TalukID', sql.Int, TalukID);
        request.input('JunctionID', sql.Int, JunctionID);
        request.input('CompanyID', sql.Int, CompanyID);

        request.input('UserId', sql.Int, UserId);

        const result = await request.execute('WebInsertUpdateRootMaster');

        const newRootId = result.output?.RootId || RootId;

        res.status(RootId === 0 ? 201 : 200).json({
            success: true,
            RootId: newRootId,
            message: RootId === 0
                ? 'Root created successfully'
                : 'Root updated successfully'
        });

    } catch (error) {
        console.error('RootMaster error:', error);
        res.status(500).json({
            success: false,
            message: 'Database operation failed',
            error: error.message
        });
    }
});

router.get('/WebGetRootMaster', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).json({
            success: false,
            message: 'CompanyID is required'
        });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        request.input('CompanyID', sql.Int, parseInt(CompanyID, 10));

        const result = await request.execute('WebGetRootMaster');

        res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });

    } catch (error) {
        console.error('GetRootMaster error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch RootMaster',
            error: error.message
        });
    }
});

router.post('/WebDeleteRootMaster', async (req, res) => {
    const { RootId, CompanyID, DeletedBy } = req.body;

    // 🔍 Validation
    if (!RootId || isNaN(RootId)) {
        return res.status(400).json({
            success: false,
            message: 'Valid RootId is required'
        });
    }

    if (!CompanyID || isNaN(CompanyID)) {
        return res.status(400).json({
            success: false,
            message: 'Valid CompanyID is required'
        });
    }

    if (!DeletedBy || isNaN(DeletedBy)) {
        return res.status(400).json({
            success: false,
            message: 'Valid DeletedBy is required'
        });
    }

    try {
        const poolConn = await sql.connect(dbConfig);

        const result = await poolConn.request()
            .input('RootId', sql.Int, RootId)
            .input('CompanyID', sql.Int, CompanyID)
            .input('DeletedBy', sql.Int, DeletedBy)
            .execute('WebDeleteRootMaster');

        const rows = result.recordset?.[0]?.RowsAffected || 0;

        if (rows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Root not found or already deleted'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Root deleted successfully'
        });

    } catch (error) {
        console.error('WebDeleteRootMaster API Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});




module.exports = router;
