const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { VID } = req.body;
    const dir = path.join(__dirname, '..', 'uploads', 'vehicles', String(VID));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });


router.get('/vehiclefile', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send('No path provided');

  const absolutePath = path.join(__dirname, '..', filePath.replace(/^\//, ''));

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).send('File not found');
  }
  res.sendFile(absolutePath);
});

router.post('/uploadVehicleImages', upload.array('files'), async (req, res) => {
  try {
    const { VID } = req.body;
    if (!VID) return res.status(400).json({ success: false, message: 'VID is required' });

    const newPaths = (req.files || []).map(f => `/uploads/vehicles/${VID}/${f.filename}`);

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VID', sql.Int, VID)
      .input('NewPathsJson', sql.NVarChar(sql.MAX), JSON.stringify(newPaths))
      .execute('sp_AddVehicleImages');

    const row = result.recordset?.[0];

    if (!row || row.Success !== 1) {
      // roll back uploaded files if DB update failed / vehicle not found
      newPaths.forEach(p => {
        const abs = path.join(__dirname, '..', p);
        fs.unlink(abs, () => {});
      });
      return res.status(404).json({ success: false, message: row?.Message || 'Update failed' });
    }

    res.json({
      success: true,
      message: row.Message,
      files: JSON.parse(row.VehicleImages || '[]')
    });
  } catch (err) {
    console.error('uploadVehicleImages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/getVehicleImages/:VID', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VID', sql.Int, req.params.VID)
      .execute('sp_GetVehicleImages');

    const row = result.recordset?.[0];
    res.json({
      success: true,
      images: row ? JSON.parse(row.VehicleImages || '[]') : []
    });
  } catch (err) {
    console.error('getVehicleImages error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/deleteVehicleImage', async (req, res) => {
  try {
    const { VID, filePath } = req.body;
    if (!VID || !filePath) return res.status(400).json({ success: false, message: 'VID and filePath are required' });

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VID', sql.Int, VID)
      .input('FilePath', sql.NVarChar(500), filePath)
      .execute('sp_DeleteVehicleImage');

    const row = result.recordset?.[0];

    if (!row || row.Success !== 1) {
      return res.status(404).json({ success: false, message: row?.Message || 'Delete failed' });
    }

    // remove the physical file only after DB confirms removal
    const absolutePath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

    res.json({
      success: true,
      message: row.Message,
      files: JSON.parse(row.VehicleImages || '[]')
    });
  } catch (err) {
    console.error('deleteVehicleImage error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const otherAttachStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { VID } = req.body;
    const dir = path.join(__dirname, '..', 'uploads', 'vehicles', String(VID), 'other');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const uploadOtherAttach = multer({ storage: otherAttachStorage });

router.post('/uploadVehicleOtherAttachments', uploadOtherAttach.array('files'), async (req, res) => {
  try {
    const { VID, Label, CreatedBy } = req.body;
    if (!VID || !Label) return res.status(400).json({ success: false, message: 'VID and Label are required' });
    if (!req.files || !req.files.length) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const pool = await sql.connect(dbConfig);
    const inserted = [];

    for (const file of req.files) {
      const filePath = `/uploads/vehicles/${VID}/other/${file.filename}`;

      const result = await pool.request()
        .input('VID', sql.Int, VID)
        .input('Label', sql.NVarChar(200), Label)
        .input('FilePath', sql.NVarChar(500), filePath)
        .input('CreatedBy', sql.Int, CreatedBy ? parseInt(CreatedBy) : null)
        .execute('sp_AddVehicleOtherAttachment');

      const row = result.recordset?.[0];
      inserted.push({ AttachmentID: row?.AttachmentID, Label, FilePath: filePath });
    }

    res.json({ success: true, attachments: inserted });
  } catch (err) {
    console.error('uploadVehicleOtherAttachments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/getVehicleOtherAttachments/:VID', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VID', sql.Int, req.params.VID)
      .execute('sp_GetVehicleOtherAttachments');

    const rows = result.recordset || [];

    const grouped = [];
    const map = {};
    rows.forEach(r => {
      if (!map[r.Label]) {
        map[r.Label] = { label: r.Label, files: [] };
        grouped.push(map[r.Label]);
      }
      map[r.Label].files.push({
        AttachmentID: r.AttachmentID,
        FilePath: r.FilePath,
        CreatedDate: r.CreatedDate
      });
    });

    res.json({ success: true, groups: grouped });
  } catch (err) {
    console.error('getVehicleOtherAttachments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/deleteVehicleOtherAttachment', async (req, res) => {
  try {
    const { AttachmentID } = req.body;
    if (!AttachmentID) return res.status(400).json({ success: false, message: 'AttachmentID is required' });

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('AttachmentID', sql.Int, AttachmentID)
      .execute('sp_DeleteVehicleOtherAttachment');

    const row = result.recordset?.[0];
    if (!row || row.Success !== 1) {
      return res.status(404).json({ success: false, message: row?.Message || 'Delete failed' });
    }

    const absolutePath = path.join(__dirname, '..', row.FilePath);
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

    res.json({ success: true, message: row.Message });
  } catch (err) {
    console.error('deleteVehicleOtherAttachment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/InsertUpdateVehicleMaster', async (req, res) => {

    const sql = require('mssql');

    const {
        VID = 0,
        VRegNo,
        CompID,
        BranchID,
        VehicleNumber,
        VehicleType,
        VehicleMake,
        VehicleMakeYear,
        ShiftType,
        VehicleCost,
        ChassisNumber,
        EngineNumber,
        SeatingCapacity,
        BS,
        VehicleDescription,
        VehicleName,

        RegisteredOwnerName,
        ContactDetails,
        DriverID,
        DriverName,
        ConductorID,
        ConductorName,
        LedgerID,
        LedgerName,
        SupplierID,       // ← ADD
        SupplierName,     // ← ADD

        RegStartDate,
        RegEndDate,

        InsuranceStartDate,
        InsuranceEndDate,

        PollutionStartDate,
        PollutionEndDate,

        InsuranceCompany,

        FitnessIssueDate,
        FitnessExpiryDate,

        PermitNumber,
        PermitIssueDate,
        PermitExpiryDate,
        PermitStartDate,
        PermitEndDate,

        Warehouse,
        HeightMeter,
        PCHMeterReading,
        Capacity,
        SpareLCoaVal,
        AreaSqft,

        PurchaseDate,
        ContactNumber,

        FuelType,
        Mileage,
        FuelTankCapacity,

        RenewalDate,

        imeiNo,
        franchiseContactNumber,

        Route,
        TimeSchedule,

        IsActive,
        VehicleImage,
        PermitDocument,
        FitnessDocument,
        OnHireDate,
  OffHireDate,

        UserId

    } = req.body;

    const toInt = (v) =>
        v === "" || v === undefined || v === null
            ? null
            : parseInt(v);

    const toDecimal = (v) =>
        v === "" || v === undefined || v === null
            ? null
            : parseFloat(v);

    const toDate = (v) =>
        v === "" || v === undefined || v === null
            ? null
            : v;

    try {

        const poolConn = await sql.connect(dbConfig);

        const request = poolConn.request();

        // ================= INT =================

        request.input('VID', sql.Int, toInt(VID));
        request.input('CompID', sql.Int, toInt(CompID));
        request.input('BranchID', sql.Int, toInt(BranchID));
        request.input('VehicleMakeYear', sql.Int, toInt(VehicleMakeYear));
        request.input('SeatingCapacity', sql.Int, toInt(SeatingCapacity));
        request.input('DriverID', sql.Int, toInt(DriverID));
        request.input('ConductorID', sql.Int, toInt(ConductorID));
        request.input('LedgerID', sql.Int, toInt(LedgerID));
        request.input('SupplierID', sql.Int, toInt(SupplierID));   // ← ADD
        request.input('UserId', sql.Int, toInt(UserId));

        // ================= STRING =================

        request.input('VRegNo', sql.NVarChar(50), VRegNo || null);
        request.input('VehicleNumber', sql.NVarChar(50), VehicleNumber || null);
        request.input('VehicleType', sql.NVarChar(50), VehicleType || null);
        request.input('VehicleMake', sql.NVarChar(100), VehicleMake || null);
        request.input('ShiftType', sql.NVarChar(50), ShiftType || null);
        request.input('ChassisNumber', sql.NVarChar(100), ChassisNumber || null);
        request.input('EngineNumber', sql.NVarChar(100), EngineNumber || null);
        request.input('BS', sql.NVarChar(50), BS || null);
        request.input('VehicleDescription', sql.NVarChar(500), VehicleDescription || null);
        request.input('VehicleName', sql.NVarChar(200), VehicleName || null);
        request.input('RegisteredOwnerName', sql.NVarChar(200), RegisteredOwnerName || null);
        request.input('ContactDetails', sql.NVarChar(sql.MAX), ContactDetails || null);
        request.input('DriverName', sql.NVarChar(200), DriverName || null);
        request.input('ConductorName', sql.NVarChar(200), ConductorName || null);
        request.input('LedgerName', sql.NVarChar(200), LedgerName || null);
        request.input('SupplierName', sql.NVarChar(200), SupplierName || null);   // ← ADD
        request.input('InsuranceCompany', sql.NVarChar(200), InsuranceCompany || null);
        request.input('Warehouse', sql.NVarChar(100), Warehouse || null);
        request.input('ContactNumber', sql.NVarChar(20), ContactNumber || null);
        request.input('FuelType', sql.VarChar(20), FuelType || null);
        request.input('imeiNo', sql.NVarChar(100), imeiNo || null);
        request.input('franchiseContactNumber', sql.NVarChar(20), franchiseContactNumber || null);
        request.input('Route', sql.NVarChar(200), Route || null);
        request.input('TimeSchedule', sql.NVarChar(200), TimeSchedule || null);
        request.input('PermitNumber', sql.NVarChar(100), PermitNumber || null);
        request.input('OnHireDate', sql.Date, toDate(OnHireDate));
request.input('OffHireDate', sql.Date, toDate(OffHireDate));
 
        // ================= DECIMAL =================

        request.input('VehicleCost', sql.Decimal(18, 2), toDecimal(VehicleCost));
        request.input('HeightMeter', sql.Decimal(10, 2), toDecimal(HeightMeter));
        request.input('PCHMeterReading', sql.Decimal(18, 2), toDecimal(PCHMeterReading));
        request.input('Capacity', sql.Decimal(10, 2), toDecimal(Capacity));
        request.input('SpareLCoaVal', sql.Decimal(18, 2), toDecimal(SpareLCoaVal));
        request.input('AreaSqft', sql.Decimal(10, 2), toDecimal(AreaSqft));
        request.input('Mileage', sql.Decimal(6, 2), toDecimal(Mileage));
        request.input('FuelTankCapacity', sql.Decimal(6, 2), toDecimal(FuelTankCapacity));

        // ================= DATE =================

        request.input('RegStartDate', sql.Date, toDate(RegStartDate));
        request.input('RegEndDate', sql.Date, toDate(RegEndDate));
        request.input('InsuranceStartDate', sql.Date, toDate(InsuranceStartDate));
        request.input('InsuranceEndDate', sql.Date, toDate(InsuranceEndDate));
        request.input('PollutionStartDate', sql.Date, toDate(PollutionStartDate));
        request.input('PollutionEndDate', sql.Date, toDate(PollutionEndDate));
        request.input('PurchaseDate', sql.Date, toDate(PurchaseDate));
        request.input('RenewalDate', sql.Date, toDate(RenewalDate));
        request.input('FitnessIssueDate', sql.Date, toDate(FitnessIssueDate));
        request.input('FitnessExpiryDate', sql.Date, toDate(FitnessExpiryDate));
        request.input('PermitIssueDate', sql.Date, toDate(PermitIssueDate));
        request.input('PermitExpiryDate', sql.Date, toDate(PermitExpiryDate));
        request.input('PermitStartDate', sql.Date, toDate(PermitStartDate));
        request.input('PermitEndDate', sql.Date, toDate(PermitEndDate));

        request.input('VehicleImage',    sql.NVarChar(sql.MAX), VehicleImage    || null);
        request.input('PermitDocument',  sql.NVarChar(sql.MAX), PermitDocument  || null);
        request.input('FitnessDocument', sql.NVarChar(sql.MAX), FitnessDocument || null);

        // ================= BIT =================

        request.input(
            'IsActive',
            sql.Bit,
            IsActive === "" ||
            IsActive === undefined ||
            IsActive === null
                ? 1
                : IsActive
        );

        // ================= EXECUTE =================

        await request.execute('webinsertupdatevehiclemaster');

        res.status(VID === 0 ? 201 : 200).json({
            success: true,
            message:
                VID === 0
                    ? 'Vehicle created successfully'
                    : 'Vehicle updated successfully'
        });

    }
    catch (error) {

        console.error('VehicleMaster error:', error);

        res.status(500).json({
            success: false,
            message: 'Database operation failed',
            error: error.message
        });
    }
});

router.get('/WebGetVehicleMaster', async (req, res) => {
    try {
        const { CompID } = req.query;

        if (!CompID) {
            return res.status(400).json({
                success: false,
                message: "CompID is required"
            });
        }

        const poolConn = await sql.connect(dbConfig);

        const result = await poolConn.request()
            .input('CompID', sql.Int, CompID)   // ✅ Pass CompID
            .execute('WebGetVehicleMastercreation');

        res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
    console.error('Get VehicleMaster error:', error);
    res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle master data',
        error: error.message
    });
}
});

router.post('/WebDeleteVehicleMaster', async (req, res) => {
    const { VID, DeletedBy } = req.body;

    // 🔍 Validation
    if (!VID || isNaN(VID)) {
        return res.status(400).json({
            success: false,
            message: 'Valid VID is required'
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
            .input('VID', sql.Int, VID)
            .input('DeletedBy', sql.Int, DeletedBy)
            .execute('WebDeleteVehicleMaster');

        // Stored procedure success response
        const response = result.recordset?.[0];

        if (!response) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        return res.status(200).json({
            success: response.Success === 1,
            message: response.Message
        });

    } catch (error) {
        console.error('WebDeleteVehicleMaster API Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

router.get('/GetVehicleTypeList', async (req, res) => {
  try {
    const { CompanyID } = req.query;

    if (!CompanyID) {
      return res.status(400).json({ success: false, message: 'CompanyID is required' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, parseInt(CompanyID))
      .execute('GetVehicleTypeList');

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('GetVehicleTypeList error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/InsertUpdateVehicleType', async (req, res) => {
  try {
    const {
      VehicleTypeID = 0,
      VehicleTypeName,
      CompanyID,
      CreatedBy,
      ModifiedBy
    } = req.body;

    if (!VehicleTypeName || !VehicleTypeName.trim()) {
      return res.status(400).json({ success: false, message: 'Vehicle Type Name is required' });
    }
    if (!CompanyID) {
      return res.status(400).json({ success: false, message: 'CompanyID is required' });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('VehicleTypeID', sql.Int, parseInt(VehicleTypeID) || 0);
    request.input('VehicleTypeName', sql.NVarChar(100), VehicleTypeName.trim());
    request.input('CompanyID', sql.Int, parseInt(CompanyID));
    request.input('CreatedBy', sql.Int, CreatedBy ? parseInt(CreatedBy) : null);
    request.input('ModifiedBy', sql.Int, ModifiedBy ? parseInt(ModifiedBy) : null);

    const result = await request.execute('InsertUpdateVehicleType');
    const row = result.recordset?.[0];

    res.status(row?.Success === 1 ? 200 : 400).json({
      success: row?.Success === 1,
      message: row?.Message,
      VehicleTypeID: row?.VehicleTypeID
    });
  } catch (error) {
    console.error('InsertUpdateVehicleType error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/DeleteVehicleType', async (req, res) => {
  try {
    const { VehicleTypeID, DeletedBy } = req.body;

    if (!VehicleTypeID) {
      return res.status(400).json({ success: false, message: 'VehicleTypeID is required' });
    }
    if (!DeletedBy) {
      return res.status(400).json({ success: false, message: 'DeletedBy is required' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VehicleTypeID', sql.Int, parseInt(VehicleTypeID))
      .input('DeletedBy', sql.Int, parseInt(DeletedBy))
      .execute('DeleteVehicleType');

    const row = result.recordset?.[0];

    res.status(row?.Success === 1 ? 200 : 400).json({
      success: row?.Success === 1,
      message: row?.Message
    });
  } catch (error) {
    console.error('DeleteVehicleType error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/getstaffs', async (req, res) => {
  try {

    console.log("Request query:", req.query);

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .execute("WebGetStaffs");   

    res.status(200).json({ 
      success: true,
      message: "Staffs fetched successfully",
      data: result.recordset
    });

  } catch (error) {

    console.error("❌ Error fetching staffs:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});




router.get('/getLedgers', async (req, res) => {
  try {

    console.log("Request query:", req.query);

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .execute("WebGetLedgers");   

    res.status(200).json({ 
      success: true,
      message: "Ledgers fetched successfully",
      data: result.recordset
    });

  } catch (error) {

    console.error("❌ Error fetching ledgers:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});

router.get('/GetWorkersByRole', async (req, res) => {
  try {
    const { RoleId, CompanyID } = req.query; // keep query param name as-is on frontend
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('UserRoleId', sql.Int, RoleId)
      .input('CompanyID', sql.Int, CompanyID)
      .execute('GetWorkersByRole');
    res.json({ workers: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/GetVehicleMembers/:vid', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('VehicleId', sql.Int, req.params.vid)
      .execute('GetVehicleMembers');
    res.json({ members: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/SaveVehicleMembers', async (req, res) => {
  try {
    const { VehicleId, Members, ModifiedBy } = req.body;
    const vid = parseInt(VehicleId, 10);
    const modBy = parseInt(ModifiedBy, 10);

    if (!vid || isNaN(vid)) {
      return res.status(400).json({ success: false, message: 'Valid VehicleId is required' });
    }

    const poolConn = await sql.connect(dbConfig);
    const result = await poolConn.request()
      .input('VehicleId', sql.Int, vid)
      .input('Members', sql.NVarChar(sql.MAX), JSON.stringify(Members || []))
      .input('ModifiedBy', sql.Int, modBy)
      .execute('SaveVehicleMembers');

    const response = result.recordset?.[0];
    return res.status(200).json({
      success: response?.Success === 1,
      message: response?.Message
    });
  } catch (error) {
    console.error('SaveVehicleMembers API Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});
router.get('/GetExpenseTypeList', async (req, res) => {
  try {
    const { CompanyID } = req.query;
    if (!CompanyID) {
      return res.status(400).json({ success: false, message: 'CompanyID is required' });
    }
 
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
      .execute('sp_GetExpenseTypeList');
 
    return res.json(result.recordset);
  } catch (err) {
    console.error('GetExpenseTypeList error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load expense types' });
  }
});
 
router.post('/InsertUpdateExpenseType', async (req, res) => {
  try {
    const {
      ExpenseTypeID = 0,
      ExpenseName,
      ACGroupID,
      CompanyID,
      CreatedBy = null,
      ModifiedBy = null,
    } = req.body;
 
    if (!ExpenseName || !ExpenseName.trim()) {
      return res.status(400).json({ success: false, message: 'Expense Name is required' });
    }
    if (!ACGroupID) {
      return res.status(400).json({ success: false, message: 'AC Group is required' });
    }
    if (!CompanyID) {
      return res.status(400).json({ success: false, message: 'CompanyID is required' });
    }
 
    const pool = await sql.connect(dbConfig);;
    const result = await pool.request()
      .input('ExpenseTypeID', sql.Int, parseInt(ExpenseTypeID, 10) || 0)
      .input('ExpenseName', sql.NVarChar(200), ExpenseName.trim())
      .input('ACGroupID', sql.Int, parseInt(ACGroupID, 10))
      .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
      .input('CreatedBy', sql.Int, CreatedBy ? parseInt(CreatedBy, 10) : null)
      .input('ModifiedBy', sql.Int, ModifiedBy ? parseInt(ModifiedBy, 10) : null)
      .execute('sp_InsertUpdateExpenseType');
 
    const savedId = result.recordset?.[0]?.ExpenseTypeID;
 
    return res.json({
      success: true,
      message: !ExpenseTypeID || ExpenseTypeID === 0
        ? 'Expense Type created successfully'
        : 'Expense Type updated successfully',
      ExpenseTypeID: savedId,
    });
  } catch (err) {
    console.error('InsertUpdateExpenseType error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Save failed' });
  }
});

router.post('/DeleteExpenseType', async (req, res) => {
  try {
    const { ExpenseTypeID, DeletedBy } = req.body;

    if (!ExpenseTypeID) {
      return res.status(400).json({ success: false, message: 'ExpenseTypeID is required' });
    }

    const pool = await sql.connect(dbConfig);   // ← fixed
    await pool.request()
      .input('ExpenseTypeID', sql.Int, parseInt(ExpenseTypeID, 10))
      .input('DeletedBy', sql.Int, DeletedBy ? parseInt(DeletedBy, 10) : null)
      .execute('sp_DeleteExpenseType');

    return res.json({ success: true, message: 'Expense Type deleted successfully' });
  } catch (err) {
    console.error('DeleteExpenseType error:', err);
    return res.status(400).json({
      success: false,
      message: err.originalError?.info?.message || err.message || 'Delete failed',
    });
  }
});

router.get('/GetVehicleExpenses/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const pool = await sql.connect(dbConfig);   // ← fixed
    const result = await pool.request()
      .input('VehicleID', sql.Int, parseInt(vehicleId, 10))
      .execute('sp_GetVehicleExpenses');

    return res.json({ success: true, expenses: result.recordset });
  } catch (err) {
    console.error('GetVehicleExpenses error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load vehicle expenses' });
  }
});

router.post('/SaveVehicleExpenses', async (req, res) => {   // ← fixed path
  try {
    const { VehicleId, Expenses = [], ModifiedBy } = req.body;

    if (!VehicleId) {
      return res.status(400).json({ success: false, message: 'VehicleId is required' });
    }

    const pool = await sql.connect(dbConfig);   // ← fixed

    const expensesTable = new sql.Table('dbo.VehicleExpenseTableType'); // schema-qualified
    expensesTable.columns.add('ExpenseTypeID', sql.Int);
    expensesTable.columns.add('Amount', sql.Decimal(18, 2));

    Expenses
      .filter(e => e.ExpenseTypeId && !isNaN(Number(e.Amount)))
      .forEach(e => {
        expensesTable.rows.add(parseInt(e.ExpenseTypeId, 10), parseFloat(e.Amount));
      });

    const result = await pool.request()
      .input('VehicleID', sql.Int, parseInt(VehicleId, 10))
      .input('Expenses', expensesTable)
      .input('ModifiedBy', sql.Int, ModifiedBy ? parseInt(ModifiedBy, 10) : null)
      .execute('sp_SaveVehicleExpenses');

    const totalVehicleCost = result.recordset?.[0]?.TotalVehicleCost ?? 0;

    return res.json({ success: true, message: 'Vehicle expenses saved', totalVehicleCost });
  } catch (err) {
    console.error('SaveVehicleExpenses error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save vehicle expenses' });
  }
});

module.exports = router;
