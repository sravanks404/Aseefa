# Aseefa rental and property business logic review

**Scope:** Read-only review of `AseefaWeb` rental/property UI and Express backend, plus the parallel `AseefaApp/AseefaApi` implementation. No application files were changed. Stored procedure definitions are absent unless specifically identified below; findings about procedures are limited to SQL scripts present in the repository or are marked for database verification.

## Executive summary

The Property Management Rental tab has a database-side lease-overlap check in the checked-in `WebInsertUpdatePropertyRental` procedure. That protection applies only to writes through that procedure. `/Userinfo` creates/edits tenant records via `InsertUpdateUser`; its availability request is a browser-side preflight, failures clear the result and allow submit, and the server write has no corresponding availability check. It can create multiple tenant rows for a unit. The two screens persist different subsets of the intended model: the tenant screen's lease dates/status are not bound by its active user API route, and tenant property/unit fields can drift from the contract's fields.

The payment screen sends tenant `UserId` as `RentID`, while a lease has a distinct `RentalID`. Transaction list/save pass that value through to stored procedures, so attribution and reporting need a coordinated ID decision and data migration. `WebGetPropertyReport` is called but its SQL body is not tracked, so its reported PropertyID-only join cannot be verified from this checkout; if it joins multiple units/contracts on `PropertyID` alone, rows multiply and unit values can be misattributed. Dashboard counts also come from rental rows rather than the unit master.

## Findings

### 1. Tenant create/update path has no server-side unit double-booking guard

**Severity: High**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/MasterControl/RentalInfo.jsx:574-600, 608-635, 795-837`
- `AseefaWeb/Backend/routes/Operations/MasterControl/UserInfo.js:199-249`
- `AseefaApp/AseefaApi/routes/Operations/MasterControl/UserInfo.js:1-7, 191-227`

**Today:** `/Userinfo` calls `GET /api/checkFlatAvailability` in an effect and blocks create only if the last result says `isOccupied` (front end 581-583). A request failure sets availability to `null` (825-829), which does not block submit. The tenant save calls `POST /api/InsertUpdateUser`; the route passes `PropertyID` and `RecordID` to `WebInsertUpdateUser` but does not call availability validation or check for a conflicting assignment (route 199-249). Edit also skips the availability check in `handleUpdate` (608-635). Multiple tenant rows can be saved against one unit; concurrent submits can also pass the same stale preflight.

The Property Management Rental tab posts to `/api/insertUpdatePropertyRental` (RentalInformation.jsx:1971-1983). Checked-in SQL `AseefaWeb/Backend/SP/WebInsertUpdatePropertyRental_SP:122-198` checks occupied lease date overlap inside a transaction using `UPDLOCK, HOLDLOCK`, so this path is safer for overlapping lease writes. The browser check is advisory; `WebCheckFlatAvailability.sql:49-73` uses `NOLOCK`. The rental tab itself does not call the availability endpoint. The tenant-only write path bypasses the lease procedure entirely.

**Recommended fix:** Keep `PropertyRental` as occupancy authority. Add a server-side tenant assignment service that validates company, property, unit, tenant and linked `RentalID` in one SQL transaction. Apply it to both create and edit; treat browser availability as advisory only. Enforce one active assignment per unit / non-overlapping active lease in the database. Ensure all API implementations use this same service. Verify supporting indexes for the procedure's serializable lock strategy.

**SQL change:** Update `WebInsertUpdateUser` (definition not in repo) or add a dedicated transactional `WebAssignTenantToRental` procedure that rejects conflicting assignments. Preserve and verify overlap protection in the lease procedure; add an appropriate index and unique/current-assignment invariant after deciding whether shared tenants are allowed.

### 2. Tenant deletion, move-out, expiry and unit change are not one lifecycle

**Severity: High**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/MasterControl/RentalInfo.jsx:519-523, 568-570, 639-661`
- `AseefaWeb/Backend/routes/Operations/MasterControl/UserInfo.js:550-580`
- `AseefaApp/AseefaApi/routes/Operations/MasterControl/UserInfo.js:191-227`
- `AseefaWeb/Backend/SP/WebInsertUpdatePropertyRental_SP:167-254`
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Dashboard.jsx:73-105`

**Today:** The tenant UI calls deletion “Delete this rental record” but deletes/soft-deletes a `UserTable` tenant through `/api/Deleteusers`; the web route calls `webRententdelete` (lines 550-580), whose SQL is absent. The route does not visibly close `PropertyRental` or clear occupied status. The AseefaApp route calls a separate `Delete User` procedure and likewise has no visible lease cleanup. The dedicated lease delete is a different endpoint; Web backend wraps it in a transaction and clears `UserTable.RentalID` (propertyRentalController.js:444-526), but `/Userinfo` does not call it.

There is no explicit move-out or room-change workflow. Staff can edit tenant `PropertyID`/`RecordID` (front end 608-635); the user route updates only the user record and does not close the previous lease, create a replacement lease, or transfer payments. By contrast, the checked-in lease procedure clears the tenant's RentalID when a lease is saved as `Vacant` (SQL lines 81-85, 230-254), but the tenant form does not coordinate that operation.

Expiry is not an automatic transition. A lease remains `Occupied`; availability can treat it as free after its end date, while dashboard occupancy counts all `RentalStatus === "Occupied"` rows without considering lease end (Dashboard.jsx:73-90). Future-dated leases also count as occupied immediately in that dashboard.

**Recommended fix:** Implement explicit `moveOut`, `transferUnit`, `terminateLease`, and `renewLease` actions. Close the old lease with an effective date, preserve history, detach it from the current tenant, and create a new lease on transfer; update related user fields and payment associations atomically. Prevent deletion of a tenant with lease/payment history or soft-delete while requiring a deliberate lease closure. Define expiry policy and calculate active occupancy consistently on the server.

**SQL change:** Add lifecycle procedures and enforce their relationships in SQL. Backfill missing/closed links before adding constraints. Add a scheduled expiry transition only if the business requires persisted status changes; otherwise calculate active-as-of-date consistently in availability and reporting.

### 3. Tenant and lease property/unit values can drift

**Severity: High**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/MasterControl/RentalInfo.jsx:543-571`
- `AseefaWeb/Backend/routes/Operations/MasterControl/UserInfo.js:199-249`
- `AseefaWeb/Backend/controllers/property/propertyRentalController.js:7-27, 77-95, 238-276`
- `AseefaWeb/Backend/SP/WebInsertUpdatePropertyRental_SP:89-109, 176-198, 230-254`
- `AseefaApp/AseefaApi/controller/property/propertyRentalController.js:9-37, 68-183`
- `AseefaApp/AseefaApi/routes/Operations/PropertyManagement/propertyInformation.js:553-665`

