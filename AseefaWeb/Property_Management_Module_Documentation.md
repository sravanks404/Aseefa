# Property Management and Rental Management — Technical Documentation

## 1. Scope and evidence

This document describes the current checked-out source in this repository. It distinguishes runnable API integrations from UI-only or incomplete work and does not infer stored-procedure internals.

The backend source invokes SQL Server stored procedures, but this repository contains no SQL DDL, stored-procedure definitions, or migration scripts for this module. The report query directly references `PropertyInformation` and `PropertyRental`; the tenant-choice handler also directly queries `UserTable`. Other entity/table names below are described as logical concepts or procedure-backed records, not as verified physical table names. Stored-procedure names are listed exactly as called by the Node.js code.

## 2. Module overview

Property Management is a workspace for maintaining company-scoped property records and related unit, rental, and operational information. Its main entry is `/PropertyManagement`, a protected React route containing tabs for:

1. Dashboard
2. Property
3. Property Master
4. Specification
5. Amenities
6. Ownership
7. Rental
8. Documents
9. Media
10. Utilities
11. Occupancy
12. Maintenance
13. Financial
14. Report

Rental-related work is available in two screens:

- The **Rental** tab in Property Management manages rental-contract rows against a property and unit through the property-rental API.
- The sidebar's **Rental Management** link opens `/Userinfo`, whose page wrapper renders `pages/Operations/MasterControl/RentalInfo.jsx`. This is a combined tenant, property/unit, availability, and payment-transaction screen. It creates and edits tenant/user records with `PropertyID` and `RecordID`; it does not call the dedicated `/insertUpdatePropertyRental` endpoint. The two screens share property, unit, and rental data but use different save paths.

## 3. Frontend architecture

### Application entry and navigation

- `Frontend/src/App.jsx` registers `/PropertyManagement`, `/Userinfo`, and `/UserPermission` under `Protectorroute`.
- `Frontend/components/Protectorroute.jsx` checks that `UserId` and `CompanyID` exist in `sessionStorage`; if either is missing, it redirects to `/`. It does not itself check module permissions.
- `Frontend/PageRouter/Operations/PropertyManagement/PropertyManagement_Page.jsx` composes the shared Navbar and Sidebar with the module workspace.
- `Frontend/components/Sidebar.jsx` links Property Management to `/PropertyManagement`. The Property Management menu item is shown for the hard-coded role IDs `1`, `3`, and `4`. The separate Rental Management link points to `/Userinfo`.
- The module's tabs are local React state, not independent URL routes. In `PropertyManagement.jsx`, a tab is mounted on first visit and kept mounted while hidden thereafter.

### Property workspace and data selection

`PropertyManagement.jsx` passes `properties`, `selectedProperty`, `onSelectProperty`, `onPropertiesChange`, and `openTab` props to tab components. It initializes its parent list with four sample property records. The Property screen itself loads company data from the backend and updates the parent list; several other screens also load their own property lists instead of relying exclusively on the parent selection. Consequently, the initial parent state is demonstration data, not persisted property data.

`Frontend/pages/apiService.js` exports the shared Axios client. Its currently active base URL is `http://localhost:1201`; other deployment URLs in that file are comments.

### Screens and forms

| Screen | Current responsibilities and interaction |
|---|---|
| Dashboard | Loads report rows and derives totals, occupancy/status counts, and rent summaries in the browser. |
| Property | Property list, text search and filters; create/edit/delete property forms. |
| Property Master | Selects a property and manages unit/flat records. The active form saves flat number, flat type, and remarks. |
| Specification | Selects a property and its Property Master unit, then edits area, room, furnishing, appliance, and meter fields. |
| Amenities | Lists and edits amenity category/name, availability, count, and notes for a property. |
| Ownership | Captures owner/co-owner, ownership percentage, purchase/value, mortgage, loan, EMI, insurance, and tax details. |
| Rental | Selects a property and unit, lists rental rows, and creates/edits/deletes rent, tenant, status, lease, deposit, frequency, renewal, grace-period, and late-fee values through the dedicated property-rental APIs. |
| Rental Management (`/Userinfo`) | Combines tenant/user maintenance with property/unit selection, flat-availability checking, rental-context display, and payment transaction management. |
| Documents | Lists, filters, uploads, edits, and deletes property document metadata/files. File types are organized into UI document categories. |
| Media | Provides a local image/video/virtual-tour editing UI, but does not persist data to the backend. |
| Utilities | Manages utility type/provider/account/cost and payment-related fields. |
| Occupancy | Tracks unit occupancy/vacancy, tenant, dates, inspection and key status, access cards, and notes. |
| Maintenance | Manages maintenance schedule, AMC/warranty, contractors, service contacts, costs, and repair/inspection notes. |
| Financial | Shows a client-only financial form/list seeded with examples; it is not connected to a database API. |
| Report | Loads property/rental report rows, filters them, derives cheque schedule columns, and offers report/export/chart UI. |

