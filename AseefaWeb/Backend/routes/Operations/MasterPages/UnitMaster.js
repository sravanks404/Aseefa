const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
 
  


// router.post("/uploadProjectDocs", uploadProjectDocs.array("files"), async (req, res) => {
//   try {
//     const { UnitID } = req.body;
//     const titles = JSON.parse(req.body.titles || "[]"); // ["Site Plan","Contract",...]

//     if (!UnitID) {
//       return res.status(400).json({ success: false, message: "UnitID is required" });
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ success: false, message: "No files uploaded" });
//     }

//     // Build document objects: { title, path, originalName, uploadedAt }
//     const newDocs = req.files.map((f, i) => ({
//       title: titles[i] || f.originalname.replace(/\.[^.]+$/, ""),
//       path: `uploads/projects/${UnitID}/${f.filename}`,
//       originalName: f.originalname,
//       uploadedAt: new Date().toISOString(),
//     }));

//     const pool = await sql.connect(dbConfig);

//     // Fetch existing documents from DB
//     const existing = await pool.request()
//       .input("UnitID", sql.Int, parseInt(UnitID))
//       .query("SELECT Documents FROM dbo.Unit WHERE UnitID = @UnitID AND IsDeleted = 0");

//     let allDocs = [];
//     if (existing.recordset[0]?.Documents) {
//       try { allDocs = JSON.parse(existing.recordset[0].Documents); } catch { allDocs = []; }
//     }

//     allDocs = [...allDocs, ...newDocs];

//     // Save merged list back to Unit
//     await pool.request()
//       .input("UnitID", sql.Int, parseInt(UnitID))
//       .input("Documents", sql.NVarChar(sql.MAX), JSON.stringify(allDocs))
//       .execute("UpdateUnitDocuments");

//     res.status(200).json({
//       success: true,
//       message: "Documents uploaded successfully",
//       documents: allDocs,
//     });

//   } catch (error) {
//     console.error("Error uploading project docs:", error);
//     res.status(500).json({ success: false, message: "Server error", error: error.message });
//   }
// });



