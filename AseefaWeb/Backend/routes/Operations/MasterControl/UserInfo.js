const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');



router.get('/GetUserRole', async (req, res) => {
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

router.get('/GetUser', async (req, res) => {
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

// router.post('/InsertUpdateUser', async (req, res) => {
//   const {
//     UserId = 0, Name, MName, LName, Sex, Address, Place, District, Mobile, Email,
//     UserName, Password, ConformPassword, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
//     CompanyID, BranchID, UserRoleId, image, BadgeNo, EIDNo, EIDExpiryDate, PPNo, PPExpiryDate,
//     VisaNo, VisaExpiryDate, InsuranceNo, InsuranceExpiryDate, GatePassNo, GatePassExpiryDate,
//     WorkmenCompNo, WorkmenCompExpiryDate, ProfLicenseNo, ProfLicenseExpiryDate, Country,
//     SupplierID, EmployeeCategoryID, ClientTrade, WorkerRate, SubSponsorID, IsHavenWorker
//   } = req.body;
//   // NOTE: resume/ppDocument/.../professionalLicenseDocument are no longer read here.

//   try {
//     const pool = await sql.connect(dbConfig);
//     const request = pool.request();

//     let imageBuffer = null;
//     if (typeof image === 'string' && image.includes('base64,')) {
//       imageBuffer = Buffer.from(image.split('base64,')[1], 'base64');
//     }

//     request.output('UserId', sql.Int, UserId);
//     request.input('Name', sql.VarChar(sql.MAX), Name);
//     request.input('MName', sql.VarChar(sql.MAX), MName);
//     request.input('LName', sql.VarChar(sql.MAX), LName);
//     request.input('Sex', sql.Int, Sex !== undefined ? parseInt(Sex) : null);
//     request.input('Address', sql.VarChar(sql.MAX), Address);
//     request.input('Place', sql.VarChar(sql.MAX), Place);
//     request.input('District', sql.VarChar(sql.MAX), District);
//     request.input('Mobile', sql.VarChar(sql.MAX), Mobile);
//     request.input('Email', sql.VarChar(sql.MAX), Email);
//     request.input('UserName', sql.VarChar(sql.MAX), UserName);
//     request.input('Password', sql.VarChar(sql.MAX), Password);
//     request.input('ConformPassword', sql.VarChar(sql.MAX), ConformPassword);
//     request.input('CreatedBy', sql.VarChar(sql.MAX), CreatedBy || null);
//     request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
//     request.input('ModifiedBy', sql.VarChar(sql.MAX), ModifiedBy || null);
//     request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
//     request.input('CompanyID', sql.Int, CompanyID || 0);
//     request.input('BranchId', sql.Int, BranchID || 0);
//     request.input('UserRoleId', sql.Int, UserRoleId || 0);
//     request.input('image', sql.VarBinary(sql.MAX), imageBuffer || null);
//     request.input('WorkerRate', sql.Decimal(10, 2),
//       WorkerRate !== undefined && WorkerRate !== null && WorkerRate !== '' ? parseFloat(WorkerRate) : null);
//     request.input('IsHavenWorker', sql.Bit, IsHavenWorker ? 1 : 0);

//     request.input('BadgeNo', sql.VarChar(100), BadgeNo || null);
//     request.input('EIDNo', sql.VarChar(100), EIDNo || null);
//     request.input('EIDExpiryDate', sql.Date, EIDExpiryDate ? new Date(EIDExpiryDate) : null);
//     request.input('PPNo', sql.VarChar(100), PPNo || null);
//     request.input('PPExpiryDate', sql.Date, PPExpiryDate ? new Date(PPExpiryDate) : null);
//     request.input('VisaNo', sql.VarChar(100), VisaNo || null);
//     request.input('VisaExpiryDate', sql.Date, VisaExpiryDate ? new Date(VisaExpiryDate) : null);
//     request.input('InsuranceNo', sql.VarChar(100), InsuranceNo || null);
//     request.input('InsuranceExpiryDate', sql.Date, InsuranceExpiryDate ? new Date(InsuranceExpiryDate) : null);
//     request.input('GatePassNo', sql.VarChar(100), GatePassNo || null);
//     request.input('GatePassExpiryDate', sql.Date, GatePassExpiryDate ? new Date(GatePassExpiryDate) : null);
//     request.input('WorkmenCompNo', sql.VarChar(100), WorkmenCompNo || null);
//     request.input('WorkmenCompExpiryDate', sql.Date, WorkmenCompExpiryDate ? new Date(WorkmenCompExpiryDate) : null);
//     request.input('ProfLicenseNo', sql.VarChar(100), ProfLicenseNo || null);
//     request.input('ProfLicenseExpiryDate', sql.Date, ProfLicenseExpiryDate ? new Date(ProfLicenseExpiryDate) : null);
//     request.input('Country', sql.VarChar(100), Country || null);
//     request.input('SupplierID', sql.Int, SupplierID ? parseInt(SupplierID) : null);
//     request.input('EmployeeCategoryID', sql.Int, EmployeeCategoryID ? parseInt(EmployeeCategoryID) : null);
//     request.input('ClientTrade', sql.VarChar(100), ClientTrade || null);
//     request.input('SubSponsorID', sql.VarChar(sql.MAX), SubSponsorID || null);

//     // ── All *FileName / *Files (base64) inputs REMOVED — pass NULL so the SP
//     //    doesn't clobber existing UserDocuments-based paths. If your SP has
//     //    these as required params, keep the input() calls but always pass null:
//     const nullFileInputs = [
//       'ResumeFileName','PPDocumentFileName','EduCertFileName','VisaDocFileName','EIDDocFileName',
//       'ExperienceDocFileName','OtherDocFileName','InsuranceFileName','GatePassFileName',
//       'WorkmenCompFileName','ProfLiceFileName'
//     ];
//     nullFileInputs.forEach(name => request.input(name, sql.VarChar(255), null));
//     const nullFilesJsonInputs = [
//       'ResumeFiles','PPDocumentFiles','EduCertFiles','VisaDocFiles','EIDDocFiles',
//       'ExperienceDocFiles','OtherDocFiles','InsuranceFiles','GatePassFiles',
//       'WorkmenCompFiles','ProfLiceFiles'
//     ];
//     nullFilesJsonInputs.forEach(name => request.input(name, sql.NVarChar(sql.MAX), null));

//     const result = await request.execute('WebInsertUpdateUser');
//     res.status(200).json({ success: true, UserId: result.output.UserId });
//   } catch (err) {
//     console.error('InsertUpdateUser SQL error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });
router.post('/InsertUpdateUser', async (req, res) => {
  const {
    UserId = 0, RecordID, PropertyID,
    Name, MName, LName, EIDNo, EIDExpiryDate, Email, Mobile, Sex, UserRoleId,
    BadgeNo, WorkerRate, PaymentMode, image,
    CompanyID, BranchID,
    CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    let imageBuffer = null;
    if (typeof image === 'string' && image.includes('base64,')) {
      imageBuffer = Buffer.from(image.split('base64,')[1], 'base64');
    }

    request.output('UserId', sql.Int, UserId ? parseInt(UserId) : 0);
    request.input('RecordID', sql.Int, RecordID ? parseInt(RecordID) : null);
    request.input('PropertyID', sql.Int, PropertyID ? parseInt(PropertyID) : null);

    request.input('Name', sql.VarChar(50), Name);
    request.input('MName', sql.VarChar(50), MName || null);
    request.input('LName', sql.VarChar(50), LName || null);
    request.input('EIDNo', sql.VarChar(50), EIDNo || null);
    request.input('EIDExpiryDate', sql.Date, EIDExpiryDate ? new Date(EIDExpiryDate) : null);
    request.input('Email', sql.VarChar(50), Email || null);
    request.input('Mobile', sql.VarChar(50), Mobile);
    request.input('Sex', sql.Int, Sex !== undefined && Sex !== '' ? parseInt(Sex) : null);
    request.input('UserRoleId', sql.Int, UserRoleId ? parseInt(UserRoleId) : null);
    request.input('BadgeNo', sql.VarChar(50), BadgeNo || null);
    request.input('WorkerRate', sql.Decimal(10, 2),
      WorkerRate !== undefined && WorkerRate !== null && WorkerRate !== '' ? parseFloat(WorkerRate) : null);
    request.input('PaymentMode', sql.VarChar(100),
      typeof PaymentMode === 'string' && PaymentMode.trim() ? PaymentMode.trim() : null);
    request.input('image', sql.VarBinary(sql.MAX), imageBuffer || null);

    request.input('CompanyID', sql.Int, CompanyID ? parseInt(CompanyID) : 0);
    request.input('BranchId', sql.Int, BranchID ? parseInt(BranchID) : null);
    request.input('CreatedBy', sql.Int, CreatedBy ? parseInt(CreatedBy) : null);
    request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
    request.input('ModifiedBy', sql.Int, ModifiedBy ? parseInt(ModifiedBy) : null);
    request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());

    const result = await request.execute('WebInsertUpdateUser');
    res.status(200).json({ success: true, UserId: result.output.UserId });
  } catch (err) {
    console.error('InsertUpdateUser SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/GetWorkerRateHistory', async (req, res) => {
  try {
    const { UserId } = req.query;
    if (!UserId) {
      return res.status(400).json({ success: false, message: 'UserId is required' });
    }
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('UserId', sql.Int, parseInt(UserId));
    const result = await request.execute('GetWorkerRateHistory');
    res.status(200).json({ success: true, history: result.recordset });
  } catch (error) {
    console.error('GetWorkerRateHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

router.post('/GetUsermasterPDF', async (req, res) => {
  const { CompanyID, UserId } = req.body;

  try {
    await sql.connect(dbConfig);

    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('UserId', sql.Int, UserId || 0);

    const result = await request.execute('WebGetUserMasterPDF');

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
router.get('/GetWorkerDocuments/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const columns = Object.values(WORKER_DOC_COLUMN_MAP); // already defined in your file
    const result = await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .query(`SELECT ${columns.join(', ')} FROM dbo.UserDocuments WHERE UserId = @UserId`);

    const row = result.recordset[0] || {};
    const documents = {};
    for (const [key, column] of Object.entries(WORKER_DOC_COLUMN_MAP)) {
      try { documents[key] = JSON.parse(row[column] || '[]'); }
      catch { documents[key] = []; }
    }
    res.json({ success: true, documents }); // paths only — tiny payload
  } catch (err) {
    console.error('GetWorkerDocuments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});





// getting branch 
router.get('/Webgetcompanywisebranchname', async (req, res) => {
  const CompanyID = req.query.CompanyID;

  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('Webgetcompanywisebranchname');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

// getting company name 
router.get('/Webgetcompanywisename', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .execute('Webgetcompanywisename');

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
// getting role
router.get('/GetRoleList', async (req, res) => {
  const { CompanyID } = req.query;

  if (!CompanyID) {
    return res.status(400).json({
      success: false,
      message: "CompanyID is required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, parseInt(CompanyID))
      .execute('WebGetRoleList');

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({
      success: false,
      message: "Database error"
    });
  }
});

// router.get('/getSalesRep', async (req, res) => {
//     const CompanyID = req.query.CompanyID;

//     if (!CompanyID) {
//         return res.status(400).json({
//             success: false,
//             message: 'CompanyID is required'
//         });
//     }

//     try {
//         await sql.connect(dbConfig);

//         const request = new sql.Request();
//         request.input('CompanyID', sql.Int, CompanyID);

//         const result = await request.execute('WebGetSalesRep');

//         res.json({
//             success: true,
//             message: 'Sales representatives loaded successfully',
//             data: result.recordset
//         });

//     } catch (err) {
//         console.error('SQL Error:', err);

//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: err.message
//         });
//     }
// });

router.post('/InsertUpdateRole', async (req, res) => {
  const {
    RoleID = 0,
    RoleName,
    CreatedBy,
    ModifiedBy,
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('RoleID', sql.Int, RoleID || 0);
    request.input('RoleName', sql.VarChar(sql.MAX), RoleName);
    request.input('CreatedBy', sql.Int, CreatedBy || null);
    request.input('ModifiedBy', sql.Int, ModifiedBy || null);

    const result = await request.execute('WebInsertUpdateRole');
    res.status(200).json({ success: true, message: RoleID ? 'Role updated successfully' : 'Role created successfully' });

  } catch (err) {
    console.error('InsertUpdateRole SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.post('/DeleteRole', async (req, res) => {
  const { RoleID, DeletedBy } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('RoleID', sql.Int, RoleID);
    request.input('DeletedBy', sql.Int, DeletedBy || null);
    await request.execute('WebDeleteRole');
    res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    console.error('DeleteRole SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// router.post('/Deleteusers', async (req, res) => {
//   const { UserId, deletedBy } = req.body;

//   if (!UserId || !deletedBy) {
//     return res.status(400).json({
//       success: false,
//       message: "UserId and deletedBy are required"
//     });
//   }

//   try {
//     const pool = await sql.connect(dbConfig);
//     const result = await pool.request()
//       .input('UserId', sql.Int, UserId)
//       .input('DeletedBy', sql.Int, deletedBy)
//       .input('DeletedDate', sql.DateTime, new Date())
//       .execute('DeleteUser'); // Use underscore instead of space in SP name

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User marked as deleted"
//     });
//   } catch (err) {
//     console.error("SQL error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Database error occurred"
//     });
//   }
// });
// router.post('/Deleteusers', async (req, res) => {
//   const { UserId, deletedBy } = req.body;

//   if (!UserId || !deletedBy) {
//     return res.status(400).json({
//       success: false,
//       message: "UserId and deletedBy are required"
//     });
//   }

//   try {
//     const pool = await sql.connect(dbConfig);
//     const result = await pool.request()
//       .input('UserId', sql.Int, UserId)
//       .input('DeletedBy', sql.Int, deletedBy)
//       .input('DeletedDate', sql.DateTime, new Date())
//       .execute('DeleteUser');

//     // rowsAffected: [0] = DELETE userDocuments, [1] = UPDATE UserTable
//     // The UPDATE is the one that proves the user existed and was newly deleted.
//     const userRowsAffected = result.rowsAffected[1] ?? 0;

//     if (userRowsAffected === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found (already deleted or does not exist)"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User marked as deleted"
//     });
//   } catch (err) {
//     console.error("SQL error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Database error occurred"
//     });
//   }
// });
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
      .execute('webRententdelete');       // ← SP name here

    const row = result.recordset?.[0];

    return res.status(row?.Success === 1 ? 200 : 404).json({
      success: row?.Success === 1,
      message: row?.Message || 'Unknown result'
    });
  } catch (err) {
    console.error("Deleteusers SQL error:", err);
    res.status(500).json({
      success: false,
      message: "Database error occurred"
    });
  }
});

router.get('/GetEmployeeCategoryList', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .execute('WebGetEmployeeCategoryList');

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({
      success: false,
      message: "Database error"
    });
  }
});


router.post('/InsertUpdateEmployeeCategory', async (req, res) => {
  const {
    CategoryID = 0,
    CategoryName,
    SalaryBasis,
    CreatedBy,
    ModifiedBy,
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('CategoryID', sql.Int, CategoryID || 0);
    request.input('CategoryName', sql.VarChar(100), CategoryName);
    request.input('SalaryBasis', sql.VarChar(50), SalaryBasis);
    request.input('CreatedBy', sql.Int, CreatedBy || null);
    request.input('ModifiedBy', sql.Int, ModifiedBy || null);

    await request.execute('WebInsertUpdateEmployeeCategory');

    res.status(200).json({
      success: true,
      message: CategoryID ? 'Employee category updated successfully' : 'Employee category created successfully'
    });

  } catch (err) {
    console.error('InsertUpdateEmployeeCategory SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.post('/DeleteEmployeeCategory', async (req, res) => {
  const { CategoryID, DeletedBy } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('CategoryID', sql.Int, CategoryID);
    request.input('DeletedBy', sql.Int, DeletedBy || null);

    await request.execute('WebDeleteEmployeeCategory');

    res.status(200).json({ success: true, message: 'Employee category deleted successfully' });
  } catch (err) {
    console.error('DeleteEmployeeCategory SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET rooms with beds for a project (via camp)
router.get('/GetRoomsByProject', async (req, res) => {
  const { ProjectID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('ProjectID', sql.Int, parseInt(ProjectID))
      .execute('WebGetRoomsByProject');
    res.json({ rooms: result.recordsets[0] || [] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET available beds for a room
router.get('/GetBedsByRoom', async (req, res) => {
  const { RoomID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('RoomID', sql.Int, parseInt(RoomID))
      .query(`SELECT BedID, BedNo, BedType, Status, UserID FROM CampBed WHERE RoomID = @RoomID AND IsDeleted = 0`);
    res.json({ beds: result.recordset });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/UpdateBedStatus', async (req, res) => {
  const { BedID, UserID } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('BedID', sql.Int, BedID)
      .input('UserID', sql.Int, UserID || null)
      .input('Status', sql.VarChar, UserID ? 'Occupied' : 'Available')
      .query(`
        UPDATE CampBed
        SET UserID = @UserID,
            Status = @Status,
            ModifiedDate = GETDATE()
        WHERE BedID = @BedID
      `);
    res.json({ success: true });
  } catch (err) {
    console.error('UpdateBedStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// Route
router.get('/GetRoomsByCamp', async (req, res) => {
  const { CampID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CampID', sql.Int, parseInt(CampID))
      .execute('WebGetRoomsByCamp');

    const rows = result.recordsets[0] || [];
    const roomsMap = new Map();
    for (const row of rows) {
      if (!roomsMap.has(row.RoomID)) {
        roomsMap.set(row.RoomID, {
          RoomID: row.RoomID, RoomNo: row.RoomNo, RoomType: row.RoomType,
          RoomStatus: row.RoomStatus, RatePerRoom: row.RatePerRoom, beds: []
        });
      }
      if (row.BedID) {
        roomsMap.get(row.RoomID).beds.push({
          BedID: row.BedID, BedNo: row.BedNo, BedType: row.BedType,
          Status: row.BedStatus, UserID: row.UserID
        });
      }
    }
    res.json({ rooms: Array.from(roomsMap.values()) });
  } catch (err) {
    console.error('GetRoomsByCamp error:', err);
    res.status(500).json({ message: err.message });
  }
});
router.get('/GetWorkersByRole', async (req, res) => {
  try {
    const { RoleId, CompanyID } = req.query;

    const roleIdNum = parseInt(RoleId);
    const companyIdNum = parseInt(CompanyID);

    if (!RoleId || isNaN(roleIdNum) || !CompanyID || isNaN(companyIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'RoleId and CompanyID are required and must be valid numbers'
      });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('RoleId', sql.Int, roleIdNum)
      .input('CompanyID', sql.Int, companyIdNum)
      .execute('GetWorkersByRole');

    res.json({ workers: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


const workerDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { userId, docType } = req.body;
    const dir = path.join(__dirname, '..', '..', '..', 'uploads', 'workers', String(userId), docType);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const uploadWorkerDoc = multer({ storage: workerDocStorage });

const WORKER_DOC_COLUMN_MAP = {
  resume: 'ResumeFiles',
  ppDocument: 'PPDocumentFiles',
  educationCert: 'EduCertFiles',
  visaDocument: 'VisaDocFiles',
  eidDocument: 'EIDDocFiles',
  experienceDocument: 'ExperienceDocFiles',
  otherDocument: 'OtherDocFiles',
  insuranceDocument: 'InsuranceFiles',
  gatePassDocument: 'GatePassFiles',
  workmenCompDocument: 'WorkmenCompFiles',
  professionalLicenseDocument: 'ProfLiceFiles',
};

router.get('/workerfile', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send('No path provided');
  const absolutePath = path.join(__dirname, '..', '..', '..', filePath.replace(/^\//, ''));
  if (!fs.existsSync(absolutePath)) return res.status(404).send('File not found');
  res.sendFile(absolutePath);
});

router.post('/uploadWorkerDocs', uploadWorkerDoc.array('files'), async (req, res) => {
  try {
    const { userId, docType, titles } = req.body;
    const column = WORKER_DOC_COLUMN_MAP[docType];
    if (!column) return res.status(400).json({ success: false, message: 'Invalid docType' });

    const parsedTitles = titles ? JSON.parse(titles) : [];
    const pool = await sql.connect(dbConfig);

    // ── FIXED: read from UserDocuments, not UserMaster ──
    const existingRes = await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .query(`SELECT ${column} AS col FROM dbo.UserDocuments WHERE UserId = @UserId`);

    let existing = [];
    try { existing = JSON.parse(existingRes.recordset[0]?.col || '[]'); } catch { existing = []; }

    const newEntries = req.files.map((f, i) => ({
      fileName: f.originalname,
      path: `/uploads/workers/${userId}/${docType}/${f.filename}`,
      label: parsedTitles[i] || ''
    }));

    const allEntries = [...existing, ...newEntries];

    // ── FIXED: MERGE instead of blind UPDATE, since the row may not exist yet ──
    await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .input('Docs', sql.NVarChar(sql.MAX), JSON.stringify(allEntries))
      .query(`
        MERGE dbo.UserDocuments AS tgt
        USING (SELECT @UserId AS UserId) AS src
        ON tgt.UserId = src.UserId
        WHEN MATCHED THEN
          UPDATE SET ${column} = @Docs
        WHEN NOT MATCHED THEN
          INSERT (UserId, ${column}) VALUES (@UserId, @Docs);
      `);

    res.json({ success: true, documents: allEntries });
  } catch (err) {
    console.error('uploadWorkerDocs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/deleteWorkerDoc', async (req, res) => {
  try {
    const { userId, docType, filePath } = req.body;
    const column = WORKER_DOC_COLUMN_MAP[docType];
    if (!column) return res.status(400).json({ success: false, message: 'Invalid docType' });

    const pool = await sql.connect(dbConfig);
    const existingRes = await pool.request() 
      .input('UserId', sql.Int, parseInt(userId))
      .query(`SELECT ${column} AS col FROM dbo.UserDocuments WHERE UserId = @UserId`);

    let existing = [];
    try { existing = JSON.parse(existingRes.recordset[0]?.col || '[]'); } catch { existing = []; }
    const updated = existing.filter(d => d.path !== filePath);

    await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .input('Docs', sql.NVarChar(sql.MAX), JSON.stringify(updated))
      .query(`UPDATE dbo.UserDocuments SET ${column} = @Docs WHERE UserId = @UserId`);

   const absolutePath = path.join(__dirname, '..', '..', '..', filePath.replace(/^\//, ''));
if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    
    res.json({ success: true, documents: updated });
  } catch (err) {
    console.error('deleteWorkerDoc error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;