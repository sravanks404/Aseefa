// const express = require('express');
// const router = express.Router();
// const sql = require('mssql');
// const dbConfig = require('../../../config/mssql');
// const axios = require('axios'); // ✅ Add this
// const uuid = require('uuid'); // For unique file names



// router.get('/GetPlDetails', async (req, res) => {
//     const { FromDate, ToDate, CompanyID, AccountName, Order } = req.query;

//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
        
//         request.input('FromDate', sql.Date, FromDate);
//         request.input('ToDate', sql.Date, ToDate);
//         request.input('CompanyID', sql.Int, CompanyID);
//         request.input('AccountName', sql.NVarChar(200), AccountName || null);
//         request.input('Order', sql.Int, Order);

//         const result = await request.execute('webGetPlDetails');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });


// router.get("/WebLedgerNew", async (req, res) => {
//   try {
//     const { FromDate, ToDate, CompanyID, AccountCode } = req.query;

//     if (!FromDate || !ToDate || !CompanyID || !AccountCode) {
//       return res.status(400).json({ error: "Missing params" });
//     }

//     const pool = await sql.connect(dbConfig);

//     const result = await pool.request()
//       .input("FromDate", sql.DateTime, FromDate)
//       .input("ToDate", sql.DateTime, ToDate)
//       .input("AcHead", sql.Int, parseInt(AccountCode))
//       .input("CompanyID", sql.Int, parseInt(CompanyID))
//       .execute("NewLedger_02042025");

//     const rs = result.recordsets;

//     // ===============================
//     // HELPERS
//     // ===============================
//     const toNumber = (v) => isNaN(Number(v)) ? 0 : Number(v);
//     const isSame = (a, b) => String(a) === String(b);
//     const amt = (r) => toNumber(r.Amt || r.Amount || r.debit || r.credit || 0);

//     let ledger = [];

//     const push = (row) => {
//       ledger.push({
//         date: new Date(row.date),
//         type: row.type,
//         transNo: row.transNo || "",
//         debit: toNumber(row.debit),
//         credit: toNumber(row.credit),
//         narration: row.narration || ""
//       });
//     };

//     // ===============================
//     // 🔴 RECEIPTS
//     // ===============================
//     (rs[32] || []).forEach(r => {
//       const amount = amt(r);
//       const isCredit = isSame(r.FCode, AccountCode);
//       push({
//         date: r.ADate,
//         type: "Receipt",
//         transNo: r.Billno,
//         debit: isCredit ? 0 : amount,
//         credit: isCredit ? amount : 0,
//         narration: r.Narration,

//       });
//     });

//     (rs[9] || []).forEach(r => {
//       const amount = amt(r);
//       const isCredit = isSame(r.PartyID, AccountCode);
//       push({
//         date: r.RDate,
//         type: "Receipt",
//         transNo: r.Slno,
//         debit: isCredit ? 0 : amount,
//         credit: isCredit ? amount : 0,
//         narration: r.Remark
//       });
//     });

//     (rs[17] || []).forEach(r => {
//       const amount = amt(r);
//       const isCredit = isSame(r.PartyID, AccountCode);
//       push({
//         date: r.ChequeApprovedDate,
//         type: "Receipt",
//         transNo: r.Slno,
//         debit: isCredit ? 0 : amount,
//         credit: isCredit ? amount : 0,
//         narration: r.Remark
//       });
//     });

//     // ===============================
//     // 🔴 PAYMENTS
//     // ===============================
//     (rs[10] || []).forEach(r => {
//       const amount = amt(r);
//       push({
//         date: r.PDate,
//         type: "Payment",
//         transNo: r.slno,
//         debit: r.FMode === "D" ? amount : 0,
//         credit: r.FMode === "C" ? amount : 0,
//         narration: r.Narration,
//         InvoiceNo:r.InvoiceNo || "",
//       });
//     });

//     (rs[30] || []).forEach(r => {
//       const amount = amt(r);
//       const isDebit = isSame(r.PartyID, AccountCode);
//       push({
//         date: r.PDate,
//         type: "Payment",
//         transNo: r.slno,
//         debit: isDebit ? amount : 0,
//         credit: isDebit ? 0 : amount,
//         narration: r.Narration,
//         InvoiceSeries: r.InvSeries || "",
//       });
//     });

