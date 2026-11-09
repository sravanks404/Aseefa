
const sql = require("mssql");
const dbConfig = require("../../config/mssql");


// =====================================================
// GET ALL UTILITIES FOR PROPERTY
// =====================================================
const getPropertyUtilities = async (req, res) => {
    try {
        const { PropertyID, CompanyID } = req.query;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message: "PropertyID and CompanyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .execute("WebGetPropertyUtilities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyUtilities:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================================
// GET UTILITY BY ID
// =====================================================
const getPropertyUtilityByID = async (req, res) => {
    try {
        const {
            UtilityID,
            PropertyID,
            CompanyID
        } = req.query;

        if (!UtilityID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "UtilityID, PropertyID and CompanyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("UtilityID", sql.Int, UtilityID)
            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .execute("WebGetPropertyUtilityByID");

        return res.status(200).json({
            success: true,
            data: result.recordset[0] || null
        });

    } catch (error) {
        console.error("getPropertyUtilityByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================================
// INSERT / UPDATE UTILITY
// =====================================================
const insertUpdatePropertyUtilities = async (req, res) => {
    try {

        const {
            UtilityID = 0,
            PropertyID,
            CompanyID,

            UtilityType,

            ProviderName,
            AccountNumber,

            MonthlyCost,
            DueDateText,

            PaymentID,
            PaymentAmount,
            PaymentDueDate,
            PaidDate,
            PaymentStatus,
            ReferenceNumber,
            Notes,

            CreatedBy,
            ModifiedBy,

            Action,

            FlatID,
            FlatType,
            RecordID
        } = req.body;


        if (!PropertyID || !CompanyID || !UtilityType) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID, CompanyID and UtilityType are required"
            });
        }


        const pool = await sql.connect(dbConfig);

        const result = await pool.request()

            .input(
                "UtilityID",
                sql.Int,
                UtilityID || 0
            )

            .input(
                "PropertyID",
                sql.Int,
                PropertyID
            )

            .input(
                "CompanyID",
                sql.Int,
                CompanyID
            )

            .input(
                "UtilityType",
                sql.VarChar(50),
                UtilityType
            )

            .input(
                "ProviderName",
                sql.VarChar(150),
                ProviderName || null
            )

            .input(
                "AccountNumber",
                sql.VarChar(100),
                AccountNumber || null
            )

            .input(
                "MonthlyCost",
                sql.Decimal(18, 2),
                MonthlyCost === "" ||
                MonthlyCost === null ||
                MonthlyCost === undefined
                    ? null
                    : Number(MonthlyCost)
            )

            .input(
                "DueDateText",
                sql.VarChar(100),
                DueDateText || null
            )

            .input(
                "PaymentID",
                sql.VarChar(50),
                PaymentID || null
            )

            .input(
                "PaymentAmount",
                sql.Decimal(18, 2),
                PaymentAmount === "" ||
                PaymentAmount === null ||
                PaymentAmount === undefined
                    ? null
                    : Number(PaymentAmount)
            )

            .input(
                "PaymentDueDate",
                sql.Date,
                PaymentDueDate || null
            )

            .input(
                "PaidDate",
                sql.Date,
                PaidDate || null
            )

            .input(
                "PaymentStatus",
                sql.VarChar(30),
                PaymentStatus || null
            )

            .input(
                "ReferenceNumber",
                sql.VarChar(150),
                ReferenceNumber || null
            )

            .input(
                "Notes",
                sql.VarChar(1000),
                Notes || null
            )

            .input(
                "CreatedBy",
                sql.Int,
                CreatedBy || null
            )

            .input(
                "ModifiedBy",
                sql.Int,
                ModifiedBy || null
            )

            .input(
                "Action",
                sql.VarChar(20),
                Action || (UtilityID ? "UPDATE" : "INSERT")
            )

            .input(
                "FlatID",
                sql.NVarChar(50),
                FlatID !== undefined && FlatID !== null ? String(FlatID).trim() : null
            )

            .input(
                "FlatType",
                sql.NVarChar(50),
                FlatType !== undefined && FlatType !== null ? String(FlatType).trim() : null
            )

            .input(
                "RecordID",
                sql.NVarChar(50),
                RecordID !== undefined && RecordID !== null ? String(RecordID).trim() : null
            )

            .execute(
                "WebInsertUpdatePropertyUtilities"
            );


        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Saved successfully",
            data:
                result.recordset?.[0] || null
        });

    } catch (error) {

        console.error(
            "insertUpdatePropertyUtilities:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================================
// DELETE UTILITY
// =====================================================
const deletePropertyUtility = async (req, res) => {
    try {

        const {
            UtilityID,
            PropertyID,
            CompanyID,
            ModifiedBy
        } = req.body;


        if (!UtilityID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "UtilityID, PropertyID and CompanyID are required"
            });
        }


        const pool = await sql.connect(dbConfig);

        const result = await pool.request()

            .input(
                "UtilityID",
                sql.Int,
                UtilityID
            )

            .input(
                "PropertyID",
                sql.Int,
                PropertyID
            )

            .input(
                "CompanyID",
                sql.Int,
                CompanyID
            )

            .input(
                "ProviderName",
                sql.VarChar(150),
                null
            )

            .input(
                "AccountNumber",
                sql.VarChar(100),
                null
            )

            .input(
                "MonthlyCost",
                sql.Decimal(18, 2),
                null
            )

            .input(
                "DueDateText",
                sql.VarChar(100),
                null
            )

            .input(
                "PaymentID",
                sql.VarChar(50),
                null
            )

            .input(
                "PaymentAmount",
                sql.Decimal(18, 2),
                null
            )

            .input(
                "PaymentDueDate",
                sql.Date,
                null
            )

            .input(
                "PaidDate",
                sql.Date,
                null
            )

            .input(
                "PaymentStatus",
                sql.VarChar(30),
                null
            )

            .input(
                "ReferenceNumber",
                sql.VarChar(150),
                null
            )

            .input(
                "Notes",
                sql.VarChar(1000),
                null
            )

            .input(
                "UtilityType",
                sql.VarChar(50),
                ""
            )

            .input(
                "CreatedBy",
                sql.Int,
                null
            )

            .input(
                "ModifiedBy",
                sql.Int,
                ModifiedBy || null
            )

            .input(
                "Action",
                sql.VarChar(20),
                "DELETE"
            )

            .execute(
                "WebInsertUpdatePropertyUtilities"
            );


        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Deleted successfully"
        });

    } catch (error) {

        console.error(
            "deletePropertyUtility:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getPropertyUtilities,
    getPropertyUtilityByID,
    insertUpdatePropertyUtilities,
    deletePropertyUtility
};

