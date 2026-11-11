// const express = require('express');
// const router = exp
 
//     const src = { ...req.query, ...req.body };
//   try {
//     const { GSlNo, GName } = src;
//     console.log("Request body:", src);

//     if (!GSlNo || !GName?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "GSlNo and GName are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);
//     await pool.request()
//       .input("GSlNo", sql.Int,        parseInt(GSlNo))
//       .input("GName", sql.VarChar(20), GName.trim())
//       .execute("webAcGroupMasterDeleteNew");

//     res.status(200).json({
//       success: true,
//       message: "Account group deleted successfully"
//     });
//   } catch (error) {
//     console.error("FULL DELETE ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       detail: error.toString()
//     });
//   }
// ross all groups (for combined tree) ────────────────────
// // FIX: This was the MISSING endpoint. Frontend calls /api/getaccountheaddata
// // to load all heads once so they can be injected into the group tree.
// // Uses the same GetAccountHeadnew SP but passes groupid = 0 to get everything,
// // OR uses a separate SP webGetAllAcHead — whichever your DB supports.
// // If GetAccountHeadnew only accepts a specific groupid, use the fallback below.
// router.get('/getaccountheaddata', async (req, res) => {
//   try {
//     const pool = await sql.connect(dbConfig);

//     let heads = [];

//     // OPTION A: If you have a SP that returns ALL heads (recommended)
//     // Uncomment and use this if webGetAllAcHead exists in your SQL Server:
//     // const result = await pool.request()
//     //   .input("companyId", sql.Int, parseInt(req.query.CompanyId) || 0)
//     //   .execute("webGetAllAcHead");
//     // heads = result.recordset;

//     // OPTION B (DEFAULT): Call GetAccountHeadnew for each group and merge.
//     // First get all groups, then fetch heads per group and combine.
//     const groupResult = await pool.request()
//       .input("companyId", sql.Int, parseInt(req.query.CompanyId) || 0)
//       .execute("getAccountmasterNew");

//     const groups = groupResult.recordset || [];

//     // Fetch heads for every group in parallel
//     const headPromises = groups.map(async (g) => {
//       try {
//         const r = await pool.request()
//           .input("groupid", sql.Int, g.GSlNo)
//           .execute("GetAccountHeadnew");
//         return r.recordset || [];
//       } catch {
//         return [];
//       }
//     });

//     const headArrays = await Promise.all(headPromises);
//     heads = headArrays.flat();

//     res.status(200).json({
//       success: true,
//       message: "All head data fetched successfully",
//       data: heads
//     });

//   } catch (error) {
//     console.error("Error fetching all head data:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//       detail: error.toString()
//     });
//   }
// });

// // ─── GET: Heads by groupId (for head table below the form) ──────────────────
// router.get('/getAccountHeadnew', async (req, res) => {
//   try {
//     const groupId = parseInt(req.query.groupid);

//     if (isNaN(groupId)) {
//       return res.status(400).json({ success: false, message: "Invalid groupid" });
//     }

//     const pool = await sql.connect(dbConfig);
//     const result = await pool.request()
//       .input("groupid", sql.Int, groupId)
//       .execute("GetAccountHeadnew");

//     res.status(200).json({
//       success: true,
//       message: "Account head data fetched successfully",
//       data: result.recordset
//     });
//   } catch (error) {
//     console.error("Error fetching account head data:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message,
//       detail: error.toString()
//     });
//   }
// });

// // ─── POST: Insert / Update Group (AcGroupMaster) ────────────────────────────
// router.post('/insertupdateacgroupmaster', async (req, res) => {
//   try {
//     const { GSlNo, GName, GUnder, UDate, Type, Userid } = req.body;
//     console.log("Request body:", req.body);

//     if (!GName?.trim() || !Userid) {
//       return res.status(400).json({
//         success: false,
//         message: "GName and Userid are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);
//     const request = pool.request();

//     request.output("GSlNo", sql.Int, Number(GSlNo || 0));
//     request.input("GName",  sql.VarChar(sql.MAX), GName.trim());
//     request.input("GUnder", sql.Int,              Number(GUnder || 0));
//     request.input("UDate",  sql.DateTime,         UDate ? new Date(UDate) : new Date());
//     request.input("Type",   sql.VarChar(20),      Type.trim());
//     request.input("Userid", sql.Int,              Number(Userid));

