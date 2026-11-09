const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
router.use(express.json());

// Define route at the starting of the page
router.get("/getPropertyReport", getPropertyReport);

async function getPropertyReport(req, res) {
    try {
        const CompanyID = req.query.CompanyID || req.session.CompanyID;

        if (!CompanyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("CompanyID", sql.Int, CompanyID)
            .execute("webGetPropertyReport");

        // Calculate columns in backend to return them directly in the report response
        const records = result.recordset.map(row => {
            const annualRent = parseFloat(row.AnnualRent) || (parseFloat(row.MonthlyRent) * 12) || 0;
            const securityDeposit = parseFloat(row.SecurityDeposit) || 0;
            const totalAmount = annualRent + securityDeposit;

            // Calculate cash received (cheques in the past + security deposit)
            let cashReceived = securityDeposit;
            
            // Calculate dynamic cheques schedule
            const numCheques = parseInt(row.NumberOfCheques) || 0;
            const start = row.LeaseStartDate;
            
            if (numCheques > 0 && start && annualRent > 0) {
                const amt = annualRent / numCheques;
                const intervalMonths = 12 / numCheques;
                const today = new Date();
                
                for (let i = 0; i < numCheques; i++) {
                    const chequeDate = new Date(start);
                    chequeDate.setMonth(chequeDate.getMonth() + Math.round(i * intervalMonths));
                    
                    if (chequeDate <= today) {
                        cashReceived += amt;
                    }
                }
            }

            return {
                ...row,
                CashReceived: cashReceived,
                TotalAmount: totalAmount
            };
        });

        // Filter by PropertyID if provided in request query (supporting case-insensitive parameter names)
        const PropertyID = req.query.PropertyID || req.query.propertyId || req.query.propertyid || req.query.Propertyid;
        let finalRecords = records;
        if (PropertyID && PropertyID !== 'null' && PropertyID !== 'undefined' && PropertyID !== '') {
            finalRecords = records.filter(row => {
                const rowPropId = row.PropertyID || row.propertyId || row.propertyid || row.Propertyid;
                return String(rowPropId) === String(PropertyID);
            });
        }

        return res.json({
            success: true,
            data: finalRecords
        });

    } catch (error) {
        console.error("getPropertyReport error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// 2. GET AVAILABLE PROPERTIES (for dropdown) — used by multiple pages
router.get("/getDashBoardData", async (req, res) => {
  try {
    const CompanyID = req.query.CompanyID || req.session.CompanyID;

    if (!CompanyID) {
      return res.status(400).json({
        success: false,
        message: "CompanyID is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("CompanyID", sql.Int, CompanyID)
      .input("PropertyID", sql.Int, null)
      .execute("WebGetPropertyFullDetails");

    const formattedData = (result.recordset || [])
      .map(p => ({
        PropertyID: p.PropertyID,
        PropertyName: p.PropertyName,
        PropertyCode: p.PropertyCode,
        BuildingName: p.BuildingName,
        UnitNumber: p.UnitNumber
      }))
      .sort((a, b) => (a.PropertyID || 0) - (b.PropertyID || 0));

    return res.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error("getDashBoardData error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});


module.exports = router;

