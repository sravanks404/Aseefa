const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');



router.get('/GetUserRole', async (req, res) => {
  const CompanyID = req.query.CompanyID;

  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }
  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('WebGetUserRole');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.get('/GetUser', async (req, res) => {
  const CompanyID = req.query.CompanyID;

  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }
  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('WebGetUser');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});


router.post('/updateUserDetails', async (req, res) => {
  const {
    CompanyID,
    UserId,
    Kmallowance,
    Dayallowance,
    BranchId,
    UserRoleId,
    ZoneId,
    AllocatedUser   // 👈 NEW (comma-separated string)
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = new sql.Request(pool);

    request.input('CompanyID', sql.Int, CompanyID);
    request.input('UserId', sql.Int, UserId);
    request.input('Kmallowance', sql.Money, Kmallowance);
    request.input('Dayallowance', sql.Money, Dayallowance);
    request.input('BranchId', sql.Int, BranchId);
    request.input('UserRoleId', sql.Int, UserRoleId);
    request.input('ZoneId', sql.Int, ZoneId);
    request.input('AllocatedUser', sql.VarChar(sql.MAX), AllocatedUser); // 👈 ADD THIS

    await request.execute('dbo.webUpdateUserAllowance');

    res.status(200).json({
      success: true,
      message: 'User allowance updated successfully'
    });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.get('/getZone', async (req, res) => {
  const CompanyID = req.query.CompanyID;

  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('WebGetZoneMaster');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

// router.post('/InsertUpdateUser', async (req, res) => {
//   const {
//     UserId = 0, Name, MName, LName, Sex, Address, Place, District, Mobile, Email,
//     UserName, Password, ConformPassword, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
//     CompanyID, BranchID, UserRoleId, image, BadgeNo, EIDNo, EIDExpiryDate, PPNo, PPExpiryDate,
//     VisaNo, VisaExpiryDate, InsuranceNo, InsuranceExpiryDate, GatePassNo, GatePassExpiryDate,
//     WorkmenCompNo, WorkmenCompExpiryDate, ProfLicenseNo, ProfLicenseExpiryDate, Country,
//     SupplierID, EmployeeCategoryID, ClientTrade, WorkerRate, SubSponsorID, IsHavenWorker
//   } = req.body;
//   // NOTE: resume/ppDocument/.../professionalLicenseDocument are no longer read here.

//   try {
//     const pool = await sql.connect(dbConfig);
//     const request = pool.request();

//     let imageBuffer = null;
//     if (typeof image === 'string' && image.includes('base64,')) {
//       imageBuffer = Buffer.from(image.split('base64,')[1], 'base64');
//     }

//     request.output('UserId', sql.Int, UserId);
//     request.input('Name', sql.VarChar(sql.MAX), Name);
//     request.input('MName', sql.VarChar(sql.MAX), MName);
//     request.input('LName', sql.VarChar(sql.MAX), LName);
//     request.input('Sex', sql.Int, Sex !== undefined ? parseInt(Sex) : null);
//     request.input('Address', sql.VarChar(sql.MAX), Address);
//     request.input('Place', sql.VarChar(sql.MAX), Place);
//     request.input('District', sql.VarChar(sql.MAX), District);
//     request.input('Mobile', sql.VarChar(sql.MAX), Mobile);
//     request.input('Email', sql.VarChar(sql.MAX), Email);
//     request.input('UserName', sql.VarChar(sql.MAX), UserName);
//     request.input('Password', sql.VarChar(sql.MAX), Password);
//     request.input('ConformPassword', sql.VarChar(sql.MAX), ConformPassword);
//     request.input('CreatedBy', sql.VarChar(sql.MAX), CreatedBy || null);
//     request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
//     request.input('ModifiedBy', sql.VarChar(sql.MAX), ModifiedBy || null);
//     request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
//     request.input('CompanyID', sql.Int, CompanyID || 0);
//     request.input('BranchId', sql.Int, BranchID || 0);
//     request.input('UserRoleId', sql.Int, UserRoleId || 0);
//     request.input('image', sql.VarBinary(sql.MAX), imageBuffer || null);
//     request.input('WorkerRate', sql.Decimal(10, 2),
//       WorkerRate !== undefined && WorkerRate !== null && WorkerRate !== '' ? parseFloat(WorkerRate) : null);
//     request.input('IsHavenWorker', sql.Bit, IsHavenWorker ? 1 : 0);

//     request.input('BadgeNo', sql.VarChar(100), BadgeNo || null);
//     request.input('EIDNo', sql.VarChar(100), EIDNo || null);
//     request.input('EIDExpiryDate', sql.Date, EIDExpiryDate ? new Date(EIDExpiryDate) : null);
//     request.input('PPNo', sql.VarChar(100), PPNo || null);
//     request.input('PPExpiryDate', sql.Date, PPExpiryDate ? new Date(PPExpiryDate) : null);
//     request.input('VisaNo', sql.VarChar(100), VisaNo || null);
//     request.input('VisaExpiryDate', sql.Date, VisaExpiryDate ? new Date(VisaExpiryDate) : null);
//     request.input('InsuranceNo', sql.VarChar(100), InsuranceNo || null);
//     request.input('InsuranceExpiryDate', sql.Date, InsuranceExpiryDate ? new Date(InsuranceExpiryDate) : null);
//     request.input('GatePassNo', sql.VarChar(100), GatePassNo || null);
//     request.input('GatePassExpiryDate', sql.Date, GatePassExpiryDate ? new Date(GatePassExpiryDate) : null);
//     request.input('WorkmenCompNo', sql.VarChar(100), WorkmenCompNo || null);
//     request.input('WorkmenCompExpiryDate', sql.Date, WorkmenCompExpiryDate ? new Date(WorkmenCompExpiryDate) : null);
//     request.input('ProfLicenseNo', sql.VarChar(100), ProfLicenseNo || null);
//     request.input('ProfLicenseExpiryDate', sql.Date, ProfLicenseExpiryDate ? new Date(ProfLicenseExpiryDate) : null);
//     request.input('Country', sql.VarChar(100), Country || null);
//     request.input('SupplierID', sql.Int, SupplierID ? parseInt(SupplierID) : null);
//     request.input('EmployeeCategoryID', sql.Int, EmployeeCategoryID ? parseInt(EmployeeCategoryID) : null);
//     request.input('ClientTrade', sql.VarChar(100), ClientTrade || null);
//     request.input('SubSponsorID', sql.VarChar(sql.MAX), SubSponsorID || null);

//     // ── All *FileName / *Files (base64) inputs REMOVED — pass NULL so the SP
//     //    doesn't clobber existing UserDocuments-based paths. If your SP has
//     //    these as required params, keep the input() calls but always pass null:
//     const nullFileInputs = [
//       'ResumeFileName','PPDocumentFileName','EduCertFileName','VisaDocFileName','EIDDocFileName',
//       'ExperienceDocFileName','OtherDocFileName','InsuranceFileName','GatePassFileName',
//       'WorkmenCompFileName','ProfLiceFileName'
//     ];
//     nullFileInputs.forEach(name => request.input(name, sql.VarChar(255), null));
//     const nullFilesJsonInputs = [
//       'ResumeFiles','PPDocumentFiles','EduCertFiles','VisaDocFiles','EIDDocFiles',
//       'ExperienceDocFiles','OtherDocFiles','InsuranceFiles','GatePassFiles',
//       'WorkmenCompFiles','ProfLiceFiles'
//     ];
//     nullFilesJsonInputs.forEach(name => request.input(name, sql.NVarChar(sql.MAX), null));

//     const result = await request.execute('WebInsertUpdateUser');
//     res.status(200).json({ success: true, UserId: result.output.UserId });
//   } catch (err) {
//     console.error('InsertUpdateUser SQL error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });
// router.post('/InsertUpdateUser', async (req, res) => {
//   const {
//     UserId = 0, RecordID, PropertyID,
//     Name, MName, LName, EIDNo, EIDExpiryDate, Email, Mobile, Sex, UserRoleId,
//     BadgeNo, WorkerRate, PaymentMode, image,
//     CompanyID, BranchID,
//     CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
//     RentalID = 0, LeaseStartDate, LeaseEndDate, RentalStatus = 'Occupied',
//     RentalAmount, MonthlyRent, UserID,
//   } = req.body;

//   let assignmentTransaction;
//   try {
//     const pool = await sql.connect(dbConfig);
//     const hasUnitAssignment = Boolean(PropertyID && RecordID);
//     const actorUserID = parseInt(UserID || ModifiedBy || CreatedBy, 10);

//     if (hasUnitAssignment && String(RentalStatus).trim().toLowerCase() === 'occupied' && !LeaseStartDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Lease start date is required when rental status is Occupied.',
//       });
//     }

//     if (hasUnitAssignment && (!Number.isInteger(actorUserID) || actorUserID <= 0)) {
//       return res.status(400).json({
//         success: false,
//         message: 'UserID is required to save the lease.',
//       });
//     }

//     // Tenant assignment and the user write share one serializable transaction so
//     // simultaneous requests cannot both pass the unit availability check.
//     if (hasUnitAssignment) {
//       if (!CompanyID) {
//         return res.status(400).json({
//           success: false,
//           message: 'CompanyID is required when assigning a tenant to a unit',
//         });
//       }

//       assignmentTransaction = new sql.Transaction(pool);
//       await assignmentTransaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

//       const conflictResult = await assignmentTransaction.request()
//         .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
//         .input('PropertyID', sql.Int, parseInt(PropertyID, 10))
//         .input('RecordID', sql.Int, parseInt(RecordID, 10))
//         .input('UserId', sql.Int, parseInt(UserId, 10) || 0)
//         .input('RentalID', sql.Int, parseInt(RentalID, 10) || 0)
//         .input('LeaseStartDate', sql.Date, LeaseStartDate || null)
//         .input('LeaseEndDate', sql.Date, LeaseEndDate || null)
//         .query(`
//           DECLARE @CandidateStart DATE = COALESCE(@LeaseStartDate, CAST(GETDATE() AS DATE));
//           DECLARE @CandidateEnd DATE = COALESCE(@LeaseEndDate, @CandidateStart);

//           IF EXISTS (
//             SELECT 1
//             FROM dbo.PropertyRental AS pr WITH (UPDLOCK, HOLDLOCK)
//             WHERE pr.CompanyID = @CompanyID
//               AND pr.PropertyID = @PropertyID
//               AND pr.RecordID = @RecordID
//               AND pr.IsDeleted = 0
//               AND LOWER(LTRIM(RTRIM(pr.RentalStatus))) = 'occupied'
//               AND (@RentalID <= 0 OR pr.RentalID <> @RentalID)
//               AND (pr.LeaseStartDate IS NULL OR pr.LeaseStartDate <= @CandidateEnd)
//               AND (pr.LeaseEndDate IS NULL OR pr.LeaseEndDate >= @CandidateStart)
//           )
//             SELECT 'LEASE' AS ConflictType;
//           ELSE IF EXISTS (
//             SELECT 1
//             FROM dbo.UserTable AS u WITH (UPDLOCK, HOLDLOCK)
//             WHERE u.CompanyID = @CompanyID
//               AND u.PropertyID = @PropertyID
//               AND u.RecordID = @RecordID
//               AND u.IsDeleted = 0
//               AND u.UserId <> @UserId
//               AND (@RentalID <= 0 OR u.RentalID IS NULL OR u.RentalID <> @RentalID)
//           )
//             SELECT 'TENANT' AS ConflictType;
//         `);

//       const conflictType = conflictResult.recordset?.[0]?.ConflictType;
//       if (conflictType) {
//         await assignmentTransaction.rollback();
//         assignmentTransaction = null;
//         return res.status(409).json({
//           success: false,
//           message: conflictType === 'LEASE'
//             ? 'An active lease already exists for this unit during the selected dates.'
//             : 'Another non-deleted tenant is already assigned to this unit.',
//         });
//       }
//     }

//     const request = assignmentTransaction
//       ? assignmentTransaction.request()
//       : pool.request();

//     let imageBuffer = null;
//     if (typeof image === 'string' && image.includes('base64,')) {
//       imageBuffer = Buffer.from(image.split('base64,')[1], 'base64');
//     }

//     request.output('UserId', sql.Int, UserId ? parseInt(UserId) : 0);
//     request.input('RecordID', sql.Int, RecordID ? parseInt(RecordID) : null);
//     request.input('PropertyID', sql.Int, PropertyID ? parseInt(PropertyID) : null);

//     request.input('Name', sql.VarChar(50), Name);
//     request.input('MName', sql.VarChar(50), MName || null);
//     request.input('LName', sql.VarChar(50), LName || null);
//     request.input('EIDNo', sql.VarChar(50), EIDNo || null);
//     request.input('EIDExpiryDate', sql.Date, EIDExpiryDate ? new Date(EIDExpiryDate) : null);
//     request.input('Email', sql.VarChar(50), Email || null);
//     request.input('Mobile', sql.VarChar(50), Mobile);
//     request.input('Sex', sql.Int, Sex !== undefined && Sex !== '' ? parseInt(Sex) : null);
//     request.input('UserRoleId', sql.Int, UserRoleId ? parseInt(UserRoleId) : null);
//     request.input('BadgeNo', sql.VarChar(50), BadgeNo || null);
//     request.input('WorkerRate', sql.Decimal(10, 2),
//       WorkerRate !== undefined && WorkerRate !== null && WorkerRate !== '' ? parseFloat(WorkerRate) : null);
//     request.input('PaymentMode', sql.VarChar(100),
//       typeof PaymentMode === 'string' && PaymentMode.trim() ? PaymentMode.trim() : null);
//     request.input('image', sql.VarBinary(sql.MAX), imageBuffer || null);

//     request.input('CompanyID', sql.Int, CompanyID ? parseInt(CompanyID) : 0);
//     request.input('BranchId', sql.Int, BranchID ? parseInt(BranchID) : null);
//     request.input('CreatedBy', sql.Int, CreatedBy ? parseInt(CreatedBy) : null);
//     request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
//     request.input('ModifiedBy', sql.Int, ModifiedBy ? parseInt(ModifiedBy) : null);
//     request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());

//     const result = await request.execute('WebInsertUpdateUser');
//     const savedUserID = Number(result.output?.UserId) || Number(UserId) || 0;

//     if (assignmentTransaction) {
//       if (!Number.isInteger(savedUserID) || savedUserID <= 0) {
//         await assignmentTransaction.rollback();
//         assignmentTransaction = null;
//         return res.status(400).json({
//           success: false,
//           message: 'Tenant save did not return a valid UserId; lease was not saved.',
//         });
//       }

//       const monthlyRentValue = MonthlyRent !== undefined ? MonthlyRent : RentalAmount;
//       const monthlyRentAmount = monthlyRentValue === '' || monthlyRentValue == null
//         ? null
//         : Number(monthlyRentValue);
//       const tenantName = [Name, MName, LName].filter((part) => String(part || '').trim()).join(' ').trim();

//       const leaseResult = await assignmentTransaction.request()
//         .input('RentalID', sql.Int, Number(RentalID) || 0)
//         .input('RecordID', sql.Int, parseInt(RecordID, 10))
//         .input('CompanyID', sql.Int, parseInt(CompanyID, 10))
//         .input('PropertyID', sql.Int, parseInt(PropertyID, 10))
//         .input('TenantName', sql.NVarChar(200), tenantName || null)
//         .input('RentalStatus', sql.NVarChar(50), RentalStatus || 'Occupied')
//         .input('MonthlyRent', sql.Decimal(18, 2), monthlyRentAmount)
//         .input('AnnualRent', sql.Decimal(18, 2), monthlyRentAmount == null ? null : monthlyRentAmount * 12)
//         .input('SecurityDeposit', sql.Decimal(18, 2), null)
//         .input('NumberOfCheques', sql.Int, null)
//         .input('PaymentFrequency', sql.NVarChar(50), null)
//         .input('RentIncreasePercentage', sql.Decimal(5, 2), null)
//         .input('LeaseStartDate', sql.Date, LeaseStartDate || null)
//         .input('LeaseEndDate', sql.Date, LeaseEndDate || null)
//         .input('RenewalOption', sql.NVarChar(100), null)
//         .input('GracePeriod', sql.Int, null)
//         .input('LateFeeRules', sql.NVarChar(sql.MAX), null)
//         .input('TenantUserID', sql.Int, savedUserID)
//         .input('UserID', sql.Int, actorUserID)
//         .execute('WebInsertUpdatePropertyRental');

//       const leaseData = leaseResult.recordset?.[0];
//       const savedRentalID = Number(leaseData?.RentalID) || 0;
//       if (leaseData?.Success !== 1 || savedRentalID <= 0) {
//         const message = leaseData?.Message || 'Lease could not be saved.';
//         const isConflict = /occupied|overlap|already exists|another tenant/i.test(message);
//         try {
//           // The lease procedure rolls back its full transaction on some
//           // validation failures; rollback may therefore report no active tx.
//           await assignmentTransaction.rollback();
//         } catch (rollbackError) {
//           console.error('InsertUpdateUser lease rollback note:', rollbackError.message);
//         }
//         assignmentTransaction = null;
//         return res.status(isConflict ? 409 : 400).json({
//           success: false,
//           message,
//         });
//       }

//       await assignmentTransaction.commit();
//       assignmentTransaction = null;
//       return res.status(200).json({
//         success: true,
//         UserId: savedUserID,
//         RentalID: savedRentalID,
//       });
//     }

//     res.status(200).json({ success: true, UserId: savedUserID });
//   } catch (err) {
//     if (assignmentTransaction) {
//       try {
//         await assignmentTransaction.rollback();
//       } catch (rollbackError) {
//         console.error('InsertUpdateUser transaction rollback error:', rollbackError);
//       }
//     }
//     console.error('InsertUpdateUser SQL error:', err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

router.post('/InsertUpdateUser', async (req, res) => {
  const {
    UserId = 0, RecordID, PropertyID,
    Name, MName, LName, EIDNo, EIDExpiryDate, Email, Mobile, Sex, UserRoleId,
    BadgeNo, WorkerRate, PaymentMode, image,
    CompanyID, BranchID,
    CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
    RentalStatus, MonthlyRent, RentalAmount, LeaseStartDate, LeaseEndDate,
  } = req.body;
  let RentalID = parseInt(req.body.RentalID, 10) || 0;

  const toInt = (v) => parseInt(v, 10) || 0;
  const toDate = (v) => (v ? new Date(v) : null);
  const firstAmount = (...values) =>
    values.find((value) => value !== undefined && value !== null && value !== '');
  const parseAmount = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : NaN;
  };
  const userRate = parseAmount(firstAmount(RentalAmount, WorkerRate, MonthlyRent));
  const rentAmount = parseAmount(firstAmount(MonthlyRent, RentalAmount, WorkerRate));
  const hasUnit = !!(PropertyID && RecordID);
  const status = String(RentalStatus || 'Occupied').trim();
  const isOccupied = status.toLowerCase() === 'occupied';

  let tx;
  const fail = async (code, message) => {
    if (tx) { try { await tx.rollback(); } catch (_) {} tx = null; }
    return res.status(code).json({ success: false, message });
  };

  try {
    if (Number.isNaN(userRate) || Number.isNaN(rentAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Rental amount must be a valid number',
      });
    }

    const pool = await sql.connect(dbConfig);

    if (hasUnit && !CompanyID) {
      return res.status(400).json({ success: false, message: 'CompanyID is required when assigning a tenant to a unit' });
    }
    if (hasUnit && isOccupied && !LeaseStartDate) {
      return res.status(400).json({ success: false, message: 'Lease start date is required for an occupied rental' });
    }

    tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    if (hasUnit) {
      // 1) Find this tenant's own lease on the server (do not trust the browser)
      if (toInt(UserId) > 0 && !RentalID) {
        const own = await tx.request()
          .input('UserId', sql.Int, toInt(UserId))
          .query(`
            SELECT TOP 1 pr.RentalID
            FROM dbo.PropertyRental pr
            WHERE pr.IsDeleted = 0
              AND pr.RentalID = (SELECT RentalID FROM dbo.UserTable WHERE UserId = @UserId)
          `);
        RentalID = own.recordset[0]?.RentalID || 0;
      }

      // 2) Conflict checks (only when taking the unit)
      if (isOccupied) {
        const start = toDate(LeaseStartDate);
        const conflict = await tx.request()
          .input('CompanyID', sql.Int, toInt(CompanyID))
          .input('PropertyID', sql.Int, toInt(PropertyID))
          .input('RecordID', sql.Int, toInt(RecordID))
          .input('UserId', sql.Int, toInt(UserId))
          .input('RentalID', sql.Int, RentalID)
          .input('LeaseStartDate', sql.Date, start)
          .input('LeaseEndDate', sql.Date, toDate(LeaseEndDate))
          .query(`
            DECLARE @S DATE = COALESCE(@LeaseStartDate, CAST(GETDATE() AS DATE));
            DECLARE @E DATE = @LeaseEndDate;

            IF EXISTS (
              SELECT 1 FROM dbo.PropertyRental pr WITH (UPDLOCK, HOLDLOCK)
              WHERE pr.CompanyID = @CompanyID AND pr.PropertyID = @PropertyID
                AND pr.RecordID = @RecordID AND pr.IsDeleted = 0
                AND LOWER(LTRIM(RTRIM(pr.RentalStatus))) = 'occupied'
                AND pr.RentalID <> @RentalID
                AND pr.RentalID <> ISNULL((SELECT RentalID FROM dbo.UserTable WHERE UserId = @UserId), 0)
                AND (pr.LeaseEndDate IS NULL OR pr.LeaseEndDate >= @S)
                AND (@E IS NULL OR pr.LeaseStartDate IS NULL OR pr.LeaseStartDate <= @E)
            )
              SELECT 'LEASE' AS ConflictType;
            ELSE IF EXISTS (
              SELECT 1 FROM dbo.UserTable u WITH (UPDLOCK, HOLDLOCK)
              WHERE u.CompanyID = @CompanyID AND u.PropertyID = @PropertyID
                AND u.RecordID = @RecordID AND u.IsDeleted = 0
                AND u.UserId <> @UserId
            )
              SELECT 'TENANT' AS ConflictType;
          `);

        const type = conflict.recordset?.[0]?.ConflictType;
        if (type) {
          return fail(409, type === 'LEASE'
            ? 'An active lease already exists for this unit during the selected dates.'
            : 'Another tenant is already assigned to this unit.');
        }
      }
    }

    // 3) Save the tenant
    let imageBuffer = null;
    if (typeof image === 'string' && image.includes('base64,')) {
      imageBuffer = Buffer.from(image.split('base64,')[1], 'base64');
    }

    const userReq = tx.request();
    userReq.output('UserId', sql.Int, toInt(UserId));
    userReq.input('RecordID', sql.Int, RecordID ? toInt(RecordID) : null);
    userReq.input('PropertyID', sql.Int, PropertyID ? toInt(PropertyID) : null);
    userReq.input('Name', sql.VarChar(50), Name);
    userReq.input('MName', sql.VarChar(50), MName || null);
    userReq.input('LName', sql.VarChar(50), LName || null);
    userReq.input('EIDNo', sql.VarChar(50), EIDNo || null);
    userReq.input('EIDExpiryDate', sql.Date, toDate(EIDExpiryDate));
    userReq.input('Email', sql.VarChar(50), Email || null);
    userReq.input('Mobile', sql.VarChar(50), Mobile);
    userReq.input('Sex', sql.Int, Sex !== undefined && Sex !== '' ? parseInt(Sex, 10) : null);
    userReq.input('UserRoleId', sql.Int, UserRoleId ? toInt(UserRoleId) : null);
    userReq.input('BadgeNo', sql.VarChar(50), BadgeNo || null);
    userReq.input('WorkerRate', sql.Decimal(10, 2), userRate);
    userReq.input('PaymentMode', sql.VarChar(100),
      typeof PaymentMode === 'string' && PaymentMode.trim() ? PaymentMode.trim() : null);
    userReq.input('image', sql.VarBinary(sql.MAX), imageBuffer);
    userReq.input('CompanyID', sql.Int, CompanyID ? toInt(CompanyID) : 0);
    userReq.input('BranchId', sql.Int, BranchID ? toInt(BranchID) : null);
    userReq.input('CreatedBy', sql.Int, CreatedBy ? toInt(CreatedBy) : null);
    userReq.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
    userReq.input('ModifiedBy', sql.Int, ModifiedBy ? toInt(ModifiedBy) : null);
    userReq.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());

    const userResult = await userReq.execute('WebInsertUpdateUser');
    const savedUserId = userResult.output.UserId;

    // 4) Create or update the lease in the same transaction
    let savedRentalID = RentalID;
    if (hasUnit) {
      const actor = toInt(ModifiedBy) || toInt(CreatedBy) || toInt(savedUserId);
      const tenantName = [Name, MName, LName].filter(Boolean).join(' ').trim();

      const leaseReq = tx.request();
      leaseReq.input('RentalID', sql.Int, RentalID);
      leaseReq.input('CompanyID', sql.Int, toInt(CompanyID));
      leaseReq.input('PropertyID', sql.Int, toInt(PropertyID));
      leaseReq.input('RecordID', sql.Int, toInt(RecordID));
      leaseReq.input('TenantName', sql.NVarChar(200), tenantName || null);
      leaseReq.input('RentalStatus', sql.NVarChar(50), status);
      leaseReq.input('MonthlyRent', sql.Decimal(18, 2), rentAmount);
      leaseReq.input(
        'AnnualRent',
        sql.Decimal(18, 2),
        rentAmount !== null ? rentAmount * 12 : null,
      );
      leaseReq.input('LeaseStartDate', sql.Date, toDate(LeaseStartDate));
      leaseReq.input('LeaseEndDate', sql.Date, toDate(LeaseEndDate));
      leaseReq.input('TenantUserID', sql.Int, toInt(savedUserId) || null);
      leaseReq.input('UserID', sql.Int, actor);

      const leaseResult = await leaseReq.execute('WebInsertUpdatePropertyRental');
      const row = leaseResult.recordset?.[0];
      if (!row || row.Success !== 1) {
        return fail(409, row?.Message || 'Lease could not be saved');
      }
      savedRentalID = row.RentalID;
    }

    await tx.commit();
    tx = null;
    res.status(200).json({ success: true, UserId: savedUserId, RentalID: savedRentalID });
  } catch (err) {
    if (tx) { try { await tx.rollback(); } catch (_) {} }
    console.error('InsertUpdateUser error:', err);
    res.status(500).json({ success: false, message: err.number === 266
      ? 'Rental could not be saved. Please check the unit and dates.'
      : 'Server error while saving the tenant.' });
  }
});

router.get('/GetWorkerRateHistory', async (req, res) => {
  try {
    const { UserId } = req.query;
    if (!UserId) {
      return res.status(400).json({ success: false, message: 'UserId is required' });
    }
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('UserId', sql.Int, parseInt(UserId));
    const result = await request.execute('GetWorkerRateHistory');
    res.status(200).json({ success: true, history: result.recordset });
  } catch (error) {
    console.error('GetWorkerRateHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.get('/GetUsermaster', async (req, res) => {
  const CompanyID = req.query.CompanyID; 

  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }

  try {
    await sql.connect(dbConfig); 
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('WebGetUserMaster');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.post('/GetUsermasterPDF', async (req, res) => {
  const { CompanyID, UserId } = req.body;

  try {
    await sql.connect(dbConfig);

    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('UserId', sql.Int, UserId || 0);

    const result = await request.execute('WebGetUserMasterPDF');

    res.json(result.recordset);

  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
router.get('/GetWorkerDocuments/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const columns = Object.values(WORKER_DOC_COLUMN_MAP); // already defined in your file
    const result = await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .query(`SELECT ${columns.join(', ')} FROM dbo.UserDocuments WHERE UserId = @UserId`);

    const row = result.recordset[0] || {};
    const documents = {};
    for (const [key, column] of Object.entries(WORKER_DOC_COLUMN_MAP)) {
      try { documents[key] = JSON.parse(row[column] || '[]'); }
      catch { documents[key] = []; }
    }
    res.json({ success: true, documents }); // paths only — tiny payload
  } catch (err) {
    console.error('GetWorkerDocuments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});





// getting branch 
router.get('/Webgetcompanywisebranchname', async (req, res) => {
  const CompanyID = req.query.CompanyID;

  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);

    const result = await request.execute('Webgetcompanywisebranchname');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

// getting company name 
router.get('/Webgetcompanywisename', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .execute('Webgetcompanywisename');

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});
// getting role
router.get('/GetRoleList', async (req, res) => {
  const { CompanyID } = req.query;

  if (!CompanyID) {
    return res.status(400).json({
      success: false,
      message: "CompanyID is required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CompanyID', sql.Int, parseInt(CompanyID))
      .execute('WebGetRoleList');

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({
      success: false,
      message: "Database error"
    });
  }
});

// router.get('/getSalesRep', async (req, res) => {
//     const CompanyID = req.query.CompanyID;

//     if (!CompanyID) {
//         return res.status(400).json({
//             success: false,
//             message: 'CompanyID is required'
//         });
//     }

//     try {
//         await sql.connect(dbConfig);

//         const request = new sql.Request();
//         request.input('CompanyID', sql.Int, CompanyID);

//         const result = await request.execute('WebGetSalesRep');

//         res.json({
//             success: true,
//             message: 'Sales representatives loaded successfully',
//             data: result.recordset
//         });

//     } catch (err) {
//         console.error('SQL Error:', err);

//         res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: err.message
//         });
//     }
// });

router.post('/InsertUpdateRole', async (req, res) => {
  const {
    RoleID = 0,
    RoleName,
    CreatedBy,
    ModifiedBy,
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('RoleID', sql.Int, RoleID || 0);
    request.input('RoleName', sql.VarChar(sql.MAX), RoleName);
    request.input('CreatedBy', sql.Int, CreatedBy || null);
    request.input('ModifiedBy', sql.Int, ModifiedBy || null);

    const result = await request.execute('WebInsertUpdateRole');
    res.status(200).json({ success: true, message: RoleID ? 'Role updated successfully' : 'Role created successfully' });

  } catch (err) {
    console.error('InsertUpdateRole SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.post('/DeleteRole', async (req, res) => {
  const { RoleID, DeletedBy } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('RoleID', sql.Int, RoleID);
    request.input('DeletedBy', sql.Int, DeletedBy || null);
    await request.execute('WebDeleteRole');
    res.status(200).json({ success: true, message: 'Role deleted successfully' });
  } catch (err) {
    console.error('DeleteRole SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// router.post('/Deleteusers', async (req, res) => {
//   const { UserId, deletedBy } = req.body;

//   if (!UserId || !deletedBy) {
//     return res.status(400).json({
//       success: false,
//       message: "UserId and deletedBy are required"
//     });
//   }

//   try {
//     const pool = await sql.connect(dbConfig);
//     const result = await pool.request()
//       .input('UserId', sql.Int, UserId)
//       .input('DeletedBy', sql.Int, deletedBy)
//       .input('DeletedDate', sql.DateTime, new Date())
//       .execute('DeleteUser'); // Use underscore instead of space in SP name

//     if (result.rowsAffected[0] === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User marked as deleted"
//     });
//   } catch (err) {
//     console.error("SQL error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Database error occurred"
//     });
//   }
// });
// router.post('/Deleteusers', async (req, res) => {
//   const { UserId, deletedBy } = req.body;

//   if (!UserId || !deletedBy) {
//     return res.status(400).json({
//       success: false,
//       message: "UserId and deletedBy are required"
//     });
//   }

//   try {
//     const pool = await sql.connect(dbConfig);
//     const result = await pool.request()
//       .input('UserId', sql.Int, UserId)
//       .input('DeletedBy', sql.Int, deletedBy)
//       .input('DeletedDate', sql.DateTime, new Date())
//       .execute('DeleteUser');

//     // rowsAffected: [0] = DELETE userDocuments, [1] = UPDATE UserTable
//     // The UPDATE is the one that proves the user existed and was newly deleted.
//     const userRowsAffected = result.rowsAffected[1] ?? 0;

//     if (userRowsAffected === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found (already deleted or does not exist)"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "User marked as deleted"
//     });
//   } catch (err) {
//     console.error("SQL error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Database error occurred"
//     });
//   }
// });
router.post('/Deleteusers', async (req, res) => {
  const { UserId, deletedBy } = req.body;

  if (!UserId || !deletedBy) {
    return res.status(400).json({
      success: false,
      message: "UserId and deletedBy are required"
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('UserId', sql.Int, UserId)
      .input('DeletedBy', sql.Int, deletedBy)
      .input('DeletedDate', sql.DateTime, new Date())
      .execute('webRententdelete');       // ← SP name here

    const row = result.recordset?.[0];

    return res.status(row?.Success === 1 ? 200 : 404).json({
      success: row?.Success === 1,
      message: row?.Message || 'Unknown result'
    });
  } catch (err) {
    console.error("Deleteusers SQL error:", err);
    res.status(500).json({
      success: false,
      message: "Database error occurred"
    });
  }
});

router.get('/GetEmployeeCategoryList', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .execute('WebGetEmployeeCategoryList');

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("SQL error:", err);
    res.status(500).json({
      success: false,
      message: "Database error"
    });
  }
});


router.post('/InsertUpdateEmployeeCategory', async (req, res) => {
  const {
    CategoryID = 0,
    CategoryName,
    SalaryBasis,
    CreatedBy,
    ModifiedBy,
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('CategoryID', sql.Int, CategoryID || 0);
    request.input('CategoryName', sql.VarChar(100), CategoryName);
    request.input('SalaryBasis', sql.VarChar(50), SalaryBasis);
    request.input('CreatedBy', sql.Int, CreatedBy || null);
    request.input('ModifiedBy', sql.Int, ModifiedBy || null);

    await request.execute('WebInsertUpdateEmployeeCategory');

    res.status(200).json({
      success: true,
      message: CategoryID ? 'Employee category updated successfully' : 'Employee category created successfully'
    });

  } catch (err) {
    console.error('InsertUpdateEmployeeCategory SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.post('/DeleteEmployeeCategory', async (req, res) => {
  const { CategoryID, DeletedBy } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.input('CategoryID', sql.Int, CategoryID);
    request.input('DeletedBy', sql.Int, DeletedBy || null);

    await request.execute('WebDeleteEmployeeCategory');

    res.status(200).json({ success: true, message: 'Employee category deleted successfully' });
  } catch (err) {
    console.error('DeleteEmployeeCategory SQL error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET rooms with beds for a project (via camp)
router.get('/GetRoomsByProject', async (req, res) => {
  const { ProjectID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('ProjectID', sql.Int, parseInt(ProjectID))
      .execute('WebGetRoomsByProject');
    res.json({ rooms: result.recordsets[0] || [] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET available beds for a room
router.get('/GetBedsByRoom', async (req, res) => {
  const { RoomID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('RoomID', sql.Int, parseInt(RoomID))
      .query(`SELECT BedID, BedNo, BedType, Status, UserID FROM CampBed WHERE RoomID = @RoomID AND IsDeleted = 0`);
    res.json({ beds: result.recordset });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
router.post('/UpdateBedStatus', async (req, res) => {
  const { BedID, UserID } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('BedID', sql.Int, BedID)
      .input('UserID', sql.Int, UserID || null)
      .input('Status', sql.VarChar, UserID ? 'Occupied' : 'Available')
      .query(`
        UPDATE CampBed
        SET UserID = @UserID,
            Status = @Status,
            ModifiedDate = GETDATE()
        WHERE BedID = @BedID
      `);
    res.json({ success: true });
  } catch (err) {
    console.error('UpdateBedStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// Route
router.get('/GetRoomsByCamp', async (req, res) => {
  const { CampID } = req.query;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CampID', sql.Int, parseInt(CampID))
      .execute('WebGetRoomsByCamp');

    const rows = result.recordsets[0] || [];
    const roomsMap = new Map();
    for (const row of rows) {
      if (!roomsMap.has(row.RoomID)) {
        roomsMap.set(row.RoomID, {
          RoomID: row.RoomID, RoomNo: row.RoomNo, RoomType: row.RoomType,
          RoomStatus: row.RoomStatus, RatePerRoom: row.RatePerRoom, beds: []
        });
      }
      if (row.BedID) {
        roomsMap.get(row.RoomID).beds.push({
          BedID: row.BedID, BedNo: row.BedNo, BedType: row.BedType,
          Status: row.BedStatus, UserID: row.UserID
        });
      }
    }
    res.json({ rooms: Array.from(roomsMap.values()) });
  } catch (err) {
    console.error('GetRoomsByCamp error:', err);
    res.status(500).json({ message: err.message });
  }
});
router.get('/GetWorkersByRole', async (req, res) => {
  try {
    const { RoleId, CompanyID } = req.query;

    const roleIdNum = parseInt(RoleId);
    const companyIdNum = parseInt(CompanyID);

    if (!RoleId || isNaN(roleIdNum) || !CompanyID || isNaN(companyIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'RoleId and CompanyID are required and must be valid numbers'
      });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('RoleId', sql.Int, roleIdNum)
      .input('CompanyID', sql.Int, companyIdNum)
      .execute('GetWorkersByRole');

    res.json({ workers: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


const workerDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { userId, docType } = req.body;
    const dir = path.join(__dirname, '..', '..', '..', 'uploads', 'workers', String(userId), docType);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
});
const uploadWorkerDoc = multer({ storage: workerDocStorage });

const WORKER_DOC_COLUMN_MAP = {
  resume: 'ResumeFiles',
  ppDocument: 'PPDocumentFiles',
  educationCert: 'EduCertFiles',
  visaDocument: 'VisaDocFiles',
  eidDocument: 'EIDDocFiles',
  experienceDocument: 'ExperienceDocFiles',
  otherDocument: 'OtherDocFiles',
  insuranceDocument: 'InsuranceFiles',
  gatePassDocument: 'GatePassFiles',
  workmenCompDocument: 'WorkmenCompFiles',
  professionalLicenseDocument: 'ProfLiceFiles',
};

router.get('/workerfile', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).send('No path provided');
  const absolutePath = path.join(__dirname, '..', '..', '..', filePath.replace(/^\//, ''));
  if (!fs.existsSync(absolutePath)) return res.status(404).send('File not found');
  res.sendFile(absolutePath);
});

router.post('/uploadWorkerDocs', uploadWorkerDoc.array('files'), async (req, res) => {
  try {
    const { userId, docType, titles } = req.body;
    const column = WORKER_DOC_COLUMN_MAP[docType];
    if (!column) return res.status(400).json({ success: false, message: 'Invalid docType' });

    const parsedTitles = titles ? JSON.parse(titles) : [];
    const pool = await sql.connect(dbConfig);

    // ── FIXED: read from UserDocuments, not UserMaster ──
    const existingRes = await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .query(`SELECT ${column} AS col FROM dbo.UserDocuments WHERE UserId = @UserId`);

    let existing = [];
    try { existing = JSON.parse(existingRes.recordset[0]?.col || '[]'); } catch { existing = []; }

    const newEntries = req.files.map((f, i) => ({
      fileName: f.originalname,
      path: `/uploads/workers/${userId}/${docType}/${f.filename}`,
      label: parsedTitles[i] || ''
    }));

    const allEntries = [...existing, ...newEntries];

    // ── FIXED: MERGE instead of blind UPDATE, since the row may not exist yet ──
    await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .input('Docs', sql.NVarChar(sql.MAX), JSON.stringify(allEntries))
      .query(`
        MERGE dbo.UserDocuments AS tgt
        USING (SELECT @UserId AS UserId) AS src
        ON tgt.UserId = src.UserId
        WHEN MATCHED THEN
          UPDATE SET ${column} = @Docs
        WHEN NOT MATCHED THEN
          INSERT (UserId, ${column}) VALUES (@UserId, @Docs);
      `);

    res.json({ success: true, documents: allEntries });
  } catch (err) {
    console.error('uploadWorkerDocs error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/deleteWorkerDoc', async (req, res) => {
  try {
    const { userId, docType, filePath } = req.body;
    const column = WORKER_DOC_COLUMN_MAP[docType];
    if (!column) return res.status(400).json({ success: false, message: 'Invalid docType' });

    const pool = await sql.connect(dbConfig);
    const existingRes = await pool.request() 
      .input('UserId', sql.Int, parseInt(userId))
      .query(`SELECT ${column} AS col FROM dbo.UserDocuments WHERE UserId = @UserId`);

    let existing = [];
    try { existing = JSON.parse(existingRes.recordset[0]?.col || '[]'); } catch { existing = []; }
    const updated = existing.filter(d => d.path !== filePath);

    await pool.request()
      .input('UserId', sql.Int, parseInt(userId))
      .input('Docs', sql.NVarChar(sql.MAX), JSON.stringify(updated))
      .query(`UPDATE dbo.UserDocuments SET ${column} = @Docs WHERE UserId = @UserId`);

   const absolutePath = path.join(__dirname, '..', '..', '..', filePath.replace(/^\//, ''));
if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    
    res.json({ success: true, documents: updated });
  } catch (err) {
    console.error('deleteWorkerDoc error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



module.exports = router;
