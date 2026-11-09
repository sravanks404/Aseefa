const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');


function generateSuitappsID() {
   const now = new Date();

   const pad = (n) => (n < 10 ? "0" + n : n);

   const datePart =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate());

   const timePart =
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

   return `WEB_${datePart}_${timePart}`;
}


router.post('/InsertUpdateProduction', async (req, res) => {
   const {
      PID, // for update pass PID, for new pass 0 or null
      ProductionNo,
      JobCardId,
      PDate,
      ProductID,
      Qty,
      CompanyID,
      CreatedBy,
      CreatedDate,
      ModifiedBy,
      ModifiedDate,
      IsDeleted,
      FYearID,
      BatchID,
      status,
      TotalLC,
      ExtaCost,
      WasteQty,
      TotalQty,
      Type,
      LabourCost,
      TotalProductionCost,
      SuitAppsId,
      Items // Array of ProductionDetails
   } = req.body;

   try {
      const pool = await sql.connect(dbConfig);
      const request = pool.request();

      const today = new Date();
      const currentDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Convert Items array to JSON string for SQL
      const detailsJson = JSON.stringify(Items || []);

      // Map all procedure parameters
      request.output('PID', sql.Int, PID || 0);  // ✅ OUTPUT param
      request.input('ProductionNo', sql.Int, ProductionNo || 0);
      request.input('JobCardId', sql.Int, JobCardId || 0);
      request.input('PDate', sql.DateTime, currentDateOnly);
      request.input('ProductID', sql.Int, ProductID || null);
      request.input('Qty', sql.Decimal(18, 3), Qty || 0);
      request.input('CompanyID', sql.Int, CompanyID);
      request.input('CreatedBy', sql.Int, CreatedBy || 0);
      request.input('CreatedDate', sql.DateTime, CreatedDate || null);
      request.input('ModifiedBy', sql.Int, ModifiedBy || null);
      request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
      request.input('IsDeleted', sql.Int, IsDeleted || 0);
      request.input('FYearID', sql.Int, FYearID || null);
      request.input('BatchID', sql.Int, BatchID || null);
      request.input('status', sql.Int, status || null);
      request.input('TotalLC', sql.Money, TotalLC || 0);
      request.input('ExtaCost', sql.Money, ExtaCost || 0);
      request.input('WasteQty', sql.Float, WasteQty || 0);
      request.input('TotalQty', sql.Float, TotalQty || 0);
      request.input('Type', sql.Int, Type || null);
      request.input('LabourCost', sql.Money, LabourCost || 0);
      request.input('TotalProductionCost', sql.Money, TotalProductionCost || 0);
      request.input('SuitAppsId', sql.VarChar(sql.MAX), SuitAppsId || null);
      request.input('Details', sql.NVarChar(sql.MAX), detailsJson);  // ✅ correct param name

      // ✅ Execute stored procedure
      const result = await request.execute('WebInsertUpdateProduction');

      // Stored proc SELECTs PID and SuitAppsId
      const pid = result.recordset?.[0]?.PID || request.parameters.PID.value;
      const suitAppsId = result.recordset?.[0]?.SuitAppsId || SuitAppsId;

      res.status(200).json({
         message: 'Production saved successfully',
         PID: pid,
         SuitAppsId: suitAppsId
      });
   } catch (error) {
      console.error('Error inserting/updating Production:', error);
      res.status(500).json({
         error: 'Failed to insert/update Production',
         details: error.message
      });
   }
});





router.get('/ProductionIngreLC', async (req, res) => {
   const { CompanyID, ItemId } = req.query;

   // 🛠 Correct validation (use || not ,)
   if (!CompanyID || !ItemId) {
      return res.status(400).send('CompanyID and ItemId are required');
   }

   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();

      // 🛠 Ensure conversion to Int (req.query is string by default)
      request.input('CompanyID', sql.Int, parseInt(CompanyID, 10));
      request.input('ItemId', sql.Int, parseInt(ItemId, 10));

      const result = await request.execute('webProductionIngreLC');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});