The report uses `moment`, `xlsx`, `jspdf`/`jspdf-autotable`, and ApexCharts. Other property forms use the shared Axios client and React state; the documents page uses multipart `FormData`.

## 4. Backend architecture

### Request path

`Backend/server.js` installs Express JSON/urlencoded parsing, CORS, session middleware, static upload serving, then mounts the property router and other application routers at `/api`. The property router is `Backend/routes/Operations/PropertyManagement/propertyInformation.js`.

The router delegates to controllers in `Backend/controllers/property/`. Those handlers use the `mssql` package and `Backend/config/mssql.js` to connect to SQL Server. Apart from the report query and the tenant-choice query, handlers bind typed request values and call stored procedures. This document intentionally does not reproduce connection credentials or environment-specific secrets.

Property documents are uploaded through Multer (`Backend/utils/uploads.js`) to `Backend/propertyuploads/PropertyDocuments/Company_<CompanyID>/Property_<PropertyID>/<DocumentType>/`; static serving for that directory is configured in `server.js`.

### Property API and SQL object map

All paths below are mounted below `/api`. The table lists the API route, handler/procedure, and what the source establishes about persistence.

| Area | API routes and methods | Controller / SQL operation |
|---|---|---|
| Property information | `POST /insertUpdateProperty`; `GET /getPropertyInfo`; `GET /getPropertyInfoByID`; `DELETE /deletePropertyInfo` | `propertyController`; `WebInsertUpdatePropertyInformation`, `WebGetPropertyInformation`, `WebGetPropertyInformationByID`, `WebDeletePropertyInformation`. Fields include `PropertyName`, code, building/unit/location/classification fields, `CompanyID`, and `UserID`. |
| Property report | `GET /getPropertyReport` | `propertyController`; direct parameterized SQL query, detailed below. |
| Property Master units | `GET /getPropertyMaster`; `GET /getPropertyMasterByID`; `POST /insertUpdatePropertyMaster`; `DELETE /deletePropertyMaster` | `propertyMasterController`; `GetPropertyMaster`, `GetPropertyMasterByID`, `InsertUpdatePropertyMasterData`, `DeletePropertyMaster`. The save handler also accepts tenant, rent amount, cash received, remarks, and `ChequesJson`; the active Property Master form currently sends only flat number/type/remarks. |
| Property Master cheques | `GET /getPropertyMasterCheque`; `POST /insertUpdatePropertyMasterCheque`; `DELETE /deletePropertyMasterCheque` | `propertyMasterController`; `WebGetPropertyMasterCheque`, `WebInsertUpdatePropertyMasterCheque`, `WebDeletePropertyMasterCheque`. The API uses `RentID`, `PropertyID`, and cheque fields such as sequence, amount, and date. |
| Specification | `POST /insertUpdatePropertySpecification`; `GET /getPropertySpecification`; `GET /getPropertySpecificationByID`; `DELETE /deletePropertySpecification` | `propertySpecificationController`; `WebInsertUpdatePropertySpecification`, `WebGetPropertySpecification`, `WebGetPropertySpecificationByID`, `WebDeletePropertySpecification`. |
| Rental | `POST /insertUpdatePropertyRental`; `GET /getPropertyRental`; `GET /getPropertyRentalByID`; `DELETE /deletePropertyRental` | `propertyRentalController`; `WebInsertUpdatePropertyRental`, `WebGetPropertyRental`, `WebGetPropertyRentalByID`, `WebDeletePropertyRental`. Rental inputs include `PropertyID`, `RecordID`, `CompanyID`, tenant name, rent/deposit, payment frequency, lease dates, and `UserID`. |
| Rental availability and tenant choices | `GET /checkFlatAvailability`; `GET /getPropertyRentalTenants` | `checkFlatAvailability` executes `WebCheckFlatAvailability`; `getPropertyRentalTenants` selects matching non-deleted `UserTable` records by company, property, unit, and optional rental ID. |
| Rental transactions | `GET /getRentalTransactions`; `POST /saveRentalTransactions` (multipart); `POST /deleteRentalTransaction` | `propertyTransactionController`; `GetRentalTransactions`, `InsertUpdateRentalTransaction`, `DeleteRentalTransaction`. The upload handler accepts transaction attachment fields named `file_<RowId>`. |
| Ownership | `GET /GetPropertyOwnership`; `GET /GetPropertyOwnershipByID`; `POST /InsertUpdatePropertyOwnership`; `POST /DeletePropertyOwnership` | `propertyOwnershipController`; `GetPropertyOwnership`, `GetPropertyOwnershipByID`, `InsertUpdatePropertyOwnership`, `DeletePropertyOwnership`. |
| Maintenance | `GET /GetPropertyMaintenance`; `GET /GetPropertyMaintenanceByID`; `POST /InsertUpdatePropertyMaintenance`; `POST /DeletePropertyMaintenance` | `propertyMaintenanceController`; `GetPropertyMaintenance`, `GetPropertyMaintenanceByID`, `InsertUpdatePropertyMaintenance`, `DeletePropertyMaintenance`. |
| Amenities | `GET /getPropertyAmenities`; `GET /getPropertyAmenitiesByID`; `POST /insertUpdatePropertyAmenities`; `DELETE /deletePropertyAmenities` | `propertyAmenitiesController`; `GetPropertyAmenities`, `GetPropertyAmenitiesByID`, `InsertUpdatePropertyAmenities`, `DeletePropertyAmenities`. |
| Utilities | `GET /GetPropertyUtilities`; `GET /GetPropertyUtilityByID`; `POST /InsertUpdatePropertyUtilities`; `DELETE /DeletePropertyUtility` | `PropertyUtilities`; `WebGetPropertyUtilities`, `WebGetPropertyUtilityByID`, `WebInsertUpdatePropertyUtilities`. The delete handler currently also calls `WebInsertUpdatePropertyUtilities`; no separate delete procedure is called in that handler. |
| Occupancy | `GET /GetPropertyOccupancy`; `GET /GetPropertyOccupancyByID`; `POST /InsertUpdatePropertyOccupancy`; `DELETE /DeletePropertyOccupancy` | `propertyOccupancyController`; `WebGetPropertyOccupancy`, `WebGetPropertyOccupancyByID`, `WebInsertUpdatePropertyOccupancy`, `WebDeletePropertyOccupancy`. Read responses normalize `TenantUserId`/`UserId` into `UserId`. |
| Documents | `GET /getPropertyDocs`; `POST /uploadPropertyDoc` (Multer single field `file`); `POST /deletePropertyDoc` | `PropertyDocController`; `GetPropertyDocuments`, `InsertUpdatePropertyDocument`, `DeletePropertyDocument`, plus a filesystem write for the uploaded file. |
| Finance | `GET /GetPropertyFinance`; `GET /GetPropertyFinanceByID`; `POST /InsertUpdatePropertyFinance`; `DELETE /DeletePropertyFinance` | `PropertyFinanceController` has empty `try`/`catch` bodies; it does not call SQL or send a response. |

