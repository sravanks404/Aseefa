// const express = require("express");
// const router = express.Router();
// const propertyController = require(  "../../../controller/property/propertyController");
// const propertySpecificationController = require("../../../controller/property/propertySpecificationController");
// const propertyRentalController = require("../../../controller/property/propertyRentalController");
// const { getPropertyOwnership, getPropertyOwnershipByID, insertUpdatePropertyOwnership, deletePropertyOwnership } = require("../../../controller/property/propertyOwnershipController");
// const { getPropertyMaintenance, getPropertyMaintenanceByID, insertUpdatePropertyMaintenance, deletePropertyMaintenance } = require("../../../controller/property/propertyMaintenanceController");
// const { getPropertyAmenities, getPropertyAmenitiesByID, insertUpdatePropertyAmenities, deletePropertyAmenities } = require("../../../controller/property/propertyAmenitiesController");
// const { getPropertyUtilities, getPropertyUtilityByID, insertUpdatePropertyUtilities, deletePropertyUtility } = require("../../../controller/property/PropertyUtilities");
// const { getPropertyOccupancy, getPropertyOccupancyByID, insertUpdatePropertyOccupancy, deletePropertyOccupancy } = require("../../../controller/property/propertyOccupancyController");
// const propertyFinanceController = require("../../../controller/property/PropertyFinanceController");
// //PROPERTY INFO
// router.post( "/insertUpdateProperty",propertyController.insertUpdateProperty);
// router.get("/getPropertyInformation",propertyController.getPropertyInformation);
// router.get("/getPropertyInformationByID", propertyController.getPropertyInformationByID);
// router.delete( "/deletePropertyInformation",propertyController.deletePropertyInformation);
// //PROPERTY SPECIFICATION
// router.post("/insertUpdatePropertySpecification", propertySpecificationController.insertUpdatePropertySpecification);
// router.get("/getPropertySpecification", propertySpecificationController.getPropertySpecification);
// router.get( "/getPropertySpecificationByID", propertySpecificationController.getPropertySpecificationByID);
// router.delete("/deletePropertySpecification", propertySpecificationController.deletePropertySpecification);
// //PROPERTY RENTAL
// router.post("/insertUpdatePropertyRental",propertyRentalController.insertUpdatePropertyRental);
// router.get("/getPropertyRental",propertyRentalController.getPropertyRental);
// router.get("/getPropertyRentalByID", propertyRentalController.getPropertyRentalByID);
// router.delete("/deletePropertyRental",propertyRentalController.deletePropertyRental);
// //PROPERTY OWNERSHIP
// router.get("/GetPropertyOwnership",getPropertyOwnership);
// router.get("/GetPropertyOwnershipByID",getPropertyOwnershipByID);
// router.post("/InsertUpdatePropertyOwnership",insertUpdatePropertyOwnership);
// router.post("/DeletePropertyOwnership",deletePropertyOwnership);
// //PROPERTY MAINTENANCE
// router.get("/GetPropertyMaintenance", getPropertyMaintenance);
// router.get("/GetPropertyMaintenanceByID", getPropertyMaintenanceByID);
// router.post("/InsertUpdatePropertyMaintenance",insertUpdatePropertyMaintenance);
// router.post("/DeletePropertyMaintenance",deletePropertyMaintenance);
// //PROPERTY AMENITIES
// router.get("/getPropertyAmenities",getPropertyAmenities);
// router.get("/getPropertyAmenitiesByID", getPropertyAmenitiesByID);
// router.post("/insertUpdatePropertyAmenities",insertUpdatePropertyAmenities);
// router.delete("/deletePropertyAmenities",deletePropertyAmenities);
// //PROPERTY UTILITIES
// router.get("/GetPropertyUtilities", getPropertyUtilities );
// router.get("/GetPropertyUtilityByID", getPropertyUtilityByID );
// router.post("/InsertUpdatePropertyUtilities", insertUpdatePropertyUtilities );
// router.delete("/DeletePropertyUtility", deletePropertyUtility );
// //PROPERTY OCCUPANCY
// router.get("/GetPropertyOccupancy", getPropertyOccupancy );
// router.get("/GetPropertyOccupancyByID", getPropertyOccupancyByID );
// router.post("/InsertUpdatePropertyOccupancy", insertUpdatePropertyOccupancy );
// router.delete("/DeletePropertyOccupancy", deletePropertyOccupancy );
// //PROPERTY FINANCE
// router.get("/GetPropertyFinance", propertyFinanceController.getPropertyFinance );
// router.get("/GetPropertyFinanceByID", propertyFinanceController.getPropertyFinanceByID );  
// router.post("/InsertUpdatePropertyFinance", propertyFinanceController.insertUpdatePropertyFinance );
// router.delete("/DeletePropertyFinance", propertyFinanceController.deletePropertyFinance );

