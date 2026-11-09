const express = require('express');
const router = express.Router();
const sql = require('mssql');
const dbConfig = require('../../../config/mssql');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // stores images in memory as buffer



router.get('/WebGetRateWiseDiscount', async (req, res) => {
    try {
        const { CompanyID } = req.query;
        if (!CompanyID) {
            return res.status(400).json({ error: "CompanyID is required" });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .execute('WebGetRateWiseDiscount'); // or your stored procedure

        res.json(result.recordset);
    } catch (err) {
        console.error('WebGetRateWiseDiscount error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/WebInsertUpdateTotalRateWisePurchase', async (req, res) => {
    try {
        const {
            Id = 0,
            FromRate,
            ToRate,
            Discount,
            CreatedBy,
            ModifiedBy, 
            CompanyID
        } = req.body;

        if (!FromRate || !ToRate || !Discount || !CompanyID) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (isNaN(parseFloat(FromRate)) || isNaN(parseFloat(ToRate))) {
            return res.status(400).json({ error: 'Invalid rate values' });
        }

        const pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('Id', sql.Int, parseInt(Id))
            .input('FromRate', sql.Decimal(18, 2), parseFloat(FromRate))
            .input('ToRate', sql.Decimal(18, 2), parseFloat(ToRate))
            .input('Discount', sql.Decimal(5, 2), parseFloat(Discount))
            .input('CreatedBy', sql.Int, Id == 0 ? parseInt(CreatedBy) : null)
            .input('CreatedDate', sql.DateTime, Id == 0 ? new Date() : null)
            .input('ModifiedBy', sql.Int, Id != 0 ? parseInt(ModifiedBy) : null)
            .input('ModifiedDate', sql.DateTime, Id != 0 ? new Date() : null) // Fixed: Use current date
            .input('CompanyID', sql.Int, parseInt(CompanyID))
            .execute('WebInsertUpdateTotalRateWisePurchase');

        res.json({
            success: true,
            data: result.recordset[0],
            message: Id == 0 ? 'Rate inserted successfully' : 'Rate updated successfully'
        });
    } catch (err) {
        console.error('Error executing procedure:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    } 
});


router.get('/GetItemAnalysis', async (req, res) => {
    const { Month, CompanyId } = req.query;  // ✅ Extract query params

    if (!Month ||!CompanyId ) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    let pool;

    try {
        pool = await sql.connect(dbConfig);

        const result = await pool.request()
            .input('Month', sql.Int, Month)
            .input('CompanyId', sql.Int, parseInt(CompanyId, 10))
            .execute('[WebGetItemTrackingAnalysis]');

        res.status(200).json({
            success: true,
            data: result.recordsets
        });

    } catch (err) {
        console.error('Database query failed:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });

    } 
});



router.post('/insertupdateitemolf', upload.array('images', 5), async (req, res) => {
  const files = req.files; // array of image files
  const body = req.body;

  // Parse necessary fields from body
  const {
    ItemID,
    ItemName,
    CompanyID,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    IsDeleted,
    TaxID,
    Tax,
    Sales_Price,
    MRP,
    WholeSalePrice,
    BPprice,
    SP,
    BatchId,
    BatchName,
    ItemDescription,
    ItemType,
    DeletedBy,
    DeletedDateAndTime,
  } = body;

  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Main item insert/update
    request.output('ItemID', sql.Int, ItemID || 0);

    request.input('ItemName', sql.VarChar(50), ItemName);
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('CreatedBy', sql.Int, CreatedBy || null);
    request.input('CreatedDate', sql.DateTime, CreatedDate || null);
    request.input('ModifiedBy', sql.Int, ModifiedBy || null);
    request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
    request.input('IsDeleted', sql.Int, IsDeleted || 0);
    request.input('TaxID', sql.Int, TaxID || null);
    request.input('Tax', sql.Decimal(18, 2), Tax || null);
    request.input('Sales_Price', sql.Decimal(18, 2), Sales_Price || null);
    request.input('MRP', sql.Decimal(18, 2), MRP || null);
    request.input('WholeSalePrice', sql.Decimal(18, 2), WholeSalePrice || null);
    request.input('BPprice', sql.Decimal(18, 2), BPprice || null);
    request.input('SP', sql.Decimal(18, 2), SP || null);
    request.input('BatchId', sql.Int, BatchId || null);
    request.input('BatchName', sql.VarChar(50), BatchName || null);
    request.input('ItemDescription', sql.VarChar(500), ItemDescription || null);
    request.input('ItemType', sql.VarChar(50), ItemType || '1');
    request.input('DeletedBy', sql.Int, DeletedBy || null);
    request.input('DeletedDateAndTime', sql.DateTime, DeletedDateAndTime || null);

    const result = await request.execute('WebInsertUpdateItem');
    const insertedItemID = result.output.ItemID;

    // Handle RECNOs — ensure it's an array
    let recnos = body.RECNOs || [];
    if (!Array.isArray(recnos)) {
      recnos = [recnos]; // convert single RECNO to array
    }

    // Save each image using its corresponding RECNO
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const recno = parseInt(recnos[i] || '0', 10); // default to 0 for insert

        const imageRequest = pool.request();
        imageRequest.output('RECNO', sql.Int, recno);
        imageRequest.input('ItemID', sql.Int, insertedItemID);
        imageRequest.input('Image', sql.VarBinary(sql.MAX), file.buffer);

        await imageRequest.execute('webInsertUpdateItemImage');
      }
    }

    res.json({
      success: true,
      message: 'Item processed successfully',
      ItemID: insertedItemID,
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({
      success: false,
      message: 'Error processing item',
      error: err.message,
    });
  }
});

router.get('/getitemimages', async (req, res) => {
  const itemId = parseInt(req.query.ItemID, 10);

  if (!itemId) {
    return res.status(400).json({ success: false, message: 'ItemID is required' });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input('ItemID', sql.Int, itemId)
      .execute('[WebGetItemImagesByItemID]');

    const images = result.recordset.map(row => ({
      RECNO: row.RECNO,
      ItemID: row.ItemID,
      imageBase64: `data:image/jpeg;base64,${row.Image.toString('base64')}`,
    }));

    res.json({ success: true, images });
  } catch (err) {
    console.error('Error fetching item images:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve item images',
      error: err.message,
    });
  }
});

router.get('/GetItem', async(req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).send('CompanyID is required');
    }
    
    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);
        

        const result = await request.execute('WebGetItem');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/deleteitem', async (req, res) => {
    const { ItemID, DeletedBy, DeletedDate } = req.body; // Get Empid from the request body

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('ItemID', sql.Int, ItemID)
            .input('DeletedBy', sql.Int, DeletedBy) // Use Empid from the request
            .input('DeletedDate', sql.DateTime, DeletedDate)
            .execute('dbo.webDeleteItem');

        res.status(200).json({
            success: true,
            message: 'item deleted successfully',
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





module.exports = router;