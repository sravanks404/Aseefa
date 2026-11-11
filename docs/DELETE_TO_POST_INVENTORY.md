# HTTP DELETE inventory (before conversion)

Inventory captured before changing application routes or requests. Line numbers refer to the working tree at inventory time. Commented-out examples are separated and are not active requests/routes.

## Backend routes

### AseefaWeb/Backend

| File | Line | Endpoint |
|---|---:|---|
| `routes/Operations/Transacations/Receipt.js` | 393 | `DELETE /deleteReciept` |
| `routes/Operations/PropertyManagement/propertyInformation.js` | 61 | `DELETE /deletePropertyInfo` |
| same | 79 | `DELETE /deletePropertySpecification` |
| same | 98 | `DELETE /deletePropertyRental` |
| same | 115 | `DELETE /DeletePropertyMaintenance` (POST twin already exists) |
| same | 116 | `DELETE /deletePropertyMaintenance` (POST twin already exists) |
| same | 122 | `DELETE /deletePropertyAmenities` |
| same | 127 | `DELETE /DeletePropertyUtility` |
| same | 132 | `DELETE /DeletePropertyOccupancy` |
| same | 143 | `DELETE /DeletePropertyFinance` |
| same | 151 | `DELETE /deletePropertyMaster` |
| same | 159 | `DELETE /deletePropertyMasterCheque` |
| `routes/Operations/MasterPages/AttendanceDashboard.js` | 89 | `DELETE /DeleteAttendanceDocument/:documentId` |
| `routes/Operations/MasterPages/accountMasterTest.js` | 162 | `DELETE /deleteitemAccount` |
| `routes/Operations/MasterPages/BatchMaster.js` | 43 | `DELETE /deletebatch` |
| `routes/Operations/MasterPages/CategoryMaster.js` | 89 | `DELETE /deleteitemcategory` |
| `routes/Operations/MasterPages/InvoiceMaster.js` | 60 | `DELETE /deleteinvoiceseries/:SID` |
| `routes/Operations/MasterPages/ReceiptCrud.js` | 393 | `DELETE /deleteReciept` |
| `routes/Operations/MasterPages/Supplier.js` | 312 | `DELETE /DeleteSupplierAttachment/:attachmentID` |
| `routes/Operations/MasterPages/TaskManagement.js` | 91 | `DELETE /deletetask` |
| `routes/Operations/MasterPages/TaxMaster.js` | 42 | `DELETE /deletetax` |
| `routes/Operations/MasterPages/UnitMaster.js` | 187 | `DELETE /deleteunit` |
| same | 463 | `DELETE /DeleteCamp` |
| `routes/Operations/MasterPages/UnitMasterTest.js` | 88 | `DELETE /deleteunittest` |
| `routes/Login/DashOut/webEmpMessage.js` | 69 | `DELETE /DeleteWebEmpMessage` |
| `routes/Login/DashOut/TaskManager.js` | 79 | `DELETE /webDeleteTask` |

### AseefaApp/AseefaApi

| File | Line | Endpoint |
|---|---:|---|
| `routes/Operations/Transacations/Receipt.js` | 393 | `DELETE /deleteReciept` |
| `routes/Operations/MasterPages/ReceiptCrud.js` | 393 | `DELETE /deleteReciept` |
| `routes/Operations/MasterControl/unitMaster.js` | 191 | `DELETE /deleteunit` |
| same | 465 | `DELETE /DeleteCamp` |
| `routes/Login/DashOut/webEmpMessage.js` | 69 | `DELETE /DeleteWebEmpMessage` |
| `routes/Login/DashOut/TaskManager.js` | 79 | `DELETE /webDeleteTask` |

Property route handlers are controller functions imported into `propertyInformation.js`; their implementations also need to read inputs from query/body `src` so their new POST routes work. The active AseefaApp property-information file has only commented DELETE declarations; it has no active DELETE route to twin.

## React frontend active requests