**Today/source of truth:** Both `UserTable` and `PropertyRental` contain `PropertyID`/`RecordID`. `PropertyRental` and its `RentalID` should be canonical for lease/occupancy; the user row should identify the person and hold a derived/current `RentalID` link. The checked-in lease procedure verifies that the unit matches company/property and validates the chosen tenant's company/property/record (SQL 89-109, 176-198), then links `RentalID` to the user. The tenant API independently accepts and writes user `PropertyID` and `RecordID`; its SQL is absent and no route-level consistency check is visible. A tenant edit can thus change the user unit while the contract still points elsewhere. The UI sends status and lease dates, but the active `InsertUpdateUser` route does not bind them. The AseefaApp rental endpoint does not even accept `RecordID` or `TenantUserID`, although the checked-in SQL contract requires `RecordID`.

**Recommended fix:** Make lease assignment/transfer the only write path for current unit assignment. Link the lease to the tenant (for example, `TenantUserID`), derive current unit from active lease, and atomically update legacy user-side property/unit fields only if other consumers require them. Align or retire the stale AseefaApp route.

**SQL change:** Add company-scoped foreign keys and consistency/uniqueness rules after cleaning existing data. Update `WebInsertUpdateUser` and lease procedures in one transaction; determine if one tenant may have multiple active leases.

### 4. Payments send tenant UserId as `RentID`