#### Directly visible SQL report tables

`GET /api/getPropertyReport` is the only module handler with a visible table query. It selects from `PropertyInformation p`, left joins `PropertyRental r` on `p.PropertyID = r.PropertyID` and `r.IsDeleted = 0`, and filters the property company and `p.IsDeleted = 0`. The selected fields include property identity/location fields and rental/lease/status fields. Backend code calculates `CashReceived` from the security deposit plus a generated cheque schedule for cheque dates not in the future, and calculates `TotalAmount` as annual rent plus security deposit.

The query explicitly references these columns:

- `PropertyInformation`: `PropertyID`, `PropertyCode`, `PropertyName`, `BuildingName`, `BuildingNumber`, `UnitNumber`, `FloorNumber`, `UnitType`, `PropertyCategory`, `TowerWing`, `BlockNumber`, `CommunityArea`, `City`, `StateEmirate`, `Country`, `PostalCode`, `GPSLocation`, `GoogleMapsLink`, `CompanyID`, and `IsDeleted`.
- `PropertyRental`: `RentalID`, `TenantName`, `RentalStatus`, `MonthlyRent`, `AnnualRent`, `SecurityDeposit`, `NumberOfCheques`, `PaymentFrequency`, `RentIncreasePercentage`, `LeaseStartDate`, `LeaseEndDate`, `RenewalOption`, `GracePeriod`, `LateFeeRules`, `PropertyID`, and `IsDeleted`.

