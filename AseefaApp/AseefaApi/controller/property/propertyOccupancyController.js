const sql = require("mssql");
const dbConfig = require("../../config/mssql");


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

        return res.status(200).json({
            success: true,
            data: result.recordset
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
        const { OccupancyID, PropertyID, CompanyID } = req.query;

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

        return res.status(200).json({
            success: true,
            data: result.recordset[0] || null
        });

    } catch (error) {
        console.error("getPropertyOccupancyByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const insertUpdatePropertyOccupancy = async (req, res) => {
    try {

        const {
            OccupancyID = 0,

            PropertyID,
            CompanyID,

            RecordType,
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


        if (!PropertyID || !CompanyID || !RecordType) {
            return res.status(400).json({
                success: false,
                message: "PropertyID, CompanyID and RecordType are required"
            });
        }


        const pool = await sql.connect(dbConfig);

        const result = await pool.request()

            .input("OccupancyID", sql.Int, OccupancyID || 0)
            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .input("RecordType", sql.VarChar(20), RecordType)
            .input("TenantName", sql.VarChar(200), TenantName || null)
            .input("CheckInDate", sql.Date, CheckInDate || null)
            .input("CheckOutDate", sql.Date, CheckOutDate || null)
            .input("InspectionStatus", sql.VarChar(50), InspectionStatus || null)
            .input("KeyHandoverStatus", sql.VarChar(50), KeyHandoverStatus || null)
            .input("AccessCardDetails", sql.VarChar(1000), AccessCardDetails || null)
            .input("Notes", sql.VarChar(2000), Notes || null)
            .input("CreatedBy", sql.Int, CreatedBy || null)
            .input("ModifiedBy", sql.Int, ModifiedBy || null)

            .execute("WebInsertUpdatePropertyOccupancy");


        return res.status(200).json({
            success: true,
            message: result.recordset?.[0]?.Message || "Saved successfully",
            data: result.recordset?.[0] || null
        });

    } catch (error) {

        console.error("insertUpdatePropertyOccupancy:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const deletePropertyOccupancy = async (req, res) => {
    try {

        const { OccupancyID, PropertyID, CompanyID, ModifiedBy } = req.body;

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
            .input("ModifiedBy", sql.Int, ModifiedBy || null)
            .execute("WebDeletePropertyOccupancy");

        return res.status(200).json({
            success: true,
            message: result.recordset?.[0]?.Message || "Deleted successfully"
        });

    } catch (error) {

        console.error("deletePropertyOccupancy:", error);

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