**Severity: High**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/MasterControl/RentalInfo.jsx:441-456, 663-710`
- `AseefaWeb/Backend/controllers/property/propertyTransactionController.js:5-24, 67-130, 167-191`
- `AseefaWeb/Backend/utils/rentalTransactionUpload.js` (storage path uses RentID)
- `AseefaWeb/Backend/routes/Operations/PropertyManagement/propertyInformation.js:161-175`
- `AseefaWeb/Backend/controllers/property/propertyController.js:244-280`

**Today:** Frontend sends `RentID: user.UserId` (RentalInfo.jsx:676-680), reloads using `fetchCheques(user.UserId)` (709), and queries transactions with that value (441-456). Backend passes it to `GetRentalTransactions` and `InsertUpdateRentalTransaction` (controller 18-24, 123-130, 167-191); attachment storage also uses RentID. Tenant UserId and lease RentalID are separate identifiers. The lease save returns a RentalID, but tenant payment save does not resolve or send it. Transactions may fail to join by lease or be attributed to the wrong entity. The property report calculates expected cheque schedule values (propertyController.js:267-280), not actual transactions, so “cash received” may not match payments.

The transaction procedure definitions are absent, so their deployed meaning for `RentID` cannot be proven from this repo. Confirm before migrating.

**Recommended fix:** Resolve the tenant's active RentalID and use it for transaction list/save/delete and attachments. Version/rename the API field if possible. Validate that the lease belongs to the same company, property and unit. Migrate legacy rows with a review of ambiguous mappings.

**SQL change:** Update `GetRentalTransactions`, `InsertUpdateRentalTransaction`, and `DeleteRentalTransaction` to use RentalID and scope by company/property/lease. Migrate existing RentID values using validated user-to-lease associations. Update reports to aggregate actual successful payments using approved status/date rules.

### 5. Property report and dashboard can duplicate rows or miscount occupancy

**Severity: High**

**Files:**
- `AseefaWeb/Backend/controllers/property/propertyController.js:244-280`
- `AseefaWeb/Backend/routes/Reports/Reports/propertyreport.js:10-76`
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/PropertyReport.jsx:52-68, 1220-1226`
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Dashboard.jsx:32-41, 73-105`

**Today:** `getPropertyReport` invokes `WebGetPropertyReport`, but that procedure definition is not in the repo. The join therefore cannot be independently verified here. Per the behavior identified for this review, if it joins on PropertyID only, a property with multiple units, leases, tenants or payments fans out into duplicated rows and misattributed totals. PropertyReport keys rows by PropertyID and RentalID/index; index can mask duplicate rows when RentalID is absent. The report API filters by PropertyID only and does not itself enforce a unit-level RecordID relation.

Dashboard consumes those report rows as its unit source, defines units as rows with non-null RentalID, and counts status/name without lease dates (Dashboard.jsx:73-105). Units without rental rows are omitted from the denominator; duplicate rows inflate occupancy and financial totals.

**Recommended fix:** Define the grain: per unit for occupancy, per lease/payment for financial reports. Join leases to units by CompanyID + PropertyID + RecordID, tenant by RentalID/TenantUserID, and transactions by RentalID; pre-aggregate transaction rows before joining. Build dashboard inventory from PropertyMaster and left join the active lease as of a date; count each RecordID once.

**SQL change:** Inspect deployed `WebGetPropertyReport`; update joins/aggregations and include all scope keys. It is absent in this checkout. Verify with fixtures for multi-unit properties, historical leases and multiple payments. Replace dashboard source with an as-of unit occupancy query.

### 6. Dates and duplicate tenant validation are incomplete

**Severity: Medium**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/MasterControl/RentalInfo.jsx:529-540, 543-571, 574-635`
- `AseefaWeb/Backend/routes/Operations/MasterControl/UserInfo.js:199-249`
- `AseefaWeb/Backend/controllers/property/propertyRentalController.js:159-169`
- `AseefaWeb/Backend/SP/WebInsertUpdatePropertyRental_SP:122-198`
- `AseefaWeb/Backend/SP/WebCheckFlatAvailability.sql:20-36, 74-120`

**Today:** Tenant form requires property, unit, first name and mobile and validates email/EID format, but does not compare lease dates, require dates, validate rent/deposit, or detect duplicate phone/ID. The API user route binds none of UI's lease status/dates and has no required-field validation. UI messages are generic (“Please fill all mandatory fields”); API error messages are surfaced as toasts. Availability SQL returns `Available=1` for an unresolved unit (“Flat record not found”, lines 20-36), and the browser can consequently treat an invalid unit as available.

The lease procedure checks date overlap but does not reject `LeaseEndDate < LeaseStartDate`. It uses inclusive overlap comparisons, so a lease starting on the prior lease's end date conflicts. Policy is unspecified. A future lease with no candidate start supplied may be treated as currently occupied because the check uses `LeaseEndDate >= today` when start is null.

**Recommended fix:** Set policy for required/open-ended dates, inclusive/exclusive end, future reservation, and holdover. Validate on UI and SQL. Validate nonnegative amounts and cheque count. Normalize phone/EID and either enforce the approved uniqueness rule or show a duplicate warning for staff review. An unresolved unit must be a validation failure, never available.

