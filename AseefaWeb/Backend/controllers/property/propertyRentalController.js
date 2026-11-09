const sql = require("mssql");
const dbConfig = require("../../config/mssql");


const insertUpdatePropertyRental = async (req, res) => {
    try {
        const {
            RentalID,
            RecordID,
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
            UserID,
            TenantUserID
        } = req.body;

     

        if (!CompanyID || Number(CompanyID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }

        if (!RecordID || Number(RecordID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "RecordID is required"
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

        if (TenantUserID !== undefined && TenantUserID !== null && TenantUserID !== "" &&
            (!Number.isInteger(Number(TenantUserID)) || Number(TenantUserID) <= 0)) {
            return res.status(400).json({
                success: false,
                message: "TenantUserID must be a positive user ID"
            });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool
            .request()

            .input(
                "RentalID",
                sql.Int,
                Number(RentalID) || 0
            )

            .input(
                "RecordID",
                sql.Int,
                Number(RecordID)
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
                MonthlyRent === "" ||
                MonthlyRent === null ||
                MonthlyRent === undefined
                    ? null
                    : Number(MonthlyRent)
            )

            .input(
                "AnnualRent",
                sql.Decimal(18, 2),
                AnnualRent === "" ||
                AnnualRent === null ||
                AnnualRent === undefined
                    ? null
                    : Number(AnnualRent)
            )

            .input(
                "SecurityDeposit",
                sql.Decimal(18, 2),
                SecurityDeposit === "" ||
                SecurityDeposit === null ||
                SecurityDeposit === undefined
                    ? null
                    : Number(SecurityDeposit)
            )

            .input(
                "NumberOfCheques",
                sql.Int,
                Number(NumberOfCheques) || null
            )

            .input(
                "PaymentFrequency",
                sql.NVarChar(50),
                PaymentFrequency || null
            )

            .input(
                "RentIncreasePercentage",
                sql.Decimal(5, 2),
                RentIncreasePercentage === "" ||
                RentIncreasePercentage === null ||
                RentIncreasePercentage === undefined
                    ? null
                    : Number(RentIncreasePercentage)
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
                "TenantUserID",
                sql.Int,
                TenantUserID ? Number(TenantUserID) : null
            )

            .input(
                "UserID",
                sql.Int,
                Number(UserID)
            )

            .execute("WebInsertUpdatePropertyRental");

        const data = result.recordset?.[0];
        const savedRentalID = Number(data?.RentalID) || Number(RentalID) || 0;

        if (data?.Success !== 1 || savedRentalID <= 0) {
            return res.status(200).json({
                success: false,
                message: data?.Message || "Rental could not be saved.",
                RentalID: 0,
                data: data || null
            });
        }

        return res.status(200).json({
            success: true,
            message:
                data?.Message ||
                "Rental saved successfully",
            RentalID: savedRentalID,
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

const getPropertyRentalTenants = async (req, res) => {
    try {
        const { CompanyID, PropertyID, RecordID, RentalID } = req.query;
        const companyID = Number(CompanyID);
        const propertyID = Number(PropertyID);
        const recordID = Number(RecordID);
        const rentalID = RentalID ? Number(RentalID) : null;

        if (![companyID, propertyID, recordID].every(Number.isInteger) ||
            companyID <= 0 || propertyID <= 0 || recordID <= 0) {
            return res.status(400).json({
                success: false,
                message: "CompanyID, PropertyID and RecordID are required"
            });
        }

        if (rentalID !== null && (!Number.isInteger(rentalID) || rentalID <= 0)) {
            return res.status(400).json({
                success: false,
                message: "RentalID must be a positive rental ID"
            });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("CompanyID", sql.Int, companyID)
            .input("PropertyID", sql.Int, propertyID)
            .input("RecordID", sql.Int, recordID)
            .input("RentalID", sql.Int, rentalID)
            .query(`
                SELECT UserId, Name, MName, LName, RentalID
                FROM dbo.UserTable
                WHERE CompanyID = @CompanyID
                  AND PropertyID = @PropertyID
                  AND RecordID = @RecordID
                  AND IsDeleted = 0
                  AND (RentalID IS NULL OR RentalID = @RentalID)
                ORDER BY Name, MName, LName
            `);

        return res.status(200).json({ success: true, data: result.recordset || [] });
    } catch (error) {
        console.error("getPropertyRentalTenants Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load tenants for this flat.",
            error: error.message
        });
    }
};



const getPropertyRental = async (req, res) => {
    try {

        const {
            CompanyID,
            PropertyID,
            RecordID
        } = req.query;

        

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

        const pool = await sql.connect(dbConfig);

        const result = await pool
            .request()

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

            // Optional — scopes results to a single PropertyMaster
            // unit/flat when provided (WebGetPropertyRental should
            // filter by RecordID when it is not null).
            .input(
                "RecordID",
                sql.Int,
                Number(RecordID) || null
            )

            .execute("WebGetPropertyRental");

        return res.status(200).json({
            success: true,
            data: result.recordset || []
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



const getPropertyRentalByID = async (req, res) => {
    try {

        const {
            RentalID,
            CompanyID,
            PropertyID
        } = req.query;

       

        if (!RentalID || Number(RentalID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "RentalID is required"
            });
        }

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

        const pool = await sql.connect(dbConfig);

        const result = await pool
            .request()

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


const deletePropertyRental = async (req, res) => {
    let transaction;
    try {

        const {
            RentalID,
            CompanyID,
            PropertyID,
            UserID
        } = req.body;

      

        if (!RentalID || Number(RentalID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "RentalID is required"
            });
        }

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
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const result = await transaction
            .request()

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
        if (data?.Success === 1) {
            await transaction.request()
                .input("RentalID", sql.Int, Number(RentalID))
                .query("UPDATE dbo.UserTable SET RentalID = NULL WHERE RentalID = @RentalID");
            await transaction.commit();
        } else {
            await transaction.rollback();
        }

        return res.status(200).json({
            success: data?.Success === 1,
            message:
                data?.Message ||
                "Rental deleted successfully",
            data: data || null
        });

    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error("deletePropertyRental rollback error:", rollbackError);
            }
        }

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


// ============================================================
// EXPORTS
// ============================================================


// ============================================================
// CHECK FLAT AVAILABILITY (Uses Stored Procedure WebCheckFlatAvailability)
// ============================================================
const checkFlatAvailability = async (req, res) => {
    try {
        const {
            CompanyID,
            PropertyID,
            RecordID,
            FlatNo,
            RentalID,
            UserId,
            LeaseStartDate,
            LeaseEndDate
        } = req.query;

        const companyID = Number(CompanyID);
        const propertyID = Number(PropertyID);

        if (!companyID || companyID <= 0 || !propertyID || propertyID <= 0) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input("CompanyID", sql.Int, companyID);
        request.input("PropertyID", sql.Int, propertyID);
        request.input("RecordID", sql.Int, RecordID ? Number(RecordID) : null);
        request.input("FlatNo", sql.NVarChar(50), FlatNo ? FlatNo.trim() : null);
        request.input("RentalID", sql.Int, RentalID ? Number(RentalID) : 0);
        request.input("UserId", sql.Int, UserId ? Number(UserId) : 0);
        request.input("LeaseStartDate", sql.Date, LeaseStartDate || null);
        request.input("LeaseEndDate", sql.Date, LeaseEndDate || null);

        const result = await request.execute("WebCheckFlatAvailability");
        const row = result.recordset?.[0];

        if (!row) {
            return res.status(200).json({
                success: true,
                available: true,
                isOccupied: false,
                status: "Available",
                message: "This flat is available for rental."
            });
        }

        return res.status(200).json({
            success: true,
            available: Boolean(row.Available),
            isOccupied: Boolean(row.IsOccupied),
            status: row.IsOccupied ? "Occupied" : (row.PreviousStatus || "Available"),
            message: row.Message,
            currentTenant: row.CurrentTenant,
            leaseEndDate: row.LeaseEndDate,
            previousTenant: row.PreviousTenant,
            previousStatus: row.PreviousStatus
        });

    } catch (error) {
        console.error("checkFlatAvailability Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify flat availability",
            error: error.message
        });
    }
};

module.exports = {
    insertUpdatePropertyRental,
    getPropertyRentalTenants,
    getPropertyRental,
    getPropertyRentalByID,
    deletePropertyRental,
    checkFlatAvailability
};