That report join is by `PropertyID`; it does not join `RecordID` in this query. The repository does not show whether the stored procedures use the same schema or different joins.

#### Logical identifiers and database limits

The application passes these identifiers across screens:

- `CompanyID`: tenant/company data scope.
- `PropertyID`: top-level property identifier.
- `RecordID`: Property Master unit/flat identifier.
- `RentalID`: rental row identifier.
- `OwnershipID`, `SpecificationID`, `MaintenanceID`, `AmenityID`, `UtilityID`, `OccupancyID`, and `DocumentID`: subrecord identifiers.
- `UserID`: user/audit/tenant reference, depending on endpoint.

The parameter contracts suggest relationships such as property → units and unit → rental, but foreign-key constraints, table names, indexes, cascading behavior, soft-delete implementation, and stored-procedure transaction rules cannot be verified without the SQL definitions.

## 5. Frontend–backend relationship by screen

| Frontend screen | APIs called by the active component | SQL / persistence connection |
|---|---|---|
| Dashboard | `GET /api/getPropertyReport` | Direct report query over `PropertyInformation` and `PropertyRental`; dashboard figures are calculated in React from the returned rows. |
| Property | `GET /api/getPropertyInfo`, `GET /api/getPropertyInfoByID`, `POST /api/insertUpdateProperty`, `DELETE /api/deletePropertyInfo` | The four property information procedures above. Company and user IDs are read from session storage. |
| Property Master | `GET /api/getPropertyInfo`, `GET /api/getPropertyMaster`, `GET /api/getPropertyMasterByID`, `POST /api/insertUpdatePropertyMaster`, `DELETE /api/deletePropertyMaster` | Unit procedures above. The currently active UI does not call the cheque APIs. |
| Specification | `GET /api/getPropertyInfo`, `GET /api/getPropertyMaster`, `GET /api/getPropertySpecificationByID`, `POST /api/insertUpdatePropertySpecification`, `DELETE /api/deletePropertySpecification` | Specification procedures above. The form's unit selection supplies `RecordID` context. |
| Amenities | `GET /api/getPropertyInfo`, `GET /api/getPropertyAmenities`, `GET /api/getPropertyAmenitiesByID`, `POST /api/insertUpdatePropertyAmenities`, `DELETE /api/deletePropertyAmenities` | Amenity procedures above. |
| Ownership | `GET /api/getPropertyInfo`, `GET /api/getPropertyOwnership`, `GET /api/getPropertyOwnershipByID`, `POST /api/insertUpdatePropertyOwnership`, `DELETE /api/deletePropertyOwnership` | Ownership procedures above. |
| Rental | `GET /api/getPropertyInfo`, `GET /api/getPropertyMaster`, `GET /api/getPropertyRental`, `GET /api/getPropertyRentalByID`, `GET /api/getPropertyRentalTenants`, `POST /api/insertUpdatePropertyRental`, `DELETE /api/deletePropertyRental` | Rental procedures above. UI loads properties and units, lists rentals and matching tenants, then sends the selected unit `RecordID` on save. |
| Documents | `GET /api/getPropertyInfo`, `GET /api/getPropertyDocs`, `POST /api/uploadPropertyDoc` (multipart), `POST /api/deletePropertyDoc` | Document procedures plus local disk storage. Procedure stores/returns metadata; physical file path is generated by Multer. |
| Media | No active backend request | Save currently resolves using a browser timeout and leaves media in component state. The commented example mentions `savePropertyMedia`, but no such backend route is registered. |
| Utilities | `GET /api/getPropertyInfo`, `GET /api/GetPropertyUtilities`, `POST /api/InsertUpdatePropertyUtilities`, `DELETE /api/DeletePropertyUtility` | Utility procedures above. API accepts payment-related fields, but the code does not establish integration with an accounting/payment module. |
| Occupancy | `GET /api/getPropertyInfo`, `GET /api/getPropertyMaster`, `GET /api/GetUsermaster`, `GET /api/GetPropertyOccupancy`, `POST /api/InsertUpdatePropertyOccupancy`, `DELETE /api/DeletePropertyOccupancy` | Occupancy procedures plus `WebGetUserMaster` for tenant/user choices. The backend occupancy handler maps the stored-procedure tenant user ID into a normalized `UserId` field. |
| Maintenance | `GET /api/getPropertyInfo`, `GET /api/getPropertyMaintenance`, `POST /api/insertUpdatePropertyMaintenance`, `DELETE /api/deletePropertyMaintenance` | Maintenance get/save/delete procedures. |
| Financial | No active backend request | Seed records and create/edit/delete updates remain in the page's React state. |
| Report | `GET /api/getPropertyReport` | Same direct SQL report query; report filters, cheque schedule presentation, charts, and exports are frontend behavior. |
| Sidebar Rental Management (`/Userinfo`) | `GET /api/Webgetcompanywisename` (super-admin company picker), `GET /api/GetRoleList`, `GET /api/getPropertyInfo`, `GET /api/GetUsermaster`, `GET /api/getPropertyMaster`, `GET /api/getPropertyRental`, `GET /api/checkFlatAvailability`, `GET /api/getRentalTransactions`, `POST /api/InsertUpdateUser`, `POST /api/Deleteusers`, `POST /api/saveRentalTransactions` (multipart), `POST /api/deleteRentalTransaction`, `POST /api/InsertUpdateRole`, `POST /api/DeleteRole`. | The screen loads tenant/user rows and enriches them with property, unit, and rental data; it saves tenant/user records through `WebInsertUpdateUser` and payment transactions through the rental-transaction procedures. It does not call the property-master cheque APIs or `/insertUpdatePropertyRental`. |