**SQL change:** Add start/end validation or a check constraint. Align overlap predicate with chosen boundary and future-reservation policy. Add normalized unique indexes only after the owner decides whether households may share phone/ID values.

### 7. Company/User identity and permissions are client-controlled

**Severity: High**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/MasterControl/RentalInfo.jsx:303-310, 586-592, 617-623, 646-649, 673-680`
- `AseefaWeb/Backend/routes/Operations/MasterControl/UserInfo.js:199-249, 550-580`
- `AseefaWeb/Backend/controllers/property/propertyRentalController.js:31-65, 444-516`
- `AseefaWeb/Backend/controllers/property/propertyTransactionController.js:67-91, 220-237`
- `AseefaWeb/Backend/routes/Reports/Reports/propertyreport.js:10-25`

**Today:** Client reads CompanyID/UserId from sessionStorage and sends CompanyID, CreatedBy/ModifiedBy/DeletedBy, or UserID. Some endpoints check positive values but trust them. Tenant save does not prove the actor may write the selected company/unit; transaction handlers do not prove access to the tenant/lease. Report accepts query CompanyID and falls back to `req.session.CompanyID`; other writes accept request values. Frontend permission gating can be bypassed with direct API calls. No route-level permission middleware is visible on these handlers.

**Recommended fix:** Derive actor and company scope from verified server identity. Authorize every read/write against company and server-side permissions. Bind tenant, lease and transaction IDs to that authorized scope in every query. Keep UI permission gating only for usability.

**SQL change:** Include CompanyID in all update/delete predicates and use company-scoped foreign keys; audit procedures for tenant isolation.

### 8. Ownership delete method mismatch; maintenance has compatibility aliases

**Severity: Medium**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Ownership.jsx:269-296`
- `AseefaWeb/Backend/routes/Operations/PropertyManagement/propertyInformation.js:102-117`
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Maintenance.jsx:406-436, 530-558`

**Today:** Ownership UI sends `DELETE /api/deletePropertyOwnership` (line 278); backend registers only `POST /DeletePropertyOwnership` (route 102-106). Different HTTP verbs mean the handler is not reached. Maintenance UI sends DELETE to lowercase paths and backend provides DELETE aliases (route 114-117), so it works through compatibility routes. Standardize all clients and routes.

**Recommended fix:** Align ownership to one method/path (prefer DELETE), scoped by ID/company/property; remove redundant maintenance aliases after client audit. Return a failure/not-found status when procedure reports no row.

**SQL change:** None for the HTTP mismatch; verify procedures are company-scoped and audited.

### 9. Utilities delete reuses insert/update procedure

**Severity: Low**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Utilities.jsx:423-450`
- `AseefaWeb/Backend/controllers/property/PropertyUtilities.js:247-273, 303-420`
- `AseefaWeb/Backend/routes/Operations/PropertyManagement/propertyInformation.js:123-127`

**Today:** Frontend sends DELETE to `/api/deletePropertyUtility`; route maps it to `deletePropertyUtility`. The controller fills many insert/update parameters with null/empty values and calls `WebInsertUpdatePropertyUtilities` with `Action: "DELETE"`. This works only if the procedure DELETE branch ignores all unrelated values; the handler also returns success without checking the procedure result.

**Recommended fix:** Add a dedicated delete handler/procedure taking UtilityID, CompanyID, PropertyID and actor; inspect result and return an accurate status.

**SQL change:** Add/verify `WebDeletePropertyUtility` with scoped predicate, audit and explicit outcome.

### 10. Financial and Media tabs do not persist

**Severity: Medium**

