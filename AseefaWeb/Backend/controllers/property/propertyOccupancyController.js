const sql = require("mssql");
const dbConfig = require("../../config/mssql");

// const getPropertyOccupancy = async (req, res) => {
//     try {
//         const { PropertyID, CompanyID } = req.query;

//         if (!PropertyID || !CompanyID) {
//             return res.status(400).json({
//                 success: false,
//                 message: "PropertyID and CompanyID are required"
//             });
//         }

//         const pool = await sql.connect(dbConfig);

//         const result = await pool.request()
//             .input("PropertyID", sql.Int, PropertyID)
//             .input("CompanyID", sql.Int, CompanyID)
//             .execute("WebGetPropertyOccupancy");

//         return res.status(200).json({
//             success: true,
//             data: result.recordset
//         });

//     } catch (error) {
//         console.error("getPropertyOccupancy:", error);

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


// const getPropertyOccupancyByID = async (req, res) => {
//     try {
//         const {
//             OccupancyID,
//             PropertyID,
//             CompanyID
//         } = req.query;

//         if (!OccupancyID || !PropertyID || !CompanyID) {
//             return res.status(400).json({
//                 success: false,
//                 message: "OccupancyID, PropertyID and CompanyID are required"
//             });
//         }

//         const pool = await sql.connect(dbConfig);

//         const result = await pool.request()
//             .input("OccupancyID", sql.Int, OccupancyID)
//             .input("PropertyID", sql.Int, PropertyID)
//             .input("CompanyID", sql.Int, CompanyID)
//             .execute("WebGetPropertyOccupancyByID");

//         return res.status(200).json({
//             success: true,
//             data: result.recordset[0] || null
//         });

//     } catch (error) {
//         console.error("getPropertyOccupancyByID:", error);

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

