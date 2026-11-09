CREATE OR ALTER PROCEDURE [dbo].[WebCheckFlatAvailability]
(
    @CompanyID INT,
    @PropertyID INT,
    @RecordID INT = NULL,
    @FlatNo NVARCHAR(50) = NULL,
    @RentalID INT = 0,
    @UserId INT = 0,
    @LeaseStartDate DATE = NULL,
    @LeaseEndDate DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Resolve RecordID from FlatNo if not provided
    IF (@RecordID IS NULL OR @RecordID <= 0) AND @FlatNo IS NOT NULL AND RTRIM(LTRIM(@FlatNo)) <> ''
    BEGIN
        SELECT TOP 1 @RecordID = RecordID
        FROM dbo.PropertyMaster
        WHERE CompanyID = @CompanyID
          AND PropertyID = @PropertyID
          AND FlatNo = RTRIM(LTRIM(@FlatNo))
          AND IsActive = 1;
    END;

    IF @RecordID IS NULL OR @RecordID <= 0
    BEGIN
        SELECT 
            1 AS Available, 
            0 AS IsOccupied, 
            'Flat record not found' AS Message, 
            NULL AS CurrentTenant, 
            NULL AS LeaseEndDate, 
            NULL AS PreviousTenant, 
            NULL AS PreviousStatus;
        RETURN;
    END;

    -- Check active overlapping occupancy
    DECLARE @OccupiedRentalID INT = NULL;
    DECLARE @CurrentTenant NVARCHAR(200) = NULL;
    DECLARE @OccupiedEndDate DATE = NULL;

    SELECT TOP 1 
        @OccupiedRentalID = pr.RentalID,
        @CurrentTenant = ISNULL(NULLIF(RTRIM(LTRIM(pr.TenantName)), ''), u.Name),
        @OccupiedEndDate = pr.LeaseEndDate
    FROM dbo.PropertyRental pr WITH (NOLOCK)
    LEFT JOIN dbo.UserTable u WITH (NOLOCK) ON (
        (u.RentalID = pr.RentalID OR (u.RecordID = pr.RecordID AND u.PropertyID = pr.PropertyID))
        AND u.IsDeleted = 0
    )
    WHERE pr.CompanyID = @CompanyID
      AND pr.PropertyID = @PropertyID
      AND pr.RecordID = @RecordID
      AND pr.IsDeleted = 0
      AND pr.RentalID <> @RentalID
      AND LOWER(RTRIM(LTRIM(pr.RentalStatus))) = 'occupied'
      AND (
          pr.LeaseEndDate IS NULL
          OR (@LeaseStartDate IS NULL AND pr.LeaseEndDate >= CAST(GETDATE() AS DATE))
          OR (
              @LeaseStartDate IS NOT NULL
              AND (pr.LeaseEndDate IS NULL OR @LeaseStartDate <= pr.LeaseEndDate)
              AND (@LeaseEndDate IS NULL OR pr.LeaseStartDate IS NULL OR @LeaseEndDate >= pr.LeaseStartDate)
          )
      )
      AND NOT EXISTS (
          SELECT 1 FROM dbo.UserTable cur WITH (NOLOCK)
          WHERE cur.UserId = @UserId AND @UserId > 0 AND cur.RentalID = pr.RentalID
      );

    IF @OccupiedRentalID IS NOT NULL
    BEGIN
        SELECT 
            0 AS Available,
            1 AS IsOccupied,
            ' This flat is currently occupied. Please select another available flat or complete the previous rental first.' AS Message,
            @CurrentTenant AS CurrentTenant,
            @OccupiedEndDate AS LeaseEndDate,
            NULL AS PreviousTenant,
            NULL AS PreviousStatus;
        RETURN;
    END;

    -- Check previous tenant for history
    DECLARE @PrevTenant NVARCHAR(200) = NULL;
    DECLARE @PrevStatus NVARCHAR(50) = NULL;

    SELECT TOP 1
        @PrevTenant = ISNULL(NULLIF(RTRIM(LTRIM(pr.TenantName)), ''), u.Name),
        @PrevStatus = pr.RentalStatus
    FROM dbo.PropertyRental pr WITH (NOLOCK)
    LEFT JOIN dbo.UserTable u WITH (NOLOCK) ON (
        (u.RentalID = pr.RentalID OR (u.RecordID = pr.RecordID AND u.PropertyID = pr.PropertyID))
        AND u.IsDeleted = 0
    )
    WHERE pr.CompanyID = @CompanyID
      AND pr.PropertyID = @PropertyID
      AND pr.RecordID = @RecordID
      AND pr.IsDeleted = 0
      AND LOWER(RTRIM(LTRIM(pr.RentalStatus))) IN ('vacated', 'completed', 'terminated', 'vacant')
    ORDER BY ISNULL(pr.ModifiedDate, pr.CreatedDate) DESC;

    SELECT 
        1 AS Available,
        0 AS IsOccupied,
        ' Flat is available for new rental.' AS Message,
        NULL AS CurrentTenant,
        NULL AS LeaseEndDate,
        @PrevTenant AS PreviousTenant,
        @PrevStatus AS PreviousStatus;
END;

