const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 

// ── Multer storage ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/suppliers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const cleanName = file.originalname
      .replace(/__SPONSOR_\d+__IDX__\d+$/, '')
      .replace(/__SUBSPONSOR_\d+__IDX__\d+$/, '')
      .replace(/__IDX__\d+$/, '');
    cb(null, `${unique}-${cleanName}`);
  }
});
const upload = multer({ storage });

// multer field config — three separate file inputs from the front end
const uploadFields = upload.fields([
  { name: 'attachments' },        // supplier-level (Other + LPO, isLPO flag in meta)
  { name: 'sponsorAttachments' }, // sponsor documents
  { name: 'subSponsorAttachments' } // sub-sponsor documents
]);

// ── Helpers ────────────────────────────────────────────────────────────────
const toDate = (val) => (!val || val === '') ? null : new Date(val);
const toInt  = (val) => (val == null || val === '') ? null : parseInt(val);
const toStr  = (val) => (val == null) ? '' : String(val);
const safeJsonParse = (val, fallback) => {
  try {
    const parsed = JSON.parse(val ?? JSON.stringify(fallback));
    return Array.isArray(parsed) || typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
};

// Inserts one row into SupplierAttachments for a given owner scope.
async function insertAttachment(pool, { supplierID, file, docName, isLPO, ownerType, ownerKey, uploadedBy }) {
  const storagePath = `/uploads/suppliers/${file.filename}`;
  const ar = pool.request();
  ar.input('SupplierID',  sql.Int,            supplierID);
  ar.input('FileName',    sql.NVarChar(255),  file.originalname.split('__IDX__')[0].split('__SPONSOR_')[0].split('__SUBSPONSOR_')[0]);
  ar.input('StoragePath', sql.NVarChar(500),  storagePath);
  ar.input('FileType',    sql.NVarChar(100),  file.mimetype);
  ar.input('FileSizeKB',  sql.Int,            Math.round(file.size / 1024));
  ar.input('DocName',     sql.NVarChar(255),  toStr(docName));
  ar.input('IsLPO',       sql.Bit,            !!isLPO);
  ar.input('OwnerType',   sql.VarChar(20),    ownerType);
  ar.input('OwnerKey',    sql.NVarChar(100),  toStr(ownerKey));
  ar.input('UploadedBy',  sql.Int,            uploadedBy);
  await ar.query(`
    INSERT INTO SupplierAttachments
      (SupplierID, FileName, StoragePath, FileType, FileSizeKB, DocName, IsLPO, OwnerType, OwnerKey, UploadedBy, UploadedAt, IsDeleted)
    VALUES
      (@SupplierID, @FileName, @StoragePath, @FileType, @FileSizeKB, @DocName, @IsLPO, @OwnerType, @OwnerKey, @UploadedBy, GETDATE(), 0)
  `);
}

// ══════════════════════════════════════════════════════════════════════════
// GET /GetSuppliers/:Companyid
// ══════════════════════════════════════════════════════════════════════════
router.get('/GetSuppliers/:Companyid', async (req, res) => {
  try {
    const { Companyid } = req.params;
    if (!Companyid) return res.status(400).json({ success: false, message: 'Companyid is required' });

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('Companyid', sql.Int, parseInt(Companyid))
      .execute('sp_GetSuppliers');

    res.json({ success: true, suppliers: result.recordset });
  } catch (err) {
    console.error('GetSuppliers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/GetSubSponsorsBySupplier', async (req, res) => {
  const { SupplierID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('SupplierID', sql.Int, SupplierID)
      .execute('GetSubSponsorsBySupplier');
    res.json({ subSponsors: result.recordset });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /CreateupdateSupplier   (multipart/form-data)
// ══════════════════════════════════════════════════════════════════════════
router.post('/CreateupdateSupplier', uploadFields, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const {
      AccountID = 0, AcHeadId = 0, AccountName,
      Address = '', city = '', country = '',
      mob = '', phone = '', Phones = '[]',
      email = '', TinNo = '',
      VatNo = '', VatExpiry = null,
      GSTinNo = '',
      EIDNo = '', EmiratesIDExpiry = null,
      TradeLicenceNo = '', TradeLicenceExpiry = null,
      PassportNo = '', PassportExpiry = null,
      ProjectIDs = '[]', IsActive = 1,
      Sponsors = '[]', SubSponsors = '[]',
      Companyid,
      CreatedBy = null, ModifiedBy = null,
      AccountParent = 27, IsSupplier = 1,
      attachmentMeta = '[]',
      sponsorAttachmentMeta = '[]',
      subSponsorAttachmentMeta = '[]',
      deletedAttachmentIDs = '[]',
      deletedSponsorAttachmentIDs = '[]',
      deletedSubSponsorAttachmentIDs = '[]',
      EmiratesIDs = '[]',   // ← ADD
  Passports = '[]',
    } = req.body;

    const phonesStr     = typeof Phones     === 'string' ? Phones     : JSON.stringify(Phones);
    const projectIDsStr = typeof ProjectIDs === 'string' ? ProjectIDs : JSON.stringify(ProjectIDs);

    // ── Parse sponsors / sub-sponsors and assign a stable Key to each ──
    // The Key is what ties a person to their documents in SupplierAttachments
    // (OwnerKey), since sponsors/sub-sponsors live as JSON, not real FK rows.
    const sponsorsArr = safeJsonParse(Sponsors, []).map((s, idx) => ({
      ...s,
      Key: s.Key || `sp_${Date.now()}_${idx}_${Math.round(Math.random() * 1e6)}`
    }));
    const subSponsorsArr = safeJsonParse(SubSponsors, []).map((s, idx) => ({
      ...s,
      Key: s.Key || `ss_${Date.now()}_${idx}_${Math.round(Math.random() * 1e6)}`
    }));

    const sponsorsStr    = JSON.stringify(sponsorsArr);
    const subSponsorsStr = JSON.stringify(subSponsorsArr);

    // ── Call stored procedure ──────────────────────────────────────────
    const request = pool.request();
    request.input('AccountID',          sql.Int,               toInt(AccountID) ?? 0);
    request.input('AcHeadId',           sql.Int,               toInt(AcHeadId)  ?? 0);
    request.input('AccountName',        sql.NVarChar(sql.MAX), toStr(AccountName));
    request.input('Address',            sql.VarChar(100),      toStr(Address));
    request.input('city',               sql.VarChar(50),       toStr(city));
    request.input('country',            sql.VarChar(50),       toStr(country));
    request.input('mob',                sql.VarChar(50),       toStr(mob));
    request.input('phone',              sql.VarChar(50),       toStr(phone));
    request.input('Phones',             sql.NVarChar(sql.MAX), phonesStr);
    request.input('email',              sql.VarChar(50),       toStr(email));
    request.input('TinNo',              sql.VarChar(50),       toStr(TinNo));
    request.input('VatNo',              sql.VarChar(50),       toStr(VatNo));
    request.input('VatExpiry',          sql.Date,              toDate(VatExpiry));
    request.input('GSTinNo',            sql.NVarChar(sql.MAX), toStr(GSTinNo));
    request.input('EIDNo',              sql.VarChar(20),       toStr(EIDNo));
    request.input('EmiratesIDExpiry',   sql.Date,              toDate(EmiratesIDExpiry));
    request.input('TradeLicenceNo',     sql.VarChar(100),      toStr(TradeLicenceNo));
    request.input('TradeLicenceExpiry', sql.Date,              toDate(TradeLicenceExpiry));
    request.input('PassportNo',         sql.VarChar(50),       toStr(PassportNo));
    request.input('PassportExpiry',     sql.Date,              toDate(PassportExpiry));
    request.input('ProjectIDs',         sql.NVarChar(sql.MAX), projectIDsStr);
    request.input('Status',             sql.Int,               toInt(IsActive) ?? 1);
    request.input('Sponsors',           sql.NVarChar(sql.MAX), sponsorsStr);
    request.input('SubSponsors',        sql.NVarChar(sql.MAX), subSponsorsStr);
    request.input('Companyid',          sql.Int,               toInt(Companyid));
    request.input('CreatedBy',          sql.Int,               toInt(CreatedBy));
    request.input('ModifiedBy',         sql.Int,               toInt(ModifiedBy));
    request.input('AccountParent',      sql.Int,               toInt(AccountParent) ?? 27);
    request.input('IsSupplier',         sql.Int,               toInt(IsSupplier)    ?? 1);
    request.input('EmiratesIDs', sql.NVarChar(sql.MAX), typeof EmiratesIDs === 'string' ? EmiratesIDs : JSON.stringify(EmiratesIDs));
request.input('Passports',   sql.NVarChar(sql.MAX), typeof Passports   === 'string' ? Passports   : JSON.stringify(Passports));

    const result   = await request.execute('sp_CreateUpdateSupplier');
    const response = result.recordset?.[0];

    if (!response?.success) {
      return res.status(400).json({ success: false, message: response?.message || 'Operation failed' });
    } 

    const supplierID = response.AccountID ?? toInt(AccountID);
    const uploadedBy  = toInt(ModifiedBy) || toInt(CreatedBy);

    // ── Soft-delete removed attachments (supplier-level + sponsor + sub-sponsor) ──
    const softDelete = async (attID) => {
      const dr = pool.request();
      dr.input('AttachmentID', sql.Int, toInt(attID));
      dr.input('DeletedBy',    sql.Int, uploadedBy);
      await dr.execute('sp_DeleteSupplierAttachment');
    };
    for (const attID of safeJsonParse(deletedAttachmentIDs, []))             await softDelete(attID);
    for (const attID of safeJsonParse(deletedSponsorAttachmentIDs, []))      await softDelete(attID);
    for (const attID of safeJsonParse(deletedSubSponsorAttachmentIDs, []))   await softDelete(attID);

    // ── Insert new supplier-level uploads (Other + LPO) ────────────────
    const meta  = safeJsonParse(attachmentMeta, []);
    const supplierFiles = req.files?.attachments || [];

    for (const file of supplierFiles) {
      const idx = parseInt(file.originalname.split('__IDX__')[1]) ?? 0;
      const m = meta.find((x) => x.index === idx) || {};
      await insertAttachment(pool, {
        supplierID,
        file,
        docName: m.docName || file.originalname.split('__IDX__')[0],
        isLPO: !!m.isLPO,
        ownerType: 'supplier',
        ownerKey: supplierID,
        uploadedBy
      });
    }

    // ── Insert new sponsor document uploads ────────────────────────────
    const sponsorMeta  = safeJsonParse(sponsorAttachmentMeta, []);
    const sponsorFiles = req.files?.sponsorAttachments || [];

    for (const file of sponsorFiles) {
      const match = file.originalname.match(/__SPONSOR_(\d+)__IDX__(\d+)$/);
      const sponsorIndex = match ? parseInt(match[1]) : 0;
      const idx          = match ? parseInt(match[2]) : 0;
      const m = sponsorMeta.find((x) => x.sponsorIndex === sponsorIndex && x.index === idx) || {};
      const sponsorKey = sponsorsArr[sponsorIndex]?.Key;
      if (!sponsorKey) continue; // sponsor was removed client-side before save
      await insertAttachment(pool, {
        supplierID,
        file,
        docName: m.docName || file.originalname.split('__SPONSOR_')[0],
        isLPO: false,
        ownerType: 'sponsor',
        ownerKey: sponsorKey,
        uploadedBy
      });
    }

    // ── Insert new sub-sponsor document uploads ─────────────────────────
    const subSponsorMeta  = safeJsonParse(subSponsorAttachmentMeta, []);
    const subSponsorFiles = req.files?.subSponsorAttachments || [];

    for (const file of subSponsorFiles) {
      const match = file.originalname.match(/__SUBSPONSOR_(\d+)__IDX__(\d+)$/);
      const subSponsorIndex = match ? parseInt(match[1]) : 0;
      const idx              = match ? parseInt(match[2]) : 0;
      const m = subSponsorMeta.find((x) => x.subSponsorIndex === subSponsorIndex && x.index === idx) || {};
      const subSponsorKey = subSponsorsArr[subSponsorIndex]?.Key;
      if (!subSponsorKey) continue;
      await insertAttachment(pool, {
        supplierID,
        file,
        docName: m.docName || file.originalname.split('__SUBSPONSOR_')[0],
        isLPO: false,
        ownerType: 'subsponsor',
        ownerKey: subSponsorKey,
        uploadedBy
      });
    }

    return res.json({
      success: true,
      message: response.message,
      AccountID: supplierID,
      Sponsors: sponsorsArr,
      SubSponsors: subSponsorsArr
    });

  } catch (err) {
    console.error('CreateupdateSupplier error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /GetSupplierAttachments/:supplierID
// Query params: ownerType ('supplier' | 'sponsor' | 'subsponsor'), ownerKey
// Both optional — default behaviour (no params) returns supplier-level docs,
// matching the previous behaviour exactly.
// ══════════════════════════════════════════════════════════════════════════
router.get('/GetSupplierAttachments/:supplierID', async (req, res) => {
  try {
    const supplierID = parseInt(req.params.supplierID);
    if (!supplierID) return res.status(400).json({ success: false, message: 'supplierID is required' });

    const { ownerType = 'supplier', ownerKey } = req.query;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('SupplierID', sql.Int, supplierID)
      .input('OwnerType',  sql.VarChar(20), ownerType)
      .input('OwnerKey',   sql.NVarChar(100), ownerKey || null)
      .execute('sp_GetSupplierAttachments');

    res.json({ success: true, attachments: result.recordset });
  } catch (err) {
    console.error('GetSupplierAttachments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// DELETE /DeleteSupplierAttachment/:attachmentID
// ══════════════════════════════════════════════════════════════════════════
router.delete('/DeleteSupplierAttachment/:attachmentID', async (req, res) => {
  try {
    const attachmentID = parseInt(req.params.attachmentID);
    const { deletedBy } = req.body;

    if (!attachmentID) return res.status(400).json({ success: false, message: 'attachmentID is required' });

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('AttachmentID', sql.Int, attachmentID)
      .input('DeletedBy',    sql.Int, toInt(deletedBy))
      .execute('sp_DeleteSupplierAttachment');

    const affected = result.recordset?.[0]?.AffectedRows ?? 0;
    if (affected === 0) return res.status(404).json({ success: false, message: 'Attachment not found or already deleted' });

    res.json({ success: true, message: 'Attachment deleted' });
  } catch (err) {
    console.error('DeleteSupplierAttachment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GET /GetProjects
// ══════════════════════════════════════════════════════════════════════════
router.get('/GetProjects', async (req, res) => {
  const CompanyID = req.query.CompanyID;
  if (!CompanyID) return res.status(400).send('CompanyID is required');
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, CompanyID)
      .execute('WebGetProjects');
    res.json(result.recordset);
  } catch (err) {
    console.error('GetProjects error:', err);
    res.status(500).send('Server error');
  }
});

// ══════════════════════════════════════════════════════════════════════════
// POST /SupplierDeleteAccountHead
// ══════════════════════════════════════════════════════════════════════════
router.post('/SupplierDeleteAccountHead', async (req, res) => {
  try {
    const { HSlNo, userid } = req.body;
    if (!HSlNo || !userid) return res.status(400).json({ success: false, message: 'HSlNo and userid are required' });

    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('HSlNo',  sql.Int, HSlNo)
      .input('userid', sql.Int, userid)
      .execute('webDeleteAccountHeads');

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('DeleteAccountHead error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;