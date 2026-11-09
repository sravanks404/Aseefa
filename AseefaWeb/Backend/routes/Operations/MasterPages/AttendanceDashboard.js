const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/attendance');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.post('/UploadAttendanceDocument', upload.single('file'), async (req, res) => {
  const { CompanyID, Month, Year, ClientID, SupplierID, CategoryID, UploadedBy } = req.body;
  if (!req.file || !CompanyID || !Month || !Year || (!ClientID && !SupplierID && !CategoryID)) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  try {
    const pool = await sql.connect(dbConfig);
    const r = pool.request();
    r.input('CompanyID', sql.Int, Number(CompanyID));
    r.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
    r.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
    r.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
    r.input('Month', sql.Int, Number(Month));
    r.input('Year', sql.Int, Number(Year));
    r.input('FileName', sql.NVarChar(255), req.file.originalname);
    r.input('StoragePath', sql.NVarChar(500), `/uploads/attendance/${req.file.filename}`);
    r.input('FileType', sql.NVarChar(100), req.file.mimetype);
    r.input('UploadedBy', sql.Int, Number(UploadedBy));
    await r.execute('sp_InsertAttendanceDocument');
    res.json({ success: true });
  } catch (err) {
    console.error('UploadAttendanceDocument error:', err);
    res.status(500).json({ success: false, message: 'Upload failed.' });
  }
}); 


