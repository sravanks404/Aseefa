const sql = require("mssql");
const dbConfig = require("../../config/mssql");

// =====================================================
// GET OWNERSHIP BY COMPANY + PROPERTY
// =====================================================
const getPropertyOwnership = async (req, res) => {
    try {
        const { CompanyID, PropertyID } = req.query;

        if (!CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("CompanyID", sql.Int, CompanyID)
            .input("PropertyID", sql.Int, PropertyID)
            .execute("GetPropertyOwnership");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("GetPropertyOwnership Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get ownership details",
            error: error.message
        });
    }
};


// =====================================================
// GET OWNERSHIP BY ID
// =====================================================
const getPropertyOwnershipByID = async (req, res) => {
    try {
        const { OwnershipID, CompanyID, PropertyID } = req.query;

        if (!OwnershipID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "OwnershipID, CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("OwnershipID", sql.Int, OwnershipID)
            .input("CompanyID", sql.Int, CompanyID)
            .input("PropertyID", sql.Int, PropertyID)
            .execute("GetPropertyOwnershipByID");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("GetPropertyOwnershipByID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get ownership details",
            error: error.message
        });
    }
};


// =====================================================
// INSERT / UPDATE OWNERSHIP
// =====================================================
const insertUpdatePropertyOwnership = async (req, res) => {
    try {
        const {
            OwnershipID,
            CompanyID,
            PropertyID,
            OwnerName,
            CoOwnerDetails,
            OwnershipPercentage,
            PurchaseDate,
            PurchasePrice,
            CurrentMarketValue,
            MortgageDetails,
            LoanAmount,
            LoanProvider,
            EMIDetails,
            InsuranceCompany,
            InsurancePolicyNumber,
            InsuranceExpiryDate,
            PropertyTaxDetails,
            UserID
        } = req.body;

        if (!CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("OwnershipID", sql.Int, OwnershipID || null)
            .input("CompanyID", sql.Int, CompanyID)
            .input("PropertyID", sql.Int, PropertyID)

            .input("OwnerName", sql.NVarChar(200), OwnerName || null)
            .input("CoOwnerDetails", sql.NVarChar(sql.MAX), CoOwnerDetails || null)
            .input(
                "OwnershipPercentage",
                sql.Decimal(5, 2),
                OwnershipPercentage !== "" && OwnershipPercentage != null
                    ? OwnershipPercentage
                    : null
            )

            .input(
                "PurchaseDate",
                sql.Date,
                PurchaseDate || null
            )
            .input(
                "PurchasePrice",
                sql.Decimal(18, 2),
                PurchasePrice !== "" && PurchasePrice != null
                    ? PurchasePrice
                    : null
            )
            .input(
                "CurrentMarketValue",
                sql.Decimal(18, 2),
                CurrentMarketValue !== "" && CurrentMarketValue != null
                    ? CurrentMarketValue
                    : null
            )

            .input("MortgageDetails", sql.NVarChar(sql.MAX), MortgageDetails || null)
            .input(
                "LoanAmount",
                sql.Decimal(18, 2),
                LoanAmount !== "" && LoanAmount != null
                    ? LoanAmount
                    : null
            )
            .input("LoanProvider", sql.NVarChar(200), LoanProvider || null)
            .input("EMIDetails", sql.NVarChar(sql.MAX), EMIDetails || null)

            .input("InsuranceCompany", sql.NVarChar(200), InsuranceCompany || null)
            .input(
                "InsurancePolicyNumber",
                sql.NVarChar(100),
                InsurancePolicyNumber || null
            )
            .input(
                "InsuranceExpiryDate",
                sql.Date,
                InsuranceExpiryDate || null
            )

            .input(
                "PropertyTaxDetails",
                sql.NVarChar(sql.MAX),
                PropertyTaxDetails || null
            )

            .input("UserID", sql.Int, UserID || null)

            .execute("InsertUpdatePropertyOwnership");

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message: result.recordset?.[0]?.Message ||
                "Ownership details saved successfully"
        });

    } catch (error) {
        console.error("InsertUpdatePropertyOwnership Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save ownership details",
            error: error.message
        });
    }
};


// =====================================================
// DELETE OWNERSHIP
// =====================================================
const deletePropertyOwnership = async (req, res) => {
    try {
        const {
            OwnershipID,
            CompanyID,
            PropertyID,
            UserID
        } = req.body;

        if (!OwnershipID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "OwnershipID, CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("OwnershipID", sql.Int, OwnershipID)
            .input("CompanyID", sql.Int, CompanyID)
            .input("PropertyID", sql.Int, PropertyID)
            .input("UserID", sql.Int, UserID || null)
            .execute("DeletePropertyOwnership");

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message: result.recordset?.[0]?.Message ||
                "Ownership details deleted successfully"
        });

    } catch (error) {
        console.error("DeletePropertyOwnership Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete ownership details",
            error: error.message
        });
    }
};


module.exports = {
    getPropertyOwnership,
    getPropertyOwnershipByID,
    insertUpdatePropertyOwnership,
    deletePropertyOwnership
};