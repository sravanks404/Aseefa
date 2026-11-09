const express = require('express');
const sql = require('mssql');
const router = express.Router();
const dbConfig = require('../../../config/mssql');
// router.get('/getExpiryDoc', async (req, res) => {
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

//         const result = await request.execute('WebGetExpiryDoc');

//         res.json({
//             success: true,
//             message: 'Worker list loaded successfully',
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

router.get('/getExpiryDoc', async (req, res) => {
    const CompanyID = req.query.CompanyID;

    if (!CompanyID) {
        return res.status(400).json({
            success: false,
            message: 'CompanyID is required'
        });
    }

    try {
        await sql.connect(dbConfig);

        const request = new sql.Request();
        request.input('CompanyID', sql.Int, CompanyID);

        const result = await request.execute('WebGetExpiryDoc');

        // Parse Projects JSON string into array
        const data = result.recordset.map(item => ({
            ...item,
            Projects: item.Projects ? JSON.parse(item.Projects) : []
        }));

        res.json({
            success: true,
            message: 'Worker list loaded successfully',
            data
        });

    } catch (err) {
        console.error('SQL Error:', err);

        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
});


module.exports = router;