// module.exports = router;

const express = require("express");
const sql = require("mssql");
const dbConfig = require("../../../config/mssql");
const router = express.Router();
const getPool = async () => {
    return await sql.connect(dbConfig);
};
//PROPERTY INFORMATION
router.post("/insertUpdateProperty", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID) || 0)
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
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("UserID", sql.Int, Number(UserID))
            .execute("WebInsertUpdatePropertyInformation");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("insertUpdateProperty:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


// GET ALL
router.get("/getPropertyInformation", async (req, res) => {
    try {
        const { CompanyID } = req.query;

        if (!CompanyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID is required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("CompanyID", sql.Int, Number(CompanyID))
            .execute("WebGetPropertyInformation");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyInformation:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


// GET BY ID
router.get("/getPropertyInformationByID", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .execute("WebGetPropertyInformationByID");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertyInformationByID:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


// DELETE - POST
router.post("/deletePropertyInformation", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("UserID", sql.Int, Number(UserID))
            .execute("WebDeletePropertyInformation");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("deletePropertyInformation:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


/* =========================================================
   PROPERTY SPECIFICATION
========================================================= */

router.post("/insertUpdatePropertySpecification", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("SpecificationID", sql.Int, Number(SpecificationID) || 0)
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input(
                "TotalArea",
                sql.Decimal(18, 2),
                TotalArea === "" || TotalArea == null
                    ? null
                    : Number(TotalArea)
            )
            .input("AreaUnit", sql.NVarChar(20), AreaUnit || null)
            .input(
                "CarpetArea",
                sql.Decimal(18, 2),
                CarpetArea === "" || CarpetArea == null
                    ? null
                    : Number(CarpetArea)
            )
            .input(
                "BuiltUpArea",
                sql.Decimal(18, 2),
                BuiltUpArea === "" || BuiltUpArea == null
                    ? null
                    : Number(BuiltUpArea)
            )
            .input(
                "Bedrooms",
                sql.Int,
                Bedrooms === "" || Bedrooms == null
                    ? null
                    : Number(Bedrooms)
            )
            .input(
                "Bathrooms",
                sql.Int,
                Bathrooms === "" || Bathrooms == null
                    ? null
                    : Number(Bathrooms)
            )
            .input(
                "BalconyCount",
                sql.Int,
                BalconyCount === "" || BalconyCount == null
                    ? null
                    : Number(BalconyCount)
            )
            .input("MaidRoom", sql.NVarChar(10), MaidRoom || null)
            .input("StoreRoom", sql.NVarChar(10), StoreRoom || null)
            .input("LaundryRoom", sql.NVarChar(10), LaundryRoom || null)
            .input("KitchenType", sql.NVarChar(50), KitchenType || null)
            .input(
                "FurnishingStatus",
                sql.NVarChar(50),
                FurnishingStatus || null
            )
            .input("ACType", sql.NVarChar(100), ACType || null)
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
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("UserID", sql.Int, Number(UserID))
            .execute("WebInsertUpdatePropertySpecification");

        const data = result.recordset?.[0];

        return res.status(200).json({
            success: data?.Success === 1,
            message: data?.Message || "Specification saved successfully",
            SpecificationID: data?.SpecificationID || 0,
            data: data || null
        });

    } catch (error) {
        console.error("insertUpdatePropertySpecification:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


router.get("/getPropertySpecification", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .execute("WebGetPropertySpecification");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertySpecification:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


router.get("/getPropertySpecificationByID", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .execute("WebGetPropertySpecificationByID");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertySpecificationByID:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


router.post("/deletePropertySpecification", async (req, res) => {
    try {
        const {
            SpecificationID,
            PropertyID,
            CompanyID,
            UserID
        } = req.body;

        if (!SpecificationID || !PropertyID || !CompanyID || !UserID) {
            return res.status(400).json({
                success: false,
                message:
                    "SpecificationID, PropertyID, CompanyID and UserID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("SpecificationID", sql.Int, Number(SpecificationID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("UserID", sql.Int, Number(UserID))
            .execute("WebDeletePropertySpecification");

        const data = result.recordset?.[0];

        return res.status(200).json({
            success: data?.Success === 1,
            message:
                data?.Message ||
                "Specification deleted successfully",
            data: data || null
        });

    } catch (error) {
        console.error("deletePropertySpecification:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


/* =========================================================
   PROPERTY RENTAL
========================================================= */

router.post("/insertUpdatePropertyRental", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("RentalID", sql.Int, Number(RentalID) || 0)
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("TenantName", sql.NVarChar(200), TenantName || null)
            .input(
                "RentalStatus",
                sql.NVarChar(50),
                RentalStatus || "Vacant"
            )
            .input(
                "MonthlyRent",
                sql.Decimal(18, 2),
                MonthlyRent === "" || MonthlyRent == null
                    ? null
                    : Number(MonthlyRent)
            )
            .input(
                "AnnualRent",
                sql.Decimal(18, 2),
                AnnualRent === "" || AnnualRent == null
                    ? null
                    : Number(AnnualRent)
            )
            .input(
                "SecurityDeposit",
                sql.Decimal(18, 2),
                SecurityDeposit === "" || SecurityDeposit == null
                    ? null
                    : Number(SecurityDeposit)
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
                RentIncreasePercentage === "" ||
                RentIncreasePercentage == null
                    ? null
                    : Number(RentIncreasePercentage)
            )
            .input("LeaseStartDate", sql.Date, LeaseStartDate || null)
            .input("LeaseEndDate", sql.Date, LeaseEndDate || null)
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
            .input("UserID", sql.Int, Number(UserID))
            .execute("WebInsertUpdatePropertyRental");

        const data = result.recordset?.[0];

        return res.status(200).json({
            success: data?.Success === 1,
            message: data?.Message || "Rental saved successfully",
            RentalID: data?.RentalID || 0,
            data: data || null
        });

    } catch (error) {
        console.error("insertUpdatePropertyRental:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


router.get("/getPropertyRental", async (req, res) => {
    try {
        const {
            CompanyID,
            PropertyID
        } = req.query;

        if (!CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("WebGetPropertyRental");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyRental:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


router.get("/getPropertyRentalByID", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("RentalID", sql.Int, Number(RentalID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("WebGetPropertyRentalByID");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertyRentalByID:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


router.post("/deletePropertyRental", async (req, res) => {
    try {
        const {
            RentalID,
            CompanyID,
            PropertyID,
            UserID
        } = req.body;

        if (!RentalID || !CompanyID || !PropertyID || !UserID) {
            return res.status(400).json({
                success: false,
                message:
                    "RentalID, CompanyID, PropertyID and UserID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("RentalID", sql.Int, Number(RentalID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("UserID", sql.Int, Number(UserID))
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
        console.error("deletePropertyRental:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


/* =========================================================
   PROPERTY OWNERSHIP
========================================================= */

router.get("/GetPropertyOwnership", async (req, res) => {
    try {
        const {
            CompanyID,
            PropertyID
        } = req.query;

        if (!CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("GetPropertyOwnership");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyOwnership:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get ownership details",
            error: error.message
        });
    }
});


router.get("/GetPropertyOwnershipByID", async (req, res) => {
    try {
        const {
            OwnershipID,
            CompanyID,
            PropertyID
        } = req.query;

        if (!OwnershipID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message:
                    "OwnershipID, CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("OwnershipID", sql.Int, Number(OwnershipID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("GetPropertyOwnershipByID");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyOwnershipByID:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get ownership details",
            error: error.message
        });
    }
});


router.post("/InsertUpdatePropertyOwnership", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("OwnershipID", sql.Int, Number(OwnershipID) || 0)
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("OwnerName", sql.NVarChar(200), OwnerName || null)
            .input(
                "CoOwnerDetails",
                sql.NVarChar(sql.MAX),
                CoOwnerDetails || null
            )
            .input(
                "OwnershipPercentage",
                sql.Decimal(5, 2),
                OwnershipPercentage === "" ||
                OwnershipPercentage == null
                    ? null
                    : Number(OwnershipPercentage)
            )
            .input("PurchaseDate", sql.Date, PurchaseDate || null)
            .input(
                "PurchasePrice",
                sql.Decimal(18, 2),
                PurchasePrice === "" ||
                PurchasePrice == null
                    ? null
                    : Number(PurchasePrice)
            )
            .input(
                "CurrentMarketValue",
                sql.Decimal(18, 2),
                CurrentMarketValue === "" ||
                CurrentMarketValue == null
                    ? null
                    : Number(CurrentMarketValue)
            )
            .input(
                "MortgageDetails",
                sql.NVarChar(sql.MAX),
                MortgageDetails || null
            )
            .input(
                "LoanAmount",
                sql.Decimal(18, 2),
                LoanAmount === "" ||
                LoanAmount == null
                    ? null
                    : Number(LoanAmount)
            )
            .input(
                "LoanProvider",
                sql.NVarChar(200),
                LoanProvider || null
            )
            .input(
                "EMIDetails",
                sql.NVarChar(sql.MAX),
                EMIDetails || null
            )
            .input(
                "InsuranceCompany",
                sql.NVarChar(200),
                InsuranceCompany || null
            )
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
            .input("UserID", sql.Int, UserID ? Number(UserID) : null)
            .execute("InsertUpdatePropertyOwnership");

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message:
                result.recordset?.[0]?.Message ||
                "Ownership details saved successfully"
        });

    } catch (error) {
        console.error("insertUpdatePropertyOwnership:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save ownership details",
            error: error.message
        });
    }
});


router.post("/DeletePropertyOwnership", async (req, res) => {
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
                message:
                    "OwnershipID, CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("OwnershipID", sql.Int, Number(OwnershipID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("UserID", sql.Int, UserID ? Number(UserID) : null)
            .execute("DeletePropertyOwnership");

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message:
                result.recordset?.[0]?.Message ||
                "Ownership details deleted successfully"
        });

    } catch (error) {
        console.error("deletePropertyOwnership:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete ownership details",
            error: error.message
        });
    }
});


/* =========================================================
   PROPERTY MAINTENANCE
========================================================= */

router.get("/GetPropertyMaintenance", async (req, res) => {
    try {
        const {
            CompanyID,
            PropertyID
        } = req.query;

        if (!CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message: "CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("GetPropertyMaintenance");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyMaintenance:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get maintenance details",
            error: error.message
        });
    }
});


router.get("/GetPropertyMaintenanceByID", async (req, res) => {
    try {
        const {
            MaintenanceID,
            CompanyID,
            PropertyID
        } = req.query;

        if (!MaintenanceID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message:
                    "MaintenanceID, CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("MaintenanceID", sql.Int, Number(MaintenanceID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .execute("GetPropertyMaintenanceByID");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyMaintenanceByID:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get maintenance details",
            error: error.message
        });
    }
});


router.post("/InsertUpdatePropertyMaintenance", async (req, res) => {
    try {
        const {
            MaintenanceID,
            CompanyID,
            PropertyID,
            LastMaintenanceDate,
            NextScheduledMaintenance,
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

        const pool = await getPool();

        const result = await pool.request()
            .input("MaintenanceID", sql.Int, Number(MaintenanceID) || 0)
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
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
                "AMCAvailable",
                sql.NVarChar(20),
                AMCAvailable || null
            )
            .input(
                "AMCContractNumber",
                sql.NVarChar(100),
                AMCContractNumber || null
            )
            .input("AMCStartDate", sql.Date, AMCStartDate || null)
            .input("AMCEndDate", sql.Date, AMCEndDate || null)
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
                MaintenanceCost === "" ||
                MaintenanceCost == null
                    ? null
                    : Number(MaintenanceCost)
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
            )
            .execute("InsertUpdatePropertyMaintenance");

        return res.status(200).json({
            success: true,
            data: result.recordset,
            message:
                result.recordset?.[0]?.Message ||
                "Maintenance details saved successfully"
        });

    } catch (error) {
        console.error("insertUpdatePropertyMaintenance:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save maintenance details",
            error: error.message
        });
    }
});


router.post("/DeletePropertyMaintenance", async (req, res) => {
    try {
        const {
            MaintenanceID,
            CompanyID,
            PropertyID,
            UserID
        } = req.body;

        if (!MaintenanceID || !CompanyID || !PropertyID) {
            return res.status(400).json({
                success: false,
                message:
                    "MaintenanceID, CompanyID and PropertyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("MaintenanceID", sql.Int, Number(MaintenanceID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .input("PropertyID", sql.Int, Number(PropertyID))
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
        console.error("deletePropertyMaintenance:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete maintenance details",
            error: error.message
        });
    }
});


/* =========================================================
   PROPERTY AMENITIES
========================================================= */

router.get("/getPropertyAmenities", async (req, res) => {
    try {
        const {
            PropertyID,
            CompanyID
        } = req.query;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .execute("GetPropertyAmenities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyAmenities:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.get("/getPropertyAmenitiesByID", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input("AmenityID", sql.Int, Number(AmenityID))
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
            .execute("GetPropertyAmenitiesByID");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyAmenitiesByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post("/insertUpdatePropertyAmenities", async (req, res) => {
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
                message:
                    "PropertyID and CompanyID are required"
            });
        }

        if (!AmenityCategory || !AmenityName) {
            return res.status(400).json({
                success: false,
                message:
                    "AmenityCategory and AmenityName are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "AmenityID",
                sql.Int,
                Number(AmenityID) || 0
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
                    ? Number(NumberOfSpaces)
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
                UserID ? Number(UserID) : null
            )
            .execute("InsertUpdatePropertyAmenities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("insertUpdatePropertyAmenities:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// DELETE - POST
router.post("/deletePropertyAmenities", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "AmenityID",
                sql.Int,
                Number(AmenityID)
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
                UserID ? Number(UserID) : null
            )
            .execute("DeletePropertyAmenities");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("deletePropertyAmenities:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/* =========================================================
   PROPERTY OCCUPANCY
========================================================= */

router.get("/GetPropertyOccupancy", async (req, res) => {
    try {
        const {
            PropertyID,
            CompanyID
        } = req.query;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input("PropertyID", sql.Int, Number(PropertyID))
            .input("CompanyID", sql.Int, Number(CompanyID))
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
});


router.get("/GetPropertyOccupancyByID", async (req, res) => {
    try {
        const {
            OccupancyID,
            PropertyID,
            CompanyID
        } = req.query;

        if (!OccupancyID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "OccupancyID, PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "OccupancyID",
                sql.Int,
                Number(OccupancyID)
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
            .execute("WebGetPropertyOccupancyByID");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertyOccupancyByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post("/InsertUpdatePropertyOccupancy", async (req, res) => {
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
                message:
                    "PropertyID, CompanyID and RecordType are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "OccupancyID",
                sql.Int,
                Number(OccupancyID) || 0
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
                "RecordType",
                sql.VarChar(20),
                RecordType
            )
            .input(
                "TenantName",
                sql.VarChar(200),
                TenantName || null
            )
            .input(
                "CheckInDate",
                sql.Date,
                CheckInDate || null
            )
            .input(
                "CheckOutDate",
                sql.Date,
                CheckOutDate || null
            )
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
            .input(
                "Notes",
                sql.VarChar(2000),
                Notes || null
            )
            .input(
                "CreatedBy",
                sql.Int,
                CreatedBy ? Number(CreatedBy) : null
            )
            .input(
                "ModifiedBy",
                sql.Int,
                ModifiedBy ? Number(ModifiedBy) : null
            )
            .execute("WebInsertUpdatePropertyOccupancy");

        const data = result.recordset?.[0];

        return res.status(200).json({
            success: true,
            message:
                data?.Message ||
                "Saved successfully",
            data: data || null
        });

    } catch (error) {
        console.error("insertUpdatePropertyOccupancy:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// DELETE - POST
router.post("/DeletePropertyOccupancy", async (req, res) => {
    try {
        const {
            OccupancyID,
            PropertyID,
            CompanyID,
            ModifiedBy
        } = req.body;

        if (!OccupancyID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "OccupancyID, PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "OccupancyID",
                sql.Int,
                Number(OccupancyID)
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
                "ModifiedBy",
                sql.Int,
                ModifiedBy ? Number(ModifiedBy) : null
            )
            .execute("WebDeletePropertyOccupancy");

        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Deleted successfully"
        });

    } catch (error) {
        console.error("deletePropertyOccupancy:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/* =========================================================
   PROPERTY UTILITIES
========================================================= */

router.get("/GetPropertyUtilities", async (req, res) => {
    try {
        const {
            PropertyID,
            CompanyID
        } = req.query;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
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
});


router.get("/GetPropertyUtilityByID", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "UtilityID",
                sql.Int,
                Number(UtilityID)
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
            .execute("WebGetPropertyUtilityByID");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertyUtilityByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post("/InsertUpdatePropertyUtilities", async (req, res) => {
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
            Action
        } = req.body;

        if (!PropertyID || !CompanyID || !UtilityType) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID, CompanyID and UtilityType are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "UtilityID",
                sql.Int,
                Number(UtilityID) || 0
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
                MonthlyCost == null
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
                PaymentAmount == null
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
                CreatedBy ? Number(CreatedBy) : null
            )
            .input(
                "ModifiedBy",
                sql.Int,
                ModifiedBy ? Number(ModifiedBy) : null
            )
            .input(
                "Action",
                sql.VarChar(20),
                Action || (UtilityID ? "UPDATE" : "INSERT")
            )
            .execute("WebInsertUpdatePropertyUtilities");

        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Saved successfully",
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("insertUpdatePropertyUtilities:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// DELETE - POST
router.post("/DeletePropertyUtility", async (req, res) => {
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

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "UtilityID",
                sql.Int,
                Number(UtilityID)
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
                ModifiedBy ? Number(ModifiedBy) : null
            )
            .input(
                "Action",
                sql.VarChar(20),
                "DELETE"
            )
            .execute("WebInsertUpdatePropertyUtilities");

        return res.status(200).json({
            success: true,
            message:
                result.recordset?.[0]?.Message ||
                "Deleted successfully"
        });

    } catch (error) {
        console.error("deletePropertyUtility:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


/* =========================================================
   PROPERTY FINANCE
========================================================= */

/*
   Finance procedure names assumed:

   WebGetPropertyFinance
   WebGetPropertyFinanceByID
   WebInsertUpdatePropertyFinance
   WebDeletePropertyFinance

   Replace parameter names below if your Finance table/SP
   uses different columns.
*/

router.get("/GetPropertyFinance", async (req, res) => {
    try {
        const {
            PropertyID,
            CompanyID
        } = req.query;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
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
            .execute("WebGetPropertyFinance");

        return res.status(200).json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error("getPropertyFinance:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.get("/GetPropertyFinanceByID", async (req, res) => {
    try {
        const {
            FinanceID,
            PropertyID,
            CompanyID
        } = req.query;

        if (!FinanceID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "FinanceID, PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "FinanceID",
                sql.Int,
                Number(FinanceID)
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
            .execute("WebGetPropertyFinanceByID");

        return res.status(200).json({
            success: true,
            data: result.recordset?.[0] || null
        });

    } catch (error) {
        console.error("getPropertyFinanceByID:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post("/InsertUpdatePropertyFinance", async (req, res) => {
    try {
        const {
            FinanceID,
            PropertyID,
            CompanyID,
            UserID,
            ...financeData
        } = req.body;

        if (!PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "PropertyID and CompanyID are required"
            });
        }

        /*
         * IMPORTANT:
         * Add your exact Finance SP parameters here once
         * the Finance table/SP columns are finalized.
         */

        const pool = await getPool();

        const request = pool.request()
            .input(
                "FinanceID",
                sql.Int,
                Number(FinanceID) || 0
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
                UserID ? Number(UserID) : null
            );

        const result = await request.execute(
            "WebInsertUpdatePropertyFinance"
        );

        const data = result.recordset?.[0];

        return res.status(200).json({
            success: data?.Success === 1 || true,
            message:
                data?.Message ||
                "Finance details saved successfully",
            data: data || null
        });

    } catch (error) {
        console.error("insertUpdatePropertyFinance:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


// DELETE - POST
router.post("/DeletePropertyFinance", async (req, res) => {
    try {
        const {
            FinanceID,
            PropertyID,
            CompanyID,
            UserID
        } = req.body;

        if (!FinanceID || !PropertyID || !CompanyID) {
            return res.status(400).json({
                success: false,
                message:
                    "FinanceID, PropertyID and CompanyID are required"
            });
        }

        const pool = await getPool();

        const result = await pool.request()
            .input(
                "FinanceID",
                sql.Int,
                Number(FinanceID)
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
                UserID ? Number(UserID) : null
            )
            .execute("WebDeletePropertyFinance");

        const data = result.recordset?.[0];

        return res.status(200).json({
            success: data?.Success === 1 || true,
            message:
                data?.Message ||
                "Finance details deleted successfully",
            data: data || null
        });

    } catch (error) {
        console.error("deletePropertyFinance:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;