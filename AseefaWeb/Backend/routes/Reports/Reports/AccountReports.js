const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

 
router.get('/PurchaseReturnReport', async (req, res) => {
    const { FromDate, ToDate, CompanyID } = req.query;

    try {
        // Validate input parameters
        if (!FromDate || !ToDate || !CompanyID) {
            return res.status(400).json({ error: 'Missing required parameters: FromDate, ToDate, and CompanyID are required' });
        }

        // Validate date format
        const fromDateParsed = new Date(FromDate);
        const toDateParsed = new Date(ToDate);
        if (isNaN(fromDateParsed) || isNaN(toDateParsed)) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Connect to database
        await sql.connect(dbConfig);
        const request = new sql.Request();
        
        // Set input parameters for stored procedure
        request.input('From', sql.DateTime, FromDate);
        request.input('To', sql.DateTime, ToDate);
        request.input('CompanyID', sql.Int, parseInt(CompanyID));

        // Execute stored procedure
        const result = await request.execute('webGetPurchaceReturn');
        
        // Send response
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    } 
});



// =====================================================
// CREDITORS REPORT
// =====================================================
router.get('/CreditorsReport', async (req, res) => {
    const { FromDate, ToDate } = req.query;

    try {
        if (!FromDate || !ToDate) {
            return res.status(400).json({ error: 'Missing required parameters: FromDate and ToDate are required' });
        }

        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('FromDate', sql.DateTime, new Date(FromDate));
        request.input('ToDate', sql.DateTime, new Date(ToDate));

        const result = await request.execute('WebGetCreditorsReport');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('CreditorsReport error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// =====================================================
// DEBITORS REPORT
// =====================================================
router.get('/DebitorsReport', async (req, res) => {
    const { FromDate, ToDate } = req.query;

    try {
        if (!FromDate || !ToDate) {
            return res.status(400).json({ error: 'Missing required parameters: FromDate and ToDate are required' });
        }

        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('FromDate', sql.DateTime, new Date(FromDate));
        request.input('ToDate', sql.DateTime, new Date(ToDate));

        const result = await request.execute('WebGetDebitorsReport');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('DebitorsReport error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// =====================================================
// ACCOUNT HEADS
// =====================================================
router.get('/Achead', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().execute('webGetAchead');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('SQL error (Achead):', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// =====================================================
// WEB LEDGER NEW
// =====================================================
router.get('/WebLedgerNew', async (req, res) => {
    try {
        const { FromDate, ToDate, CompanyID, AccountCode } = req.query;

        if (!FromDate || !ToDate || !CompanyID || !AccountCode) {
            return res.status(400).json({ error: 'Missing parameters: FromDate, ToDate, CompanyID, and AccountCode are required' });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('FromDate', sql.DateTime, new Date(FromDate))
            .input('ToDate', sql.DateTime, new Date(ToDate))
            .input('AcHead', sql.Int, parseInt(AccountCode))
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .execute('NewLedger_03062025');

        const rs = result.recordsets || [];

        const toNumber = (v) => isNaN(Number(v)) ? 0 : Number(v);
        const isSame = (a, b) => String(a) === String(b);
        const amt = (r) => toNumber(r.Amt || r.Amount || r.debit || r.credit || 0);

        let ledger = [];
        const push = (row) => {
            ledger.push({
                date: new Date(row.date),
                type: row.type,
                transNo: row.transNo || '',
                debit: toNumber(row.debit),
                credit: toNumber(row.credit),
                narration: row.narration || '',
                InvoiceNo: row.InvoiceNo || '',
                InvoiceSeries: row.InvoiceSeries || ''
            });
        };

        // Receipts
        (rs[32] || []).forEach(r => {
            const amount = amt(r);
            const isCredit = isSame(r.FCode, AccountCode);
            push({
                date: r.ADate,
                type: 'Receipt',
                transNo: r.Billno,
                debit: isCredit ? 0 : amount,
                credit: isCredit ? amount : 0,
                narration: r.Narration
            });
        });

        (rs[9] || []).forEach(r => {
            const amount = amt(r);
            const isCredit = isSame(r.PartyID, AccountCode);
            push({
                date: r.RDate,
                type: 'Receipt',
                transNo: r.Slno,
                debit: isCredit ? 0 : amount,
                credit: isCredit ? amount : 0,
                narration: r.Remark
            });
        });

        (rs[17] || []).forEach(r => {
            const amount = amt(r);
            const isCredit = isSame(r.PartyID, AccountCode);
            push({
                date: r.ChequeApprovedDate,
                type: 'Receipt',
                transNo: r.Slno,
                debit: isCredit ? 0 : amount,
                credit: isCredit ? amount : 0,
                narration: r.Remark
            });
        });

        // Payments
        (rs[10] || []).forEach(r => {
            const amount = amt(r);
            push({
                date: r.PDate,
                type: 'Payment',
                transNo: r.slno || r.Slno,
                debit: r.FMode === 'D' ? amount : 0,
                credit: r.FMode === 'C' ? amount : 0,
                narration: r.Narration || r.Remark,
                InvoiceNo: r.InvoiceNo || ''
            });
        });

        (rs[30] || []).forEach(r => {
            const amount = amt(r);
            const isDebit = isSame(r.PartyID, AccountCode);
            push({
                date: r.PDate,
                type: 'Payment',
                transNo: r.slno || r.Slno,
                debit: isDebit ? amount : 0,
                credit: isDebit ? 0 : amount,
                narration: r.Narration,
                InvoiceSeries: r.InvSeries || ''
            });
        });

        // Debit side
        (rs[7] || []).forEach(r => push({ date: r.BillDate, type: 'Sale', transNo: r.BillNo, debit: toNumber(r.BillAmount), credit: 0, narration: r.Narration, InvoiceSeries: r.InvSeries }));
        (rs[16] || []).forEach(r => push({ date: r.PurReturnDate, type: 'Purchase Return', transNo: r.PurchaseReturnNo, debit: amt(r), credit: 0 }));
        (rs[22] || []).forEach(r => push({ date: r.ADate, type: 'Journal', transNo: r.BillNo, debit: amt(r), credit: 0 }));
        (rs[12] || []).forEach(r => push({ date: r.ADate, type: 'Opening Voucher', transNo: r.BillNo, debit: amt(r), credit: 0 }));
        (rs[25] || []).forEach(r => push({ date: r.ADate, type: 'Contra', transNo: r.BillNo, debit: toNumber(r.debit), credit: 0 }));
        (rs[33] || []).forEach(r => push({ date: r.PurchaseDate, type: 'RoundOff', transNo: r.BillNo, debit: amt(r), credit: 0 }));

        // Credit side
        (rs[11] || []).forEach(r => push({ date: r.ADate, type: 'Opening Voucher', transNo: r.BillNo, debit: 0, credit: amt(r) }));
        (rs[29] || []).forEach(r => push({ date: r.ADate, type: 'Contra', transNo: r.BillNo, debit: 0, credit: toNumber(r.credit) }));
        (rs[13] || []).forEach(r => push({ date: r.ReturnDate, type: 'Sale Return', transNo: r.BillNo, debit: 0, credit: toNumber(r.BillAmount) }));
        (rs[8] || []).forEach(r => push({ date: r.PurchaseDate, type: 'Purchase', transNo: r.PurchaseNo, debit: 0, credit: amt(r) }));
        (rs[26] || []).forEach(r => push({ date: r.ADate, type: 'Journal', transNo: r.BillNo, debit: 0, credit: toNumber(r.credit) }));
        (rs[31] || []).forEach(r => push({ date: r.ADate, type: 'Credit Note', transNo: r.BillNo, debit: 0, credit: toNumber(r.debit) }));
        (rs[34] || []).forEach(r => push({ date: r.PurchaseDate, type: 'RoundOff', transNo: r.BillNo, debit: 0, credit: amt(r) }));

        ledger.sort((a, b) => a.date - b.date);

        const fromDateObj = new Date(FromDate);

        let Opbill = 0,
            OpPurchase = 0,
            OpReceipt = 0,
            OpReceiptParty = 0,
            OpReceiptCheque = 0,
            OpPayment = 0,
            OpOpeningCredit = 0,
            OpOpeningDebit = 0,
            OpBillReturn = 0,
            OpPurchaseRtn = 0,
            Opagainstbillrtn = 0,
            Opagainstbill = 0,
            OpsinglejournalC_OB = 0,
            OpsinglejournalD_OB = 0,
            ContraCredit = 0,
            ContraDebit = 0;

        ledger.forEach(r => {
            if (r.date < fromDateObj) {
                switch (r.type) {
                    case 'Sale': Opbill += r.debit; break;
                    case 'Purchase': OpPurchase += r.credit; break;
                    case 'Receipt':
                        if (isSame(r.transNo, AccountCode)) OpReceiptParty += r.credit;
                        else OpReceipt += r.credit;
                        break;
                    case 'Payment': OpPayment += r.debit; break;
                    case 'Opening Voucher': OpOpeningDebit += r.debit; OpOpeningCredit += r.credit; break;
                    case 'Sale Return': OpBillReturn += r.credit; break;
                    case 'Purchase Return': OpPurchaseRtn += r.debit; break;
                    case 'Journal': OpsinglejournalD_OB += r.debit; OpsinglejournalC_OB += r.credit; break;
                    case 'Contra': ContraDebit += r.debit; ContraCredit += r.credit; break;
                }
            }
        });

        let OpeningCredit = OpPurchase + OpPayment + OpOpeningCredit + OpBillReturn - Opagainstbillrtn + Opagainstbill + OpsinglejournalC_OB + ContraCredit;
        let OpeningDebit = Opbill + OpReceipt + OpReceiptParty + OpReceiptCheque + OpOpeningDebit + OpPurchaseRtn + OpsinglejournalD_OB + ContraDebit;
        let openingBalance = OpeningDebit - OpeningCredit;

        const opening = {
            debit: openingBalance > 0 ? openingBalance : 0,
            credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
            balance: openingBalance
        };

        const filteredLedger = ledger.filter(r => r.date >= fromDateObj);

        let balance = openingBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const finalLedger = filteredLedger.map((r, i) => {
            totalDebit += r.debit;
            totalCredit += r.credit;
            balance += r.debit - r.credit;
            return {
                slno: i + 1,
                ...r,
                balance: Number(balance.toFixed(2))
            };
        });

        res.json({
            opening,
            totals: {
                debit: totalDebit,
                credit: totalCredit
            },
            ledger: finalLedger
        });
    } catch (err) {
        console.error('WebLedgerNew error:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// =====================================================
// TRAIL BALANCE
// =====================================================
router.get('/TrailBalance', async (req, res) => {
    const { CompanyID, FromDate, ToDate } = req.query;

    try {
        if (!FromDate || !ToDate) {
            return res.status(400).json({ error: 'Missing required parameters: FromDate and ToDate are required' });
        }

        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('CompanyID', sql.Int, CompanyID ? parseInt(CompanyID) : 1);
        request.input('FromDate', sql.DateTime, new Date(FromDate));
        request.input('ToDate', sql.DateTime, new Date(ToDate));

        const result = await request.execute('WebGetTrailBalance');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('SQL error (TrailBalance):', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