## 6. Current workflows

### Property and unit workflow

1. The user signs in; company and user identifiers are retained in `sessionStorage`.
2. The protected route opens Property Management if `UserId` and `CompanyID` are present.
3. On first opening the Property tab, the browser loads the company property list from `/api/getPropertyInfo`.
4. Creating or editing a property sends property details and audit identifiers to `/api/insertUpdateProperty`; the backend calls `WebInsertUpdatePropertyInformation`. Delete sends the property ID and company/user context to `/api/deletePropertyInfo`.
5. Property Master loads units for the selected property. The active UI creates/edits flat number, type, and remarks, sending the parent `PropertyID` and company/user identifiers to the unit procedure.
6. Specification and other property-level tabs load their relevant records and send the corresponding IDs to their endpoints. Specification also selects a Property Master unit (`RecordID`).

### Rental contract workflow

1. The Rental tab loads properties, then units for the chosen property, and rental rows for the selected property.
2. Creating a rental requires a selected unit. The frontend maps its ID to `RecordID` and offers tenants from `UserTable` matching the selected `CompanyID`, `PropertyID`, and `RecordID`.
3. The frontend sends the selected tenant as `TenantUserID` separately from `UserID`, which remains the logged-in actor/audit ID. `WebInsertUpdatePropertyRental` creates or updates the rental and links its `RentalID` to the selected `UserTable` row in the same SQL transaction. Editing allows changing the unit; only one active `Occupied` rental may use a unit, and saving as `Vacant` releases its tenant link and makes the unit available.
4. Editing first requests `/api/getPropertyRentalByID`; deleting sends the rental and company/property/user identifiers to `/api/deletePropertyRental`.
5. The report/dashboard call `/api/getPropertyReport`, whose report values are derived from property and rental rows. The displayed cheque schedule is calculated from rent, `NumberOfCheques`, and lease start date; it is not a read of bank-cleared payment transactions.

### Combined Rental Management workflow (`/Userinfo`)

