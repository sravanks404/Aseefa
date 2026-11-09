const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');


router.post('/webInsertUpdateTask', async (req, res) => {
  const {
    TID,
    Taskname,
    TDate,
    Status,
    CompanyID,
    CreatedBy,
    ModifiedBy,
    ModifiedDate
  } = req.body;



  try {
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    // Insert data
    const result = await request
      .input('TID', sql.Int, TID)
      .input('Taskname', sql.VarChar(sql.MAX), Taskname)
      .input('TDate', sql.Date, TDate)

      .input('Status', sql.Int, Status)
      .input('CompanyID', sql.Int, CompanyID)
      .input('CreatedBy', sql.Int, CreatedBy)
      .input('CreatedDate', sql.DateTime, new Date())
      .input('ModifiedBy', sql.Int, ModifiedBy)
      .input('ModifiedDate', sql.DateTime, ModifiedDate)
      .execute('webInsertUpdateTask');

    const insertedTID = result.output.TID;
    res.status(200).json();
  } catch (error) {
    console.log('Error inserting data:', error);
    res.status(500).json({ error: 'Failed to insert data', details: error.message });
  }
});


router.put('/updateTask', async (req, res) => {
  const { TID, Taskname, TDate, Status, CompanyID, CreatedBy, CreatedDate, ModifiedBy, ModifiedDate, IsDeleted } = req.body;

  if (!TID) {
    return res.status(400).send('TID is required for update');
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();

    request.input('TID', sql.Int, TID);
    request.input('Taskname', sql.VarChar(255), Taskname || null);
    request.input('Date', sql.DateTime, TDate ? new Date(TDate) : null);
    request.input('Status', sql.Int, Status || null);
    request.input('CompanyID', sql.Int, CompanyID);
    request.input('CreatedBy', sql.Int, CreatedBy || null);
    request.input('CreatedDate', sql.DateTime, CreatedDate ? new Date(CreatedDate) : new Date());
    request.input('ModifiedBy', sql.Int, ModifiedBy || null);
    request.input('ModifiedDate', sql.DateTime, ModifiedDate ? new Date(ModifiedDate) : new Date());
    request.input('IsDeleted', sql.Int, IsDeleted || 0);

    const result = await request.execute('webInsertUpdateTask');

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.log('SQL error:', err);
    res.status(500).send('Server error');
  }
});

router.delete('/webDeleteTask', async (req, res) => {
  const { TID, DeletedBy } = req.body;

  if (!TID || !DeletedBy) {
    return res.status(400).send('TID and DeletedBy are required for deletion');
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('TID', sql.Int, TID)
      .input('DeletedBy', sql.Int, DeletedBy)
      .input('DeletedDate', sql.DateTime, new Date())
      .execute('webDeleteTask');

    // console.log('Rows affected:', result.rowsAffected[0]);

    res.status(200).json({
      success: true,
      message: 'Employee Message deleted successfully',
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

router.get('/webGetTask', async (req, res) => {
  const { CompanyID } = req.query;
  if (!CompanyID) {
    return res.status(400).send('CompanyID is required');
  }

  try {
    await sql.connect(dbConfig);
    const request = new sql.Request();
    request.input('CompanyID', sql.Int, parseInt(CompanyID, 10));

    const result = await request.execute('webGetTask');
    // console.log('DB Query Result:', result.recordset); // Debugging the database result

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router; 