router.get('/ProductionJobIngredients', async (req, res) => {
   const { JobCardId, JCItemId } = req.query;
   if (!JobCardId) {
      return res.status(400).send('JobCardId is required');
   }

   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('JobCardId', sql.Int, JobCardId);
      request.input('JCItemId', sql.Int, JCItemId);


      const result = await request.execute('webGetProductionJobIngredients');

      // ✅ return structured response
      res.json({
         jobCard: result.recordsets[0] || [],       // 1st set → Job Card
         production: result.recordsets[1] || [],  // 2nd set → Production
         productiondetails: result.recordsets[2] || []     // 3nd set → Production

      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/ProductionJobQc', async (req, res) => {
   const { CompanyID } = req.query;
   if (!CompanyID) {
      return res.status(400).send('CompanyID is required');
   }
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('CompanyID', sql.Int, CompanyID);

      const result = await request.execute('webGetProductionJobQc');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/ProductionJobQc', async (req, res) => {
   const { CompanyID } = req.query;
   if (!CompanyID) {
      return res.status(400).send('CompanyID is required');
   }
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('CompanyID', sql.Int, CompanyID);

      const result = await request.execute('webGetProductionJobQc');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/ProductionEntryDetails', async (req, res) => {
   const { JobCardId, PID } = req.query;
   if (!JobCardId) {
      return res.status(400).send('JobCardId is required');
   }

   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('JobCardId', sql.Int, JobCardId);
      request.input('PID', sql.Int, PID);


      const result = await request.execute('webGetProductionEntryDetails');

      // ✅ return structured response
      res.json({
         jobCard: result.recordsets[0] || [],       // 1st set → Job Card
         production: result.recordsets[1] || [],  // 2nd set → Production
         productiondetails: result.recordsets[2] || []     // 3nd set → Production

      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/ProductionJobQcDetails', async (req, res) => {
   const { JobCardId, PID } = req.query;
   if (!JobCardId) {
      return res.status(400).send('JobCardId is required');
   }

   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('JobCardId', sql.Int, JobCardId);
      request.input('PID', sql.Int, PID);


      const result = await request.execute('webGetProductionJobQcDetails');

      // ✅ return structured response
      res.json({
         jobCard: result.recordsets[0] || [],       // 1st set → Job Card
         production: result.recordsets[1] || [],  // 2nd set → Production
         productiondetails: result.recordsets[2] || []     // 3nd set → Production

      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.post('/insertqualitycheck', async (req, res) => {
    let {
        QcId,
        JobCardId,
        ProductionId,
        QcChecked,   // may come as array
        QcVerified,
        TableCleaning,
        Tray,
        HydrogenPeroxide,
        ClothHygienin,
        Vesselclean,
        SaltVisibility,
        Narration,
        QcStatus,
        LocationId,
        CompanyID,
        CreatedBy,
        CreatedDate,
        ModifiedBy,
        ModifiedDate,
        IsDeleted
    } = req.body;

    try {
        // ✅ Convert array → comma separated string
        if (Array.isArray(QcChecked)) {
            QcChecked = QcChecked.join(",");
        }

        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Required params
        request.input('JobCardId', sql.Int, JobCardId);
        request.input('ProductionId', sql.Int, ProductionId);
        request.input('QcChecked', sql.NVarChar(sql.MAX), QcChecked || null);
        request.input('QcVerified', sql.Int, QcVerified || null);

        // Boolean-like fields (store "1"/"0")
        request.input('TableCleaning', sql.VarChar(sql.MAX), TableCleaning ? "1" : "0");
        request.input('Tray', sql.VarChar(sql.MAX), Tray ? "1" : "0");
        request.input('HydrogenPeroxide', sql.VarChar(sql.MAX), HydrogenPeroxide ? "1" : "0");
        request.input('ClothHygienin', sql.VarChar(sql.MAX), ClothHygienin ? "1" : "0");
        request.input('Vesselclean', sql.VarChar(sql.MAX), Vesselclean ? "1" : "0");
        request.input('SaltVisibility', sql.VarChar(sql.MAX), SaltVisibility ? "1" : "0");

        // Other fields
        request.input('Narration', sql.VarChar(sql.MAX), Narration || "");
        request.input('QcStatus', sql.Int, QcStatus || 0);
        request.input('LocationId', sql.Int, LocationId || null);
        request.input('CompanyID', sql.Int, parseInt(CompanyID));
        request.input('CreatedBy', sql.Int, CreatedBy || null);
        request.input('CreatedDate', sql.DateTime, CreatedDate || new Date());
        request.input('ModifiedBy', sql.Int, ModifiedBy || null);
        request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
        request.input('IsDeleted', sql.Int, IsDeleted || 0);

        // Output param
        request.output('QcId', sql.Int);

        const result = await request.execute('[WebInsertUpdateQualityCheck]');

        res.status(200).json({
            message: 'Quality check saved successfully',
            QcId: result.output.QcId
        });
    } catch (error) {
        console.error('Error inserting/updating Quality Check:', error);
        res.status(500).json({
            error: 'Failed to insert/update Quality Check',
            details: error.message
        });
    }
});
router.post('/WebinsertupdateIngredients', async (req, res) => {
   const {
      IID = 0,
      ItemID,
      ItemType,
      ParentIID = null,
      IsDeleted = 0,
      CreatedBy,
      CreatedDate = null,
      ModifiedBy = null,
      ModifiedDate = null,
      DeletedBy = null,
      DeletedDate = null,
      Qty,
      CompanyID,
      FYearID,
      Details = null // should be JSON array
   } = req.body;

   try {
      const pool = await sql.connect(dbConfig);

      // always generate SuitappsID inside API
      const SuitappsID = generateSuitappsID();

      const request = pool.request();
      request.output("IID", sql.Int, IID);

      request.input("ItemID", sql.Int, ItemID);
      request.input("ItemType", sql.Int, ItemType);
      request.input("ParentIID", sql.Int, ParentIID);
      request.input("IsDeleted", sql.Int, IsDeleted);
      request.input("CreatedBy", sql.Int, CreatedBy);
      request.input("CreatedDate", sql.DateTime, CreatedDate);
      request.input("ModifiedBy", sql.Int, ModifiedBy);
      request.input("ModifiedDate", sql.DateTime, ModifiedDate);
      request.input("DeletedBy", sql.Int, DeletedBy);
      request.input("DeletedDate", sql.DateTime, DeletedDate);
      request.input("Qty", sql.Money, Qty);
      request.input("CompanyID", sql.Int, CompanyID);
      request.input("FYearID", sql.Int, FYearID);
      request.input("SuitappsID", sql.NVarChar(50), SuitappsID);

      // Send JSON string for details
      request.input(
         "Details",
         sql.NVarChar(sql.MAX),
         Details ? JSON.stringify(Details) : null
      );

      const result = await request.execute("WebInsertUpdateIngradients");

      res.json({
         success: true,
         IID: result.output.IID,
         SuitappsID, // return the generated ID
         data: result.recordset
      });
   } catch (err) {
      console.error("Error executing procedure:", err);
      res.status(500).json({ success: false, error: err.message });
   }
});

router.get('/GetUnit', async (req, res) => {
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();

      const result = await request.execute('GetUnit');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/GetIngredient', async (req, res) => {
   const { CompanyID } = req.query;
   if (!CompanyID) {
      return res.status(400).send('CompanyID is required');
   }
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('CompanyID', sql.Int, CompanyID);

      const result = await request.execute('webGetIngredients');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/GetIngredientDetails', async (req, res) => {
   const { CompanyID, IID } = req.query;
   if (!CompanyID || !IID) {
      return res.status(400).send('CompanyID and IID are required');
   }
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('CompanyID', sql.Int, CompanyID);
      request.input('IID', sql.Int, IID);
      const result = await request.execute('webGetIngredientsDetails');

      // return both recordsets
      res.json({
         master: result.recordsets[0][0] || null,
         details: result.recordsets[1] || []
      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.post('/webDeleteIngredient', async (req, res) => {
   const { IID } = req.body; // ✅ match stored procedure

   try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
         .input('IID', sql.Int, IID) // ✅ only JobCardId
         .execute('dbo.WebDeleteIngredient');

      res.status(200).json({
         success: true,
         message: 'Ingredients deleted successfully',
         data: result.recordset
      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).json({
         success: false,
         message: err.message
      });
   }
});

router.post('/WebInsertUpdateByproducts', async (req, res) => {
   const {
      BPID = 0,
      ItemID,
      ItemType,
      IsDeleted = 0,
      CreatedBy,
      CreatedDate = null,
      ModifiedBy = null,
      ModifiedDate = null,
      DeletedBy = null,
      DeletedDate = null,
      Qty,
      CompanyID,
      FYearID,
      Details = null // should be JSON array
   } = req.body;

   try {
      const pool = await sql.connect(dbConfig);

      // Always generate SuitappsID inside API
      const SuitappsID = generateSuitappsID();

      const request = pool.request();
      request.output("BPID", sql.Int, BPID);
      request.input("ItemID", sql.Int, ItemID);
      request.input("ItemType", sql.Int, ItemType);
      request.input("IsDeleted", sql.Bit, IsDeleted);
      request.input("CreatedBy", sql.Int, CreatedBy);
      request.input("CreatedDate", sql.DateTime, CreatedDate);
      request.input("ModifiedBy", sql.Int, ModifiedBy);
      request.input("ModifiedDate", sql.DateTime, ModifiedDate);
      request.input("DeletedBy", sql.Int, DeletedBy);
      request.input("DeletedDate", sql.DateTime, DeletedDate);
      request.input("Qty", sql.Decimal(18, 2), Qty);
      request.input("CompanyID", sql.Int, CompanyID);
      request.input("FYearID", sql.Int, FYearID);
      request.input("SuitappsID", sql.NVarChar(100), SuitappsID);

      // Send JSON string for details
      request.input(
         "Details",
         sql.NVarChar(sql.MAX),
         Details ? JSON.stringify(Details) : null
      );

      const result = await request.execute("WebInsertUpdateByproducts");

      res.json({
         success: true,
         BPID: result.output.BPID,
         SuitappsID, // return the generated ID
         data: result.recordset
      });
   } catch (err) {
      console.error("Error executing procedure:", err);
      res.status(500).json({ success: false, error: err.message });
   }
});

router.get('/Webgetbyproduct', async (req, res) => {
   const { CompanyID } = req.query;
   if (!CompanyID) {
      return res.status(400).send('CompanyID is required');
   }
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();
      request.input('CompanyID', sql.Int, CompanyID);

      const result = await request.execute('WebGetByproducts');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});

router.get('/Webgetbyproductdetails', async (req, res) => {
   const { CompanyID, BPID } = req.query;

   try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request()
         .input("CompanyID", sql.Int, CompanyID)
         .input("BPID", sql.Int, BPID)
         .execute("WebGetByproductsDetails");

      res.json({
         master: result.recordset.length > 0 ? result.recordset[0] : null,
         details: result.recordset
      });
   } catch (err) {
      console.error("Error fetching byproduct details:", err);
      res.status(500).json({ success: false, error: err.message });
   }
});

router.post('/webDeleteByproduct', async (req, res) => {
   const { BPID, DeletedBy } = req.body; // ✅ match stored procedure

   try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
         .input('BPID', sql.Int, BPID) // ✅ only JobCardId
         .input('DeletedBy', sql.Int, DeletedBy)
         .execute('dbo.[WebDeleteByproduct]');

      res.status(200).json({
         success: true,
         message: 'Byproduct deleted successfully',
         data: result.recordset
      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).json({
         success: false,
         message: err.message
      });
   }
});

// get QC details by JobCardId
router.get('/WebgetQcDetails', async (req, res) => {
  const { CompanyID, JobCardId, PID } = req.query;  // ✅ use PID instead of ProAlloId

  if (!CompanyID || !JobCardId) {
    return res.status(400).send('CompanyID and JobCardId are required');
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('JobCardId', sql.Int, JobCardId);
    request.input('PID', sql.Int, PID || null);   // ✅ match SP param

    const result = await request.execute('[WebGetQualityCheck]');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});


router.post('/webDeleteProduction', async (req, res) => {
   const { PID } = req.body; // ✅ match stored procedure
   try {
      let pool = await sql.connect(dbConfig);
      let result = await pool.request()
         .input('PID', sql.Int, PID) // ✅ only JobCardId
         .execute('dbo.WebDeleteProduction');

      res.status(200).json({
         success: true,
         message: 'Production deleted successfully',
         data: result.recordset
      });
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).json({
         success: false,
         message: err.message
      });
   }
});


router.get('/Getlocation', async (req, res) => {
   try {
      await sql.connect(dbConfig);
      const request = new sql.Request();

      const result = await request.execute('[GetLocation]');
      res.json(result.recordset);
   } catch (err) {
      console.error('SQL error:', err);
      res.status(500).send('Server error');
   }
});


module.exports = router;