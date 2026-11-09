const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../config/mssql');

// ================= INSERT / UPDATE ACCOUNT =================

router.post("/InsertUpdateCustomer", async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const data = req.body;

        const request = pool.request();

        // OUTPUT parameter
        request.output("AccountCode", sql.Int);

        // INPUT parameters
        request.input("AccountName", sql.VarChar(50), data.AccountName);
        request.input("SuitAppsId", sql.VarChar(50), data.SuitAppsId);
        request.input("Type", sql.VarChar(50), data.Type);
        request.input("AccountID", sql.Int, data.AccountID ?? 0);
        request.input("CompanyID", sql.Int, data.CompanyID);

        request.input("CreatedBy", sql.Int, data.CreatedBy);
        request.input("CreatedDate", sql.DateTime, data.CreatedDate);
        request.input("ModifiedBy", sql.Int, data.ModifiedBy);
        request.input("ModifiedDate", sql.DateTime, data.ModifiedDate);
        request.input("IsDeleted", sql.Int, data.IsDeleted ?? 0);

        request.input("Address", sql.VarChar(250), data.Address);
        request.input("Email", sql.VarChar(100), data.Email);
        request.input("Mob", sql.VarChar(20), data.Mob);
        request.input("city", sql.VarChar(100), data.city);
        request.input("country", sql.VarChar(100), data.country);
        request.input("Phone", sql.VarChar(20), data.Phone);

        request.input("CreatedDateAndTime", sql.DateTime, data.CreatedDateAndTime);
        request.input("MoifiedDateAndTime", sql.DateTime, data.MoifiedDateAndTime);

        request.input("RootId", sql.Int, data.RootId);
        request.input("RateType", sql.VarChar(50), data.RateType);
        request.input("PinNo", sql.VarChar(50), data.PinNo);
        request.input("GSTinNo", sql.VarChar(50), data.GSTinNo);
        request.input("Place", sql.VarChar(100), data.Place);
        request.input("CustomerType", sql.VarChar(50), data.CustomerType);

        request.input("Latitude", sql.VarChar(sql.MAX), data.Latitude);
        request.input("Longitude", sql.VarChar(sql.MAX), data.Longitude);
       
        request.input("DiscountPercentage", sql.VarChar(sql.MAX), data.DiscountPercentage);
        request.input("CreditDays", sql.Int, data.CreditDays ?? 0);

        request.input("image", sql.VarBinary(sql.MAX), data.image1 || null);
        request.input("Branchid", sql.Int, data.Branchid);
        // Execute procedure
        const result = await request.execute("APPInsertUpdateAccount");

        // return res.json({
        //     success: true,
        //     AccountCode: result.output.AccountCode,
        //     AccountID: result.output.AccountID,
        //     SuitAppsId: data.SuitAppsId
        // });
        return res.json({
                success: true,
                AccountID: result.recordset[0].AccountID,
                AccountCode: result.recordset[0].AccountCode,
                SuitAppsId: result.recordset[0].SuitAppsId
            });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

router.get('/GetRouteName', async (req, res) => {
    try {
        const { EmpID, Date } = req.query;

        if (!EmpID || !Date) {
            return res.status(400).json({
                success: false,
                message: 'EmpID and Date are required'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('EmpID', sql.Int, EmpID)
            .input('Date', sql.Date, Date)
            .execute('APPGetRootByEmpAndDate');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});


router.get('/GetCustomerDetails', async (req, res) => {
    try {
        const { CompanyID, RootID } = req.query;

        if (!CompanyID || !RootID) {
            return res.status(400).json({
                success: false,
                message: 'CompanyID and RootID are required'
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('CompanyID', sql.Int, CompanyID)
            .input('RootID', sql.Int, RootID)
            .execute('APPGetCustomerDetailsByRoot');

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

module.exports = router;