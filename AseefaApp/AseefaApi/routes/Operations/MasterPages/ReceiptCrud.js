const express = require('express');
const sql = re
 
    const src = { ...req.query, ...req.body };
    const { ReNo, DeletedBy } = src;

    // Validate the input data
    if (ReNo === undefined || DeletedBy === undefined) {
        return res.status(400).send('ReNo and DeletedBy are required');
    }

    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('ReNo', sql.Int, ReNo)
            .input('DeletedBy', sql.Int, DeletedBy)
            .input('DeletedDate', sql.DateTime, new Date())
            .execute('DeleteReciept');

        // console.log('Rows affected:', result.rowsAffected[0]); // Log rows affected

        if (result.rowsAffected[0] > 0) {
            res.status(200).send('No matching receipt found to delete');
        } else {
            res.status(404).send('Receipt deleted successfully');
        }
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Server error');
    }
 } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetCustSupLedger', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('webGetCustSupLedger');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetRouteName', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        const result = await request.execute('webGetRouteName');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertupdatereciept', async (req, res) => {
    const {
        Slno,
        RDate,
        PartyID
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        request.output('Slno', sql.Int, Slno || 0);
        request.input('RDate', sql.Date, RDate);
        request.input('PartyID', sql.Int, PartyID);

        const result = await request.execute('webInsertUpdateReceipt');

        res.json({
            success: true,
            message: 'Receipt processed successfully',
            Slno: result.output.Slno,
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            message: 'Error processing receipt',
            error: err.message,
        });
    }
});

router.get('/GetAganistBill', async (req, res) => {
    const { CompanyID, CustomerID } = req.query;
    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('CustomerID', sql.Int, CustomerID);


        const result = await request.execute('webGetAganistBill');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertupdateagainstbill', async (req, res) => {
    const {
        ABID = 0,
        BillID,
        PaidAmount,
        Date,
        Isdeleted = 0,
        ReceiptID,
        ApprovalStatus,
        Narration
    } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        request.input('ABID', sql.Int, ABID);
        request.input('BillID', sql.Int, BillID);
        request.input('PaidAmount', sql.Money, PaidAmount);
        request.input('Date', sql.DateTime, Date);
        request.input('Isdeleted', sql.Int, Isdeleted);
        request.input('ReturnID', sql.Int, ReceiptID);
        request.input('ApprovalStatus', sql.Int, ApprovalStatus);
        request.input('Narration', sql.VarChar(50), Narration);

        await request.execute('webInsertUpdateAgainstBill');

        res.json({
            success: true,
            message: 'Against Bill record processed successfully'
        });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({
            success: false,
            message: 'Error processing against bill record',
            error: err.message
        });
    }
});


router.get('/GetReceipt', async (req, res) => {
    const { CompanyID, slno } = req.query;
    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('slno', sql.Int, slno);


        const result = await request.execute('webGetReceipt');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});






// -------------------------------------------------------------------------------


