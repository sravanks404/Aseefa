const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');

const pool = new sql.ConnectionPool({
    ...dbConfig,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  });

//Route master api
router.post('/InsertupdateRoute', async (req, res) => {

    const now = new Date();
    const pad = n => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1); // Months are 0-based
    const year = now.getFullYear();
    const hour = pad(now.getHours());
    const minute = pad(now.getMinutes());
    const second = pad(now.getSeconds());

  const formattedSuitAppsId = `WEB-${day}-${month}-${year}_${hour}-${minute}-${second}`;

    const {
      RootId,
      RootName,
      PlaceName,
      FromPlace,
      ToPlace,
      State,       // New field
      District,    // New field
      Taluk,       // New field
      Junction,
      CreatedBy,
      CreatedDate,
      SuitApps_id
    } = req.body;
  
    try {
      const pool = await sql.connect(dbConfig);
      const request = pool.request();
      // Declare only as OUTPUT and set initial value
      request.output('RootId', sql.Int);
      request.parameters['RootId'] = { name: 'RootId', type: sql.Int, value: RootId };
      request.input('RootName', sql.VarChar(50), RootName);
      request.input('PlaceName', sql.VarChar(50), PlaceName);
      request.input('FromPlace', sql.VarChar(50), FromPlace);
      request.input('ToPlace', sql.VarChar(50), ToPlace);
      request.input('State', sql.Int, State);          // Pass State ID
      request.input('District', sql.Int, District);    // Pass District ID
      request.input('Taluk', sql.Int, Taluk);          // Pass Taluk ID
      request.input('Junction', sql.Int, Junction);    // Pass Junction ID
      request.input('CreatedBy', sql.Int, CreatedBy);
      request.input('CreatedDate', sql.DateTime, CreatedDate || new Date());
      request.input('SuitApps_id', sql.VarChar(50), formattedSuitAppsId);
      const result = await request.execute('WebInsertUpdateRouteMaster');
      const returnId = result.output.RootId;
      res.status(200).json({ success: true, RootId: returnId });
    } catch (err) {
      console.error('SQL error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
});
  
router.get('/WebGetRouteMaster', async (req, res) => {
    try {
        const { CompanyID } = req.query;
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Proper input handling
        request.input('CompanyID', sql.Int, CompanyID);
        
        // Execute stored procedure
        const result = await request.execute('webGetRouteMaster');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: err.message 
        });
    }
});

router.post('/WebDeleteRouteMaster', async (req, res) => {
    const RootId = parseInt(req.body.RootId, 10);
    const DeletedBy = parseInt(req.body.DeletedBy, 10);

    if (isNaN(RootId) || isNaN(DeletedBy)) {
        return res.status(400).json({ 
            success: false, 
            message: 'RootId and DeletedBy must be valid numbers.' 
        });
    }

    try {
        const result = await (await sql.connect(dbConfig)).request()
            .input('RootId', sql.Int, RootId)
            .input('DeletedBy', sql.Int, DeletedBy)
            .input('DeletedDate', sql.DateTime, new Date())
            .execute('[WebDeleteRouteMaster]');

        const rows = result.rowsAffected[0] || 0;

        res.status(rows > 0 ? 200 : 404).json({
            success: rows > 0,
            message: rows > 0 ? 'Route successfully deleted' : 'Route not found or already deleted',
            ...(rows > 0 && { deletedId: RootId })
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Database operation failed', 
            error: error.message 
        });
    }
});


// Place creation api

router.post('/InsertupdatePlace', async (req, res) => {
  const {
      PlID = 0,
      PlaceName,
      StateID,
      DistrictID,
      TalukID,
      JunctionID,
      LevelId,
      CompanyID,
      CreatedBy,
      ModifiedBy = null
  } = req.body;

  try {
      let pool = await sql.connect(dbConfig);

      let result = await pool.request()
          .input('PlID', sql.Int, PlID)
          .input('PlaceName', sql.VarChar(100), PlaceName)
          .input('StateID', sql.Int, StateID)
          .input('DistrictID', sql.Int, DistrictID)
          .input('TalukID', sql.Int, TalukID)
          .input('JunctionID', sql.Int, JunctionID)
          .input('LevelId', sql.Int, LevelId)
          .input('CompanyID', sql.Int, CompanyID)
          .input('CreatedBy', sql.Int, CreatedBy)
          .input('ModifiedBy', sql.Int, ModifiedBy)
          .execute('webInsertUpdatePlaceCreation');

      const output = result.recordset?.[0];

      if (PlID === 0) {
          res.status(201).json({ message: 'Place created successfully', PlID: output?.NewPlID });
      } else {
          res.status(200).json({ message: 'Place updated successfully', PlID: output?.UpdatedPlID });
      }

  } catch (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Backend API Route (Node.js/Express example)
router.get('/GetStates', async (req, res) => {
    try {
        const { CompanyID } = req.query;

        // Validate CompanyID
        if (!CompanyID || isNaN(CompanyID)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing CompanyID'
            });
        }

        const query = `
            SELECT 
                PlID AS StateID,
                PlaceName AS StateName
            FROM [PlaceCreation]
            WHERE 
                LevelId = 1 AND 
                [IsDeleted]=0 and
                CompanyID = @CompanyID
            ORDER BY StateName
        `;

        // Ensure pool is connected (optional but useful in dev)
        if (!pool.connected) {
            await pool.connect();
        }

        const result = await pool.request()
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .query(query);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        console.error('Error fetching states:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch states',
            error: error.message // Optional: helpful for debugging
        });
    }
});