const getPropertyOccupancy = async (req, res) => {
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
            .execute("WebGetPropertyOccupancy");

        // Each row now includes UserId (linked rental tenant)
        const data = (result.recordset || []).map((r) => ({
            ...r,
            UserId: r.TenantUserId ?? r.UserId ?? null,
        }));

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("getPropertyOccupancy:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const getPropertyOccupancyByID = async (req, res) => {
    try {
        const {
            OccupancyID,
            PropertyID,
            CompanyID
        } = req.query;

        if (!OccupancyID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message: "OccupancyID, PropertyID and CompanyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("OccupancyID", sql.Int, OccupancyID)
            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .execute("WebGetPropertyOccupancyByID");

        const row = result.recordset[0] || null;

        // Expose UserId uniformly (falls back to TenantUserId if SP uses that name)
        const data = row
            ? { ...row, UserId: row.TenantUserId ?? row.UserId ?? null }
            : null;

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        console.error("getPropertyOccupancyByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
// const insertUpdatePropertyOccupancy = async (req, res) => {
//     try {
//         const {
//             OccupancyID = 0,
//             PropertyID,
//             CompanyID,
//             RecordID,
//             RecordType,
//             TenantName,
//             CheckInDate,
//             CheckOutDate,
//             InspectionStatus,
//             KeyHandoverStatus,
//             AccessCardDetails,
//             Notes,
//             CreatedBy,
//             ModifiedBy
//         } = req.body;

//         if (!PropertyID || !CompanyID || !RecordID || !RecordType) {
//             return res.status(400).json({
//                 success: false,
//                 message:
//                     "PropertyID, CompanyID, RecordID and RecordType are required"
//             });
//         }

//         const pool = await sql.connect(dbConfig);

//         const result = await pool.request()
//             .input("OccupancyID", sql.Int, OccupancyID || 0)
//             .input("PropertyID", sql.Int, PropertyID)
//             .input("CompanyID", sql.Int, CompanyID)
//             .input("RecordID", sql.Int, RecordID)
//             .input("RecordType", sql.VarChar(20), RecordType)
//             .input("TenantName", sql.VarChar(200), TenantName || null)
//             .input("CheckInDate", sql.Date, CheckInDate || null)
//             .input("CheckOutDate", sql.Date, CheckOutDate || null)
//             .input(
//                 "InspectionStatus",
//                 sql.VarChar(50),
//                 InspectionStatus || null
//             )
//             .input(
//                 "KeyHandoverStatus",
//                 sql.VarChar(50),
//                 KeyHandoverStatus || null
//             )
//             .input(
//                 "AccessCardDetails",
//                 sql.VarChar(1000),
//                 AccessCardDetails || null
//             )
//             .input("Notes", sql.VarChar(2000), Notes || null)
//             .input("CreatedBy", sql.Int, CreatedBy || null)
//             .input("ModifiedBy", sql.Int, ModifiedBy || null)
//             .execute("WebInsertUpdatePropertyOccupancy");

//         return res.status(200).json({
//             success: true,
//             message:
//                 result.recordset?.[0]?.Message ||
//                 "Saved successfully",
//             data: result.recordset?.[0] || null
//         });

//     } catch (error) {
//         console.error(
//             "insertUpdatePropertyOccupancy:",
//             error
//         );

//         return res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };


const insertUpdatePropertyOccupancy = async (req, res) => {
    try {
        const {
            OccupancyID = 0,
            PropertyID,
            CompanyID,
            RecordID,
            RecordType,
            UserID,                         // ✅ NEW
            TenantName,
            CheckInDate,
            CheckOutDate,
            InspectionStatus,
            KeyHandoverStatus,
            AccessCardDetails,
            Notes,
            CreatedBy,
            ModifiedBy
        } = req.body;

        if (!PropertyID || !CompanyID || !RecordID || !RecordType) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID, CompanyID, RecordID and RecordType are required"
            });
        }

        // ✅ Optional validation: if RecordType is 'Occupancy', UserID should be provided
        if (RecordType === 'Occupancy' && !UserID) {
            return res.status(400).json({
                success: false,
                message: "UserID is required for Occupancy record type"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("OccupancyID", sql.Int, OccupancyID || 0)
            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .input("RecordID", sql.Int, RecordID)
            .input("RecordType", sql.VarChar(20), RecordType)
            .input("UserID", sql.Int, UserID || null)   // ✅ NEW
            .input("TenantName", sql.VarChar(200), TenantName || null)
            .input("CheckInDate", sql.Date, CheckInDate || null)
            .input("CheckOutDate", sql.Date, CheckOutDate || null)
            .input(
                "InspectionStatus",
                sql.VarChar(50),
                InspectionStatus || null
            )
            .input(
                "KeyHandoverStatus",
                sql.VarChar(50),
                KeyHandoverStatus || null
            )
            .input(
                "AccessCardDetails",
                sql.VarChar(1000),
                AccessCardDetails || null
            )
            .input("Notes", sql.VarChar(2000), Notes || null)
            .input("CreatedBy", sql.Int, CreatedBy || null)
            .input("ModifiedBy", sql.Int, ModifiedBy || null)
            .execute("WebInsertUpdatePropertyOccupancy");

        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Saved successfully",
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error(
            "insertUpdatePropertyOccupancy:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deletePropertyOccupancy = async (req, res) => {
    const src = { ...req.query, ...req.body };
    try {
        const {
            OccupancyID,
            PropertyID,
            CompanyID,
            ModifiedBy
        } = src;

        if (!OccupancyID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "OccupancyID, PropertyID and CompanyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("OccupancyID", sql.Int, OccupancyID)
            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .input("ModifiedBy", sql.Int, ModifiedBy || null)
            .execute("WebDeletePropertyOccupancy");

        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Deleted successfully"
        });

    } catch (error) {
        console.error(
            "deletePropertyOccupancy:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getPropertyOccupancy,
    getPropertyOccupancyByID,
    insertUpdatePropertyOccupancy,
    deletePropertyOccupancy
};
