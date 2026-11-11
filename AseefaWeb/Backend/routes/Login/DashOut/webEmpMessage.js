// const express = require('express');
// const router = expre
 
//     const src = { ...req.query, ...req.body };
//     const { MID, DeletedBy } = src;

//     try { 
//         let pool = await sql.connect(dbConfig);
//         let result = await pool.request()
//             .input('MID', sql.Int, MID)
//             .input('DeletedBy', sql.Int, DeletedBy) // Use the imported Empid for DeletedBy
//             .input('DeletedDate', sql.DateTime, new Date()) // Use current date for DeletedDate
//             .execute('dbo.webDeleteEmpMessage');

//         res.status(200).json({
//             success: true,
//             message: 'Employee Message deleted successfully',
//             data: result.recordset
//         });
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).json({
//             success: false,
//             message: err.message
//         });
//     }
// nyID)
//             .input('CreatedBy', sql.Int, CreatedBy)
//             .input('CreatedDate', sql.DateTime, CreatedDate ||  Date()) // Use current date if not provided
//             .input('ModifiedBy', sql.Int, ModifiedBy)
//             .input('ModifiedDate', sql.DateTime, ModifiedDate ||  Date()) // Use current date if not provided
//             .execute('webInsertupdateEmpMessage');

//         const insertedMID = result.output?.MID || null; // Handle undefined output
//         res.status(200).json({ message: 'Employee Message insert/Update successfully', MID: insertedMID });

//     } catch (error) {
//         console.error('Error inserting Employee Message:', error);
//         res.status(500).json({ error: 'Insertion failed', details: error.message });
//     }
// });

// router.get('/GetWebEmpMessage', async (req, res) => {

//     const { CompanyID, activeUserId } = req.query;

//     if (!CompanyID) {
//         return res.status(400).send('CompanyID is required');
//     }


//     try {
//         await sql.connect(dbConfig);
//         const request = new sql.Request();
//         request.input('CompanyID', sql.Int, CompanyID);
//         request.input('activeUserId', sql.NVarChar(sql.MAX), activeUserId)


//         const result = await request.execute('webGetEmpMessage');
//         res.json(result.recordset);
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).send('Server error');
//     }
// });

// router.delete('/DeleteWebEmpMessage', async (req, res) => {
//     const src = { ...req.query, ...req.body };
//     const { MID, DeletedBy } = src;

//     try { 
//         let pool = await sql.connect(dbConfig);
//         let result = await pool.request()
//             .input('MID', sql.Int, MID)
//             .input('DeletedBy', sql.Int, DeletedBy) // Use the imported Empid for DeletedBy
//             .input('DeletedDate', sql.DateTime, new Date()) // Use current date for DeletedDate
//             .execute('dbo.webDeleteEmpMessage');

//         res.status(200).json({
//             success: true,
//             message: 'Employee Message deleted successfully',
//             data: result.recordset
//         });
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).json({
//             success: false,
//             message: err.message
//         });
//     }
// })
// router.post('/DeleteWebEmpMessage', async (req, res) => {
//     const src = { ...req.query, ...req.body };
//     const { MID, DeletedBy } = src;

//     try { 
//         let pool = await sql.connect(dbConfig);
//         let result = await pool.request()
//             .input('MID', sql.Int, MID)
//             .input('DeletedBy', sql.Int, DeletedBy) // Use the imported Empid for DeletedBy
//             .input('DeletedDate', sql.DateTime, new Date()) // Use current date for DeletedDate
//             .execute('dbo.webDeleteEmpMessage');

//         res.status(200).json({
//             success: true,
//             message: 'Employee Message deleted successfully',
//             data: result.recordset
//         });
//     } catch (err) {
//         console.error('SQL error:', err);
//         res.status(500).json({
//             success: false,
//             message: err.message
//         });
//     }
// });

// module.exports = router;