router.get('/GetDistricts', async (req, res) => {
    try {
        const { CompanyID, StateID } = req.query;

        // Validate input
        if (!CompanyID || !StateID) {
            return res.status(400).json({ 
                success: false,
                message: 'CompanyID and StateID are required'
            });
        }

        await sql.connect(dbConfig);
        const request = new sql.Request();
        
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('StateID', sql.Int, StateID);

        const result = await request.query(`
            SELECT 
                DistrictID,
                PlaceName AS DistrictName,
                StateID,
                CompanyID
            FROM PlaceCreation
            WHERE 
                StateID = @StateID 
                AND CompanyID = @CompanyID
               AND  LevelId = 2  AND
                [IsDeleted]=0
            ORDER BY DistrictName
        `);

        res.json({
            success: true,
            message: 'Districts fetched successfully',
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching districts:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching districts',
            error: err.message
        });
    } 
});

router.get('/GetTaluks', async (req, res) => {
    try {
        const { CompanyID, DistrictID } = req.query;

        // Validate input
        if (!CompanyID || !DistrictID) {
            return res.status(400).json({ 
                success: false,
                message: 'CompanyID and DistrictID are required'
            });
        }

        await sql.connect(dbConfig);
        const request = new sql.Request();
        
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('DistrictID', sql.Int, DistrictID);

        const result = await request.query(`
            SELECT 
                PlID AS TalukID,
                PlaceName AS TalukName,
                DistrictID,
                CompanyID
            FROM PlaceCreation
            WHERE 
                DistrictID = @DistrictID 
                AND CompanyID = @CompanyID
                AND LevelId = 3
                AND [IsDeleted]=0 
            ORDER BY TalukName
        `);

        res.json({
            success: true,
            message: 'Taluks fetched successfully',
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching taluks:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching taluks',
            error: err.message
        });
    } 
});

router.get('/GetJunctions', async (req, res) => {
    try {
        const { CompanyID, TalukID } = req.query;

        // Validate input
        if (!CompanyID || !TalukID) {
            return res.status(400).json({ 
                success: false,
                message: 'CompanyID and TalukID are required'
            });
        }

        await sql.connect(dbConfig);
        const request = new sql.Request();
        
        request.input('CompanyID', sql.Int, CompanyID);
        request.input('TalukID', sql.Int, TalukID);

        const result = await request.query(`
            SELECT 
                PlID AS JunctionID,
                PlaceName AS JunctionName,
                TalukID,
                CompanyID
            FROM PlaceCreation
            WHERE 
                TalukID = @TalukID 
                AND CompanyID = @CompanyID
                AND LevelId = 4
                 AND [IsDeleted]=0 
            ORDER BY JunctionName
        `);

        res.json({
            success: true,
            message: 'Junctions fetched successfully',
            data: result.recordset
        });

    } catch (err) {
        console.error('Error fetching junctions:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching junctions',
            error: err.message
        });
    } 
});

router.get('/WebGetPlaceMaster', async (req, res) => {
    try {
        const CompanyID = parseInt(req.query.CompanyID); // Get CompanyID from query string
        if (isNaN(CompanyID)) {
            return res.status(400).send('Invalid CompanyID');
        }

        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        const result = await request.execute('[webGetPlaceName]');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/deletePlace', async (req, res) => {
    const { PlID, DeletedBy } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('PlID', sql.Int, PlID)
            .input('DeletedBy', sql.Int, DeletedBy || 0) // Handle null case
            .execute('webDeletePlace');

        if (result.recordset[0].RowsAffected > 0) {
            res.status(200).json({ message: 'Place deleted successfully' });
        } else {
            res.status(404).json({ error: 'Place not found or already deleted' });
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
