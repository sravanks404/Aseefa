const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/deletecompany', async (req, res) => {
    const { CompanyId, DeletedDate, DeletedBy } = req.body;

    try {
        if (!CompanyId || !DeletedBy) {
            return res.status(400).json({
                success: false,
                message: "CompanyId and DeletedBy are required."
            });
        }

        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('CompanyId', sql.Int, CompanyId)
            .input('DeletedBy', sql.Int, DeletedBy)
            .input('DeletedDate', sql.DateTime, DeletedDate || new Date())
            .execute('dbo.webDeleteCompany');

        const rowsAffected = result.recordset[0]?.RowsAffected || 0;

        if (rowsAffected === 0) {
            return res.status(404).json({
                success: false,
                message: "Company not found or already deleted.",
                data: result.recordset
            });
        }

        res.status(200).json({
            success: true,
            message: "Company deleted successfully",
            data: result.recordset
        });
    } catch (err) {
        console.error("SQL error:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


router.get('/getcompanyinfo', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);
    let result = await pool.request().execute('dbo.webGetCompanyInfo');

    const companies = result.recordset.map(company => ({
      ...company,
      CompanyLogo: company.CompanyLogo
        ? Buffer.from(company.CompanyLogo).toString('base64') // Optional: convert binary to base64
        : null
    }));

    res.status(200).json({
      success: true,
      data: companies
    });

  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: err.message
    });
  }
});


router.get('/getfinancialcmp/:CompanyID', async(req, res) => {


    const { CompanyID } = req.params;

    try {
        await sql.connect(dbConfig);
        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('GetFYearByCompanyID');
        res.json(result.recordset);
    } catch (err) {
        console.error('SQL error:', err);
        res.status(500).send('Server error');
    }
});

router.post('/insertcompany', upload.single('Logo'), async (req, res) => {
      const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
      const data = isMultipart ? req.body : req.body;
      const logoBuffer = isMultipart && req.file ? req.file.buffer : null;
 
  const {
    CompanyId = 0,
    TinNo,
    CstNo,
    CompanyName,
    CompanyCode,
    Address,
    TelephoneNo,
    MobileNo,
    Citty,
    state,
    District,
    Pincode,
    CreatedBy,
    CreatedDate,
    ModifiedBy,
    ModifiedDate,
    DeletedBy,
    DeletedDate,
    GSTinNo,
    Email
  } = req.body;

  try {
    let pool = await sql.connect(dbConfig);
    let request = pool.request();

const result = await request
.output('CompanyId', sql.Int, CompanyId) // single declaration, provides value and marks as output

  .input('TinNo', sql.VarChar(sql.MAX), TinNo)
  .input('CstNo', sql.VarChar(sql.MAX), CstNo)
  .input('CompanyName', sql.VarChar(sql.MAX), CompanyName)
  .input('CompanyCode', sql.VarChar(sql.MAX), '0')
  .input('Address', sql.VarChar(sql.MAX), Address)
  .input('TelephoneNo', sql.VarChar(sql.MAX), TelephoneNo)
  .input('MobileNo', sql.VarChar(sql.MAX), MobileNo)
  .input('Citty', sql.VarChar(sql.MAX), Citty)
  .input('state', sql.VarChar(sql.MAX), state)
  .input('District', sql.VarChar(sql.MAX), District)
  .input('Pincode', sql.VarChar(10), Pincode)
  .input('CreatedBy', sql.Int, CreatedBy)
  .input('CreatedDate', sql.DateTime, CreatedDate || new Date())
  .input('ModifiedBy', sql.Int, ModifiedBy)
  .input('ModifiedDate', sql.DateTime, ModifiedDate || new Date())
  .input('DeletedBy', sql.Int, DeletedBy)
  .input('DeletedDate', sql.DateTime, DeletedDate || new Date())
  .input('GSTinNo', sql.VarChar(sql.MAX), GSTinNo)
  .input('Email', sql.VarChar(sql.MAX), Email)
  .input('Logo', sql.VarBinary(sql.MAX), logoBuffer)

  .execute('dbo.WebInsertUpdateCompanyInfo');

    res.status(200).json({
      success: true,
      message: CompanyId === 0 ? 'Company inserted successfully' : 'Company updated successfully',
      CompanyId: request.parameters.CompanyId.value
    });
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).json({
      success: false,
      message: 'Database error',
      error: err.message
    });
  }
});



module.exports = router;