//     const result = await request.execute("webInsertUpdateAcGroupMasterNew");

//     res.status(200).json({
//       success: true,
//       message: Number(GSlNo || 0) === 0
//         ? "Account group inserted successfully"
//         : "Account group updated successfully",
//       GSlNo: result.output.GSlNo
//     });
//   } catch (error) {
//     console.error("FULL SQL ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       detail: error.toString()
//     });
//   }
// });

// // ─── DELETE: Group ───────────────────────────────────────────────────────────
// router.delete('/deleteitemAccount', async (req, res) => {
//     const src = { ...req.query, ...req.body };
//   try {
//     const { GSlNo, GName } = src;
//     console.log("Request body:", src);

//     if (!GSlNo || !GName?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "GSlNo and GName are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);
//     await pool.request()
//       .input("GSlNo", sql.Int,        parseInt(GSlNo))
//       .input("GName", sql.VarChar(20), GName.trim())
//       .execute("webAcGroupMasterDeleteNew");

//     res.status(200).json({
//       success: true,
//       message: "Account group deleted successfully"
//     });
//   } catch (error) {
//     console.error("FULL DELETE ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       detail: error.toString()
//     });
//   }
// })
// router.post('/deleteitemAccount', async (req, res) => {
//     const src = { ...req.query, ...req.body };
//   try {
//     const { GSlNo, GName } = src;
//     console.log("Request body:", src);

//     if (!GSlNo || !GName?.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "GSlNo and GName are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);
//     await pool.request()
//       .input("GSlNo", sql.Int,        parseInt(GSlNo))
//       .input("GName", sql.VarChar(20), GName.trim())
//       .execute("webAcGroupMasterDeleteNew");

//     res.status(200).json({
//       success: true,
//       message: "Account group deleted successfully"
//     });
//   } catch (error) {
//     console.error("FULL DELETE ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       detail: error.toString()
//     });
//   }
// });

// // ─── POST: Insert / Update Head (AcHead) ────────────────────────────────────
// router.post('/insertUpdateAccountHead', async (req, res) => {
//   try {
//     const { HSlNo, HName, GUnder, UDate, Type, Userid } = req.body;
//     console.log("Request Body:", req.body);

//     if (!HName?.trim() || !GUnder || !Type?.trim() || !Userid) {
//       return res.status(400).json({
//         success: false,
//         message: "HName, GUnder, Type and Userid are required"
//       });
//     }

//     const pool = await sql.connect(dbConfig);
//     const request = pool.request();

//     request.output("HSlNo", sql.Int,              Number(HSlNo || 0));
//     request.input("HName",  sql.VarChar(sql.MAX), HName.trim());
//     request.input("GUnder", sql.Int,              Number(GUnder));
//     request.input("UDate",  sql.DateTime,         UDate ? new Date(UDate) : new Date());
//     request.input("Type",   sql.VarChar(20),      Type.trim());
//     request.input("Userid", sql.Int,              Number(Userid));

//     const result = await request.execute("webInsertUpdateAccountHead");

//     res.status(200).json({
//       success: true,
//       message: Number(HSlNo || 0) === 0
//         ? "Account head inserted successfully"
//         : "Account head updated successfully",
//       HSlNo: result.output.HSlNo
//     });
//   } catch (error) {
//     console.error("FULL SQL ERROR:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//       detail: error.toString()
//     });
//   }
// });

// router.post('/deleteaccounthead', async (req, res) => {

//     try {

//         const { HSlNo, userid } = req.body;

//         console.log("Delete Request:", req.body);

//         // Validation
//         if (!HSlNo || !userid) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'HSlNo and userid are required'
//             });
//         }

//         // Database Connection
//         const pool = await sql.connect();

//         // Execute Procedure
//         const result = await pool.request()
//             .input('HSlNo', sql.Int, HSlNo)
//             .input('userid', sql.Int, userid)
//             .execute('webDeleteAccountHeadsNEW');

//         console.log("Procedure Result:", result);

//         return res.status(200).json({
//             success: true,
//             message: 'Account Head Deleted Successfully',
//             data: result.recordset
//         });

//     } catch (error) {

//         console.error("Delete Error:", error);

//         return res.status(500).json({
//             success: false,
//             message: 'Server Error',
//             error: error.message
//         });
//     }
// });

// module.exports = router;