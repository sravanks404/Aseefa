const sql = require("mssql");
const dbConfig = require("../../config/mssql");



const insertUpdatePropertyRental = async (req, res) => {
    try {

        const {
            RentalID,
            CompanyID,
            PropertyID,

            TenantName,
            RentalStatus,

            MonthlyRent,
            AnnualRent,
            SecurityDeposit,

            NumberOfCheques,

            PaymentFrequency,

            RentIncreasePercentage,

            LeaseStartDate,
            LeaseEndDate,

            RenewalOption,

            GracePeriod,

            LateFeeRules,

            UserID
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!CompanyID || Number(CompanyID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }


        if (!PropertyID || Number(PropertyID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "PropertyID is required"
            });
        }


        if (!UserID || Number(UserID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "UserID is required"
            });
        }


        const pool = await sql.connect(dbConfig);


        const result = await pool.request()

            .input(
                "RentalID",
                sql.Int,
                Number(RentalID) || 0
            )

            .input(
                "CompanyID",
                sql.Int,
                Number(CompanyID)
            )

            .input(
                "PropertyID",
                sql.Int,
                Number(PropertyID)
            )

            .input(
                "TenantName",
                sql.NVarChar(200),
                TenantName || null
            )

            .input(
                "RentalStatus",
                sql.NVarChar(50),
                RentalStatus || "Vacant"
            )

            .input(
                "MonthlyRent",
                sql.Decimal(18, 2),
                MonthlyRent === ""
                    ? null
                    : Number(MonthlyRent) || null
            )

            .input(
                "AnnualRent",
                sql.Decimal(18, 2),
                AnnualRent === ""
                    ? null
                    : Number(AnnualRent) || null
            )

            .input(
                "SecurityDeposit",
                sql.Decimal(18, 2),
                SecurityDeposit === ""
                    ? null
                    : Number(SecurityDeposit) || null
            )

            .input(
                "NumberOfCheques",
                sql.Int,
                NumberOfCheques || null
            )

            .input(
                "PaymentFrequency",
                sql.NVarChar(50),
                PaymentFrequency || null
            )

            .input(
                "RentIncreasePercentage",
                sql.Decimal(5, 2),
                RentIncreasePercentage === ""
                    ? null
                    : Number(RentIncreasePercentage) || null
            )

            .input(
                "LeaseStartDate",
                sql.Date,
                LeaseStartDate || null
            )

            .input(
                "LeaseEndDate",
                sql.Date,
                LeaseEndDate || null
            )

            .input(
                "RenewalOption",
                sql.NVarChar(100),
                RenewalOption || null
            )

            .input(
                "GracePeriod",
                sql.Int,
                Number(GracePeriod) || null
            )

            .input(
                "LateFeeRules",
                sql.NVarChar(sql.MAX),
                LateFeeRules || null
            )

            .input(
                "UserID",
                sql.Int,
                Number(UserID)
            )

            .execute("WebInsertUpdatePropertyRental");


        const data = result.recordset?.[0];


        return res.status(200).json({
            success: data?.Success === 1,
            message:
                data?.Message ||
                "Rental saved successfully",
            RentalID: data?.RentalID || 0,
            data: data || null
        });

    } catch (error) {

        console.error(
            "insertUpdatePropertyRental Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// ============================================================
// GET RENTAL BY PROPERTY
// ============================================================
const getPropertyRental = async (req, res) => {

    try {

        const {
            CompanyID,
            PropertyID
        } = req.query;


        if (!CompanyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }


        if (!PropertyID) {
            return res.status(400).json({
                success: false,
                message: "PropertyID is required"
            });
        }


        const pool = await sql.connect(dbConfig);


        const result = await pool.request()

            .input(
                "CompanyID",
                sql.Int,
                Number(CompanyID)
            )

            .input(
                "PropertyID",
                sql.Int,
                Number(PropertyID)
            )

            .execute("WebGetPropertyRental");


        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {

        console.error(
            "getPropertyRental Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// ============================================================
// GET RENTAL BY ID
// ============================================================
const getPropertyRentalByID = async (req, res) => {

    try {

        const {
            RentalID,
            CompanyID,
            PropertyID
        } = req.query;


        if (!RentalID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message:
                    "RentalID, CompanyID and PropertyID are required"
            });
        }


        const pool = await sql.connect(dbConfig);


        const result = await pool.request()

            .input(
                "RentalID",
                sql.Int,
                Number(RentalID)
            )

            .input(
                "CompanyID",
                sql.Int,
                Number(CompanyID)
            )

            .input(
                "PropertyID",
                sql.Int,
                Number(PropertyID)
            )

            .execute("WebGetPropertyRentalByID");


        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {

        console.error(
            "getPropertyRentalByID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// ============================================================
// DELETE RENTAL
// ============================================================
const deletePropertyRental = async (req, res) => {

    try {

        const {
            RentalID,
            CompanyID,
            PropertyID,
            UserID
        } = req.body;


        if (!RentalID ||
            !CompanyID ||
            !PropertyID ||
            !UserID) {

            return res.status(400).json({
                success: false,
                message:
                    "RentalID, CompanyID, PropertyID and UserID are required"
            });
        }


        const pool = await sql.connect(dbConfig);


        const result = await pool.request()

            .input(
                "RentalID",
                sql.Int,
                Number(RentalID)
            )

            .input(
                "CompanyID",
                sql.Int,
                Number(CompanyID)
            )

            .input(
                "PropertyID",
                sql.Int,
                Number(PropertyID)
            )

            .input(
                "UserID",
                sql.Int,
                Number(UserID)
            )

            .execute("WebDeletePropertyRental");


        const data = result.recordset?.[0];


        return res.status(200).json({
            success: data?.Success === 1,
            message:
                data?.Message ||
                "Rental deleted successfully",
            data: data || null
        });

    } catch (error) {

        console.error(
            "deletePropertyRental Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


module.exports = {
    insertUpdatePropertyRental,
    getPropertyRental,
    getPropertyRentalByID,
    deletePropertyRental
};