router.post("/deleteProjectDoc", async (req, res) => {
  try {
    const { UnitID, filePath } = req.body;

    if (!UnitID || !filePath) {
      return res.status(400).json({ success: false, message: "UnitID and filePath are required" });
    }

    const pool = await sql.connect(dbConfig);

    // Fetch current docs
    const existing = await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .query("SELECT Documents FROM dbo.Unit WHERE UnitID = @UnitID AND IsDeleted = 0");

    let allDocs = [];
    if (existing.recordset[0]?.Documents) {
      try { allDocs = JSON.parse(existing.recordset[0].Documents); } catch { allDocs = []; }
    }

    // Remove the doc from array
    allDocs = allDocs.filter(d => d.path !== filePath);

    // Delete physical file
    const absPath = path.join(__dirname, "../../../", filePath);

    // Save updated list
    await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .input("Documents", sql.NVarChar(sql.MAX), JSON.stringify(allDocs))
      .execute("UpdateUnitDocuments");

    res.status(200).json({ success: true, message: "Document removed", documents: allDocs });

  } catch (error) {
    console.error("Error deleting project doc:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// ── GET /api/projectfile ───────────────────────────────────────────
// Query: ?path=uploads/projects/46/1234567_file.pdf
router.get("/projectfile", (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ success: false, message: "path is required" });

    // Security: only allow uploads/projects/ paths
    if (!filePath.startsWith("uploads/projects/")) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const absPath = path.join(__dirname, "../../../", filePath);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    res.sendFile(absPath);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});



router.get('/getunit', async (req, res) => {
  try {
    const { CompanyId } = req.query;

    if (!CompanyId) {
      return res.status(400).json({
        success: false,
        message: "CompanyId is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("CompanyId", sql.Int, parseInt(CompanyId))
      .execute("WebGetUnit");

    res.status(200).json({
      success: true,
      message: "Unit data fetched successfully",
      data: result.recordset
    });

  } catch (error) {

    console.error("Full error:", error);  // ← shows full error object

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
      detail: error.toString()  // ← ADD THIS LINE temporarily
    });
  }
});

router.delete('/deleteunit', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { UnitID, DeletedBy } = src;

    if (!UnitID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "UnitID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteUnit");

    res.status(200).json({
      success: true,
      message: "Unit deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
})
router.post('/deleteunit', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {

    const { UnitID, DeletedBy } = src;

    if (!UnitID || !DeletedBy) {
      return res.status(400).json({
        success: false,
        message: "UnitID and DeletedBy are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .input("DeletedBy", sql.Int, parseInt(DeletedBy))
      .execute("WebDeleteUnit");

    res.status(200).json({
      success: true,
      message: "Unit deleted successfully"
    });

  } catch (error) {

    console.error("Error deleting unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});


router.post('/insertupdateunit', async (req, res) => {
  try {

    const { UnitID, UnitName, CreatedBy, CompanyId } = req.body;

    if (!UnitName || !CreatedBy || !CompanyId) {
      return res.status(400).json({
        success: false,
        message: "UnitName, CreatedBy and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID || 0))
      .input("UnitName", sql.VarChar(50), UnitName)
      .input("CreatedBy", sql.Int, parseInt(CreatedBy))
      .input("CompanyId", sql.Int, parseInt(CompanyId))
      .execute("WebInsertUpdateUnit");

    res.status(200).json({
      success: true,
      message: UnitID == 0 ? "Unit inserted successfully" : "Unit updated successfully"
    });

  } catch (error) {

    console.error("Error saving unit:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });

  }
});


router.post('/Newinsertupdateunit', async (req, res) => {
  try {
    const {
      UnitID, UnitName, UnitCode, StartDate, EndDate,
      Location, VehicleIds, CampIds, ClientID, CreatedBy, CompanyId,
      TotalManpower, SalesRepId     // ← add
    } = req.body;

    if (!UnitName || !CreatedBy || !CompanyId || !ClientID) {
      return res.status(400).json({
        success: false,
        message: "UnitName, CreatedBy, CompanyId and ClientID are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID || 0))
      .input("UnitName", sql.VarChar(50), UnitName)
      .input("UnitCode", sql.NVarChar(50), UnitCode || "")
      .input("StartDate", sql.Date, StartDate || null)
      .input("EndDate", sql.Date, EndDate || null)
      .input("Location", sql.VarChar(sql.MAX), Location || "")
      .input("VehicleIds", sql.NVarChar(sql.MAX), VehicleIds || "")
      .input("CampIds", sql.NVarChar(sql.MAX), CampIds || "")
      .input("ClientID", sql.Int, parseInt(ClientID))
      .input("CreatedBy", sql.Int, parseInt(CreatedBy))
      .input("CompanyId", sql.Int, parseInt(CompanyId))
      .input("TotalManpower", sql.Int, parseInt(TotalManpower) || 0)  // ← add
      .input("SalesRepId", sql.Int, SalesRepId ? parseInt(SalesRepId) : null)
      .execute("NewWebInsertUpdateUnit");

    const unitId = result.recordset?.[0]?.UnitID;

    res.status(200).json({
      success: true,
      message: parseInt(UnitID || 0) === 0 ? "Project inserted successfully" : "Project updated successfully",
      UnitID: unitId
    });

  } catch (error) {
    console.error("Error saving unit:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ── GET all projects for a client ──────────────────────────────────
router.get('/getprojectsbyclient', async (req, res) => {
  try {
    const { ClientID, CompanyId, UserID } = req.query;

    console.log("getprojectsbyclient params:", { ClientID, CompanyId, UserID });

    if (!ClientID || !CompanyId || !UserID) {
      return res.status(400).json({
        success: false,
        message: "ClientID and CompanyId are required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("ClientID", sql.Int, parseInt(ClientID))
      .input("CompanyId", sql.Int, parseInt(CompanyId))
      .input("UserID", sql.Int, parseInt(UserID))

      .execute("GetProjectsByClientID");

    res.status(200).json({
      success: true,
      projects: result.recordset || []
    });

  } catch (error) {
    console.error("Error in getprojectsbyclient:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});


// ── GET single project by UnitID ───────────────────────────────────
router.get('/getprojectbyid', async (req, res) => {
  try {
    const { UnitID } = req.query;

    console.log("getprojectbyid params:", { UnitID });

    if (!UnitID) {
      return res.status(400).json({
        success: false,
        message: "UnitID is required"
      });
    }

    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("UnitID", sql.Int, parseInt(UnitID))
      .execute("GetProjectByUnitID");

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.status(200).json({
      success: true,
      project: result.recordset[0]
    });

  } catch (error) {
    console.error("Error in getprojectbyid:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});


router.get('/getvehiclesbyproject', async (req, res) => {
  try {
    const { ProjectID } = req.query;
    if (!ProjectID) return res.status(400).json({ success: false, message: "ProjectID is required" });
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("ProjectID", sql.Int, parseInt(ProjectID))
      .execute("GetVehiclesByProjectID");
    res.status(200).json({ success: true, vehicles: result.recordset || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

router.get('/getcampsbyproject', async (req, res) => {
  try {
    const { ProjectID } = req.query;
    if (!ProjectID) return res.status(400).json({ success: false, message: "ProjectID is required" });
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("ProjectID", sql.Int, parseInt(ProjectID))
      .execute("GetCampsByProjectID");
    res.status(200).json({ success: true, camps: result.recordset || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// ── GET all camps ──────────────────────────────────────────────────
router.get('/GetCamp', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .query(`SELECT CampID, CampName FROM dbo.Camp WHERE IsDeleted = 0 ORDER BY CampName`);

    res.json({ success: true, camps: result.recordset });
  } catch (err) {
    console.error('GetCamp error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── INSERT / UPDATE camp ───────────────────────────────────────────
router.post('/InsertUpdateCamp', async (req, res) => {
  try {
    const { CampID = 0, CampName, CreatedBy = 0 } = req.body;

    if (!CampName?.trim()) {
      return res.status(400).json({ success: false, message: "CampName is required" });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CampID', sql.Int, parseInt(CampID))
      .input('CampName', sql.VarChar(100), CampName.trim())
      .input('CreatedBy', sql.Int, parseInt(CreatedBy))
      .execute('InsertUpdateCamp');

    const row = result.recordset?.[0];
    res.json({ success: true, CampID: row?.CampID, action: row?.Action });

  } catch (err) {
    console.error('InsertUpdateCamp error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE camp (soft delete) ──────────────────────────────────────
router.delete('/DeleteCamp', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {
    const { CampID, DeletedBy = 0 } = src;

    if (!CampID) {
      return res.status(400).json({ success: false, message: "CampID is required" });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CampID', sql.Int, parseInt(CampID))
      .input('DeletedBy', sql.Int, parseInt(DeletedBy))
      .execute('DeleteCamp');

    const affected = result.recordset?.[0]?.AffectedRows;
    if (affected === 0) {
      return res.status(404).json({ success: false, message: "Camp not found or already deleted" });
    }

    res.json({ success: true, message: "Camp deleted" });

  } catch (err) {
    console.error('DeleteCamp error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
})
router.post('/DeleteCamp', async (req, res) => {
    const src = { ...req.query, ...req.body };
  try {
    const { CampID, DeletedBy = 0 } = src;

    if (!CampID) {
      return res.status(400).json({ success: false, message: "CampID is required" });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('CampID', sql.Int, parseInt(CampID))
      .input('DeletedBy', sql.Int, parseInt(DeletedBy))
      .execute('DeleteCamp');

    const affected = result.recordset?.[0]?.AffectedRows;
    if (affected === 0) {
      return res.status(404).json({ success: false, message: "Camp not found or already deleted" });
    }

    res.json({ success: true, message: "Camp deleted" });

  } catch (err) {
    console.error('DeleteCamp error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/InsertUpdateProjectAllocation', async (req, res) => {
  try {
    const {
      WorkerAllocationId, UserId, ClientId, ProjectId,
      StartDate, EndDate, CampID, VehicleId,
      RoomID, BedID,
      ProjectAllocationStatus, Remarks,
      CreatedBy, CreatedDate, ModifiedBy, ModifiedDate,
      CampFilterByProject, VehicleFilterByProject,   // ← ADD
      CampStartDate, CampEndDate, VehicleStartDate, VehicleEndDate
    } = req.body;

    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    request.output('WorkerAllocationId', sql.Int, parseInt(WorkerAllocationId) || 0);
    request.input('UserId', sql.Int, parseInt(UserId));
    request.input('ClientId', sql.Int, parseInt(ClientId));
    request.input('ProjectId', sql.Int, parseInt(ProjectId));
    request.input('StartDate', sql.Date, StartDate || null);
    request.input('EndDate', sql.Date, EndDate || null);
    request.input('CampID', sql.Int, CampID ? parseInt(CampID) : null);
    request.input('VehicleId', sql.Int, VehicleId ? parseInt(VehicleId) : null);
    request.input('RoomID', sql.Int, RoomID ? parseInt(RoomID) : null);
    request.input('BedID', sql.Int, BedID ? parseInt(BedID) : null);
    request.input('ProjectAllocationStatus', sql.Int, ProjectAllocationStatus !== undefined ? parseInt(ProjectAllocationStatus) : null);
    request.input('Remarks', sql.NVarChar(sql.MAX), Remarks || null);
    request.input('CreatedBy', sql.VarChar(sql.MAX), CreatedBy || null);
    request.input('CreatedDate', sql.DateTime, CreatedDate || null);
    request.input('ModifiedBy', sql.VarChar(sql.MAX), ModifiedBy || null);
    request.input('ModifiedDate', sql.DateTime, ModifiedDate || null);
    request.input('CampFilterByProject', sql.Bit, CampFilterByProject ?? 1);
    request.input('VehicleFilterByProject', sql.Bit, VehicleFilterByProject ?? 1);  // ← ADD
    request.input('CampStartDate', sql.Date, CampStartDate || null);
    request.input('CampEndDate', sql.Date, CampEndDate || null);
    request.input('VehicleStartDate', sql.Date, VehicleStartDate || null);
    request.input('VehicleEndDate', sql.Date, VehicleEndDate || null);

    const result = await request.execute('InsertUpdateProjectAllocation');
    const newId = result.output.WorkerAllocationId;

    res.status(200).json({ success: true, message: 'Saved successfully', WorkerAllocationId: newId });

  } catch (error) {
    console.error('InsertUpdateProjectAllocation error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
router.get("/dashboardWorkers", async (req, res) => {
  const { CompanyID } = req.query;

  if (!CompanyID) {
    return res.status(400).json({ error: "CompanyID is required" });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("CompanyID", sql.Int, CompanyID)
      .execute("sp_DashboardWorkers");

    // sp returns a single summary row -> wrap in array to match
    // the res.data[0] pattern used elsewhere in Pagebody.js
    return res.json(result.recordset);
  } catch (err) {
    console.error("Error in /api/dashboardWorkers:", err);
    return res.status(500).json({ error: "Failed to fetch worker dashboard stats" });
  }
});
router.get('/GetProjectAllocationByUser', async (req, res) => {
  try {
    const { UserId } = req.query;

    if (!UserId) {
      return res.status(400).json({ success: false, message: 'UserId is required' });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('UserId', sql.Int, parseInt(UserId));

    const result = await request.execute('GetProjectAllocationByUser');

    res.status(200).json({
      success: true,
      allocations: result.recordset
    });

  } catch (error) {
    console.error('GetProjectAllocationByUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ── DELETE allocation ────────────────────────────────────────────────
router.post('/DeleteProjectAllocation', async (req, res) => {
  try {
    const { WorkerAllocationId, DeletedBy, DeletedDate } = req.body;

    if (!WorkerAllocationId) {
      return res.status(400).json({ success: false, message: 'WorkerAllocationId is required' });
    }

    const pool = await sql.connect(dbConfig);
    const request = pool.request();
    request.input('WorkerAllocationId', sql.Int, parseInt(WorkerAllocationId));
    request.input('DeletedBy', sql.VarChar(sql.MAX), DeletedBy || null);
    request.input('DeletedDate', sql.DateTime, DeletedDate || null);

    await request.execute('DeleteProjectAllocation');

    res.status(200).json({
      success: true,
      message: 'Allocation deleted successfully'
    });

  } catch (error) {
    console.error('DeleteProjectAllocation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});






module.exports = router;