**Files:**
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Financial .jsx:141-178`
- `AseefaWeb/Backend/controllers/property/PropertyFinanceController.js:4-39`
- `AseefaWeb/Backend/routes/Operations/PropertyManagement/propertyInformation.js:133-145`
- `AseefaWeb/Frontend/pages/Operations/PropertyManagement/Media.jsx:179-218`

**Today:** Financial save/delete wait 400ms and mutate React state; intended API calls remain TODO comments. Backend finance methods have empty try/catch bodies and send no response, despite routes being registered. Media save waits 700ms and sets a success indicator; its `savePropertyMedia` FormData example is commented out, and no matching route/controller exists in either reviewed backend. Success is temporary and records/files disappear on refresh.

**Recommended fix:** Mark these tabs as prototypes and disable save until implemented, or build persistence end-to-end. Finance needs company/property-scoped CRUD and validation. Media needs an approved metadata/file storage model, upload limits, access and delete/update behavior.

**SQL change:** Finance needs schema and list/upsert/delete procedures (not identified). Media metadata needs SQL only if the chosen storage model requires it; media files may use object storage.

### 11. AseefaApp API rental endpoint is stale vs the Web flow

**Severity: Medium**

**Files:**
- `AseefaApp/AseefaApi/routes/Operations/PropertyManagement/propertyInformation.js:553-685, 688-804`
- `AseefaApp/AseefaApi/controller/property/propertyRentalController.js:6-37, 68-183, 357-423`
- `AseefaWeb/Backend/controllers/property/propertyRentalController.js:5-27, 67-95`

**Today:** AseefaApp's active inline `/insertUpdatePropertyRental` route does not extract/pass RecordID or TenantUserID, despite the checked-in Web procedure requiring RecordID. Its old controller variant also omits RecordID. If it calls the same procedure, the parameter contract is incomplete. This API also has no corresponding availability/tenant-link behavior in the shown active route. Procedure failures are returned as HTTP 200 with `success:false`.

**Recommended fix:** Confirm which Express server is deployed for the frontend. Retire the duplicate or bring AseefaApp into parity (RecordID, TenantUserID, availability, transactions, delete/unlink, status codes). Document the authoritative API contract.

**SQL change:** None for API parity; verify both servers against the deployed stored-procedure signature.

## SQL work list (separate from app changes)

1. Inspect deployed `WebInsertUpdateUser`, `webRententdelete` / `Delete User`, transaction procedures, `WebGetPropertyReport`, schema and indexes.
2. Decide canonical lease/tenant relationship and migrate transaction RentID values if the intended key is RentalID.
3. Enforce valid dates, overlap and active tenant assignment transactionally; verify indexed locks under concurrency.
4. Implement explicit move-out/transfer/renewal operations and preserve historical payment links.
5. Repair report joins at the chosen grain; derive occupancy from unit master + active lease as of date.
6. Add company-scoped FKs/constraints and actor/company authorization predicates where practical.
7. Implement finance persistence; add media metadata schema only if required by approved storage design.

## Prioritized fix plan (separate branches)

1. **Guard tenant writes:** Add server-side company/unit/tenant validation and conflict rejection for tenant create and edit; do not rely on browser preflight.
2. **Canonical lease assignment:** Make RentalID the current lease link and serialize assignment/transfer through one transactional service; sync legacy user fields only if retained.
3. **Payment ID contract:** Confirm RentID meaning, then update list/save/delete and attachment paths to lease RentalID with reviewed data migration.
4. **Lease lifecycle:** Add move-out, transfer, expiry and renewal; prevent tenant deletion from orphaning active lease/payment history.
5. **Validation policy:** Decide date boundary/future reservation and duplicate phone/ID rules; implement in UI and database.
6. **Report grain and occupancy:** Fix SQL joins/aggregation and dashboard source; count each RecordID once.
7. **Server authorization:** Derive actor/company from verified identity and enforce permissions/scope on rental and property actions.
8. **Delete API consistency:** Fix ownership method/path; replace utilities upsert-as-delete; remove maintenance aliases after client audit.
9. **API consolidation:** Confirm deployed server and bring AseefaApp/AseefaApi into parity or retire it.
10. **Persistence completion:** Implement finance/media storage or mark those screens read-only/prototype.
11. **SQL source control:** Add missing procedure/schema definitions and fixtures for assignment, payments, expiry, deletes and report grain.

## Product-owner questions

1. Is `PropertyRental.RentalID` canonical, and should payment `RentID` refer to it? What mapping can be trusted for existing transactions?
2. Can a lease have multiple tenants, or a tenant multiple simultaneous leases? Who is primary if multiple tenants share a unit?
3. Should future leases reserve units immediately? Are end dates inclusive, and can a new lease start on the prior lease's end date?
4. Should expiry automatically make a unit vacant, or must staff complete move-out? How are renewals and holdovers represented?
5. Does a room change close the old lease and create a new one while retaining payments against the original terms?
6. Can staff delete tenants with lease/payment history, or only deactivate them?
7. Are phone numbers or Emirates IDs unique per company? Can family members share a phone?
8. What does occupied mean for reserved, blocked, maintenance, and partially available multi-bed units?
9. Should report rows represent units, leases, or payments? Should CashReceived mean actual collections or scheduled cheques?
10. Which server is deployed behind the frontend: `AseefaWeb/Backend` or `AseefaApp/AseefaApi`? Can the duplicate implementation be retired?
11. What persistence and retention model should Finance and Media use?