1. The combined screen loads tenant/user records and properties, then loads each property's units and rental rows to display property, flat, and rental context together.
2. Creating or editing a tenant/rental entry requires a selected property and unit. The screen checks availability through `/api/checkFlatAvailability` before allowing the create flow.
3. Create and update requests go to `/api/InsertUpdateUser` (`WebInsertUpdateUser`) with tenant fields plus `PropertyID` and `RecordID`. This is a user/tenant save, not a call to `/api/insertUpdatePropertyRental`. Although the UI includes rental-status and lease-date fields, the current `InsertUpdateUser` route does not read or bind those fields; use the Property Management **Rental** tab's dedicated endpoint to persist rental-contract fields.
4. The screen loads payment transactions through `/api/getRentalTransactions`, saves them (including optional uploaded files) through `/api/saveRentalTransactions`, and deletes them through `/api/deleteRentalTransaction`. The UI sends the selected user row's `UserId` as `RentID`; the database procedure's expected ID relationship cannot be verified from this repository and should be confirmed before relying on transaction-to-rental linkage.
5. Deleting a tenant/rental entry uses `/api/Deleteusers`, which calls `webRententdelete`. The Property Master cheque endpoints remain registered but are not called by the active `RentalInfo.jsx` screen.

### Operational subrecord workflow

Amenities, ownership, utilities, occupancy, maintenance, and documents are managed from their respective tabs. They are scoped in request parameters by `CompanyID` and `PropertyID`, and some are additionally scoped by a subrecord ID or unit `RecordID`. Backend handlers return JSON success/data fields or a 400 response for required-identifier failures and 500 responses on database exceptions. The stored procedures determine the actual persistence and soft-delete rules.

## 7. User Master and access control

### User/tenant master

`Backend/routes/Operations/MasterControl/UserInfo.js` exposes user/role endpoints, including `/GetUser`, `/GetUserRole`, `/GetUsermaster`, and `/InsertUpdateUser`. The tenant workflow uses `/GetUsermaster` → `WebGetUserMaster` and `/InsertUpdateUser` → `WebInsertUpdateUser`. The RentalInfo UI can associate a user with `PropertyID` and `RecordID` and displays tenant/user and rental-related details. These records are distinct from the `UserID` used as the current logged-in actor/audit value in many property forms.

The current page wiring is important: `Frontend/PageRouter/Operations/MasterControl/Userinfopage.jsx` imports both `TabUser` and `RentalInfo`, but renders `RentalInfo`; the user information form (`UserInfo.jsx`) is not rendered by that wrapper. The sidebar Rental Management link points to this combined screen. The screen uses user-master records as its tenant records, while the Property Management Rental tab remains a separate property-rental contract editor.

### Permission configuration versus enforcement

The separate User Permission page exposes a matrix of forms/modules and flags: `CanView`, `CanAdd`, `CanEdit`, `CanDelete`, `CanPrint`, `CanExport`, and `CanApprove`. Its APIs are:

- `GET /api/getMenus` → `WebGetMenuAndSubMenus`
- `GET /api/getUserForPermission` → `WebGetUserForPermission`
- `GET /api/getUserPermission` → `WebGetUserPermission`
- `GET /api/checkPermission` → `WebCheckUserPermission`
- `POST /api/saveUserPermission` → transactionally invokes `WebInsertUserPermission` for each distinct `FormID`

The frontend `PermissionProvider` caches returned permissions in `sessionStorage`. In the inspected Property Management pages, no component calls `usePermission` or checks these flags. The only demonstrated permission hook usage is in the worker UserInfo page with form code `WORKERS`. `Sidebar.jsx` restricts some menu items using hard-coded role IDs, including Property Management; this is not a per-user Property Management `CanView` check. The route guard checks login context only, and the property API router has no permission middleware.

Therefore, the current source proves that permission assignments can be configured and queried, but does not prove that those assignments hide Property Management tabs or authorize/deny its API operations.

## 8. Data flow and module relationships

### Identifiers and intended links established by API contracts

```text
CompanyID
  └── PropertyID (property record)
        ├── RecordID (Property Master unit/flat)
        │     ├── RentalID (rental record; request includes PropertyID + RecordID)
        │     ├── User/Tenant association (the tenant surface sends PropertyID + RecordID)
        │     └── Occupancy record (request includes PropertyID + RecordID + tenant fields)
        ├── Specification / Amenities / Ownership / Utilities / Maintenance / Documents
        └── Property report (property information joined to rental rows by PropertyID)
```

