const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    const { accountId, docType } = req.body;
    const dir = path.join(__dirname, '..', 'uploads', 'customers', String(accountId), docType);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Map docType key -> Accout column name
const DOC_COLUMN_MAP = {
  tradeLicence:   'TradeLicenceFiles',
  vatCertificate: 'VATCertificateFiles',
  contract:       'ContractFiles',
};
// ✅ Add this in your customer router file
// Place it BEFORE your other routes
router.get('/customerfile', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send('No path provided');

  // filePath comes in as /uploads/customers/1/tradeLicence/file.pdf
  // Strip leading slash and join from the correct base
  const absolutePath = path.join(__dirname, '..', filePath.replace(/^\//, ''));

  if (!fs.existsSync(absolutePath)) {
    console.log('File not found at:', absolutePath);  // ← helps debug
    return res.status(404).send('File not found');
  }

  res.sendFile(absolutePath);
});
router.post('/uploadCustomerDocs', upload.array('files'), async (req, res) => {
  try {
    const { accountId, docType } = req.body;
    const column = DOC_COLUMN_MAP[docType];
    if (!column) return res.status(400).json({ success: false, message: 'Invalid docType' });

    const pool = await sql.connect(dbConfig);

    // Fetch existing paths
    const existingRes = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`SELECT ${column} AS col FROM Accout WHERE AccountID = @AccountID`);

    let existing = [];
    try { existing = JSON.parse(existingRes.recordset[0]?.col || '[]'); } catch { existing = []; }

    const newPaths = req.files.map(f =>
      `/uploads/customers/${accountId}/${docType}/${f.filename}` 
    );

    const allPaths = [...existing, ...newPaths];

    await pool.request()
      .input('AccountID', sql.Int, accountId)
      .input('Paths', sql.NVarChar(sql.MAX), JSON.stringify(allPaths))
      .query(`UPDATE Accout SET ${column} = @Paths WHERE AccountID = @AccountID`);

    res.json({ success: true, files: allPaths });
  } catch (err) {
    console.error('uploadCustomerDocs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/getCustomerDocs/:accountId', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('AccountID', sql.Int, req.params.accountId)
      .query(`
        SELECT TradeLicenceFiles, VATCertificateFiles, ContractFiles
        FROM Accout
        WHERE AccountID = @AccountID
      `);

    const row   = result.recordset[0] || {};
    const parse = (col) => {
      try { return JSON.parse(col || '[]'); } catch { return []; }
    };

    res.json({
      success:        true,
      tradeLicence:   parse(row.TradeLicenceFiles),
      vatCertificate: parse(row.VATCertificateFiles),
      contract:       parse(row.ContractFiles),
    });
  } catch (err) {
    console.error('getCustomerDocs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/deleteCustomerDoc', async (req, res) => {
  try {
    const { accountId, docType, filePath } = req.body;
    const column = DOC_COLUMN_MAP[docType];
    if (!column) return res.status(400).json({ success: false, message: 'Invalid docType' });

    const pool = await sql.connect(dbConfig);

    // Get current paths
    const existingRes = await pool.request()
      .input('AccountID', sql.Int, accountId)
      .query(`SELECT ${column} AS col FROM Accout WHERE AccountID = @AccountID`);

    let existing = [];
    try { existing = JSON.parse(existingRes.recordset[0]?.col || '[]'); } catch { existing = []; }

    // Remove the path
    const updated = existing.filter(p => p !== filePath);

    await pool.request()
      .input('AccountID', sql.Int, accountId)
      .input('Paths', sql.NVarChar(sql.MAX), JSON.stringify(updated))
      .query(`UPDATE Accout SET ${column} = @Paths WHERE AccountID = @AccountID`);

    // Delete physical file
    const absolutePath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);

    res.json({ success: true });
  } catch (err) {
    console.error('deleteCustomerDoc error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/CreateupdateCustomer', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const {
      AcHeadId    = 0,
      AccountID   = 0,
      AccountName,
      Address     = '',
      city        = '',
      Place       = '',
      country     = '',
      mob         = '',
      Phone       = '',
      email       = '',
      TinNo       = '',
      CSTNo       = '',
      GSTinNo     = '',
      Companyid,
      CreatedBy,
      AdharNo     = '',
      ShipTo      = '',
      District    = '',
      Sponsor     = '',
      sponsors = [],
      State       = '',
      Pincode     = '',
      TradeLicenceNo   = '',
      TradeLicenceExpiry = null,
      CreditDays  = 0,
      KM          = 0,
      DiscountPercentage = '',
      CreditLimit  = 0,
      CreditAmount = 0,
      RateType    = '',
      SaleBlock   = '',
      RootId      = 0,
      RoutePosition = 0,
      IsSupplier  = 0,
      Billcount   = 0,
      SponsorID   = 0,
      LegalName   = '',
      VATNo       = '',
      Contacts    = [],
      Status = 1, 
    } = req.body;

    // ── STEP 1: AcHead ────────────────────────────────────────────
    const acHeadReq = pool.request();
    acHeadReq.output('AcHeadId', sql.Int, AcHeadId);
    acHeadReq.input('AcHeadName', sql.VarChar(sql.MAX), AccountName);
    acHeadReq.input('GroupId',    sql.Int, 14);
    acHeadReq.input('UserId',     sql.Int, CreatedBy);
    acHeadReq.input('Date',       sql.DateTime, new Date());
    acHeadReq.input('Type',       sql.VarChar(50), 'P');

    const acHeadResult  = await acHeadReq.execute('webInsertUpdateAcHead');
    const finalAcHeadId = acHeadResult.output.AcHeadId;

    // ── STEP 2: Build contacts JSON — all 4 fields ────────────────
    const contactsForSp = (Contacts || [])
      .filter(c => c.name || c.mobile)
      .map(c => ({
        ContactPerson: c.name         || '',
        ContactNumber: c.mobile       || '',
        Designation:   c.designation  || '',
        Email:         c.email        || '',
      }));

    // ── STEP 3: Accout + AccountDetails via SP ────────────────────
    const accReq = pool.request();
accReq.output('AccountID', sql.Int, parseInt(AccountID) || 0);   

    accReq.input('AccountCode',         sql.VarChar(sql.MAX),  finalAcHeadId.toString());
    accReq.input('AccountParent',       sql.Int,               14);
    accReq.input('AccountType',         sql.Int,               0);
    accReq.input('AccountGroup',        sql.Int,               0);
    accReq.input('AccountName',         sql.VarChar(sql.MAX),  AccountName);
    accReq.input('Amount',              sql.Money,             0);
    accReq.input('ReflectsIn',          sql.VarChar(sql.MAX),  '');
    accReq.input('Order',               sql.Int,               0);

    accReq.input('Address',             sql.VarChar(sql.MAX),  Address);
    accReq.input('city',                sql.VarChar(sql.MAX),  city);
    accReq.input('Place',               sql.VarChar(sql.MAX),  Place || city);
    accReq.input('country',             sql.VarChar(sql.MAX),  country);
    accReq.input('mob',                 sql.VarChar(sql.MAX),  mob);
    accReq.input('Phone',               sql.VarChar(sql.MAX),  Phone);
    accReq.input('Email',               sql.VarChar(sql.MAX),  email);
    accReq.input('TinNo',               sql.VarChar(sql.MAX),  TinNo);
    accReq.input('CSTNo',               sql.VarChar(sql.MAX),  CSTNo);
    accReq.input('AccountHead',         sql.Int,               finalAcHeadId);
    accReq.input('Companyid',           sql.Int,               Companyid);
    accReq.input('RootId',              sql.Int,               RootId);
    accReq.input('RateType',            sql.VarChar(sql.MAX),  RateType);
    accReq.input('SaleBlock',           sql.VarChar(sql.MAX),  SaleBlock);
    accReq.input('BankName',            sql.VarChar(sql.MAX),  '');
    accReq.input('CardType',            sql.VarChar(sql.MAX),  '');
    accReq.input('CardNo',              sql.VarChar(sql.MAX),  '');
    accReq.input('CreatedBy',           sql.Int,               CreatedBy);
    accReq.input('CreatedDate',         sql.DateTime,          new Date());
    accReq.input('ModifiedBy',          sql.Int,               CreatedBy);
    accReq.input('ModifiedDate',        sql.DateTime,          new Date());
    accReq.input('DeletedBy',           sql.Int,               0);
    accReq.input('DeletedDate',         sql.DateTime,          null);
    accReq.input('Billmode',            sql.VarChar(50),       '');
    accReq.input('GradeID',             sql.Int,               0);
    accReq.input('TradeLicenceNo',      sql.VarChar(sql.MAX),  TradeLicenceNo);
    accReq.input('TradeLicenceExpiry',  sql.Date, TradeLicenceExpiry ? new Date(TradeLicenceExpiry) : null);
    accReq.input('PinNo',               sql.VarChar(sql.MAX),  '');
    accReq.input('CreditDays',          sql.Int,               CreditDays);
    accReq.input('DiscountPercentage',  sql.VarChar(50),       DiscountPercentage);
    accReq.input('Dis8HNT',             sql.Money,             0);
    accReq.input('Dis8HT',              sql.VarChar(50),       '');
    accReq.input('GSTinNo',             sql.VarChar(sql.MAX),  GSTinNo);
    accReq.input('AdharNo',             sql.VarChar(sql.MAX),  AdharNo);
    accReq.input('Customer_SuitAppsId', sql.VarChar(sql.MAX),  '');
    accReq.input('Latitude',            sql.VarChar(sql.MAX),  '');
    accReq.input('Longitude',           sql.VarChar(sql.MAX),  '');
    accReq.input('IsSupplier',          sql.Int,               IsSupplier);
    accReq.input('IfDistributor',       sql.Int,               0);
    accReq.input('DistribtrWiseCustId', sql.Int,               0);
    accReq.input('ShipTo',              sql.VarChar(sql.MAX),  ShipTo);
    accReq.input('District',            sql.NVarChar(100),     District);
    accReq.input('State',               sql.NVarChar(100),     State);
    
    accReq.input('Pincode',             sql.NVarChar(20),      Pincode);
    accReq.input('KM',                  sql.Decimal(10, 2),    KM);
    accReq.input('CreditLimit',         sql.Decimal(18, 2),    CreditLimit);
    accReq.input('CreditAmount',        sql.Decimal(18, 2),    CreditAmount);
    accReq.input('Billcount',           sql.Int,               parseInt(Billcount) || 0);
    accReq.input('RoutePosition',       sql.Int,               RoutePosition);
    accReq.input('SponsorID',           sql.Int,               parseInt(SponsorID) || 0);
    accReq.input('ContactPersons',      sql.NVarChar(sql.MAX), JSON.stringify(contactsForSp));
    
    const accResult      = await accReq.execute('webInsertUpdateAccountnew');
    const finalAccountID = accResult.output.AccountID;

    // ── STEP 4: VATNo + LegalName (not in SP — direct UPDATE) ─────
    const extraReq = pool.request();
    extraReq.input('AccountID', sql.Int,              finalAccountID);
    extraReq.input('VATNo',     sql.VarChar(50),      VATNo     || '');
    extraReq.input('LegalName', sql.VarChar(sql.MAX), LegalName || '');
    extraReq.input('Sponsor', sql.NVarChar(sql.MAX), Sponsor || '');
    extraReq.input('Status', sql.Int, Status);
    extraReq.input('Sponsors', sql.NVarChar(sql.MAX), JSON.stringify(
  (req.body.sponsors || []).filter(Boolean)
));
    await extraReq.query(`
      UPDATE Accout
      SET vatNo     = @VATNo,
          LegalName = @LegalName,
          Sponsor   = @Sponsor,
          Sponsors  = @Sponsors,
          Status    = @Status 
      WHERE AccountID = @AccountID
    `);

    res.json({
      success:   true,
      AcHeadId:  finalAcHeadId,
      AccountID: finalAccountID,
    });

  } catch (err) {
    console.error('CreateupdateCustomer error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/insertUpdateDesignation', async (req, res) => {
  try {
    const { DesignationId = 0, DesignationName } = req.body;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('DesignationId', sql.Int, DesignationId)
      .input('DesignationName', sql.NVarChar(100), DesignationName)
      .execute('InsertUpdateDesignation');
    res.json({ success: true, DesignationId: result.recordset[0]?.DesignationId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/getDesignations', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().execute('GetDesignations');
    res.json({ success: true, designations: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/GetAccountDetails/:accountId', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const { accountId } = req.params;

    const r = pool.request();
    r.input('AccountID', sql.Int, parseInt(accountId));

    const contactsResult = await r.query(`
      SELECT ContactPerson, ContactNumber, Designation, Email
      FROM AccountDetails
      WHERE AccountID = @AccountID
    `);

    const r2 = pool.request();
    r2.input('AccountID', sql.Int, parseInt(accountId));

    const docsResult = await r2.query(`
      SELECT TradeLicenceFiles, VATCertificateFiles, ContractFiles
      FROM Accout
      WHERE AccountID = @AccountID
    `);

    const docRow = docsResult.recordset[0] || {};

    const parseDocs = (val) => {
      try { return JSON.parse(val || '[]'); }
      catch { return []; }
    };

    res.json({
      success: true,
      contacts: contactsResult.recordset,
      documents: {
        tradeLicence:   parseDocs(docRow.TradeLicenceFiles),
        vatCertificate: parseDocs(docRow.VATCertificateFiles),
        contract:       parseDocs(docRow.ContractFiles),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// router.get('/GetCustomers/:Companyid', async (req, res) => {
//   const { Companyid } = req.params;

//   if (!Companyid) {
//     return res.status(400).json({
//       success: false,
//       message: "Companyid is required"
//     });
//   }

//   try {
//     const pool = await sql.connect(dbConfig);
//     const request = pool.request();

//     // Pass Companyid to SP
//     request.input('Companyid', sql.Int, parseInt(Companyid, 10));

//     const result = await request.execute('webGetCustomernew');

//     res.json({
//       success: true,
//       customers: result.recordset
//     });

//   } catch (err) {
//     console.error("Error fetching customers:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });
router.get('/GetCustomers/:Companyid', async (req, res) => {
  const { Companyid } = req.params;
  const { UserID } = req.query;

  if (!Companyid || !UserID) {
    return res.status(400).json({
      success: false,
      message: "Companyid and UserID are required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('Companyid', sql.Int, parseInt(Companyid, 10));
    request.input('UserID', sql.Int, parseInt(UserID, 10));

    const result = await request.execute('webGetCustomernew');

    res.json({
      success: true,
      customers: result.recordset || []
    });

  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


router.get('/GetSupplierList/:Companyid', async (req, res) => {
  try {
    const { Companyid } = req.params;
    if (!Companyid) return res.status(400).json({ success: false, message: 'Companyid is required' });

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('Companyid', sql.Int, parseInt(Companyid))
      .execute('cl_GetSuppliers');

    res.json({ success: true, suppliers: result.recordset });
  } catch (err) {
    console.error('GetSuppliers error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/getratetype', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .execute('webGetRateType');   // your stored procedure

    res.json({
      success: true,
      data: result.recordset   // [{ RateTypeText: 'CCP' }, ...]
    });
  } catch (error) {
    console.error('Error in Get RateType API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rate types'
    });
  }
});

router.get('/getgsttype', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool
      .request()
      .execute('webGetGSTType');   // GST stored procedure

    res.json({
      success: true,
      data: result.recordset   // [{ GSTTypeId: 1, GSTTypeText: 'Regular' }, ...]
    });

  } catch (error) {
    console.error('Error in Get GSTType API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch GST types'
    });
  }
});

router.post("/InsertUpdateRootPosition", async (req, res) => {
  try {
    const {
      RootId,
      CustomerId,
      Position,
      CreatedBy
    } = req.body;

    // Basic validation
    if (!RootId || !CustomerId || !Position || !CreatedBy) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (RootId, CustomerId, Position, CreatedBy)"
      });
    }

    const pool = await sql.connect(dbConfig);

    const request = pool.request();

    request.input("RootId", sql.Int, RootId);
    request.input("CustomerId", sql.Int, CustomerId);
    request.input("Position", sql.Int, Position);
    request.input("CreatedBy", sql.Int, CreatedBy);
    request.input("CreatedDate", sql.DateTime, new Date());

    await request.execute("webInsertUpdateRootPosition");

    res.status(200).json({
      success: true,
      message: "Route position saved successfully"
    });

  } catch (error) {
    console.error("Error inserting/updating root position:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/WebGetRootMastername', async (req, res) => {
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

router.get('/getrootposition', async (req, res) => {
  const { accountId, rootId, companyId } = req.query;

  // Basic validation
  if (!accountId || !rootId || !companyId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: accountId, rootId, companyId'
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('AccountID',   sql.Int, parseInt(accountId));
    request.input('RootID',      sql.Int, parseInt(rootId));
    request.input('Companyid',   sql.Int, parseInt(companyId));

    const result = await request.execute('webGetCustomerNameByRootPosition');

    // Usually returns one recordset
    const customers = result.recordset || [];

    res.json({
      success: true,
      count: customers.length,
      customers
    });

  } catch (err) {
    console.error('Error executing webGetCustomerNameByRootPosition:', err);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers by root position',
      error: err.message   // ← remove in production if sensitive
    });
  }
});

router.post('/customerDeleteAccountHead', async (req, res) => {
  try {
    const { HSlNo, userid } = req.body;

    if (!HSlNo || !userid) {
      return res.status(400).json({
        success: false,
        message: 'HSlNo and userid are required'
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('HSlNo', sql.Int, HSlNo)
      .input('userid', sql.Int, userid)
      .execute('webDeleteAccountHeads');

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: err.message
    });
  }
});


router.get('/GetCamp/:CampID', async (req, res) => {
  const { CampID } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('CampID', sql.Int, parseInt(CampID, 10))
      .execute('sp_GetCampByID');

    res.json({
      success: true,
      camp: result.recordset
    });

  } catch (err) {
    console.error("Error fetching camp:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


router.get('/GetVehiclesNew', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .execute('GetVehiclesNew');

    res.json({
      success: true,
      vehicles: result.recordset
    });

  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({
      success: false,
      message: err.message
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

router.get('/getSalesReps', async (req, res) => {
  const { CompanyId } = req.query;

  if (!CompanyId) {
    return res.status(400).json({
      success: false,
      message: "CompanyId is required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, parseInt(CompanyId))
      .execute('WebGetSalesReps');

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({
      success: false,
      message: err.message   
    });
  }
});

module.exports = router;