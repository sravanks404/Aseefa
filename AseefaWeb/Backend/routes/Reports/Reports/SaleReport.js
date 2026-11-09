const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');



router.get('/ExportSales', async (req, res) => {
    const { CompanyID, FromDate, ToDate, Type } = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        const result = await request.execute('webGetExportSales');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});



router.get('/GetUsersalesman', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('[webGetUsers]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});





router.get('/GetUsersalesman', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('[webGetUsers]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.post('/getproductReport', async (req, res) => {
    const { CompanyID, FromDate, ToDate } = req.body;

    if (!CompanyID) {
        return res.status(400).json({ error: 'CompanyID is required.' });
    }

    try {
        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .input('FromDate', sql.Date, FromDate || null)
            .input('ToDate', sql.Date, ToDate || null)
            .execute('[webGetProductReport]');


        const response = {
            OrderDetails: result.recordsets[0] || [], // First result set: Detailed order report
            Summary: result.recordsets[1] || []
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

router.get('/GetProductiondetails', async (req, res) => {
    const { PID } = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('PID', sql.Int, PID);


        const result = await request.execute('[webGetProductDetails]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/HSNReturn', async (req, res) => {
    const { CompanyID, FromDate, ToDate, Type } = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('Type', sql.VarChar, Type);
        const result = await request.execute('WebGetHSNSalesReturnReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/vanSaleSummary', async (req, res) => {
    const { CompanyID, FromDate, ToDate, UserID, BranchID, activeUserId } = req.query;

    if (!CompanyID || !FromDate || !ToDate) {
        return res.status(400).json({ error: 'CompanyID, FromDate, and ToDate are required.' });
    }

    try {
        await sql.connect(dbConfig);

        const request = new sql.Request();
        request.input('CompanyID', sql.Int, parseInt(CompanyID));
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('AppDatabase', sql.NVarChar(128), dbConfig.AppDatabase);
        request.input('CreatedBy', sql.Int, parseInt(UserID));
        request.input('BranchID', sql.Int, parseInt(BranchID));
        request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId)




        const result = await request.execute('webGetVanSaleSummary');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetUsersalesman', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('[webGetUsers]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});


router.post('/getSaleReport', async (req, res) => {
    const { FromDate, ToDate, companyID, FYearID, Type, activeUserId } = req.body;

    if (!FromDate || !ToDate || !companyID || !FYearID || !Type) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('FromDate', sql.Date, FromDate)
            .input('ToDate', sql.Date, ToDate)
            .input('companyID', sql.Int, companyID)
            .input('FYearID', sql.Int, FYearID)
            .input('Type', sql.VarChar(50), Type)
            .input('activeUserId', sql.NVarChar(sql.MAX), activeUserId)


            .execute('webGetAllSaleReport');

        // Collect the results from the multiple recordsets
        const response = {
            summary: result.recordsets[0] || [], //ult
            billDetails: result.recordsets[1] || [], // Second SELECT statement result First SELECT statement res
            taxDetails: result.recordsets[2] || [], // Third SELECT statement result
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    } finally {
    }
});

router.post('/getOrderReport', async (req, res) => {
    const { CompanyID, OrderStatus, UserID, CustomerID, FromDate, ToDate, BillMode, activeUserId } = req.body;

    if (!CompanyID) {
        return res.status(400).json({ error: 'CompanyID is required.' });
    }

    try {
        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .input('OrderStatus', sql.Int, OrderStatus || null)
            //   .input('UserID', sql.Int, UserID || null)
            .input('CustomerID', sql.Int, CustomerID || null)
            .input('FromDate', sql.Date, FromDate || null)
            .input('ToDate', sql.Date, ToDate || null)
            .input('BillMode', sql.Int, BillMode || null)
            .input('activeUserId', sql.NVarChar(sql.MAX), activeUserId)


            .execute('webGetOrderReport');

        // Collect the results from the multiple recordsets
        const response = {
            OrderDetails: result.recordsets[0] || [], // First result set: Detailed order report
            Summary: result.recordsets[1] || []
        };

        res.status(200).json(response);
    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});
router.get('/GetCustomers', async (req, res) => {
    const { CompanyID } = req.query;


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);


        const result = await request.execute('webGetCustomers');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetUsers', async (req, res) => {
    const { CompanyID } = req.query;


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);


        const result = await request.execute('webGetUsers');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/Getorderdetails', async (req, res) => {
    const { DSID,OrderType } = req.query;


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('OrderType', sql.Int, OrderType);
        request.input('DSID', sql.Int, DSID);


        const result = await request.execute('webGetOrderDetails');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/GetBilldetails', async (req, res) => {
    const { BillID, CompanyID } = req.query;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('BillID', sql.Int, BillID);
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('webGetBillDetails');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
})


router.post('/DailySummary', async (req, res) => {
  try {
    const {
      FromDate,
      ToDate,
      SalesmanID,
      CompanyID,
      UserRoleId,
      AllocatedUser,
     
    } = req.body;

    await sql.connect(dbConfig);

    const request = new sql.Request();
    request.input('FromDate', sql.Date, FromDate);
    request.input('ToDate', sql.Date, ToDate);
    request.input('SalesmanID', sql.Int, SalesmanID ?? null);
    request.input('AppDatabase', sql.NVarChar(128), dbConfig.AppDatabase);
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('UserRoleId', sql.Int, UserRoleId);
    request.input('AllocatedUser', sql.NVarChar(sql.MAX), AllocatedUser ?? null);

    const result = await request.execute('[dbo].[WebGetDailysummaryReport_Fast]');

    res.json(result.recordsets);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get("/dashboardWorkers", async (req, res) => {
  const { CompanyID } = req.query;
 
  if (!CompanyID) {
    return res.status(400).json({ success: false, message: "CompanyID is required" });
  }
 
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("CompanyID", sql.Int, CompanyID)
      .execute("sp_DashboardWorkers");
 
    // sp returns a single summary row -> recordset is already an
    // array, matching the res.data[0] pattern used in Pagebody.js
    res.json(result.recordset);
  } catch (err) {
    console.error("dashboardWorkers error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch worker dashboard stats" });
  }
});


router.get('/ProfitReport', async (req, res) => {
    try {
        const { CompanyID, FromDate, ToDate, Wholesale } = req.query; // Use query parameters

        if (!CompanyID || !FromDate || !ToDate) {
            return res.status(400).json({ error: "CompanyID, FromDate, and ToDate are required." });
        }

        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('CompanyId', sql.Int, parseInt(CompanyID)) // Ensure proper type conversion
            .input('from', sql.Date, FromDate)
            .input('to', sql.Date, ToDate)
            .input('Wholesale', sql.VarChar(20), Wholesale || '') // Default to empty string if null

            .execute('webProfitReport');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/ItemwiseSale', async (req, res) => {
    try {
        const { CompanyID, FromDate, ToDate, ItemID, UserId } = req.query;

        if (!CompanyID || !FromDate || !ToDate) {
            return res.status(400).json({ error: "CompanyID, FromDate, and ToDate are required." });
        }

        const itemIDValue =
            ItemID === undefined || ItemID === null || ItemID === '' || ItemID === 'null'
                ? null
                : parseInt(ItemID);

        const pool = await sql.connect(dbConfig);

        const request = pool.request()
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .input('FromDate', sql.Date, FromDate)
            .input('ToDate', sql.Date, ToDate)
            .input('ItemID', sql.Int, itemIDValue)
            .input('UserId', sql.Int, UserId ? parseInt(UserId) : null); // ✅ added

        const result = await request.execute('[webGetItemwiseSale]');

        res.json(result.recordsets); // ✅ Supports multiple sets
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/Itemsalebycust', async (req, res) => {
    try {
        const { CompanyID, FromDate, ToDate, ItemID } = req.query; // Use query parameters

        if (!CompanyID || !FromDate || !ToDate) {
            return res.status(400).json({ error: "CompanyID, FromDate, and ToDate are required." });
        }

        // Connect to the database
        const pool = await sql.connect(dbConfig);

        // Execute the stored procedure
        const result = await pool.request()
            .input('CompanyID', sql.Int, parseInt(CompanyID)) // Ensure proper type conversion
            .input('FromDate', sql.Date, FromDate)
            .input('ToDate', sql.Date, ToDate)
            .input('ItemID', sql.Int, ItemID ? parseInt(ItemID) : null)

            .execute('webGetItemwiseSalebycust');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/itembybill', async (req, res) => {
    const { CompanyID } = req.query;


    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);


        const result = await request.execute('[webGetItembybill]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/taxamount', async (req, res) => {
    const { CompanyID, FromDate, ToDate } = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        const result = await request.execute('webGetSaleTaxReport');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/HSNcode', async (req, res) => {
    const { CompanyID, FromDate, ToDate, Type } = req.query;
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate);
        request.input('ToDate', sql.Date, ToDate);
        request.input('Type', sql.VarChar, Type);
        const result = await request.execute('[WebGetHSNForSalesReport]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/ProductionAnalysis', async (req, res) => {
    const { ItemID, RequiredQty } = req.query;  // <-- parameters from query string

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Pass parameters to the procedure
        request.input('ItemID', sql.Int, ItemID);
        request.input('RequiredQty', sql.Decimal(18, 4), RequiredQty);

        // Execute the procedure
        const result = await request.execute('webGetProductionAnalysis');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.get('/ProductionOrder', async (req, res) => {
    const { CompanyID, FromDate, ToDate } = req.query;  // <-- parameters from query string

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        // Pass parameters to the procedure
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('FromDate', sql.Date, FromDate || null);
        request.input('ToDate', sql.Date, ToDate || null);

        // Execute the procedure
        const result = await request.execute('webGetProductionOrder');

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});



router.post('/ImportExcelBill', async (req, res) => {
    const { JsonData } = req.body;

    // Validation
    if (!JsonData || !Array.isArray(JsonData) || JsonData.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'JsonData is required and must be a non-empty array'
        });
    }

    // Trim & normalize
    const normalizedData = JsonData.map(row => ({
        CustomerName: row.CustomerName?.trim(),
        RetailBillNo: row.RetailBillNo,
        BillDate: row.BillDate,
        BillAmount: row.BillAmount,
        Naration: row.Naration?.trim() || ''
    }));

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();

        request.input('JsonData', sql.NVarChar(sql.MAX), JSON.stringify(normalizedData));

        const result = await request.execute('WebImportExcelBill');

        const [summary, failed] = result.recordsets;

        return res.status(200).json({
            success: true,
            message: 'Excel bills imported successfully',
            insertedCount: summary[0]?.InsertedCount || 0,
            failed: failed || []
        });

    } catch (err) {
        console.error('SQL error:', err);
        return res.status(500).json({
            success: false,
            message: err.originalError?.message || err.message || 'Import failed',
            number: err.originalError?.number,
            lineNumber: err.originalError?.lineNumber
        });
    }
});




router.get("/GetRoute", async (req, res) => {
    try {
        await sql.connect(dbConfig);

        const request = new sql.Request();
        const result = await request.execute("GetRootMaster");

        res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("GetRootMaster API Error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});




module.exports = router;