//     // ===============================
//     // 🟢 DEBIT SIDE
//     // ===============================
//     //(rs[7] || []).forEach(r => push({ date: r.BillDate, type: "Sale", transNo: r.BillNo, debit: r.BillAmount, credit: 0 }));
//     (rs[7] || []).forEach(r => push({ date: r.BillDate, type: "Sale", transNo: r.BillNo, debit: r.BillAmount, credit: 0 ,narration: r.Narration,InvoiceSeries: r.InvSeries }));
//     (rs[16] || []).forEach(r => push({ date: r.PurReturnDate, type: "Purchase Return", transNo: r.PurchaseReturnNo, debit: amt(r), credit: 0 }));
//     (rs[22] || []).forEach(r => push({ date: r.ADate, type: "Journal", transNo: r.BillNo, debit: amt(r), credit: 0 }));
//     (rs[12] || []).forEach(r => push({ date: r.ADate, type: "Opening Voucher", transNo: r.BillNo, debit: amt(r), credit: 0 }));
//     (rs[25] || []).forEach(r => push({ date: r.ADate, type: "Contra", transNo: r.BillNo, debit: r.debit, credit: 0 }));
//     (rs[33] || []).forEach(r => push({ date: r.PurchaseDate, type: "RoundOff", transNo: r.BillNo, debit: amt(r), credit: 0 }));

//     // ===============================
//     // 🔵 CREDIT SIDE
//     // ===============================
//     (rs[11] || []).forEach(r => push({ date: r.ADate, type: "Opening Voucher", transNo: r.BillNo, debit: 0, credit: amt(r) }));
//     (rs[29] || []).forEach(r => push({ date: r.ADate, type: "Contra", transNo: r.BillNo, debit: 0, credit: r.credit }));
//     (rs[13] || []).forEach(r => push({ date: r.ReturnDate, type: "Sale Return", transNo: r.BillNo, debit: 0, credit: r.BillAmount }));
//     (rs[8] || []).forEach(r => push({ date: r.PurchaseDate, type: "Purchase", transNo: r.PurchaseNo, debit: 0, credit: amt(r) }));
//     (rs[26] || []).forEach(r => push({ date: r.ADate, type: "Journal", transNo: r.BillNo, debit: 0, credit: r.credit }));
//     (rs[31] || []).forEach(r => push({ date: r.ADate, type: "Credit Note", transNo: r.BillNo, debit: 0, credit: r.debit }));
//     (rs[34] || []).forEach(r => push({ date: r.PurchaseDate, type: "RoundOff", transNo: r.BillNo, debit: 0, credit: amt(r) }));

//     // ===============================
//     // SORT
//     // ===============================
//     ledger.sort((a, b) => a.date - b.date);

//     const fromDateObj = new Date(FromDate);

//     // ===============================
//     // ✅ OPENING CALCULATION (C# LOGIC)
//     // ===============================
//     let Opbill = 0,
//         OpPurchase = 0,
//         OpReceipt = 0,
//         OpReceiptParty = 0,
//         OpReceiptCheque = 0,
//         OpPayment = 0,
//         OpOpeningCredit = 0,
//         OpOpeningDebit = 0,
//         OpBillReturn = 0,
//         OpPurchaseRtn = 0,
//         Opagainstbillrtn = 0,
//         Opagainstbill = 0,
//         OpsinglejournalC_OB = 0,
//         OpsinglejournalD_OB = 0,
//         ContraCredit = 0,
//         ContraDebit = 0;

//     ledger.forEach(r => {
//       if (r.date < fromDateObj) {

//         switch (r.type) {

//           case "Sale":
//             Opbill += r.debit;
//             break;

//           case "Purchase":
//             OpPurchase += r.credit;
//             break;

//           case "Receipt":
//             if (isSame(r.transNo, AccountCode))
//               OpReceiptParty += r.credit;
//             else
//               OpReceipt += r.credit;
//             break;

//           case "Payment":
//             OpPayment += r.debit;
//             break;

//           case "Opening Voucher":
//             OpOpeningDebit += r.debit;
//             OpOpeningCredit += r.credit;
//             break;

//           case "Sale Return":
//             OpBillReturn += r.credit;
//             break;

//           case "Purchase Return":
//             OpPurchaseRtn += r.debit;
//             break;

//           case "Journal":
//             OpsinglejournalD_OB += r.debit;
//             OpsinglejournalC_OB += r.credit;
//             break;

//           case "Contra":
//             ContraDebit += r.debit;
//             ContraCredit += r.credit;
//             break;
//         }
//       }
//     });

//     // ===============================
//     // FINAL OPENING FORMULA
//     // ===============================
//     let OpeningCredit =
//       OpPurchase +
//       OpPayment +
//       OpOpeningCredit +
//       OpBillReturn -
//       Opagainstbillrtn +
//       Opagainstbill +
//       OpsinglejournalC_OB +
//       ContraCredit;