This is the relationship indicated by frontend selection and backend parameters, not a verified ERD. No foreign-key definitions are available.

### Owner, tenant, payments, and cheques

- **Owner:** The ownership endpoint accepts `OwnerName`, co-owner details, percentage, purchase and valuation details, mortgage/loan, EMI, insurance, and tax fields. The controller does not pass a separate owner ID; the repository does not establish an Owner master or owner-to-tenant relation.
- **Tenant:** Rental and occupancy records have tenant-name fields. The combined RentalInfo screen uses user-master records and associates them with a property/unit; this is distinct from the dedicated property-rental contract save.
- **Payments:** Rental transaction APIs are present, but the source does not establish integration with an accounting module or bank-cleared payment ledger. Utilities has payment amount/status/date/reference fields, but is not linked to an accounting/payment transaction module. The report's `CashReceived` is calculated, not fetched from the rental-transaction API.
- **Cheques and transactions:** Property Master cheque CRUD endpoints are registered but are not called by the active `/Userinfo` RentalInfo UI. That combined screen uses the rental-transaction endpoints instead. Report cheque rows are generated from the rental's cheque count and lease data rather than loaded transaction records.
- **Documents/media:** Documents have a working upload route and physical filesystem path. Media has no active persistence route and is not connected to the Documents API.
- **Report:** The report uses a property-level join on `PropertyID`, not the unit `RecordID` used by the rental form. It can therefore return multiple rental rows for one property if the database has multiple matching rentals; exact data shape depends on the database/procedure-backed records.

## 9. Architecture diagram

```mermaid
flowchart LR
    U[Authenticated user] --> APP[React App routes]
    APP --> GUARD[Protectorroute: UserId + CompanyID in sessionStorage]
    GUARD --> WRAP[PropertyManagement_Page: Navbar + Sidebar]
    WRAP --> TABS[Property Management tab workspace]
    TABS --> SCREENS[Property, units, rental, ownership, occupancy, utilities, maintenance, documents, reports]
    TABS --> LOCAL[Media and Financial: local/mock UI]
    SIDEBAR[Rental Management link] --> USERPAGE[/Userinfo page wrapper]
    USERPAGE --> RENTALINFO[MasterControl RentalInfo combined tenant + property/unit + transactions UI]

    SCREENS --> AXIOS[Axios apiService]
    RENTALINFO --> AXIOS
    AXIOS --> API[Express server.js /api routes]
    API --> ROUTER[PropertyManagement router]
    API --> USERROUTE[MasterControl UserInfo + UserPermission routes]
    ROUTER --> CTRL[Property controllers]
    USERROUTE --> USERCTRL[User/permission handlers]
    CTRL --> MSSQL[mssql client + config]
    USERCTRL --> MSSQL
    MSSQL --> SP[SQL Server stored procedures]
    MSSQL --> REPORTSQL[Direct report SELECT]
    SP --> DB[(SQL Server database)]
    REPORTSQL --> DB
    CTRL --> FS[Local propertyuploads filesystem]
    FS --> STATIC[Express /propertyuploads static route]
```

## 10. Current implementation status and limitations

### Implemented and connected

- Property CRUD is connected to its Express endpoints and stored procedures.
- Property Master unit listing, detail retrieval, save, and delete are connected.
- Rental listing, detail retrieval, save, and delete are connected; requests carry the company/property/unit/user identifiers.
- Specification, amenities, ownership, occupancy, maintenance, and utilities have backend handlers and stored-procedure calls.
- Documents have backend list/save/delete handlers and file upload to disk; Multer limits files to 25 MiB. The UI requires a file when creating a new document; an edit can update metadata without a new file.
- Dashboard and report fetch the property report endpoint.
- User permission configuration and retrieval endpoints exist, separate from property API authorization.

### Incomplete, mocked, or inconsistent

