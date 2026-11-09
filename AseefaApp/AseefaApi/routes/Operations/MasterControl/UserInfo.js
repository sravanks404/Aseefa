const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');



router.get('/GetUserRole', async(req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetUserRole');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetUser', async(req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
 
        const result = await request.execute('WebGetUser');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/updateUserDetails', async (req, res) => {
    const {
        CompanyID,
        UserId,
        Kmallowance,
        Dayallowance,
        BranchId,
        UserRoleId,
        ZoneId,
        AllocatedUser   // 👈 NEW (comma-separated string)
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = new sql.Request(pool);

        request.input('CompanyID', sql.Int, CompanyID);
        request.input('UserId', sql.Int, UserId);
        request.input('Kmallowance', sql.Money, Kmallowance);
        request.input('Dayallowance', sql.Money, Dayallowance);
        request.input('BranchId', sql.Int, BranchId);
        request.input('UserRoleId', sql.Int, UserRoleId);
        request.input('ZoneId', sql.Int, ZoneId);
        request.input('AllocatedUser', sql.VarChar(sql.MAX), AllocatedUser); // 👈 ADD THIS

        await request.execute('dbo.webUpdateUserAllowance');

        res.status(200).json({
            success: true,
            message: 'User allowance updated successfully'
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

router.post('/InsertUpdateUser', async (req, res) => {
  const {
    UserId = 0,
    Name,
    Sex,
    Address,
    Place,
    District,
    Mobile,
    Email,
    UserName,
    Password,
    ConformPassword,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    CompanyID,
    image
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Decode base64 image
    let imageBuffer = null;
    if (typeof image === 'string' && image.includes('base64,')) {
      const base64Data = image.split('base64,')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    // Correct usage of OUTPUT param
    request.input('UserId', sql.Int ,UserId);

    // Inputs
    request.input('Name', sql.VarChar(sql.MAX), Name);
    request.input('Sex', sql.Int, Sex);
    request.input('Address', sql.VarChar(sql.MAX), Address);
    request.input('Place', sql.VarChar(sql.MAX), Place);
    request.input('District', sql.VarChar(sql.MAX), District);
    request.input('Mobile', sql.VarChar(sql.MAX), Mobile);
    request.input('Email', sql.VarChar(sql.MAX), Email);
    request.input('UserName', sql.VarChar(sql.MAX), UserName);
    request.input('Password', sql.VarChar(sql.MAX), Password);
    request.input('ConformPassword', sql.VarChar(sql.MAX), ConformPassword);
    request.input('CreatedBy', sql.VarChar(sql.MAX), CreatedBy || null);
    request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
    request.input('ModifiedBy', sql.VarChar(sql.MAX), ModifiedBy || null);
    request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
    request.input('CompanyID', sql.Int, CompanyID || 0);
    request.input('image', sql.VarBinary(sql.MAX), imageBuffer || null);


    const result = await request.execute('WebInsertUpdateUser');
    const returnId = result.output.UserId;

    res.status(200).json({ success: true, UserId: returnId });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/GetUsermaster', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetUserMaster');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.post('/Deleteusers', async (req, res) => {
    const { UserId, deletedBy } = req.body;

    if (!UserId || !deletedBy) {
        return res.status(400).json({
            success: false,
            message: "UserId and deletedBy are required"
        });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('UserId', sql.Int, UserId)
            .input('DeletedBy', sql.Int, deletedBy)
            .input('DeletedDate', sql.DateTime, new Date())
            .execute('Delete User'); // Use underscore instead of space in SP name

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "User marked as deleted"
        });
    } catch (err) {
        console.error("SQL error:", err);
        res.status(500).json({
            success: false,
            message: "Database error occurred"
        });
    }
});




module.exports = router;