//     let OpeningDebit =
//       Opbill +
//       OpReceipt +
//       OpReceiptParty +
//       OpReceiptCheque +
//       OpOpeningDebit +
//       OpPurchaseRtn +
//       OpsinglejournalD_OB +
//       ContraDebit;

//     let openingBalance = OpeningDebit - OpeningCredit;

//     const opening = {
//       debit: openingBalance > 0 ? openingBalance : 0,
//       credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
//       balance: openingBalance
//     };

//     // ===============================
//     // FILTER AFTER FROM DATE
//     // ===============================
//     const filteredLedger = ledger.filter(r => r.date >= fromDateObj);

//     // ===============================
//     // RUNNING BALANCE
//     // ===============================
//     let balance = openingBalance;
//     let totalDebit = 0;
//     let totalCredit = 0;

//     const finalLedger = filteredLedger.map((r, i) => {
//       totalDebit += r.debit;
//       totalCredit += r.credit;

//       balance += r.debit - r.credit;

//       return {
//         slno: i + 1,
//         ...r,
//         balance: Number(balance.toFixed(2))
//       };
//     });

//     // ===============================
//     // RESPONSE
//     // ===============================
//     res.json({
//       opening,
//       totals: {
//         debit: totalDebit,
//         credit: totalCredit
//       },
//       ledger: finalLedger
//     });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       error: err.message
//     });
//   }
// });


// router.get('/allpartyledger', async (req, res) => {
//     const { FromDate, ToDate, CompanyID,AccountGroup,Reset } = req.query;  // ✅ Extract query params

//     if (!FromDate || !ToDate || !CompanyID ) {
//         return res.status(400).json({ error: 'Missing required parameters.' });
//     }
//     let pool;
//     try {
//         pool = await sql.connect(dbConfig);
//         const result = await pool.request()
//             .input('FromDate', sql.DateTime,new Date (FromDate))
//             .input('ToDate', sql.DateTime, new Date(ToDate))
//             .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
//             .input('AccountGroup', sql.Int, parseInt(AccountGroup, 10))
//             input('Reset', sql.Int, parseInt(Reset, 10))
//             .execute('Weballpartyledger');
//         res.status(200).json({
//             success: true,
//             data: result.recordsets
//         });
//     } catch (err) {
//         console.error('Database query failed:', err);
//         res.status(500).json({
//             error: 'Internal Server Error',
//             details: err.message
//         });
//     } 
// });

// router.post("/send-wa", async (req, res) => {
//   const { phone, text, fname, fileBase64 } = req.body;

//   if (!phone || !text || !fname || !fileBase64) {
//     return res.status(400).send("Missing required fields");
//   }

//   try {
//     // Create temp folder if not exists
//     const tempDir = path.join(__dirname, "../temp");
//     if (!fs.existsSync(tempDir)) {
//       fs.mkdirSync(tempDir);
//     }

//     // Generate a unique filename to avoid collision
//     const safeFileName = `${uuid.v4()}-${fname.replace(/\s+/g, "_")}`;
//     const filePath = path.join(tempDir, safeFileName);

//     // Save PDF file from base64
//     fs.writeFileSync(filePath, Buffer.from(fileBase64, "base64"));

//     // Serve this file via a static server (make sure `/temp` is public in Express)
//     const fileUrl = `https://your-domain.com/temp/${safeFileName}`; // replace with actual domain

//     // WhatsApp API params
//     const apiURL = "https://bhashsms.com/api/sendmsg.php";
//     const params = {
//       user: "BhashWAPAi",
//       pass: "bwap@123$",
//       sender: "BUZWAP",
//       phone,
//       text,
//       priority: "wa",
//       stype: "normal",
//       htype: "document",
//       fname,
//       url: fileUrl
//     };

//     const response = await axios.get(apiURL, { params });

//     res.send(`Message sent successfully. API Response: ${response.data}`);
//   } catch (err) {
//     console.error("WhatsApp API Error:", err.message);
//     res.status(500).send("Failed to send WhatsApp message");
//   }
// });



// router.get('/getplreport', async (req, res) => {
//     const { FromDate, ToDate, CompanyID, } = req.query;  // ✅ Extract query params

