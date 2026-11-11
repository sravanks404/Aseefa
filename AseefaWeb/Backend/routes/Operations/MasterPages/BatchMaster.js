// const express = require('express');
// const router
 
//     const src = { ...req.query, ...req.body };
//   try {

//     const { BatchId, DeletedBy } = src;

//     if (!BatchId || !DeletedBy) {
//       return res.status(400).json({
//         success: false,
//         message: "BatchId and DeletedBy are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);

//     await pool.request()
//       .input("BatchId", sql.Int, parseInt(BatchId))
//       .input("DeletedBy", sql.Int, parseInt(DeletedBy))
//       .execute("WebDeleteBatchDetailes");

//     res.status(200).json({
//       success: true,
//       message: "Batch deleted successfully"
//     });

//   } catch (error) {

//     console.error("Error deleting batch:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });

//   }
// ss: false,
//       message: "Server error",
//       error: error.message,
//       detail: error.toString()  // ← ADD THIS LINE temporarily
//     });
//   }
// });


// router.delete('/deletebatch', async (req, res) => {
//     const src = { ...req.query, ...req.body };
//   try {

//     const { BatchId, DeletedBy } = src;

//     if (!BatchId || !DeletedBy) {
//       return res.status(400).json({
//         success: false,
//         message: "BatchId and DeletedBy are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);

//     await pool.request()
//       .input("BatchId", sql.Int, parseInt(BatchId))
//       .input("DeletedBy", sql.Int, parseInt(DeletedBy))
//       .execute("WebDeleteBatchDetailes");

//     res.status(200).json({
//       success: true,
//       message: "Batch deleted successfully"
//     });

//   } catch (error) {

//     console.error("Error deleting batch:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });

//   }
// })
// router.post('/deletebatch', async (req, res) => {
//     const src = { ...req.query, ...req.body };
//   try {

//     const { BatchId, DeletedBy } = src;

//     if (!BatchId || !DeletedBy) {
//       return res.status(400).json({
//         success: false,
//         message: "BatchId and DeletedBy are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);

//     await pool.request()
//       .input("BatchId", sql.Int, parseInt(BatchId))
//       .input("DeletedBy", sql.Int, parseInt(DeletedBy))
//       .execute("WebDeleteBatchDetailes");

//     res.status(200).json({
//       success: true,
//       message: "Batch deleted successfully"
//     });

//   } catch (error) {

//     console.error("Error deleting batch:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });

//   }
// });


// router.post('/insertupdatebatch', async (req, res) => {
//   try {

//     const { BatchId, BatchName, BatExpiryDate, CreatedBy, CompanyId } = req.body;

//     console.log("Request body:", req.body);

//     if (!BatchName || !CreatedBy || !CompanyId) {
//       return res.status(400).json({
//         success: false,
//         message: "BatchName, CreatedBy and CompanyId are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);

//     await pool.request()
//       .input("BatchId", sql.Int, parseInt(BatchId || 0))
//       .input("BatchName", sql.VarChar(100), BatchName)
//       .input("BatExpiryDate", sql.Date, BatExpiryDate ? new Date(BatExpiryDate) : null)
//       .input("CreatedBy", sql.Int, parseInt(CreatedBy))
//       .input("CompanyId", sql.Int, parseInt(CompanyId))   // ✅ FIXED
//       .execute("WebInsertUpdateBatchDetailes");

//     res.status(200).json({
//       success: true,
//       message: BatchId == 0 ? "Batch inserted successfully" : "Batch updated successfully"
//     });

//   } catch (error) {

//     console.error("Error saving batch details:", error);

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//       detail: error.toString()
//     });

//   }
// });




// module.exports = router;