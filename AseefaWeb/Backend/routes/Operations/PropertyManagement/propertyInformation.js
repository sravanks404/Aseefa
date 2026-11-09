const express = require("express");
const router = express.Router();
const propertyController = require("../../../controllers/property/propertyController");
const propertySpecificationController = require("../../../controllers/property/propertySpecificationController");
const rentalTransactionController = require("../../../controllers/property/propertyTransactionController");
const propertyRentalController = require("../../../controllers/property/propertyRentalController");
const rentalTransactionUpload = require("../../../utils/rentalTransactionUpload");
const {
  getPropertyOwnership,
  getPropertyOwnershipByID,
  insertUpdatePropertyOwnership,
  deletePropertyOwnership,
} = require("../../../controllers/property/propertyOwnershipController");
const {
  getPropertyMaintenance,
  getPropertyMaintenanceByID,
  insertUpdatePropertyMaintenance,
  deletePropertyMaintenance,
} = require("../../../controllers/property/propertyMaintenanceController");
const {
  getPropertyAmenities,
  getPropertyAmenitiesByID,
  insertUpdatePropertyAmenities,
  deletePropertyAmenities,
} = require("../../../controllers/property/propertyAmenitiesController");
const {
  getPropertyUtilities,
  getPropertyUtilityByID,
  insertUpdatePropertyUtilities,
  deletePropertyUtility,
} = require("../../../controllers/property/PropertyUtilities");
const {
  getPropertyOccupancy,
  getPropertyOccupancyByID,
  insertUpdatePropertyOccupancy,
  deletePropertyOccupancy,
} = require("../../../controllers/property/propertyOccupancyController");
const propertyFinanceController = require("../../../controllers/property/PropertyFinanceController");
const {
  getPropertyMaster,
  getPropertyMasterCheque,
  insertUpdatePropertyMasterCheque,
  deletePropertyMasterCheque,
  getPropertyMasterByID,
  insertUpdatePropertyMasterData,
  deletePropertyMaster,
} = require("../../../controllers/property/propertyMasterController");
const {
  getPropertyDocs,
  uploadPropertyDoc,
  deletePropertyDoc,
} = require("../../../controllers/property/PropertyDocController");
const upload = require("../../../utils/uploads");
//PROPERTY INFO
router.post("/insertUpdateProperty", propertyController.insertUpdateProperty);
router.get("/getPropertyInfo", propertyController.getPropertyInformation);
router.get(
  "/getPropertyInfoByID",
  propertyController.getPropertyInformationByID,
);
router.delete(
  "/deletePropertyInfo",
  propertyController.deletePropertyInformation,
);
router.get("/getPropertyReport", propertyController.getPropertyReport);
//PROPERTY SPECIFICATION
router.post(
  "/insertUpdatePropertySpecification",
  propertySpecificationController.insertUpdatePropertySpecification,
);
router.get(
  "/getPropertySpecification",
  propertySpecificationController.getPropertySpecification,
);
router.get(
  "/getPropertySpecificationByID",
  propertySpecificationController.getPropertySpecificationByID,
);
router.delete(
  "/deletePropertySpecification",
  propertySpecificationController.deletePropertySpecification,
);
//PROPERTY RENTAL
router.post(
  "/insertUpdatePropertyRental",
  propertyRentalController.insertUpdatePropertyRental,
);
router.get(
  "/getPropertyRentalTenants",
  propertyRentalController.getPropertyRentalTenants,
);
router.get("/getPropertyRental", propertyRentalController.getPropertyRental);
router.get("/checkFlatAvailability", propertyRentalController.checkFlatAvailability);
router.get(
  "/getPropertyRentalByID",
  propertyRentalController.getPropertyRentalByID,
);
router.delete(
  "/deletePropertyRental",
  propertyRentalController.deletePropertyRental,
);
//PROPERTY OWNERSHIP
router.get("/GetPropertyOwnership", getPropertyOwnership);
router.get("/GetPropertyOwnershipByID", getPropertyOwnershipByID);
router.post("/InsertUpdatePropertyOwnership", insertUpdatePropertyOwnership);
router.post("/DeletePropertyOwnership", deletePropertyOwnership);
//PROPERTY MAINTENANCE
router.get("/GetPropertyMaintenance", getPropertyMaintenance);
router.get("/GetPropertyMaintenanceByID", getPropertyMaintenanceByID);
router.post(
  "/InsertUpdatePropertyMaintenance",
  insertUpdatePropertyMaintenance,
);
router.post("/DeletePropertyMaintenance", deletePropertyMaintenance);
router.delete("/DeletePropertyMaintenance", deletePropertyMaintenance);
router.delete("/deletePropertyMaintenance", deletePropertyMaintenance);
router.post("/deletePropertyMaintenance", deletePropertyMaintenance);
//PROPERTY AMENITIES
router.get("/getPropertyAmenities", getPropertyAmenities);
router.get("/getPropertyAmenitiesByID", getPropertyAmenitiesByID);
router.post("/insertUpdatePropertyAmenities", insertUpdatePropertyAmenities);
router.delete("/deletePropertyAmenities", deletePropertyAmenities);
//PROPERTY UTILITIES
router.get("/GetPropertyUtilities", getPropertyUtilities);
router.get("/GetPropertyUtilityByID", getPropertyUtilityByID);
router.post("/InsertUpdatePropertyUtilities", insertUpdatePropertyUtilities);
router.delete("/DeletePropertyUtility", deletePropertyUtility);
//PROPERTY OCCUPANCY
router.get("/GetPropertyOccupancy", getPropertyOccupancy);
router.get("/GetPropertyOccupancyByID", getPropertyOccupancyByID);
router.post("/InsertUpdatePropertyOccupancy", insertUpdatePropertyOccupancy);
router.delete("/DeletePropertyOccupancy", deletePropertyOccupancy);
//PROPERTY FINANCE
router.get("/GetPropertyFinance", propertyFinanceController.getPropertyFinance);
router.get(
  "/GetPropertyFinanceByID",
  propertyFinanceController.getPropertyFinanceByID,
);
router.post(
  "/InsertUpdatePropertyFinance",
  propertyFinanceController.insertUpdatePropertyFinance,
);
router.delete(
  "/DeletePropertyFinance",
  propertyFinanceController.deletePropertyFinance,
);
//PROPERTY MASTER
router.get("/getPropertyMaster", getPropertyMaster);
router.get("/getPropertyMasterByID", getPropertyMasterByID);
router.post("/insertUpdatePropertyMaster", insertUpdatePropertyMasterData);
router.delete("/deletePropertyMaster", deletePropertyMaster);
//PROPERTY DOCUMENTS
router.get("/getPropertyDocs", getPropertyDocs);
router.post("/uploadPropertyDoc", upload.single("file"), uploadPropertyDoc);
router.post("/deletePropertyDoc", deletePropertyDoc);

router.get("/getPropertyMasterCheque", getPropertyMasterCheque);
router.post("/insertUpdatePropertyMasterCheque", insertUpdatePropertyMasterCheque);
router.delete("/deletePropertyMasterCheque", deletePropertyMasterCheque);

router.get(
  "/getRentalTransactions",
  rentalTransactionController.getRentalTransactions
);

router.post(
  "/saveRentalTransactions",
  rentalTransactionUpload.any(),   // ← .any() — many files with file_<RowId> field names
  rentalTransactionController.saveRentalTransactions
);

router.post(
  "/deleteRentalTransaction",
  rentalTransactionController.deleteRentalTransaction
);

module.exports = router;
