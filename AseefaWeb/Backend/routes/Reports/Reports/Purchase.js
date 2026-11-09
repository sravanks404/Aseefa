const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
router.use(express.json());

router.get('/GetPurchasedetails', async (req, res) => {
  const { PurchaseID, CompanyID } = req.query;
  console.log("API Hit - PurchaseID:", PurchaseID, "CompanyID:", CompanyID); // DEBUG

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('PurchaseID', sql.Int, PurchaseID);
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('[webGetPurchaseDetailReport]');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});


router.get("/GetAllPurchaseReport", async (req, res) => {
    const { FromDate, ToDate, FYearID, CompanyID } = req.query;

    // Validate required parameters
    if (!FromDate || !ToDate || !FYearID || !CompanyID) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input("FromDate", sql.DateTime, FromDate);
        request.input("ToDate", sql.DateTime, ToDate);
        request.input("FYearID", sql.Int, parseInt(FYearID, 10));
        request.input("CompanyID", sql.Int, parseInt(CompanyID, 10));

        const result = await request.execute("GetAllPurchaseReport");
        res.json(result.recordset);
    } catch (error) {
        console.error("SQL error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    } 
});

router.get("/webGetSupplier", async (req, res) => {
    const { CompanyID } = req.query;

    // Validate required parameter
    if (!CompanyID) {
        return res.status(400).json({ error: "Missing required parameter: CompanyID" });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input("CompanyID", sql.Int, parseInt(CompanyID, 10));

        const result = await request.execute("webGetSupplier");
        res.json(result.recordset);
    } catch (error) {
        console.error("SQL error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    } 
});

router.get("/GetSupplierWiseReport", async (req, res) => {
    const { from, to, FYearID,SupplierId ,CompanyID } = req.query;

    // Validate required parameters
    if (!from || !to || !FYearID || !SupplierId || !CompanyID) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input("from", sql.DateTime, from);
        request.input("to", sql.DateTime, to);
        request.input("FYearID", sql.Int, parseInt(FYearID, 10));
        request.input("SupplierId", sql.Int, parseInt(SupplierId, 10));
        request.input("CompanyID", sql.Int, parseInt(CompanyID, 10));


        const result = await request.execute("GetSupplierWiseReport");
        res.json(result.recordset);
    } catch (error) {
        console.error("SQL error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    } 
});

router.get("/webGetPurchaseItem", async (req, res) => {
    const { CompanyID } = req.query;

    // Validate required parameter
    if (!CompanyID) {
        return res.status(400).json({ error: "Missing required parameter: CompanyID" });
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input("CompanyID", sql.Int, parseInt(CompanyID, 10));

        const result = await request.execute("webGetItemWisePurchase");
        res.json(result.recordset);
    } catch (error) {
        console.error("SQL error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    } 
});

router.get('/GetItemWisePurchase', async (req, res) => {
    const { from,to,CompanyID, ItemId, FYearID } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('from',sql.Date,from);
        request.input('to',sql.Date,to);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('ItemId', sql.Int, ItemId);
        request.input('FYearID', sql.Int, FYearID);
        const result = await request.execute('GetItemWisePurchase');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetReceiptDetailes', async (req, res) => {
    const { CompanyID, FromDate, ToDate,activeUserId } = req.query;
    
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyId', sql.Int, CompanyID);
        request.input('fromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId)


        const result = await request.execute('webGetReceiptDetailes');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});



router.get('/GetPaymentReport', async (req, res) => {
    const {CompanyId, fromDate, ToDate} = req.query;


    
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyId', sql.Int, CompanyId);
        request.input('fromDate', sql.Date, fromDate);
        request.input('ToDate', sql.Date, ToDate);


        const result = await request.execute('WebGetPayment');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetJournalReport', async (req, res) => {
    const {FromDate,ToDate,CompanyID,Type,Narration    } = req.query;
    
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('fromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('CompanyID',sql.Int,CompanyID);
        request.input('Type',sql.VarChar,Type);
        request.input('Narration',sql.VarChar,Narration);
        //request.input('FYearID',sql.Int,FYearID);


        const result = await request.execute('webGetSingleJournal');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.get('/GetOpeningstockReport', async (req, res) => {
    const {CompanyID} = req.query;
    
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID',sql.Int,CompanyID);
        

        const result = await request.execute('webGetOpeningStock');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetCustomerDetailReport', async (req, res) => {
    let { FromDate, ToDate, CompanyID } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert empty strings to null
        FromDate = FromDate?.trim() ? new Date(FromDate) : null;
        ToDate = ToDate?.trim() ? new Date(ToDate) : null;

        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('CompanyID', sql.Int, CompanyID);


        const result = await request.execute('webGetCustomerDetailes');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    } 
});

router.get('/GetPurchaseReturnDetails', async (req, res) => {
  const { PurchaseID, CompanyID } = req.query;
  console.log("API Hit - PurchaseID:", PurchaseID, "CompanyID:", CompanyID); // DEBUG

  try {
    if (!PurchaseID || !CompanyID) {
      return res.status(400).json({ error: "PurchaseID and CompanyID are required" });
    }

    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('PurchaseID', sql.Int, PurchaseID);
    request.input('CompanyID', sql.Int, CompanyID);

    // Call your updated stored procedure
    const result = await request.execute('[webGetPurchaseReturnDetails]');
    
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});
router.get('/GetBillingReturn', async (req, res) => {
  const { FromDate, ToDate, CompanyID, FYearID } = req.query;
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID, "FYearID:", FYearID); // DEBUG

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID || !FYearID) {
      return res.status(400).json({ error: "FromDate, ToDate, CompanyID, and FYearID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('FromDate', sql.DateTime, FromDate);
    request.input('ToDate', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('FYearID', sql.Int, FYearID);

    // Execute stored procedure
    const result = await request.execute('[webGetBillingReturn]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetCreditnoteReport', async (req, res) => {
  let { FromDate, ToDate, CompanyID, Type = 'CN' } = req.query; // Default Type = CN
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID, "Type:", Type);

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID) {
      return res.status(400).json({ error: "FromDate, ToDate, and CompanyID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('FromDate', sql.DateTime, FromDate);
    request.input('ToDate', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('Type', sql.VarChar, Type); // use Type variable

    // Execute stored procedure
    const result = await request.execute('[webgetcreditnotereport]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetDebitnoteReport', async (req, res) => {
  let { FromDate, ToDate, CompanyID, Type = 'DN' } = req.query; // Default Type = CN
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID, "Type:", Type);

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID) {
      return res.status(400).json({ error: "FromDate, ToDate, and CompanyID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('FromDate', sql.DateTime, FromDate);
    request.input('ToDate', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('Type', sql.VarChar, Type); // use Type variable

    // Execute stored procedure
    const result = await request.execute('[webgetcreditnotereport]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetOpeningVoucherReport', async (req, res) => {
  let { FromDate, ToDate, CompanyID } = req.query;
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID);

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID) {
      return res.status(400).json({ error: "FromDate, ToDate, and CompanyID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('FromDate', sql.DateTime, FromDate);
    request.input('ToDate', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);

    // Execute stored procedure
    const result = await request.execute('[WebGetOpeningVoucherReport]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetContraReport', async (req, res) => {
  let { FromDate, ToDate, CompanyID } = req.query;
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID);

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID) {
      return res.status(400).json({ error: "FromDate, ToDate, and CompanyID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('FromDate', sql.DateTime, FromDate);
    request.input('ToDate', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);

    // Execute stored procedure
    const result = await request.execute('[WebGetContraReport]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetItemPurchaseReturn', async (req, res) => {
  let { FromDate, ToDate, CompanyID } = req.query;
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID);

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID) {
      return res.status(400).json({ error: "FromDate, ToDate, and CompanyID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('From', sql.DateTime, FromDate);
    request.input('To', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);

    // Execute stored procedure
    const result = await request.execute('[dbo].[webGetItemPurchaceReturn]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetItemBillReturn', async (req, res) => {
  let { FromDate, ToDate, CompanyID } = req.query;
  console.log("API Hit - FromDate:", FromDate, "ToDate:", ToDate, "CompanyID:", CompanyID);

  try {
    // Validate input
    if (!FromDate || !ToDate || !CompanyID) {
      return res.status(400).json({ error: "FromDate, ToDate, and CompanyID are required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('From', sql.DateTime, FromDate);
    request.input('To', sql.DateTime, ToDate);
    request.input('CompanyID', sql.Int, CompanyID);

    // Execute stored procedure
    const result = await request.execute('[dbo].[webGetItemBillReturn]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetBillReturnDetails', async (req, res) => {
  const { BillID } = req.query;
  console.log("API Hit - BillID:", BillID); // DEBUG

  try {
    // Validate input
    if (!BillID) {
      return res.status(400).json({ error: "BillID is required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('BillID', sql.Int, BillID);

    // Execute stored procedure
    const result = await request.execute('[dbo].[WebGetBillReturnDetails]');

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});



router.post('/InsertUpdateBank', async (req, res) => {

  // ── TYPE SAFETY CHECK — logs which sql types are undefined ──
  const typeCheck = {
    'sql.Int':         typeof sql?.Int,
    'sql.VarChar':     typeof sql?.VarChar,
    'sql.Bit':         typeof sql?.Bit,
    'sql.Date':        typeof sql?.Date,
    'sql.DateTime':    typeof sql?.DateTime,
    'sql.DateTime2':   typeof sql?.DateTime2,
    'sql.NVarChar':    typeof sql?.NVarChar,
  };
  console.log('=== SQL TYPE CHECK ===', JSON.stringify(typeCheck, null, 2));

  const {
    Slno = 0,
    HeadNo,
    BankName,
    Place,
    Branch,
    PhoneNo1,
    AccNo,
    BDate,
    UserId,
    Isdeleted = 0,
    Companyid,
    Branchid,
    UPIid,
    IFSC,
    Status = 0,
    AccountName
  } = req.body;

  try {
    if (!BankName || BankName.trim() === '') {
      return res.status(400).json({ success: false, message: 'BankName is required' });
    }
    if (!Companyid) {
      return res.status(400).json({ success: false, message: 'Companyid is required' });
    }
    if (!Branchid) {
      return res.status(400).json({ success: false, message: 'Branchid is required' });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    const slnoValue   = !isNaN(Number(Slno)) ? Number(Slno) : 0;
    const statusValue = (Status === 1 || Status === true) ? 1 : 0;

    let bDateValue = null;
    if (BDate) {
      const d = new Date(BDate);
      if (!isNaN(d.getTime())) {
        bDateValue = d.toISOString().split('T')[0];
      }
    }

    // ── Use ONLY Int, VarChar, NVarChar — safest across all mssql versions ──
    request.input('Slno',      sql.Int,           slnoValue);
    request.input('HeadNo',    sql.Int,           HeadNo   ? parseInt(HeadNo, 10)  : null);
    request.input('BankName',  sql.NVarChar(200), BankName || null);
    request.input('GUnder',    sql.Int,           14);
    request.input('Place',     sql.NVarChar(200), Place    || null);
    request.input('Branch',    sql.NVarChar(200), Branch   || null);
    request.input('PhoneNo1',  sql.NVarChar(50),  PhoneNo1 || null);
    request.input('AccNo',     sql.NVarChar(100), AccNo    || null);
    request.input('BDate',     sql.NVarChar(20),  bDateValue);
    request.input('UserId',    sql.Int,           UserId   ? parseInt(UserId, 10)  : null);
    request.input('Isdeleted', sql.Int,           Isdeleted ? 1 : 0);   // ← Int instead of Bit
    request.input('Companyid', sql.Int,           parseInt(Companyid, 10));
    request.input('Branchid',  sql.Int,           parseInt(Branchid, 10));
    request.input('UPIid',     sql.NVarChar(150), UPIid    || null);
    request.input('IFSC',      sql.NVarChar(150), IFSC     || null);
    request.input('Status',    sql.Int,           statusValue);
    request.input('AccountName',  sql.NVarChar(150), AccountName || null);

    console.log('=== InsertUpdateBank Inputs ===');
    console.log({ slnoValue, BankName, statusValue, bDateValue, HeadNo, Companyid, Branchid,AccountName });
    console.log('===============================');

    const result = await request.execute('WebInsertUpdateBank');
    const returnId = result.recordset?.[0]?.Slno ?? null;

    res.status(200).json({
      success: true,
      Slno: returnId,
      message: slnoValue === 0
        ? 'Bank record inserted successfully'
        : 'Bank record updated successfully'
    });

  } catch (err) {
    console.error('=== InsertUpdateBank Error ===');
    console.error('Message:', err.message);
    console.error('Stack:',   err.stack);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    console.error('==============================');

    res.status(500).json({
      success: false,
      message: err.message || 'An error occurred',
      error: err.toString()
    });
  }
});

router.post('/DeleteBank', async (req, res) => {
  try {
    const { HSlNo } = req.body;
    if (!HSlNo) return res.status(400).json({ Message: "HSlNo is required" });

    const pool = await sql.connect(dbConfig);  // ✅ was: sql.connect(config)
    const result = await pool.request()
      .input('HSlNo', sql.Int, HSlNo)
      .execute('webDeleteBank');

    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ Message: err.message });
  }
});

router.post('/InsertUpdateAcHead', async (req, res) => {

  const {
    HSlNo = 0,
    HName,
    GUnder = 14,  // Default to 9 for Bank Accounts
    UserId,
    UDate,
    Type,
    OCash,
    Place,
    SuitAppsId
  } = req.body;

  try {

    if (!HName) {
      return res.status(400).json({
        success: false,
        message: "HName is required"
      });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    const hSlNoValue = Number(HSlNo);
    
    // Ensure GUnder is always 9 for bank accounts
    const gUnderValue = 14;

    request.input('HSlNo', sql.Int, !isNaN(hSlNoValue) ? hSlNoValue : 0);
    request.input('HName', sql.VarChar(200), HName || null);
    request.input('GUnder', sql.Int, gUnderValue);  // Changed to sql.Int and hardcoded to 9
    request.input('UserId', sql.Int, UserId ? parseInt(UserId) : null);
    request.input('UDate', sql.DateTime, UDate ? new Date(UDate) : new Date());
    request.input('Type', sql.VarChar(100), Type || null);
    request.input('OCash', sql.Decimal(18, 2), OCash ? parseFloat(OCash) : 0);
    request.input('Place', sql.VarChar(200), Place || null);
    request.input('SuitAppsId', sql.Int, SuitAppsId ? parseInt(SuitAppsId) : null);

    console.log('=== InsertUpdateAcHead Debug ===');
    console.log('HSlNo:', hSlNoValue);
    console.log('HName:', HName);
    console.log('GUnder:', gUnderValue);
    console.log('UserId:', UserId);
    console.log('================================');

    const result = await request.execute('WebInsertUpdateAcHeadBank');

    console.log('Stored Procedure Result:', result.recordset);

    const returnId =
      result.recordset && result.recordset[0]
        ? result.recordset[0].HSlNo
        : null;

    res.status(200).json({
      success: true,
      HSlNo: returnId,
      message: hSlNoValue === 0
        ? "Account Head inserted successfully"
        : "Account Head updated successfully"
    });

  } catch (err) {
    console.error('=== InsertUpdateAcHead Error ===');
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('================================');
    
    res.status(500).json({
      success: false,
      message: err.message,
      error: err.toString()
    });
  }
});


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


router.get('/GetBilldetail', async (req, res) => {
    const { BillID, CompanyID } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('BillID', sql.Int, BillID);
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('webGetBillDetailed');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
})

router.get('/GetBank', async (req, res) => {
  const { CompanyId, BranchId } = req.query;
  console.log("API Hit - CompanyId:", CompanyId, "BranchId:", BranchId); // DEBUG

  try {
    // Validate input
    if (!CompanyId) {
      return res.status(400).json({ error: "CompanyId is required" });
    }

    // Connect to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    // Pass parameters to stored procedure
    request.input('CompanyId', sql.Int, CompanyId);
    request.input('BranchId', sql.Int, BranchId || null);

    // Execute stored procedure
    const result = await request.execute('[dbo].[webGetBank]');

    res.json(result.recordset);

  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});


router.get('/webGetBillDetailed', async (req, res) => {
  try {
    const { BillID, CompanyID } = req.query;

    // ✅ Validate required params
    if (!BillID || !CompanyID) {
      return res.status(400).json({
        success: false,
        message: "BillID and CompanyID are required"
      });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    // ✅ Input parameters
    request.input('BillID', sql.Int, parseInt(BillID));
    request.input('CompanyID', sql.Int, parseInt(CompanyID));

    // ✅ Execute stored procedure
    const result = await request.execute('webGetBillDetailed');

    return res.json({
      success: true,
      data: result.recordset
    });

  } catch (error) {
    console.error("Error in webGetBillDetailed:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});





module.exports = router;
