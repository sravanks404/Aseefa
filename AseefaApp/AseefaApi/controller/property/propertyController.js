const sql = require("mssql");
const dbConfig = require("../../config/mssql");

const insertUpdateProperty = async (req, res) => {
    try {

        const {
            PropertyID,
            PropertyCode,
            PropertyName,
            BuildingName,
            BuildingNumber,
            UnitNumber,
            FloorNumber,
            UnitType,
            PropertyCategory,
            TowerWing,
            BlockNumber,
            CommunityArea,
            City,
            StateEmirate,
            Country,
            PostalCode,
            GPSLocation,
            GoogleMapsLink,
            CompanyID,
            UserID
        } = req.body;

        // ------------------------------------------------------
        // VALIDATION
        // ------------------------------------------------------

        if (!CompanyID || Number(CompanyID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }

        if (!UserID || Number(UserID) <= 0) {
            return res.status(400).json({
                success: false,
                message: "UserID is required"
            });
        }

        if (!PropertyName || !PropertyName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Property Name is required"
            });
        }

        // ------------------------------------------------------
        // DATABASE
        // ------------------------------------------------------

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()

            .input("PropertyID", sql.Int, PropertyID || 0)

            .input("PropertyCode", sql.NVarChar(50), PropertyCode || null)
            .input("PropertyName", sql.NVarChar(200), PropertyName)

            .input("BuildingName", sql.NVarChar(200), BuildingName || null)
            .input("BuildingNumber", sql.NVarChar(100), BuildingNumber || null)
            .input("UnitNumber", sql.NVarChar(100), UnitNumber || null)
            .input("FloorNumber", sql.NVarChar(50), FloorNumber || null)

            .input("UnitType", sql.NVarChar(50), UnitType || null)
            .input("PropertyCategory", sql.NVarChar(50), PropertyCategory || null)

            .input("TowerWing", sql.NVarChar(100), TowerWing || null)
            .input("BlockNumber", sql.NVarChar(100), BlockNumber || null)
            .input("CommunityArea", sql.NVarChar(200), CommunityArea || null)

            .input("City", sql.NVarChar(100), City || null)
            .input("StateEmirate", sql.NVarChar(100), StateEmirate || null)
            .input("Country", sql.NVarChar(100), Country || null)
            .input("PostalCode", sql.NVarChar(30), PostalCode || null)

            .input("GPSLocation", sql.NVarChar(100), GPSLocation || null)
            .input("GoogleMapsLink", sql.NVarChar(500), GoogleMapsLink || null)

            .input("CompanyID", sql.Int, CompanyID)
            .input("UserID", sql.Int, UserID)

            .execute("WebInsertUpdatePropertyInformation");

        return res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {

        console.error("insertUpdateProperty error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// =====================================================
// GET PROPERTY LIST
// =====================================================
const getPropertyInformation = async (req, res) => {

    try {

        const { CompanyID } = req.query;

        if (!CompanyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input("CompanyID", sql.Int, CompanyID)
            .execute("WebGetPropertyInformation");

        return res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {

        console.error("getPropertyInformation error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// =====================================================
// GET PROPERTY BY ID
// =====================================================
const getPropertyInformationByID = async (req, res) => {

    try {

        const {
            PropertyID,
            CompanyID
        } = req.query;

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

            .execute("WebGetPropertyInformationByID");

        return res.json({
            success: true,
            data: result.recordset[0] || null
        });

    } catch (error) {

        console.error("getPropertyInformationByID error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// =====================================================
// SOFT DELETE PROPERTY
// =====================================================
const deletePropertyInformation = async (req, res) => {

    try {

        const {
            PropertyID,
            CompanyID,
            UserID
        } = req.body;

        if (!PropertyID || !CompanyID || !UserID) {
            return res.status(400).json({
                success: false,
                message: "PropertyID, CompanyID and UserID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()

            .input("PropertyID", sql.Int, PropertyID)
            .input("CompanyID", sql.Int, CompanyID)
            .input("UserID", sql.Int, UserID)

            .execute("WebDeletePropertyInformation");

        return res.json({
            success: true,
            data: result.recordset[0]
        });

    } catch (error) {

        console.error("deletePropertyInformation error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


module.exports = {
    insertUpdateProperty,
    getPropertyInformation,
    getPropertyInformationByID,
    deletePropertyInformation
};