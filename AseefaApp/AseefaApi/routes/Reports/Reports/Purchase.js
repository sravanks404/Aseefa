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
    const { CompanyID, FromDate, ToDate } = req.query;

    // Validation
    if (!CompanyID || !FromDate || !ToDate) {
      return res.status(400).json({
        success: false,
        message: "CompanyID, FromDate and ToDate are required",
      });
    }

    // Ensure CompanyID is integer
    const companyIdInt = parseInt(CompanyID);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({
        success: false,
        message: "CompanyID must be a valid integer",
      });
    }

    // Connect to SQL Server
    const pool = await sql.connect(dbConfig);

    // Execute stored procedure
    const result = await pool
      .request()
      .input("CompanyID", sql.Int, companyIdInt)
      .input("FromDate", sql.Date, FromDate)
      .input("ToDate", sql.Date, ToDate)
      .execute("[webGetOpeningStock]");

    // Return results
    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in /webGetBranchName:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch branch stock data",
      error: error.message,
    });
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







module.exports = router;
