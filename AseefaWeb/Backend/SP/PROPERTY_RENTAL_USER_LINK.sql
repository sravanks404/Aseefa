USE [SuitApps_AseefaSoft]
GO

IF COL_LENGTH(N'dbo.UserTable', N'RentalID') IS NULL
BEGIN
    ALTER TABLE dbo.UserTable
        ADD RentalID INT NULL;
END
GO
