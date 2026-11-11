const sql = require("mssql");
const dbConfig = require("../../config/mssql");

const getPropertyMaintenance = async (req, res) => {
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
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("GetPropertyMaintenance");

        const data = (result.recordset || []).map((row) => ({
            ...row,
            RoomID: row.RoomTypeID,
            TypeID: row.RoomTypeID,
        }));

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("GetPropertyMaintenance Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get maintenance details",
            error: error.message
        });
    }
};


const getPropertyMaintenanceByID = async (req, res) => {
    try {
        const {
            MaintenanceID,
            CompanyID,
            PropertyID
        } = req.query;

        if (!MaintenanceID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "MaintenanceID, CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("MaintenanceID", sql.Int, Number(MaintenanceID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("GetPropertyMaintenanceByID");

        const data = (result.recordset || []).map((row) => ({
            ...row,
            RoomID: row.RoomTypeID,
            TypeID: row.RoomTypeID,
        }));

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("GetPropertyMaintenanceByID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get maintenance details",
            error: error.message
        });
    }
};



const insertUpdatePropertyMaintenance = async (req, res) => {
    try {
        const {
            MaintenanceID,
            CompanyID,
            PropertyID,

            LastMaintenanceDate,
            NextScheduledMaintenance,
            RoomID,
            RoomNo,
            TypeID,
            RoomTypeID,
            RoomType,

            AMCAvailable,
            AMCContractNumber,
            AMCStartDate,
            AMCEndDate,

            WarrantyAvailable,
            WarrantyExpiryDate,
            WarrantyDetails,

            ContractorName,
            PhoneNumber,
            EmailAddress,
            ContractorAddress,

            ServiceProvider,
            ServiceContact,

            MaintenanceCost,
            MaintenanceCostFrequency,

            RepairHistory,
            InspectionReports,

            UserID
        } = req.body;

        if (!CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const request = pool.request()
            .input(
                "MaintenanceID",
                sql.Int,
                MaintenanceID ? Number(MaintenanceID) : null
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
                "LastMaintenanceDate",
                sql.Date,
                LastMaintenanceDate || null
            )

            .input(
                "NextScheduledMaintenance",
                sql.Date,
                NextScheduledMaintenance || null
            )

            .input(
                "RoomTypeID",
                sql.Int,
                (TypeID !== undefined && TypeID !== null && TypeID !== "")
                    ? Number(TypeID)
                    : (RoomTypeID !== undefined && RoomTypeID !== null && RoomTypeID !== "")
                        ? Number(RoomTypeID)
                        : (RoomID !== undefined && RoomID !== null && RoomID !== "")
                            ? Number(RoomID)
                            : null
            )

            .input(
                "RoomType",
                sql.NVarChar(100),
                RoomType || null
            )

            .input(
                "AMCAvailable",
                sql.NVarChar(20),
                AMCAvailable || null
            )

            .input(
                "AMCContractNumber",
                sql.NVarChar(100),
                AMCContractNumber || null
            )

            .input(
                "AMCStartDate",
                sql.Date,
                AMCStartDate || null
            )

            .input(
                "AMCEndDate",
                sql.Date,
                AMCEndDate || null
            )

            .input(
                "WarrantyAvailable",
                sql.NVarChar(20),
                WarrantyAvailable || null
            )

            .input(
                "WarrantyExpiryDate",
                sql.Date,
                WarrantyExpiryDate || null
            )

            .input(
                "WarrantyDetails",
                sql.NVarChar(sql.MAX),
                WarrantyDetails || null
            )

            .input(
                "ContractorName",
                sql.NVarChar(200),
                ContractorName || null
            )

            .input(
                "PhoneNumber",
                sql.NVarChar(50),
                PhoneNumber || null
            )

            .input(
                "EmailAddress",
                sql.NVarChar(200),
                EmailAddress || null
            )

            .input(
                "ContractorAddress",
                sql.NVarChar(sql.MAX),
                ContractorAddress || null
            )

            .input(
                "ServiceProvider",
                sql.NVarChar(200),
                ServiceProvider || null
            )

            .input(
                "ServiceContact",
                sql.NVarChar(50),
                ServiceContact || null
            )

            .input(
                "MaintenanceCost",
                sql.Decimal(18, 2),
                MaintenanceCost !== "" &&
                MaintenanceCost !== null &&
                MaintenanceCost !== undefined
                    ? Number(MaintenanceCost)
                    : null
            )

            .input(
                "MaintenanceCostFrequency",
                sql.NVarChar(50),
                MaintenanceCostFrequency || null
            )

            .input(
                "RepairHistory",
                sql.NVarChar(sql.MAX),
                RepairHistory || null
            )

            .input(
                "InspectionReports",
                sql.NVarChar(sql.MAX),
                InspectionReports || null
            )

            .input(
                "UserID",
                sql.Int,
                UserID ? Number(UserID) : null
            );

        const result = await request.execute(
            "InsertUpdatePropertyMaintenance"
        );

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message:
                result.recordset?.[0]?.Message ||
                "Maintenance details saved successfully"
        });

    } catch (error) {
        console.error(
            "InsertUpdatePropertyMaintenance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to save maintenance details",
            error: error.message
        });
    }
};



const deletePropertyMaintenance = async (req, res) => {
    const src = { ...req.query, ...req.body };
    try {
        const {
            MaintenanceID,
            CompanyID,
            PropertyID,
            UserID
        } = src;

        if (!MaintenanceID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message:
                    "MaintenanceID, CompanyID and PropertyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input(
                "MaintenanceID",
                sql.Int,
                Number(MaintenanceID)
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
                UserID ? Number(UserID) : null
            )
            .execute("DeletePropertyMaintenance");

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message:
                result.recordset?.[0]?.Message ||
                "Maintenance details deleted successfully"
        });

    } catch (error) {
        console.error(
            "DeletePropertyMaintenance Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to delete maintenance details",
            error: error.message
        });
    }
};




module.exports = {
    getPropertyMaintenance,
    getPropertyMaintenanceByID,
    insertUpdatePropertyMaintenance,
    deletePropertyMaintenance
};