| File | Line | Endpoint |
|---|---:|---|
| `pages/Operations/Transactions/Receipt.jsx` | 412 | `/api/deleteReciept` |
| `pages/Operations/PropertyManagement/Utilities.jsx` | 432 | `/api/deletePropertyUtility` |
| `pages/Operations/PropertyManagement/RentalInformation.jsx` | 2032 | `/api/deletePropertyRental` |
| `pages/Operations/PropertyManagement/PropertySpecification.jsx` | 1062 | `/api/deletePropertySpecification` |
| `pages/Operations/PropertyManagement/Propertymaster.jsx` | 2024 | `/api/deletePropertyMaster` |
| `pages/Operations/PropertyManagement/PropertyInformation.jsx` | 642 | `/api/deletePropertyInfo` |
| `pages/Operations/PropertyManagement/Ownership.jsx` | 278 | `/api/deletePropertyOwnership` |
| `pages/Operations/PropertyManagement/Occupancy.jsx` | 1314 | `/api/deletePropertyOccupancy` |
| `pages/Operations/PropertyManagement/Maintenance.jsx` | 416, 539 | `/api/deletePropertyMaintenance` |
| `pages/Operations/PropertyManagement/Amenities.jsx` | 318 | `/api/deletePropertyAmenities` |
| `pages/Operations/MasterPages/AttendanceDashboard.jsx` | 1882 | `/api/DeleteAttendanceDocument/${doc.DocumentId}` |
| `pages/Operations/MasterPages/AttendanceDocuments.jsx` | 172 | `/api/DeleteAttendanceDocument/${doc.DocumentId}` |
| `pages/Operations/MasterPages/AccountMaster.jsx` | 1864 | `/api/deleteAccountHead` |
| same | 1884 | `/api/deleteitemAccount` |
| `pages/Operations/MasterPages/BatchMaster.jsx` | 192 | `/api/deletebatch` |
| `pages/Operations/MasterPages/CategoryMaster.jsx` | 406 | `/api/deleteitemcategory` |
| `pages/Operations/MasterPages/Customer.jsx` | 1081 | `/api/deleteunit` |
| `pages/Operations/MasterPages/InvoiceMaster.jsx` | 245 | `/api/deleteinvoiceseries/${form.SID}` |
| `pages/Operations/MasterPages/PlaceMaster.jsx` | 223 | `/api/WebDeletePlaceMaster` |
| `pages/Operations/MasterPages/Reciept.jsx` | 412 | `/api/deleteReciept` |
| `pages/Operations/MasterPages/TaxMaster.jsx` | 1011 | `/api/deletetax` |
| `pages/Operations/MasterPages/TaskManagement.jsx` | 290 | `/api/deletetask` |
| `pages/Operations/MasterPages/UnitMaster.jsx` | 771 | `/api/deleteunit` |
| `pages/Operations/MasterPages/UnitMasterTest.jsx` | 207 | `/api/deleteunittest` |
| `pages/Login/Dashboardout/EmpMessage.jsx` | 292 | `/api/DeleteWebEmpMessage` |
| `pages/Login/Dashboardout/TaskManager.jsx` | 346 | `/api/webDeleteTask` |
| `pages/Operations/Inventory/ProductionCrud copy 2.jsx` | 210 | `/api/DeleteProduction/${jc.JobCardId}` (no matching `router.delete`/`app.delete` was found in the scoped backends) |

The two active Ownership and Maintenance UI requests call paths that were already registered as POST in the Web property route file; they still used DELETE at inventory time.

## Flutter HTTP method scan

No active `http.delete(...)`, `dio.delete(...)`, `.delete(...)`, or `method: 'DELETE'` / `method: "DELETE"` occurrence was found in `AseefaApp/Aseefa/lib`. The inspected Flutter delete handlers already submit JSON with POST, including Property Information, Property Master, Specification, Rental, Ownership, Utilities, Occupancy, Maintenance, Amenities, and Utility Payments. Therefore no Flutter method conversion is indicated by the requested scan.

## Commented-out frontend examples (not requests)

| File | Line | Commented endpoint |
|---|---:|---|
| `pages/Operations/PropertyManagement/RentalInformation.jsx` | 606 | `/api/deletePropertyRental` |
| `pages/Operations/PropertyManagement/Propertymaster.jsx` | 665 | `/api/deletePropertyMaster` |
| `pages/Operations/PropertyManagement/Occupancy.jsx` | 332 | `/api/deletePropertyOccupancy` |
| `pages/Operations/MasterPages/AccountMaster.jsx` | 677, 697 | `/api/deleteAccountHead`, `/api/deleteitemAccount` |
| `pages/Operations/MasterPages/UnitMaster.jsx` | 211 | `/api/deleteunit` |
| `pages/Operations/MasterPages/TaxMaster.jsx` | 297 | `/api/deletetax` |

No changes are needed for these inactive examples to affect runtime behavior.
