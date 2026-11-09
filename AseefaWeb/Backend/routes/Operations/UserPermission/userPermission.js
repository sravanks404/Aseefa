const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

router.get('/getMenus', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .execute('WebGetMenuAndSubMenus');

        res.status(200).json({
            success: true,
            message: 'Menus loaded successfully',
            data: result.recordset
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
router.get('/getUserForPermission', async (req, res) => {
    try {
        const { CompanyID } = req.query;

        if (CompanyID === undefined || CompanyID === null || CompanyID === '') {
            return res.status(400).json({
                success: false,
                message: 'CompanyID is required'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .execute('WebGetUserForPermission');

        res.status(200).json({
            success: true,
            message: 'Users fetched successfully.',
            data: result.recordset
        });

    } catch (error) {
        console.error('Error fetching users:', error);

        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
});

router.get('/checkPermission', async (req, res) => {
    try {

        const { UserID, FormCode } = req.query;

        if (!UserID || !FormCode) {
            return res.status(400).json({
                success: false,
                message: "UserID and FormCode are required."
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('UserID', sql.Int, UserID)
            .input('FormCode', sql.VarChar(100), FormCode)
            .execute('WebCheckUserPermission');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Permission not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: result.recordset[0]
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }
});
router.get('/getUserPermission', async (req, res) => {
    try {
        const { UserID } = req.query;

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('UserID', sql.Int, UserID)
            .execute('WebGetUserPermission');

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
router.post('/saveUserPermission', async (req, res) => {
      let transaction;
    let transactionStarted = false;

    try {
        const { UserID, CreatedBy, Permissions } = req.body;

        if (!UserID) {
            return res.status(400).json({
                success: false,
                message: 'UserID is required'
            });
        }

        if (!CreatedBy) {
            return res.status(400).json({
                success: false,
                message: 'CreatedBy is required'
            });
        }

        if (!Array.isArray(Permissions) || Permissions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one permission record is required'
            });
        }

        const uniquePermissions = new Map();

        for (const item of Permissions) {
            if (!item?.FormID) {
                return res.status(400).json({
                    success: false,
                    message: 'Each permission must include FormID'
                });
            }

            uniquePermissions.set(Number(item.FormID), {
                FormID: Number(item.FormID),
                CanView: !!item.CanView,
                CanAdd: !!item.CanAdd,
                CanEdit: !!item.CanEdit,
                CanDelete: !!item.CanDelete,
                CanPrint: !!item.CanPrint,
                CanExport: !!item.CanExport,
                CanApprove: !!item.CanApprove
            });
        }

        const pool = await sql.connect(dbConfig);
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        transactionStarted = true;

        for (const item of uniquePermissions.values()) {
            await new sql.Request(transaction)
                .input('UserID', sql.Int, UserID)
                .input('FormID', sql.Int, item.FormID)
                .input('CanView', sql.Bit, item.CanView)
                .input('CanAdd', sql.Bit, item.CanAdd)
                .input('CanEdit', sql.Bit, item.CanEdit)
                .input('CanDelete', sql.Bit, item.CanDelete)
                .input('CanPrint', sql.Bit, item.CanPrint)
                .input('CanExport', sql.Bit, item.CanExport)
                .input('CanApprove', sql.Bit, item.CanApprove)
                .input('CreatedBy', sql.Int, CreatedBy)
                .execute('WebInsertUserPermission');
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: 'User permissions saved successfully.'
        });

    } catch (err) {
        if (transactionStarted) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error('Rollback failed:', rollbackErr);
            }
        }

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message || 'Failed to save user permissions'
        });
    }
});

module.exports = router;