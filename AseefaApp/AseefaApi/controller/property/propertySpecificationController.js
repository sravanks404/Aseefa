const sql = require("mssql");
const dbConfig = require("../../config/mssql");


// ============================================================
// INSERT / UPDATE PROPERTY SPECIFICATION
// ============================================================
const insertUpdatePropertySpecification = async (req, res) => {

    try {

        const {
            SpecificationID,
            PropertyID,

            TotalArea,
            AreaUnit,

            CarpetArea,
            BuiltUpArea,

            Bedrooms,
            Bathrooms,
            BalconyCount,

            MaidRoom,
            StoreRoom,
            LaundryRoom,

            KitchenType,
            FurnishingStatus,
            ACType,

            InternetAvailability,

            ElectricityMeterNo,
            WaterMeterNo,
            GasConnectionNo,

            CompanyID,
            UserID
        } = req.body;


        // ------------------------------------------------
        // VALIDATION
        // ------------------------------------------------

        if (!PropertyID || Number(PropertyID) <= 0) {

            return res.status(400).json({
                success: false,
                message: "PropertyID is required"
            });
        }


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


        // ------------------------------------------------
        // DATABASE
        // ------------------------------------------------

        const pool = await sql.connect(dbConfig);


        const result = await pool.request()

            .input(
                "SpecificationID",
                sql.Int,
                Number(SpecificationID) || 0
            )

            .input(
                "PropertyID",
                sql.Int,
                Number(PropertyID)
            )

            .input(
                "TotalArea",
                sql.Decimal(18, 2),
                TotalArea === ""
                    ? null
                    : Number(TotalArea) || null
            )

            .input(
                "AreaUnit",
                sql.NVarChar(20),
                AreaUnit || null
            )

            .input(
                "CarpetArea",
                sql.Decimal(18, 2),
                CarpetArea === ""
                    ? null
                    : Number(CarpetArea) || null
            )

            .input(
                "BuiltUpArea",
                sql.Decimal(18, 2),
                BuiltUpArea === ""
                    ? null
                    : Number(BuiltUpArea) || null
            )

            .input(
                "Bedrooms",
                sql.Int,
                Bedrooms === ""
                    ? null
                    : Number(Bedrooms) || null
            )

            .input(
                "Bathrooms",
                sql.Int,
                Bathrooms === ""
                    ? null
                    : Number(Bathrooms) || null
            )

            .input(
                "BalconyCount",
                sql.Int,
                BalconyCount === ""
                    ? null
                    : Number(BalconyCount) || null
            )

            .input(
                "MaidRoom",
                sql.NVarChar(10),
                MaidRoom || null
            )

            .input(
                "StoreRoom",
                sql.NVarChar(10),
                StoreRoom || null
            )

            .input(
                "LaundryRoom",
                sql.NVarChar(10),
                LaundryRoom || null
            )

            .input(
                "KitchenType",
                sql.NVarChar(50),
                KitchenType || null
            )

            .input(
                "FurnishingStatus",
                sql.NVarChar(50),
                FurnishingStatus || null
            )

            .input(
                "ACType",
                sql.NVarChar(100),
                ACType || null
            )

            .input(
                "InternetAvailability",
                sql.NVarChar(10),
                InternetAvailability || null
            )

            .input(
                "ElectricityMeterNo",
                sql.NVarChar(100),
                ElectricityMeterNo || null
            )

            .input(
                "WaterMeterNo",
                sql.NVarChar(100),
                WaterMeterNo || null
            )

            .input(
                "GasConnectionNo",
                sql.NVarChar(100),
                GasConnectionNo || null
            )

            .input(
                "CompanyID",
                sql.Int,
                Number(CompanyID)
            )

            .input(
                "UserID",
                sql.Int,
                Number(UserID)
            )

            .execute(
                "WebInsertUpdatePropertySpecification"
            );


        const data = result.recordset?.[0];


        return res.status(200).json({

            success: data?.Success === 1,

            message:
                data?.Message ||
                "Specification saved successfully",

            SpecificationID:
                data?.SpecificationID || 0,

            data:
                data || null
        });


    } catch (error) {

        console.error(
            "insertUpdatePropertySpecification Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                error.message
        });
    }
};