router.post('/insertupdatereciept11', async (req, res) => {
    const {
        ReId,
        ReNo,
        Rdate,
        PLID,
        AccGroupid,
        Debit,
        Narration,
        CompanyID,
        Bank,
        ChkNo,
        ChkDate,
        Remark,
        Branch,
        FormName,
        Type,
        FYearID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,
        PartyID,
    } = req.body;

    if (!CompanyID) {
        return res.status(400).send('Missing Company ID');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Convert empty strings or undefined values to null where appropriate
        request.input('ReId', sql.Int, ReId || 0); // 0 for new insert
        request.input('ReNo', sql.Int, ReNo || null);
        request.input('Rdate', sql.DateTime, Rdate || null);
        request.input('PLID', sql.Int, PLID || null);
        request.input('AccGroupid', sql.Int, AccGroupid || null);
        request.input('PartyID', sql.Int, PartyID || null);
        request.input('Debit', sql.Money, Debit ? parseFloat(Debit) : null);
        request.input('Narration', sql.VarChar(sql.MAX), Narration || null);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('Bank', sql.VarChar(sql.MAX), Bank || null);
        request.input('ChkNo', sql.VarChar(sql.MAX), ChkNo || null);
        request.input('ChkDate', sql.DateTime, ChkDate || null);
        request.input('Remark', sql.VarChar(sql.MAX), Remark || null);
        request.input('Branch', sql.VarChar(sql.MAX), Branch || null);
        request.input('FormName', sql.Int, FormName || null);
        request.input('Type', sql.VarChar(50), Type || null);
        request.input('FYearID', sql.Int, FYearID || null);
        request.input('CreatedBy', sql.Int, CreatedBy);
        request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('InsertUpdateReciept');

        res.json({
            message: ReId ? 'Reciept updated successfully' : 'Reciept inserted successfully',
            ReId: result.recordset[0]?.ReId || ReId // Return the new ReId or existing one
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertReceipt', async (req, res) => {
    const {
        ReNo,
        Rdate,
        PLID,
        AccGroupid,
        Debit,
        Narration,
        CompanyID,
        Bank,
        ChkNo,
        ChkDate,
        Remark,
        Branch,
        FormName,
        Type,
        FYearID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,
        PartyID,
    } = req.body;

    if (!CompanyID) {
        return res.status(400).send('Missing Company ID');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        request.input('ReId', sql.Int, 0); // 0 indicates new insert
        request.input('ReNo', sql.Int, ReNo || null);
        request.input('Rdate', sql.DateTime, Rdate || null);
        request.input('PLID', sql.Int, PLID || null);
        request.input('AccGroupid', sql.Int, AccGroupid || null);
        request.input('PartyID', sql.Int, PartyID || null);
        request.input('Debit', sql.Money, Debit ? parseFloat(Debit) : null);
        request.input('Narration', sql.VarChar(sql.MAX), Narration || null);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('Bank', sql.VarChar(sql.MAX), Bank || null);
        request.input('ChkNo', sql.VarChar(sql.MAX), ChkNo || null);
        request.input('ChkDate', sql.DateTime, ChkDate || null);
        request.input('Remark', sql.VarChar(sql.MAX), Remark || null);
        request.input('Branch', sql.VarChar(sql.MAX), Branch || null);
        request.input('FormName', sql.Int, FormName || null);
        request.input('Type', sql.VarChar(50), Type || null);
        request.input('FYearID', sql.Int, FYearID || null);
        request.input('CreatedBy', sql.Int, CreatedBy);
        request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
        request.input('ModifiedBy', sql.Int, ModifiedBy);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('insertupdatereciept'); // Assuming a separate stored procedure for insert

        res.json({
            message: 'Reciept inserted successfully',
            ReId: result.recordset[0]?.ReId // Return the new ReId if available
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.put('/updateReceipt', async (req, res) => {
    const {
        ReId,
        ReNo,
        Rdate,
        PLID,
        AccGroupid,
        Debit,
        Narration,
        CompanyID,
        Bank,
        ChkNo,
        ChkDate,
        Remark,
        Branch,
        FormName,
        Type,
        FYearID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted,
        PartyID,
    } = req.body;

    if (!ReNo) {
        return res.status(400).send('Missing ReNo for update');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        request.input('ReId', sql.Int, ReId);
        request.input('ReNo', sql.Int, ReNo);
        request.input('Rdate', sql.DateTime, Rdate || null);
        request.input('PLID', sql.Int, PLID || null);
        request.input('AccGroupid', sql.Int, AccGroupid || null);
        request.input('PartyID', sql.Int, PartyID || null);
        request.input('Debit', sql.Money, Debit ? parseFloat(Debit) : null);
        request.input('Narration', sql.VarChar(sql.MAX), Narration || null);
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('Bank', sql.VarChar(sql.MAX), Bank || null);
        request.input('ChkNo', sql.VarChar(sql.MAX), ChkNo || null);
        request.input('ChkDate', sql.DateTime, ChkDate || null);
        request.input('Remark', sql.VarChar(sql.MAX), Remark || null);
        request.input('Branch', sql.VarChar(sql.MAX), Branch || null);
        request.input('FormName', sql.Int, FormName || null);
        request.input('Type', sql.VarChar(50), Type || null);
        request.input('FYearID', sql.Int, FYearID || null);
        request.input('CreatedBy', sql.Int, CreatedBy);
        request.input('CreatedDate', sql.DateTime, CreatedDate);
        request.input('ModifiedBy', sql.Int, ModifiedBy);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        const result = await request.execute('insertupdatereciept'); // Assuming a separate stored procedure for update

        res.json({
            message: 'Reciept updated successfully',
        });
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.delete('/deleteReciept', async (req, res) => {
    const src = { ...req.query, ...req.body };
    const { ReNo, DeletedBy } = src;

    // Validate the input data
    if (ReNo === undefined || DeletedBy === undefined) {
        return res.status(400).send('ReNo and DeletedBy are required');
    }

    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('ReNo', sql.Int, ReNo)
            .input('DeletedBy', sql.Int, DeletedBy)
            .input('DeletedDate', sql.DateTime, new Date())
            .execute('DeleteReciept');

        // console.log('Rows affected:', result.rowsAffected[0]); // Log rows affected

        if (result.rowsAffected[0] > 0) {
            res.status(200).send('No matching receipt found to delete');
        } else {
            res.status(404).send('Receipt deleted successfully');
        }
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Server error');
    }
})
router.post('/deleteReciept', async (req, res) => {
    const src = { ...req.query, ...req.body };
    const { ReNo, DeletedBy } = src;

    // Validate the input data
    if (ReNo === undefined || DeletedBy === undefined) {
        return res.status(400).send('ReNo and DeletedBy are required');
    }

    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('ReNo', sql.Int, ReNo)
            .input('DeletedBy', sql.Int, DeletedBy)
            .input('DeletedDate', sql.DateTime, new Date())
            .execute('DeleteReciept');

        // console.log('Rows affected:', result.rowsAffected[0]); // Log rows affected

        if (result.rowsAffected[0] > 0) {
            res.status(200).send('No matching receipt found to delete');
        } else {
            res.status(404).send('Receipt deleted successfully');
        }
    } catch (err) {
        console.error('SQL error', err);
        res.status(500).send('Server error');
    }
});



module.exports = router;