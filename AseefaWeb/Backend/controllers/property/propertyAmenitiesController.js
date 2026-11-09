const sql = require("mssql");
const dbConfig = require("../../config/mssql");

const getPropertyAmenities = async (req, res) => {
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
            .input("PropertyID", sql.Int, parseInt(PropertyID))
            .input("CompanyID", sql.Int, parseInt(CompanyID))
            .execute("GetPropertyAmenities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("GetPropertyAmenities Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getPropertyAmenitiesByID = async (req, res) => {
    try {
        const {
            AmenityID,
            PropertyID,
            CompanyID
        } = req.query;

        if (!AmenityID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "AmenityID, PropertyID and CompanyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input(
                "AmenityID",
                sql.Int,
                parseInt(AmenityID)
            )
            .input(
                "PropertyID",
                sql.Int,
                parseInt(PropertyID)
            )
            .input(
                "CompanyID",
                sql.Int,
                parseInt(CompanyID)
            )
            .execute("GetPropertyAmenitiesByID");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error(
            "GetPropertyAmenitiesByID Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =====================================================
// INSERT / UPDATE PROPERTY AMENITY
// =====================================================
const insertUpdatePropertyAmenities = async (req, res) => {
    try {
        const {
            AmenityID,
            PropertyID,
            CompanyID,
            AmenityCategory,
            AmenityName,
            IsAvailable,
            NumberOfSpaces,
            SizeOrNotes,
            UserID
        } = req.body;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message: "PropertyID and CompanyID are required"
            });
        }

        if (!AmenityCategory || !AmenityName) {
            return res.status(400).json({
                success: false,
                message: "AmenityCategory and AmenityName are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input(
                "AmenityID",
                sql.Int,
                AmenityID ? parseInt(AmenityID) : null
            )
            .input(
                "PropertyID",
                sql.Int,
                parseInt(PropertyID)
            )
            .input(
                "CompanyID",
                sql.Int,
                parseInt(CompanyID)
            )
            .input(
                "AmenityCategory",
                sql.NVarChar(100),
                AmenityCategory
            )
            .input(
                "AmenityName",
                sql.NVarChar(150),
                AmenityName
            )
            .input(
                "IsAvailable",
                sql.Bit,
                IsAvailable ? 1 : 0
            )
            .input(
                "NumberOfSpaces",
                sql.Int,
                NumberOfSpaces !== null &&
                NumberOfSpaces !== undefined &&
                NumberOfSpaces !== ""
                    ? parseInt(NumberOfSpaces)
                    : null
            )
            .input(
                "SizeOrNotes",
                sql.NVarChar(500),
                SizeOrNotes || null
            )
            .input(
                "UserID",
                sql.Int,
                UserID ? parseInt(UserID) : null
            )
            .execute("InsertUpdatePropertyAmenities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error(
            "InsertUpdatePropertyAmenities Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// =====================================================
// DELETE PROPERTY AMENITY
// =====================================================
const deletePropertyAmenities = async (req, res) => {
    try {
        const {
            AmenityID,
            PropertyID,
            CompanyID,
            UserID
        } = req.body;

        if (!AmenityID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "AmenityID, PropertyID and CompanyID are required"
            });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input(
                "AmenityID",
                sql.Int,
                parseInt(AmenityID)
            )
            .input(
                "PropertyID",
                sql.Int,
                parseInt(PropertyID)
            )
            .input(
                "CompanyID",
                sql.Int,
                parseInt(CompanyID)
            )
            .input(
                "UserID",
                sql.Int,
                UserID ? parseInt(UserID) : null
            )
            .execute("DeletePropertyAmenities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error(
            "DeletePropertyAmenities Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



module.exports = {
    getPropertyAmenities,
    getPropertyAmenitiesByID,
    insertUpdatePropertyAmenities,
    deletePropertyAmenities
};