1. **Financial:** Frontend rows are hard-coded seed examples and create/edit/delete only mutate React state after a timeout. The backend finance handlers are empty and never complete an HTTP response. No functional persistence is present.
2. **Media:** Image previews and media fields exist only in component state. The save operation waits locally; the example API call is commented and there is no registered `savePropertyMedia` backend route.
3. **Property Master field mismatch:** The backend save supports tenant, rental amount, cash received, and cheque JSON, but the active Property Master UI currently sends only unit number/type/remarks. Property Master cheque endpoints are registered but the active RentalInfo screen uses rental-transaction endpoints instead.
4. **Delete HTTP verb mismatch:** Ownership and Maintenance frontend screens send `DELETE` requests, but their Express routes are registered with `POST`. Those UI delete requests do not match the declared route method. The other route/method pairs should be read from the API map above.
5. **Utilities delete procedure:** The delete route exists, but its controller calls `WebInsertUpdatePropertyUtilities`, not a separately named delete procedure. Whether that procedure interprets the request as deletion cannot be confirmed without its SQL definition.
6. **Access enforcement:** Property visibility in the sidebar uses role-ID checks; property tabs and API handlers do not consume the saved per-form permission flags in the inspected source. Login presence is checked, but per-operation permission enforcement is not demonstrated.
7. **Current route naming/wiring:** The sidebar's Rental Management link opens `/Userinfo`, whose wrapper renders the combined `RentalInfo` screen, not the imported `TabUser` component. It is a separate page from `/PropertyManagement` → Rental tab and uses a different create/update endpoint.
8. **Report calculation assumptions:** Report/dashboard derive occupancy and payment summaries from the report result. Cheque schedule/cash received are calculated from rental values and dates rather than reconciled payment/cheque-clearing data.
9. **Database visibility:** Stored-procedure internals and table schemas are absent. Apart from the report query's two tables, exact tables, foreign keys, constraints, and soft-delete/audit behavior are not verifiable from repository files.
10. **Demo data:** The parent Property Management workspace and Financial screen include seed records. Do not treat those entries as database records.

### Validation and error behavior visible in source

- Property pages generally read `CompanyID` and `UserId`/`UserID` from `sessionStorage` and show an error if required context is absent.
- Rental insert/update requires positive `CompanyID`, `PropertyID`, `RecordID`, and `UserID`; the frontend also prevents saving without a selected property/unit and user.
- Ownership requires `CompanyID` and `PropertyID`; amenities additionally require `AmenityCategory` and `AmenityName`; occupancy requires `PropertyID`, `CompanyID`, `RecordID`, and `RecordType`.
- Documents require `CompanyID`, `PropertyID`, and document type; new uploads require a file. Multer enforces a 25 MiB size limit, while no server-side MIME/type allowlist is visible in the upload configuration.
- Most controller failures return JSON with a 400 for missing required values or a 500 on SQL/server errors. Error response details differ by handler. Several screens also apply client-side search and filters that do not alter database queries.

## 11. Source reference index

- Frontend shell, routes, navigation, and access: [App.jsx](./Frontend/src/App.jsx), [main.jsx](./Frontend/src/main.jsx), [Protectorroute.jsx](./Frontend/components/Protectorroute.jsx), [Sidebar.jsx](./Frontend/components/Sidebar.jsx), [permissionContex.jsx](./Frontend/src/context/permissionContex.jsx).
- Main module and screens: [PropertyManagement.jsx](./Frontend/pages/Operations/PropertyManagement/PropertyManagement.jsx) and the sibling screen components in [PropertyManagement/](./Frontend/pages/Operations/PropertyManagement/).
- Separate Rental Management/tenant surface: [Userinfopage.jsx](./Frontend/PageRouter/Operations/MasterControl/Userinfopage.jsx) and [RentalInfo.jsx](./Frontend/pages/Operations/MasterControl/RentalInfo.jsx).
- API client: [apiService.js](./Frontend/pages/apiService.js).
- Express setup and property routes: [server.js](./Backend/server.js), [propertyInformation.js](./Backend/routes/Operations/PropertyManagement/propertyInformation.js).
- Property handlers: [Backend/controllers/property/](./Backend/controllers/property/).
- Upload storage and SQL connection configuration: [uploads.js](./Backend/utils/uploads.js), [mssql.js](./Backend/config/mssql.js).
- User and permission APIs: [UserInfo.js](./Backend/routes/Operations/MasterControl/UserInfo.js), [userPermission.js](./Backend/routes/Operations/UserPermission/userPermission.js).
- Existing workflow notes (not used as proof of SQL schema): [PROPERTY_MODULE_WORKFLOW.md](./PROPERTY_MODULE_WORKFLOW.md).
