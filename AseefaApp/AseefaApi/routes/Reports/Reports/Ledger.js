const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');
const axios = require('axios'); // ✅ Add this
const uuid = require('uuid'); // For unique file names



router.get('/GetPlDetails', async (req, res) => {
    const { FromDate, ToDate, CompanyID, AccountName, Order } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('AccountName', sql.NVarChar(200), AccountName || null);
        request.input('Order', sql.Int, Order);

        const result = await request.execute('webGetPlDetails');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});




router.get('/allpartyledger', async (req, res) => {
    const { FromDate, ToDate, CompanyID,AccountGroup,Reset } = req.query;  // ✅ Extract query params

    if (!FromDate || !ToDate || !CompanyID ) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('FromDate', sql.DateTime,new Date (FromDate))
            .input('ToDate', sql.DateTime, new Date(ToDate))
            .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
            .input('AccountGroup', sql.Int, parseInt(AccountGroup, 10))
            input('Reset', sql.Int, parseInt(Reset, 10))
            .execute('Weballpartyledger');
        res.status(200).json({
            success: true,
            data: result.recordsets
        });
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });
    } 
});

router.post("/send-wa", async (req, res) => {
  const { phone, text, fname, fileBase64 } = req.body;

  if (!phone || !text || !fname || !fileBase64) {
    return res.status(400).send("Missing required fields");
  }

  try {
    // Create temp folder if not exists
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Generate a unique filename to avoid collision
    const safeFileName = `${uuid.v4()}-${fname.replace(/\s+/g, "_")}`;
    const filePath = path.join(tempDir, safeFileName);

    // Save PDF file from base64
    fs.writeFileSync(filePath, Buffer.from(fileBase64, "base64"));

    // Serve this file via a static server (make sure `/temp` is public in Express)
    const fileUrl = `https://your-domain.com/temp/${safeFileName}`; // replace with actual domain

    // WhatsApp API params
    const apiURL = "https://bhashsms.com/api/sendmsg.php";
    const params = {
      user: "BhashWAPAi",
      pass: "bwap@123$",
      sender: "BUZWAP",
      phone,
      text,
      priority: "wa",
      stype: "normal",
      htype: "document",
      fname,
      url: fileUrl
    };

    const response = await axios.get(apiURL, { params });

    res.send(`Message sent successfully. API Response: ${response.data}`);
  } catch (err) {
    console.error("WhatsApp API Error:", err.message);
    res.status(500).send("Failed to send WhatsApp message");
  }
});



router.get('/getplreport', async (req, res) => {
    const { FromDate, ToDate, CompanyID, } = req.query;  // ✅ Extract query params

    if (!FromDate || !ToDate || !CompanyID ) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('FromDate', sql.DateTime,new Date (FromDate))
            .input('ToDate', sql.DateTime, new Date(ToDate))
            .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
            .execute('webGetProfitAndLoss');
        res.status(200).json({
            success: true,
            data: result.recordsets
        });
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });
    } 
});


router.get('/WebLedger', async (req, res) => {
    try {
        const { FromDate, ToDate, CompanyID, AccountCode } = req.query;

        if (!FromDate || !ToDate || !CompanyID || !AccountCode) {
            return res.status(400).json({ error: "FromDate, ToDate, CompanyID, and AccountCode are required." });
        }

        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('FromDate', sql.DateTime, FromDate)
            .input('ToDate', sql.DateTime, ToDate)
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .input('AccountCode', sql.Int, parseInt(AccountCode))
            .execute('WebLedger');

        const response = {
         
            details: result.recordsets
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/LedgerTrans', async (req, res) => {
    try {
        const { FromDate, ToDate, CompanyID, AccountCode } = req.query; 

        if (!FromDate || !ToDate || !CompanyID || !AccountCode) {
            return res.status(400).json({ error: "FromDate, ToDate, CompanyID, and AccountCode are required." });
        }

        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('FromDate', sql.DateTime, FromDate)
            .input('ToDate', sql.DateTime, ToDate)
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .input('AccountCode', sql.Int, parseInt(AccountCode))
            .execute('WebLedgerTrans');

        const response = {
         
            details: result.recordsets
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/Achead', async (req, res) => {
    // const {FromDate, ToDate } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        const result = await request.execute('webGetAchead');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/LedgerCustomer', async (req, res) => {
    try {
        const { CustomerID, FromDate, ToDate,FYearID } = req.query; 

        if (!CustomerID || !FromDate || !ToDate) {
            return res.status(400).json({ error: "CustomerID, FromDate, and ToDate are required." });
        }

        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('CustomerID', sql.Int, parseInt(CustomerID)) 
            .input('FYearID', sql.Int, parseInt(FYearID)) 
            .input('FromDate', sql.Date, FromDate)
            .input('ToDate', sql.Date, ToDate)
            .execute('WEB-TESTGetLedgerwiseDetailsAppAllDate'); 

            const response = {
                summary: result.recordsets[0] || [], // First SELECT statement result
                Details: result.recordsets[1] || [], // Second SELECT statement result
            };

            res.status(200).json(response);
        } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/TrailBalance', async (req, res) => {
    const { CompanyID, FromDate, ToDate } = req.query;



    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);

        const result = await request.execute('WebGetTrailBalance');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.get('/DamageReport', async (req, res) => {
    const {FromDate, ToDate } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);

        const result = await request.execute('WebGetDamageReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/DebitorsReport', async (req, res) => {
    const {FromDate, ToDate } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);

        const result = await request.execute('WebGetDebitorsReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.get('/CreditorsReport', async (req, res) => {
    const {FromDate, ToDate } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);

        const result = await request.execute('WebGetCreditorsReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});





module.exports = router;
