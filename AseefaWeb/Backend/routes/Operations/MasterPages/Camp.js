const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');

// ---------------------------------------------------------
// File storage config
// ---------------------------------------------------------
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads", "camp");
if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_ROOT),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${ts}_${safeName}`);
  },
});
const upload = multer({ storage });

// ---------------------------------------------------------
// GET /api/GetCamp?CompanyID=
// ---------------------------------------------------------
router.get("/GetCamp", async (req, res) => {
  try {
    const { CompanyID } = req.query;
    console.log("Raw CompanyID from query:", CompanyID, typeof CompanyID); // ← add this

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("CompanyID", sql.Int, CompanyID)
      .execute("sp_GetCamp");

    console.log("Rows returned:", result.recordset.length);
    console.log("Distinct CompanyIDs in result:", [...new Set(result.recordset.map(r => r.CompanyID))]);

    res.json({ success: true, camps: result.recordset });
  } catch (err) {
    console.error("GetCamp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------
// GET /api/GetCampDetails/:campId
// ---------------------------------------------------------
router.get("/GetCampDetails/:campId", async (req, res) => {
  try {
    const { campId } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("CampID", sql.Int, campId)
      .execute("sp_GetCampDetails");

    // recordsets[0]=camp, [1]=rooms, [2]=beds, [3]=facilities, [4]=documents
    const [campRows, roomRows, bedRows, facilityRows, docRows] = result.recordsets;

    if (!campRows.length) {
      return res.json({ success: false, message: "Camp not found" });
    }

    const rooms = roomRows.map(r => ({
      RoomID: r.RoomID,
      RoomNo: r.RoomNo,
      FloorNo: r.FloorNo,
      RoomType: r.RoomType,
      BedCapacity: r.BedCapacity,
      RoomStatus: r.RoomStatus,
      RatePerRoom: r.RatePerRoom, 
      beds: bedRows
        .filter(b => b.RoomID === r.RoomID)
        .map(b => ({ BedID: b.BedID, BedNo: b.BedNo, BedType: b.BedType, Status: b.Status })),
    }));

    const facilities = facilityRows[0]
      ? {
          WifiAvailable: !!facilityRows[0].WifiAvailable,
          KitchenAvailable: !!facilityRows[0].KitchenAvailable,
          LaundryAvailable: !!facilityRows[0].LaundryAvailable,
          DrinkingWater: !!facilityRows[0].DrinkingWater,
          AC: !!facilityRows[0].AC,
          AttachedBathroom: !!facilityRows[0].AttachedBathroom,
          CommonBathroom: !!facilityRows[0].CommonBathroom,
          Parking: !!facilityRows[0].Parking,
          SecurityAvailable: !!facilityRows[0].SecurityAvailable,
          FirstAidFacility: !!facilityRows[0].FirstAidFacility,
        }
      : {};

    const groupDocs = (type) =>
      docRows.filter(d => d.DocType === type).map(d => d.FilePath);

    const fixedExpiry = (type) => {
      const row = docRows.find(d => d.DocType === type && d.ExpiryDate);
      return row ? row.ExpiryDate : null;
    };

    // group "other" docs by Title
    const otherMap = {};
    docRows.filter(d => d.DocType === "other").forEach(d => {
      const key = d.Title || "Untitled";
      if (!otherMap[key]) otherMap[key] = { title: key, files: [], expiryDate: d.ExpiryDate };
      otherMap[key].files.push(d.FilePath);
    });

    const documents = {
      tradeLicence: groupDocs("tradeLicence"),
      campPermit: groupDocs("campPermit"),
      municipalityApproval: groupDocs("municipalityApproval"),
      civilDefenceApproval: groupDocs("civilDefenceApproval"),
      tradeLicenceExpiry: fixedExpiry("tradeLicence"),
      campPermitExpiry: fixedExpiry("campPermit"),
      municipalityApprovalExpiry: fixedExpiry("municipalityApproval"),
      civilDefenceApprovalExpiry: fixedExpiry("civilDefenceApproval"),
      other: Object.values(otherMap),
    };

    res.json({
      success: true,
      ...campRows[0],
      rooms,
      facilities,
      documents,
    });
  } catch (err) {
    console.error("GetCampDetails error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/InsertUpdateCampFull", async (req, res) => {
  const pool = await sql.connect(dbConfig);
  const tx = new sql.Transaction(pool);
  try {
    const body = req.body;
    await tx.begin();

    // 1. Camp master
    const campReq = new sql.Request(tx);
    campReq
      .input("CampID", sql.Int, body.CampID || 0)
      .input("CampName", sql.VarChar(100), body.CampName)
      .input("Description", sql.VarChar(500), body.Description || null)
      .input("CampLocation", sql.VarChar(200), body.CampLocation || null)
      .input("Address", sql.VarChar(500), body.Address || null)
      .input("CampManagerName", sql.VarChar(100), body.CampManagerName || null)
      .input("CampManagerContactNo", sql.VarChar(20), body.CampManagerContactNo || null)
      .input("AlternateContactNo", sql.VarChar(20), body.AlternateContactNo || null)
      .input("TotalRooms", sql.Int, body.TotalRooms || 0)
      .input("TotalCapacity", sql.Int, body.TotalCapacity || 0)
      .input("CampStatus", sql.TinyInt, body.CampStatus ?? 1)
      .input("Latitude", sql.Decimal(10, 6), body.Latitude || null)
      .input("Longitude", sql.Decimal(10, 6), body.Longitude || null)
      .input("FromDate", sql.Date, body.FromDate || null)
      .input("ToDate", sql.Date, body.ToDate || null)
      .input("TotalRent", sql.Decimal(12, 2), body.TotalRent ?? null)
      .input("RentLoss", sql.Decimal(12, 2), body.RentLoss ?? null)
      .input("CompanyID", sql.Int, body.CompanyID)
      .input("CreatedBy", sql.Int, body.CreatedBy)
      .output("NewCampID", sql.Int);

    const campResult = await campReq.execute("sp_InsertUpdateCamp");
    const campId = campResult.output.NewCampID;

    const keptRoomIds = [];
    const keptBedIds = [];

    for (const room of body.Rooms || []) {
      let roomId = room.RoomID || 0;

      if (roomId > 0) {
        const roomReq = new sql.Request(tx);
        await roomReq
          .input("RoomID", sql.Int, roomId)
          .input("CampID", sql.Int, campId)
          .input("RoomNo", sql.VarChar(50), room.RoomNo)
          .input("FloorNo", sql.VarChar(20), room.FloorNo || null)
          .input("RoomType", sql.VarChar(50), room.RoomType)
          .input("BedCapacity", sql.Int, room.BedCapacity || 0)
          .input("RoomStatus", sql.VarChar(20), room.RoomStatus)
          .input("RatePerRoom", sql.Decimal(10, 2), room.RatePerRoom || null)
          .query(`UPDATE CampRoom SET
                    RoomNo = @RoomNo,
                    FloorNo = @FloorNo,
                    RoomType = @RoomType,
                    BedCapacity = @BedCapacity,
                    RoomStatus = @RoomStatus,
                    RatePerRoom = @RatePerRoom
                  WHERE RoomID = @RoomID AND CampID = @CampID`);
      } else {
        const roomReq = new sql.Request(tx);
        const roomResult = await roomReq
          .input("CampID", sql.Int, campId)
          .input("RoomNo", sql.VarChar(50), room.RoomNo)
          .input("FloorNo", sql.VarChar(20), room.FloorNo || null)
          .input("RoomType", sql.VarChar(50), room.RoomType)
          .input("BedCapacity", sql.Int, room.BedCapacity || 0)
          .input("RoomStatus", sql.VarChar(20), room.RoomStatus)
          .input("RatePerRoom", sql.Decimal(10, 2), room.RatePerRoom || null)
          .query(`INSERT INTO CampRoom (CampID, RoomNo, FloorNo, RoomType, BedCapacity, RoomStatus, RatePerRoom)
                  OUTPUT INSERTED.RoomID
                  VALUES (@CampID, @RoomNo, @FloorNo, @RoomType, @BedCapacity, @RoomStatus, @RatePerRoom)`);
        roomId = roomResult.recordset[0].RoomID;
      }

      keptRoomIds.push(roomId);

      for (const bed of room.Beds || []) {
        let bedId = bed.BedID || 0;

        if (bedId > 0) {
          const bedReq = new sql.Request(tx);
          await bedReq
            .input("BedID", sql.Int, bedId)
            .input("RoomID", sql.Int, roomId)
            .input("BedNo", sql.VarChar(20), bed.BedNo)
            .input("BedType", sql.VarChar(20), bed.BedType)
            .query(`UPDATE CampBed SET
                      BedNo = @BedNo,
                      BedType = @BedType,
                      RoomID = @RoomID
                    WHERE BedID = @BedID`);
        } else {
          const bedReq = new sql.Request(tx);
          const bedResult = await bedReq
            .input("RoomID", sql.Int, roomId)
            .input("BedNo", sql.VarChar(20), bed.BedNo)
            .input("BedType", sql.VarChar(20), bed.BedType)
            .input("Status", sql.VarChar(20), bed.Status || "Available")
            .query(`INSERT INTO CampBed (RoomID, BedNo, BedType, Status)
                    OUTPUT INSERTED.BedID
                    VALUES (@RoomID, @BedNo, @BedType, @Status)`);
          bedId = bedResult.recordset[0].BedID;
        }

        keptBedIds.push(bedId);
      }
    }

    const delBedsReq = new sql.Request(tx);
    delBedsReq.input("CampID", sql.Int, campId);

    let bedDeleteQuery = `
      DECLARE @KeptBeds TABLE (BedID INT PRIMARY KEY);
    `;
    if (keptBedIds.length > 0) {
      const bedValues = keptBedIds.map((_, i) => `(@Bed${i})`).join(",");
      keptBedIds.forEach((id, i) => delBedsReq.input(`Bed${i}`, sql.Int, id));
      bedDeleteQuery += `INSERT INTO @KeptBeds (BedID) VALUES ${bedValues};`;
    }
    bedDeleteQuery += `
      DELETE b FROM CampBed b
      INNER JOIN CampRoom r ON r.RoomID = b.RoomID
      WHERE r.CampID = @CampID
        AND b.BedID NOT IN (SELECT BedID FROM @KeptBeds);
    `;
    await delBedsReq.query(bedDeleteQuery);

    const delRoomsReq = new sql.Request(tx);
    delRoomsReq.input("CampID", sql.Int, campId);

    let roomDeleteQuery = `
      DECLARE @KeptRooms TABLE (RoomID INT PRIMARY KEY);
    `;
    if (keptRoomIds.length > 0) {
      const roomValues = keptRoomIds.map((_, i) => `(@Room${i})`).join(",");
      keptRoomIds.forEach((id, i) => delRoomsReq.input(`Room${i}`, sql.Int, id));
      roomDeleteQuery += `INSERT INTO @KeptRooms (RoomID) VALUES ${roomValues};`;
    }
    roomDeleteQuery += `
      DELETE FROM CampRoom
      WHERE CampID = @CampID
        AND RoomID NOT IN (SELECT RoomID FROM @KeptRooms);
    `;
    await delRoomsReq.query(roomDeleteQuery);

    const f = body.Facilities || {};
    const facReq = new sql.Request(tx);
    await facReq
      .input("CampID", sql.Int, campId)
      .input("WifiAvailable", sql.Bit, !!f.WifiAvailable)
      .input("KitchenAvailable", sql.Bit, !!f.KitchenAvailable)
      .input("LaundryAvailable", sql.Bit, !!f.LaundryAvailable)
      .input("DrinkingWater", sql.Bit, !!f.DrinkingWater)
      .input("AC", sql.Bit, !!f.AC)
      .input("AttachedBathroom", sql.Bit, !!f.AttachedBathroom)
      .input("CommonBathroom", sql.Bit, !!f.CommonBathroom)
      .input("Parking", sql.Bit, !!f.Parking)
      .input("SecurityAvailable", sql.Bit, !!f.SecurityAvailable)
      .input("FirstAidFacility", sql.Bit, !!f.FirstAidFacility)
      .execute("sp_UpsertCampFacility");

    const de = body.DocumentExpiry || {};
    for (const [docType, expiry] of Object.entries(de)) {
      if (!expiry) continue;
      const expReq = new sql.Request(tx);
      await expReq
        .input("CampID", sql.Int, campId)
        .input("DocType", sql.VarChar(50), docType.replace("Expiry", ""))
        .input("ExpiryDate", sql.Date, expiry)
        .query(`UPDATE CampDocument SET ExpiryDate = @ExpiryDate
                WHERE CampID = @CampID AND DocType = @DocType`);
    }

    for (const od of body.OtherDocuments || []) {
      if (!od.title) continue;
      const odReq = new sql.Request(tx);
      await odReq
        .input("CampID", sql.Int, campId)
        .input("Title", sql.VarChar(200), od.title)
        .input("ExpiryDate", sql.Date, od.expiryDate || null)
        .query(`UPDATE CampDocument SET ExpiryDate = @ExpiryDate
                WHERE CampID = @CampID AND DocType = 'other' AND Title = @Title`);
    }

    await tx.commit();
    res.json({ success: true, CampID: campId });
  } catch (err) {
    console.error("InsertUpdateCampFull error:", err);
    try {
      await tx.rollback();
    } catch (rollbackErr) {
      console.error("Rollback also failed (transaction likely already aborted):", rollbackErr.message);
    }
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/uploadCampDocs", upload.array("files"), async (req, res) => {
  try {
    const { campId, docType, title, expiryDate } = req.body; 
    const pool = await sql.connect(dbConfig);
    for (const file of req.files) {
      const relPath = path.join("camp", file.filename).replace(/\\/g, "/");
      await pool.request()
        .input("CampID", sql.Int, campId)
        .input("DocType", sql.VarChar(50), docType)
        .input("Title", sql.VarChar(200), title || null)
        .input("FilePath", sql.VarChar(500), relPath)
        .input("ExpiryDate", sql.Date, expiryDate || null)
        .query(`INSERT INTO CampDocument (CampID, DocType, Title, FilePath, ExpiryDate)
                VALUES (@CampID, @DocType, @Title, @FilePath, @ExpiryDate)`);
    }

    // return the up-to-date file list for this docType (+title if "other")
    const filesResult = await pool.request()
  .input("CampID", sql.Int, campId)
  .input("DocType", sql.VarChar(50), docType)
  .input("Title", sql.VarChar(200), title || null)
  .query(`SELECT FilePath FROM CampDocument
          WHERE CampID = @CampID AND DocType = @DocType
            AND (@Title IS NULL OR Title = @Title)
            AND IsDeleted = 0`);

    res.json({ success: true, files: filesResult.recordset.map(r => r.FilePath) });
  } catch (err) {
    console.error("uploadCampDocs error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/deleteCampDoc", async (req, res) => {
  try {
    const { campId, docType, filePath, title } = req.body;
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("CampID", sql.Int, campId)
      .input("DocType", sql.VarChar(50), docType)
      .input("FilePath", sql.VarChar(500), filePath)
      .input("Title", sql.VarChar(200), title || null)
      .execute("sp_DeleteCampDoc");

    res.json({ success: true });
  } catch (err) {
    console.error("deleteCampDoc error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post("/deleteCamp", async (req, res) => {
  try {
    const { CampID, DeletedBy } = req.body;
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("CampID", sql.Int, CampID)
      .input("DeletedBy", sql.Int, DeletedBy)
      .execute("sp_DeleteCamp");

    res.json({ success: true });
  } catch (err) {
    console.error("deleteCamp error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/SaveCampAllocationHistory', async (req, res) => {
  try {
    const { WorkerAllocationId, NewCampID, ChangedBy, Remarks } = req.body;
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('WorkerAllocationId', sql.Int, WorkerAllocationId)
      .input('NewCampID', sql.Int, NewCampID)
      .input('ChangedBy', sql.Int, ChangedBy)
      .input('ChangedDate', sql.DateTime, new Date())
      .input('Remarks', sql.VarChar(500), Remarks || null)
      .query(`INSERT INTO ProjectAllocationCampHistory
                (WorkerAllocationId, CampID, ChangedBy, ChangedDate, Remarks)
              VALUES
                (@WorkerAllocationId, @NewCampID, @ChangedBy, @ChangedDate, @Remarks)`);
    res.json({ success: true });
  } catch (err) {
    console.error('SaveCampAllocationHistory error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.get('/GetCampAllocationHistory', async (req, res) => {
  try {
    const { WorkerAllocationId } = req.query;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('WorkerAllocationId', sql.Int, WorkerAllocationId)
      .query(`
        SELECT 
          h.HistoryID,
          h.CampID,
          c.CampName,
          h.ChangedBy,
          h.ChangedDate,
          h.Remarks
        FROM ProjectAllocationCampHistory h
        LEFT JOIN Camp c ON c.CampID = h.CampID
        WHERE h.WorkerAllocationId = @WorkerAllocationId
        ORDER BY h.ChangedDate DESC
      `);
    res.json({ success: true, history: result.recordset });
  } catch (err) {
    console.error('GetCampAllocationHistory error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/campfile", (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).send("Missing path");

  const safePath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(__dirname, "..", "..", "..", "uploads", safePath);

  if (!fullPath.startsWith(UPLOAD_ROOT)) {
    return res.status(400).send("Invalid path");
  }
  if (!fs.existsSync(fullPath)) {
    return res.status(404).send("File not found");
  }
  res.sendFile(fullPath);
});

router.post('/AssignBedToWorker', async (req, res) => {
  const { UserID, NewBedID, OldBedID } = req.body;
  const pool = await sql.connect(dbConfig);
  const tx = new sql.Transaction(pool);
  try {
    await tx.begin();

    // Release only the specific OLD bed for this allocation row,
    // not ALL beds the worker holds (other projects keep their beds).
    if (OldBedID && OldBedID !== NewBedID) {
      const releaseReq = new sql.Request(tx);
      await releaseReq
        .input('BedID', sql.Int, OldBedID)
        .input('UserID', sql.Int, UserID)
        .query(`UPDATE CampBed
                SET UserID = NULL, Status = 'Available', ModifiedDate = GETDATE()
                WHERE BedID = @BedID AND UserID = @UserID`);
    } else if (!NewBedID && !OldBedID) {
      // No bed info at all — no-op, don't touch anything
    } else if (!NewBedID && OldBedID) {
      // Clearing a bed with no replacement
      const releaseReq = new sql.Request(tx);
      await releaseReq
        .input('BedID', sql.Int, OldBedID)
        .input('UserID', sql.Int, UserID)
        .query(`UPDATE CampBed
                SET UserID = NULL, Status = 'Available', ModifiedDate = GETDATE()
                WHERE BedID = @BedID AND UserID = @UserID`);
    }

    // Occupy the new bed if specified and different from old
    if (NewBedID && NewBedID !== OldBedID) {
      const occupyReq = new sql.Request(tx);
      await occupyReq
        .input('BedID', sql.Int, NewBedID)
        .input('UserID', sql.Int, UserID)
        .query(`UPDATE CampBed
                SET UserID = @UserID, Status = 'Occupied', ModifiedDate = GETDATE()
                WHERE BedID = @BedID`);
    }

    await tx.commit();
    res.json({ success: true });
  } catch (err) {
    await tx.rollback();
    console.error('AssignBedToWorker error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


router.get('/GetUnlinkedCamps', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool
            .request()
            .execute('usp_GetUnlinkedCamps');

        res.json({
            success: true,
            camps: result.recordset
        });

    } catch (err) {
        console.error('GetUnlinkedCamps Error:', err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});
router.get('/GetUnlinkedVehicles', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);

        const result = await pool
            .request()
            .execute('usp_GetUnlinkedVehicles');

        res.json({
            success: true,
            vehicles: result.recordset
        });

    } catch (err) {
        console.error('GetUnlinkedVehicles Error:', err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


router.get("/GetCampClientLocations/:campId", async (req, res) => {
  try {
    const { campId } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("CampID", sql.Int, campId)
      .execute("sp_GetCampClientLocations");

    res.json({ success: true, locations: result.recordset });
  } catch (err) {
    console.error("GetCampClientLocations error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}); 

module.exports = router;