//     if (!FromDate || !ToDate || !CompanyID ) {
//         return res.status(400).json({ error: 'Missing required parameters.' });
//     }
//     let pool;
//     try {
//         pool = await sql.connect(dbConfig);
//         const result = await pool.request()
//             .input('FromDate', sql.DateTime,new Date (FromDate))
//             .input('ToDate', sql.DateTime, new Date(ToDate))
//             .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
//             .execute('webGetProfitAndLoss');
//         res.status(200).json({
//             success: true,
//             data: result.recordsets
//         });
//     } catch (err) {
//         console.error('Database query failed:', err);
//         res.status(500).json({
//             error: 'Internal Server Error',
//             details: err.message
//         });
//     } 
// });


// router.get('/WebLedger', async (req, res) => {
//     try {
//         const { FromDate, ToDate, CompanyID, AccountCode } = req.query;

//         if (!FromDate || !ToDate || !CompanyID || !AccountCode) {
//             return res.status(400).json({ error: "FromDate, ToDate, CompanyID, and AccountCode are required." });
//         }

//         // Connect to the database
//         const pool = await sql.connect(dbConfig);

//         // Execute the stored procedure
//         const result = await pool.request()
//             .input('FromDate', sql.DateTime, FromDate)
//             .input('ToDate', sql.DateTime, ToDate)
//             .input('CompanyID', sql.Int, parseInt(CompanyID))
//             .input('AccountCode', sql.Int, parseInt(AccountCode))
//             .execute('WebLedger');

//         const response = {
         
//             details: result.recordsets
//         };

//         res.status(200).json(response);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// router.get('/LedgerTrans', async (req, res) => {
//     try {
//         const { FromDate, ToDate, CompanyID, AccountCode } = req.query; 

//         if (!FromDate || !ToDate || !CompanyID || !AccountCode) {
//             return res.status(400).json({ error: "FromDate, ToDate, CompanyID, and AccountCode are required." });
//         }

//         // Connect to the database
//         const pool = await sql.connect(dbConfig);

//         // Execute the stored procedure
//         const result = await pool.request()
//             .input('FromDate', sql.DateTime, FromDate)
//             .input('ToDate', sql.DateTime, ToDate)
//             .input('CompanyID', sql.Int, parseInt(CompanyID))
//             .input('AccountCode', sql.Int, parseInt(AccountCode))
//             .execute('WebLedgerTrans');

//         const response = {
         
//             details: result.recordsets
//         };

//         res.status(200).json(response);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// router.get('/Achead', async (req, res) => {
//     // const {FromDate, ToDate } = req.query;

//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
//         const result = await request.execute('webGetAchead');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });

// router.get('/LedgerCustomer', async (req, res) => {
//     try {
//         const { CustomerID, FromDate, ToDate,FYearID } = req.query; 

//         if (!CustomerID || !FromDate || !ToDate) {
//             return res.status(400).json({ error: "CustomerID, FromDate, and ToDate are required." });
//         }

//         // Connect to the database
//         const pool = await sql.connect(dbConfig);

//         // Execute the stored procedure
//         const result = await pool.request()
//             .input('CustomerID', sql.Int, parseInt(CustomerID)) 
//             .input('FYearID', sql.Int, parseInt(FYearID)) 
//             .input('FromDate', sql.Date, FromDate)
//             .input('ToDate', sql.Date, ToDate)
//             .execute('WEB-TESTGetLedgerwiseDetailsAppAllDate'); 

//             const response = {
//                 summary: result.recordsets[0] || [], // First SELECT statement result
//                 Details: result.recordsets[1] || [], // Second SELECT statement result
//             };

//             res.status(200).json(response);
//         } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// router.get('/TrailBalance', async (req, res) => {
//     const { CompanyID, FromDate, ToDate } = req.query;



//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
//         request.input('CompanyID', sql.Int, CompanyID);
//         request.input('FromDate', sql.Date, FromDate);
//         request.input('ToDate', sql.Date, ToDate);

//         const result = await request.execute('WebGetTrailBalance');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });


// router.get('/DamageReport', async (req, res) => {
//     const {FromDate, ToDate } = req.query;

//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
//         request.input('FromDate', sql.Date, FromDate);
//         request.input('ToDate', sql.Date, ToDate);

//         const result = await request.execute('WebGetDamageReport');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });

// router.get('/DebitorsReport', async (req, res) => {
//     const {FromDate, ToDate } = req.query;

//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
//         request.input('FromDate', sql.Date, FromDate);
//         request.input('ToDate', sql.Date, ToDate);

//         const result = await request.execute('WebGetDebitorsReport');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });


// router.get('/CreditorsReport', async (req, res) => {
//     const {FromDate, ToDate } = req.query;

//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
//         request.input('FromDate', sql.Date, FromDate);
//         request.input('ToDate', sql.Date, ToDate);

//         const result = await request.execute('WebGetCreditorsReport');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });





// module.exports = router;
