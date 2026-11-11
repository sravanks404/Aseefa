/*
Recommended database change only; this file is documentation and is not deployed.

Integrate the checks below into dbo.WebInsertUpdateUser so the checks and that
procedure's existing INSERT/UPDATE commit or roll back together. Do not run the
checks in a separate transaction that commits before the user write.

Expected inputs (adapt names/types to the deployed procedure):
  @CompanyID, @PropertyID, @RecordID, @UserId, @RentalID,
  @LeaseStartDate, @LeaseEndDate

@RentalID is the current lease being edited (0/null for new). For tenants with
no supplied start date, today is used as the candidate start; a missing end date
is treated as a one-day check at that start. Align that fallback with the
product's future-reservation/open-ended lease policy before deployment.
*/

-- Supporting indexes. Check existing indexes and duplicate data first; avoid
-- creating duplicates of equivalent indexes. IsDeleted is included as a key
-- filter for serializable range checks on the unit's active lease/tenant rows.
CREATE NONCLUSTERED INDEX IX_PropertyRental_Unit_LeaseConflict
ON dbo.PropertyRental
(
    CompanyID,
    PropertyID,
    RecordID,
    IsDeleted,
    RentalStatus,
    LeaseStartDate,
    LeaseEndDate
)
INCLUDE (RentalID);
GO

CREATE NONCLUSTERED INDEX IX_UserTable_Unit_ActiveTenant
ON dbo.UserTable
(
    CompanyID,
    PropertyID,
    RecordID,
    IsDeleted,
    UserId
)
INCLUDE (RentalID);
GO

/*
Template to place inside dbo.WebInsertUpdateUser, after input validation and
before the existing UserTable INSERT/UPDATE. Keep the original DML inside this
same transaction. If the procedure already owns a transaction, incorporate this
fragment into that transaction rather than nesting an independent commit.
*/
SET XACT_ABORT ON;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @CandidateStart DATE = COALESCE(@LeaseStartDate, CAST(GETDATE() AS DATE));
    DECLARE @CandidateEnd DATE = COALESCE(@LeaseEndDate, @CandidateStart);

    -- Reject another occupied, non-deleted lease for this unit whose date
    -- interval overlaps the candidate interval. Keep the current lease on edit.
    IF EXISTS
    (
        SELECT 1
        FROM dbo.PropertyRental AS pr WITH (UPDLOCK, HOLDLOCK)
        WHERE pr.CompanyID = @CompanyID
          AND pr.PropertyID = @PropertyID
          AND pr.RecordID = @RecordID
          AND pr.IsDeleted = 0
          AND LOWER(LTRIM(RTRIM(pr.RentalStatus))) = 'occupied'
          AND (ISNULL(@RentalID, 0) <= 0 OR pr.RentalID <> @RentalID)
          AND (pr.LeaseStartDate IS NULL OR pr.LeaseStartDate <= @CandidateEnd)
          AND (pr.LeaseEndDate IS NULL OR pr.LeaseEndDate >= @CandidateStart)
    )
    BEGIN
        THROW 51001, 'An active lease already exists for this unit during the selected dates.', 1;
    END;

    -- Reject a different non-deleted tenant already assigned to the unit.
    -- Exclude both the edited user and their current lease association.
    IF EXISTS
    (
        SELECT 1
        FROM dbo.UserTable AS u WITH (UPDLOCK, HOLDLOCK)
        WHERE u.CompanyID = @CompanyID
          AND u.PropertyID = @PropertyID
          AND u.RecordID = @RecordID
          AND u.IsDeleted = 0
          AND u.UserId <> ISNULL(@UserId, 0)
          AND (ISNULL(@RentalID, 0) <= 0 OR u.RentalID IS NULL OR u.RentalID <> @RentalID)
    )
    BEGIN
        THROW 51002, 'Another non-deleted tenant is already assigned to this unit.', 1;
    END;

    -- Existing WebInsertUpdateUser INSERT/UPDATE DML goes here, unchanged.

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

/*
If WebInsertUpdateUser does not currently accept RentalID and lease dates,
decide whether to add those parameters before deploying. The API route currently
uses these request values for its pre-check; database-side validation must use
the same candidate interval and current-lease exclusions to prevent a TOCTOU
race. Adapt error handling so the API maps 51001/51002 to HTTP 409.
*/

/*
Tenant save -> lease save atomicity (implemented in the Express route):

The route begins an outer SERIALIZABLE transaction, runs WebInsertUpdateUser,
uses its returned UserId as TenantUserID, then calls
WebInsertUpdatePropertyRental with the same transaction request. On success the
lease procedure's nested BEGIN/COMMIT only decrements @@TRANCOUNT; the route
commits the outer transaction after it receives Success=1 and a RentalID.

On lease validation/overlap failure the existing WebInsertUpdatePropertyRental
procedure may ROLLBACK the entire ambient transaction (@@TRANCOUNT becomes 0)
and return Success=0. The route must check that result, return its Message (409
for conflicts, 400 for other validation failures), and never commit. For failure
paths that leave the outer transaction open, the route rolls it back. No
compensating delete is used because both stored procedure calls share one SQL
transaction. If the deployed WebInsertUpdateUser procedure explicitly commits a
top-level transaction or uses a separate connection, this guarantee does not
hold; refactor it to participate in the caller's transaction before deployment.

Occupied status requires a LeaseStartDate in both API and UI validation. The
route calls the lease procedure with the tenant's saved UserId, current RentalID
(or 0), PropertyID/RecordID, tenant name, status, monthly rent, optional end
date, and the logged-in UserID; other contract values are passed as NULL because
they are not present on the tenant form. Confirm whether the annual amount
should be derived from monthly rent (current route behavior) or captured
separately before treating that value as accounting data.
*/