// ============================================================
// GET SPECIFICATION
// PropertyID + CompanyID
// ============================================================
const getPropertySpecification = async (req, res) => {

    try {

        const {
            PropertyID,
            CompanyID
        } = req.query;


        if (!PropertyID) {

            return res.status(400).json({
                success: false,
                message: "PropertyID is required"
            });
        }


        if (!CompanyID) {

            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }


        const pool =
            await sql.connect(dbConfig);


        const result =
            await pool.request()

                .input(
                    "PropertyID",
                    sql.Int,
                    Number(PropertyID)
                )

                .input(
                    "CompanyID",
                    sql.Int,
                    Number(CompanyID)
                )

                .execute(
                    "WebGetPropertySpecification"
                );


        return res.status(200).json({

            success: true,

            data:
                result.recordset?.[0] ||
                null
        });


    } catch (error) {

        console.error(
            "getPropertySpecification Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                error.message
        });
    }
};


// ============================================================
// GET SPECIFICATION BY ID
// ============================================================
const getPropertySpecificationByID = async (req, res) => {

    try {

        const {
            PropertyID,
            CompanyID
        } = req.query;


        if (!PropertyID || Number(PropertyID) <= 0) {

            return res.status(400).json({
                success: false,
                message: "PropertyID is required"
            });
        }


        if (!CompanyID || Number(CompanyID) <= 0) {

            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }


        const pool =
            await sql.connect(dbConfig);


        const result =
            await pool.request()

                .input(
                    "PropertyID",
                    sql.Int,
                    Number(PropertyID)
                )

                .input(
                    "CompanyID",
                    sql.Int,
                    Number(CompanyID)
                )

                .execute(
                    "WebGetPropertySpecificationByID"
                );


        const data =
            result.recordset?.[0] || null;


        return res.status(200).json({

            success: true,

            data: data
        });


    } catch (error) {

        console.error(
            "getPropertySpecificationByID Error:",
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
// DELETE SPECIFICATION
// PropertyID + CompanyID + SpecificationID
// ============================================================
const deletePropertySpecification = async (req, res) => {

    try {

        const {
            SpecificationID,
            PropertyID,
            CompanyID,
            UserID
        } = req.body;


        if (!SpecificationID) {

            return res.status(400).json({
                success: false,
                message: "SpecificationID is required"
            });
        }


        if (!PropertyID) {

            return res.status(400).json({
                success: false,
                message: "PropertyID is required"
            });
        }


        if (!CompanyID) {

            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }


        if (!UserID) {

            return res.status(400).json({
                success: false,
                message: "UserID is required"
            });
        }


        const pool =
            await sql.connect(dbConfig);


        const result =
            await pool.request()

                .input(
                    "SpecificationID",
                    sql.Int,
                    Number(SpecificationID)
                )

                .input(
                    "PropertyID",
                    sql.Int,
                    Number(PropertyID)
                )

                .input(
                    "CompanyID",
                    sql.Int,
                    Number(CompanyID)
                )

                .input(
                    "UserID",
                    sql.Int,
                    Number(UserID)
                )

                .execute(
                    "WebDeletePropertySpecification"
                );


        const data =
            result.recordset?.[0];


        return res.status(200).json({

            success:
                data?.Success === 1,

            message:
                data?.Message ||
                "Specification deleted successfully",

            data:
                data || null
        });


    } catch (error) {

        console.error(
            "deletePropertySpecification Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                error.message
        });
    }
};


module.exports = {
    insertUpdatePropertySpecification,
    getPropertySpecification,
    getPropertySpecificationByID,
    deletePropertySpecification
};