router.get('/GetAttendanceDocuments', async (req, res) => {
  const { CompanyID, ClientID, ProjectID, SupplierID, CategoryID, Month, Year } = req.query;

  if (!CompanyID || !Month || !Year || (!ClientID && !SupplierID && !CategoryID && !ProjectID)) {
    return res.status(400).json({
      success: false,
      message: 'CompanyID, Month, Year and one of ClientID, SupplierID, CategoryID, or ProjectID are required.',
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const r = pool.request();
    r.input('CompanyID', sql.Int, Number(CompanyID));
    r.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
    r.input('ProjectID', sql.Int, ProjectID ? Number(ProjectID) : null);
    r.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
    r.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
    r.input('Month', sql.Int, Number(Month));
    r.input('Year', sql.Int, Number(Year));

    const result = await r.execute('sp_GetAttendanceDocuments');

    const documents = (result.recordset || []).map(d => ({
      DocumentId: d.DocumentId,
      FileName: d.FileName,
      FileType: d.FileType,
      UploadedBy: d.UploadedBy,
      UploadedAt: d.UploadedAt,
      Url: `${req.protocol}://${req.get('host')}${d.StoragePath}`,
    }));

    return res.json({ success: true, documents });
  } catch (err) {
    console.error('GetAttendanceDocuments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load documents.' });
  }
});

router.delete('/DeleteAttendanceDocument/:documentId', async (req, res) => {
  const documentId = parseInt(req.params.documentId);
  const { deletedBy } = req.body;

  if (!documentId) {
    return res.status(400).json({ success: false, message: 'documentId is required.' });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const r = pool.request();
    r.input('DocumentId', sql.Int, documentId);
    r.input('DeletedBy', sql.Int, deletedBy ? Number(deletedBy) : null);

    const result = await r.execute('sp_DeleteAttendanceDocument');
    const affected = result.recordset?.[0]?.AffectedRows ?? 0;

    if (affected === 0) {
      return res.status(404).json({ success: false, message: 'Document not found or already deleted.' });
    }

    return res.json({ success: true, message: 'Document deleted.' });
  } catch (err) {
    console.error('DeleteAttendanceDocument error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
});

router.get('/GetAttendanceAbstract', async (req, res) => {
  const { CompanyID, ClientID, ProjectID, SupplierID, CategoryID, Month, Year } = req.query;

  if (!CompanyID || !Month || !Year || (!ClientID && !SupplierID && !CategoryID && !ProjectID)) {
    return res.status(400).json({
      success: false,
      message: 'CompanyID, Month, Year and one of ClientID, SupplierID, CategoryID, or ProjectID are required.',
    });
  }

  const modesProvided = [ClientID, SupplierID, CategoryID].filter(Boolean).length;
  if (modesProvided > 1) {
    return res.status(400).json({
      success: false,
      message: 'Provide only one of ClientID, SupplierID, or CategoryID.',
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('CompanyID', sql.Int, Number(CompanyID));
    request.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
    request.input('ProjectID', sql.Int, ProjectID ? Number(ProjectID) : null);
    request.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
    request.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
    request.input('Month', sql.Int, Number(Month));
    request.input('Year', sql.Int, Number(Year));

    const result = await request.execute('sp_GetAttendanceAbstract');

    const roster = result.recordsets[0] || [];
    const entries = result.recordsets[1] || [];

    const entriesByUser = entries.reduce((acc, row) => {
      const uid = row.UserId;
      if (!acc[uid]) acc[uid] = {};
      const raw = row.Value;
      const num = Number(raw);
      acc[uid][row.Day] = raw !== null && raw !== '' && !isNaN(num) && /^-?\d+(\.\d+)?$/.test(String(raw))
        ? num
        : raw;
      return acc;
    }, {});

    const workers = roster.map(w => ({
      UserId: w.UserId,
      Name: w.Name,
      MName: w.MName,
      LName: w.LName,
      BadgeNo: w.BadgeNo,            // ← add this line
      RoleName: w.RoleName,
      SupplierId: w.SupplierID,
      SupplierName: w.SupplierName,
      WorkerRate: w.WorkerRate,
      ProjectName: w.ProjectName,
      ProjectCode: w.ProjectCode,
      ClientId: w.ClientID,
      ProjectId: w.ProjectID,
      StartDate: w.StartDate ? new Date(w.StartDate).toISOString().slice(0, 10) : null,
      EndDate: w.EndDate ? new Date(w.EndDate).toISOString().slice(0, 10) : null,
      Days: entriesByUser[w.UserId] || {},
    }));

    return res.json({ success: true, workers });
  } catch (err) {
    console.error('GetAttendanceAbstract error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load attendance data.' });
  }
});

router.post('/SaveAttendance', async (req, res) => {
  const { CompanyID, ModifiedBy, Entries } = req.body;

  if (!CompanyID || !ModifiedBy || !Array.isArray(Entries) || Entries.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'CompanyID, ModifiedBy and a non-empty Entries array are required.',
    });
  }

  
  const isValidValue = (v) => {
    if (v === 'A' || v === 'H' || v === 'Offhired') return true;
    const num = Number(v);
    return typeof v === 'number' || (!isNaN(num) && num >= 0 && num <= 24);
  };

  const invalid = Entries.find(e =>
    !e.UserId ||
    !e.Date ||
    !isValidValue(e.Value) ||
    !e.ClientId ||
    e.ProjectId === undefined ||
    e.ProjectId === null
  );
  if (invalid) {
    return res.status(400).json({
      success: false,
      message: 'One or more entries have an invalid UserId, Date, Value, ClientId or ProjectId.',
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('CompanyID', sql.Int, Number(CompanyID));
    request.input('ModifiedBy', sql.Int, Number(ModifiedBy));
    request.input('EntriesJson', sql.NVarChar(sql.MAX), JSON.stringify(Entries));

    const result = await request.execute('sp_InsertUpdateAttendance');
    const success = result.recordset?.[0]?.Success === 1;

    return res.json({ success, rowsAffected: result.recordset?.[0]?.RowsAffected ?? Entries.length });
  } catch (err) {
    console.error('SaveAttendance error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save attendance changes.' });
  }
});
// ── GET all projects for a supplier ────────────────────────────────
router.get('/GetProjectsBySupplier', async (req, res) => {
  try {
    const { SupplierID } = req.query;

    if (!SupplierID) {
      return res.status(400).json({
        success: false,
        message: "SupplierID is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("SupplierID", sql.Int, parseInt(SupplierID))
      .query(`
        SELECT DISTINCT u.UnitID, u.UnitName
        FROM dbo.ProjectAllocationDetails pad
        INNER JOIN dbo.Unit u ON u.UnitID = pad.ProjectId
        INNER JOIN dbo.UserTable um ON um.UserId = pad.UserId
        WHERE um.SupplierID = @SupplierID
          AND pad.IsDeleted = 0
          AND u.IsDeleted = 0
        ORDER BY u.UnitName
      `);

    res.status(200).json({
      success: true,
      projects: result.recordset || []
    });

  } catch (error) {
    console.error("Error in GetProjectsBySupplier:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get('/GetProjectsByCategory', async (req, res) => {
  try {
    const { CategoryID } = req.query;

    if (!CategoryID) {
      return res.status(400).json({
        success: false,
        message: "CategoryID is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("CategoryID", sql.Int, parseInt(CategoryID))
      .query(`
        SELECT DISTINCT u.UnitID, u.UnitName
        FROM dbo.ProjectAllocationDetails pad
        INNER JOIN dbo.Unit u ON u.UnitID = pad.ProjectId
        INNER JOIN dbo.UserTable um ON um.UserId = pad.UserId
        WHERE um.EmployeeCategoryID = @CategoryID
          AND pad.IsDeleted = 0
          AND u.IsDeleted = 0
        ORDER BY u.UnitName
      `);

    res.status(200).json({
      success: true,
      projects: result.recordset || []
    });

  } catch (error) {
    console.error("Error in GetProjectsByCategory:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get('/GetAllProjects', async (req, res) => {
  try {
    const { CompanyID } = req.query;

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("CompanyID", sql.Int, parseInt(CompanyID))
      .query(`
        SELECT DISTINCT u.UnitID, u.UnitName
        FROM dbo.ProjectAllocationDetails pad
        INNER JOIN dbo.Unit u ON u.UnitID = pad.ProjectId
        WHERE pad.IsDeleted = 0
          AND u.IsDeleted = 0
        ORDER BY u.UnitName
      `);

    res.status(200).json({
      success: true,
      projects: result.recordset || []
    });

  } catch (error) {
    console.error("Error in GetAllProjects:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get('/GetAttendanceSignOff', async (req, res) => {
  const { CompanyID, ClientID, ProjectID, SupplierID, CategoryID, Month, Year } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const r = pool.request();
    r.input('CompanyID', sql.Int, Number(CompanyID));
    r.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
    r.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
    r.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
    r.input('ProjectID', sql.Int, ProjectID ? Number(ProjectID) : null);
    r.input('Month', sql.Int, Number(Month));
    r.input('Year', sql.Int, Number(Year));
    const result = await r.execute('sp_GetAttendanceSignOff');
    res.json({ success: true, signOff: result.recordset?.[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load sign-off status.' });
  }
});

// Reusable factory for the three write actions
function makeSignOffRoute(procName) {
  return async (req, res) => {
    const { CompanyID, ClientID, ProjectID, SupplierID, CategoryID, Month, Year, UserId } = req.body;
    if (!CompanyID || !Month || !Year || !UserId) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }
    try {
      const pool = await sql.connect(dbConfig);
      const r = pool.request();
      r.input('CompanyID', sql.Int, Number(CompanyID));
      r.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
      r.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
      r.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
      r.input('ProjectID', sql.Int, ProjectID ? Number(ProjectID) : null);
      r.input('Month', sql.Int, Number(Month));
      r.input('Year', sql.Int, Number(Year));
      r.input('UserId', sql.Int, Number(UserId));
      await r.execute(procName);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to record sign-off.' });
    }
  };
}
router.get('/GetAttendanceApprovalChain', async (req, res) => {
  const { CompanyID, ClientID, ProjectID, SupplierID, CategoryID, Month, Year } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const r = pool.request();
    r.input('CompanyID', sql.Int, Number(CompanyID));
    r.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
    r.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
    r.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
    r.input('ProjectID', sql.Int, ProjectID ? Number(ProjectID) : null);
    r.input('Month', sql.Int, Number(Month));
    r.input('Year', sql.Int, Number(Year));
    const result = await r.query(`
        SELECT ChainID, ApproverUserID, StepOrder, Status, ActionedAt
        FROM AttendanceApprovalChain
        WHERE CompanyID = @CompanyID
          AND ISNULL(ClientID,0) = ISNULL(@ClientID,0)
          AND ISNULL(SupplierID,0) = ISNULL(@SupplierID,0)
          AND ISNULL(CategoryID,0) = ISNULL(@CategoryID,0)
          AND ISNULL(ProjectID,0) = ISNULL(@ProjectID,0)
          AND Month = @Month AND Year = @Year AND IsDeleted = 0
        ORDER BY StepOrder
    `);
    res.json({ success: true, chain: result.recordset || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load approval chain.' });
  }
});

router.post('/ActionAttendanceApproval', async (req, res) => {
  const { ChainID, UserID, Action } = req.body;
  if (!ChainID || !UserID || !['Approved', 'Rejected'].includes(Action)) {
    return res.status(400).json({ success: false, message: 'Missing or invalid fields.' });
  }
  try {
    const pool = await sql.connect(dbConfig);
    const r = pool.request();
    r.input('ChainID', sql.Int, Number(ChainID));
    r.input('UserID', sql.Int, Number(UserID));
    r.input('Action', sql.NVarChar(20), Action);
    await r.execute('sp_ActionAttendanceApproval');
    res.json({ success: true });
  } catch (err) {
    console.error('ActionAttendanceApproval error:', err);
    res.status(500).json({ success: false, message: err.originalError?.info?.message || 'Action failed.' });
  }
});
router.post('/SetAttendanceApprovalChain', async (req, res) => {
  const { CompanyID, ClientID, SupplierID, CategoryID, ProjectID, Month, Year, Approvers } = req.body;
  if (!CompanyID || !Month || !Year || !Array.isArray(Approvers) || Approvers.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required fields.' });
  }
  try {
    const pool = await sql.connect(dbConfig);

    // ── Validate every proposed approver is an actual Task Management approver ──
    const eligibleResult = await pool.request()
      .input('CompanyID', sql.Int, Number(CompanyID))
      .query(`
        SELECT DISTINCT tam.EmployeeID
        FROM TaskApprovalMembers tam
        INNER JOIN UserTable u ON u.UserId = tam.EmployeeID
        WHERE u.CompanyID = @CompanyID AND u.IsDeleted = 0
      `);
    const eligibleIds = new Set(eligibleResult.recordset.map(r => r.EmployeeID));
    const invalid = Approvers.filter(a => !eligibleIds.has(Number(a.UserID)));
    if (invalid.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected approvers are not designated Task Management approvers.',
      });
    }

    const r = pool.request();
    r.input('CompanyID', sql.Int, Number(CompanyID));
    r.input('ClientID', sql.Int, ClientID ? Number(ClientID) : null);
    r.input('SupplierID', sql.Int, SupplierID ? Number(SupplierID) : null);
    r.input('CategoryID', sql.Int, CategoryID ? Number(CategoryID) : null);
    r.input('ProjectID', sql.Int, ProjectID ? Number(ProjectID) : null);
    r.input('Month', sql.Int, Number(Month));
    r.input('Year', sql.Int, Number(Year));
    r.input('ApproverListJSON', sql.NVarChar(sql.MAX), JSON.stringify(Approvers));
    await r.execute('sp_SetAttendanceApprovalChain');
    res.json({ success: true });
  } catch (err) {
    console.error('SetAttendanceApprovalChain error:', err);
    res.status(500).json({ success: false, message: 'Failed to save approval chain.' });
  }
});

router.post('/MarkAttendancePrepared', makeSignOffRoute('sp_MarkAttendancePrepared'));
router.post('/MarkAttendanceVerified', makeSignOffRoute('sp_MarkAttendanceVerified'));
router.post('/MarkAttendanceApproved', makeSignOffRoute('sp_MarkAttendanceApproved'));
router.get('/GetSuppliersByProject', async (req, res) => {
  try {
    const { ProjectID } = req.query;

    if (!ProjectID) {
      return res.status(400).json({
        success: false,
        message: "ProjectID is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("ProjectID", sql.Int, parseInt(ProjectID))
      .query(`
        SELECT DISTINCT a.AccountID, a.AccountName
        FROM dbo.ProjectAllocationDetails pad
        INNER JOIN dbo.UserTable um ON um.UserId = pad.UserId
        INNER JOIN dbo.Accout a ON a.AccountID = um.SupplierID
        WHERE pad.ProjectId = @ProjectID
          AND pad.IsDeleted = 0
          AND um.SupplierID IS NOT NULL
        ORDER BY a.AccountName
      `);

    res.status(200).json({
      success: true,
      suppliers: result.recordset || []
    });

  } catch (error) {
    console.error("Error in GetSuppliersByProject:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});
module.exports = router;