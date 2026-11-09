const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
const transporter = require('../../../mailer');  

// ---------------------------------------------------------
// GET /GetProjectEstimationList?CompanyID=&ClientID=&SubmissionStatus=
// ---------------------------------------------------------
router.get("/GetProjectEstimationList", async (req, res) => {
  try {
    const { CompanyID, ClientID, SubmissionStatus } = req.query;
    const pool = await sql.connect(dbConfig); 
    const result = await pool.request()
      .input("CompanyID", sql.Int, CompanyID)
      .input("ClientID", sql.Int, ClientID || null)
      .input("SubmissionStatus", sql.Bit, SubmissionStatus === undefined ? null : Number(SubmissionStatus))
      .execute("sp_GetProjectEstimationList");

    res.json({ success: true, estimations: result.recordset });
  } catch (err) {
    console.error("GetProjectEstimationList error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------
// GET /GetProjectEstimationByProject?CompanyID=&ClientID=&ProjectID=
// Used by the UI to auto-load an existing draft/submitted
// estimation the moment a Client + Project is selected.
// Returns { success:true, exists:false } if nothing saved yet —
// that is the normal "new estimation" case, not an error.
// ---------------------------------------------------------
router.get("/GetProjectEstimationByProject", async (req, res) => {
  try {
    const { CompanyID, ClientID, ProjectID } = req.query;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("CompanyID", sql.Int, CompanyID)
      .input("ClientID", sql.Int, ClientID)
      .input("ProjectID", sql.Int, ProjectID)
      .execute("sp_GetProjectEstimationByProject");

    const [headerRows, tradeRows, costRows, supplierRows] = result.recordsets;

    if (!headerRows.length) {
      return res.json({ success: true, exists: false });
    }

    res.json({
      success: true,
      exists: true,
      ...headerRows[0],
      trades: tradeRows,
      projectCosts: costRows[0] || {},
      suppliers: supplierRows,
    });
  } catch (err) {
    console.error("GetProjectEstimationByProject error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------
// GET /GetProjectEstimationDetails/:estimationId
// ---------------------------------------------------------
router.get("/GetProjectEstimationDetails/:estimationId", async (req, res) => {
  try {
    const { estimationId } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input("EstimationID", sql.Int, estimationId)
      .execute("sp_GetProjectEstimation");

    // recordsets[0]=header, [1]=trades, [2]=projectCosts, [3]=suppliers
    const [headerRows, tradeRows, costRows, supplierRows] = result.recordsets;

    if (!headerRows.length) {
      return res.json({ success: false, message: "Estimation not found" });
    }

    res.json({
      success: true,
      ...headerRows[0],
      trades: tradeRows,
      projectCosts: costRows[0] || {},
      suppliers: supplierRows,
    });
  } catch (err) {
    console.error("GetProjectEstimationDetails error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------------------------------------------------
// POST /InsertUpdateProjectEstimation
// body: { EstimationID?, CompanyID, ClientID, ProjectID, ProjectName,
//         Commission, CreatedBy/ModifiedBy as UserID,
//         Trades: [...], ProjectCosts: {...}, Suppliers: [...] }
// Blocked server-side (inside the SP) once SubmissionStatus = 0.
// ---------------------------------------------------------
// router.post("/InsertUpdateProjectEstimation", async (req, res) => {
//   try {
//     const body = req.body;

//     console.log("Suppliers payload:", JSON.stringify(body.Suppliers, null, 2)); // <-- ADD THIS LINE

//     const pool = await sql.connect(dbConfig);

//     const estReq = pool.request()
//       .input("EstimationID", sql.Int, body.EstimationID || null)
//       .input("CompanyID", sql.Int, body.CompanyID)
//       .input("ClientID", sql.Int, body.ClientID)
//       .input("ProjectID", sql.Int, body.ProjectID)
//       .input("ProjectName", sql.NVarChar(255), body.ProjectName || null)
//       .input("Commission", sql.Decimal(18, 2), body.Commission || 0)
//       .input("UserID", sql.Int, body.UserID || null)
//       .input("TradesJson", sql.NVarChar(sql.MAX), JSON.stringify(body.Trades || []))
//       .input("CostsJson", sql.NVarChar(sql.MAX), JSON.stringify(body.ProjectCosts || {}))
//       .input("SuppliersJson", sql.NVarChar(sql.MAX), JSON.stringify(body.Suppliers || []))
//       .output("NewEstimationID", sql.Int);

//     const result = await estReq.execute("sp_SaveProjectEstimation");
//     const estimationId = result.output.NewEstimationID;

//     res.json({ success: true, EstimationID: estimationId });
//   } catch (err) {
//     console.error("InsertUpdateProjectEstimation error:", err);
//     const locked = /submitted and cannot be edited/i.test(err.message);
//     res.status(locked ? 409 : 500).json({ success: false, message: err.message });
//   }
// });

router.post("/InsertUpdateProjectEstimation", async (req, res) => {
  try {
    const body = req.body;
    const pool = await sql.connect(dbConfig);

    const estReq = pool.request()
      .input("EstimationID", sql.Int, body.EstimationID || null)
      .input("CompanyID", sql.Int, body.CompanyID)
      .input("ClientID", sql.Int, body.ClientID)
      .input("ProjectID", sql.Int, body.ProjectID)
      .input("ProjectName", sql.NVarChar(255), body.ProjectName || null)
      .input("Commission", sql.Decimal(18, 2), body.Commission || 0)
      .input("UserID", sql.Int, body.UserID || null)
      .input("TradesJson", sql.NVarChar(sql.MAX), JSON.stringify(body.Trades || []))
      .input("CostsJson", sql.NVarChar(sql.MAX), JSON.stringify(body.ProjectCosts || {}))
      .input("SuppliersJson", sql.NVarChar(sql.MAX), JSON.stringify(body.Suppliers || []))
      .output("NewEstimationID", sql.Int);

    const result = await estReq.execute("sp_SaveProjectEstimation");
    const estimationId = result.output.NewEstimationID;
    const isNew = !body.EstimationID;

    // ── Fetch summary for the email body ──
    const detailResult = await pool.request()
      .input("EstimationID", sql.Int, estimationId)
      .execute("sp_GetProjectEstimation");
    const [headerRows] = detailResult.recordsets;
    const header = headerRows[0] || {};

    const subject = `Project Estimation ${isNew ? "Created" : "Updated"} — ${header.ProjectName || "Untitled"} (ID: ${estimationId})`;

    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1C2340;">
        <h2 style="color: #2D4BA9;">Project Estimation ${isNew ? "Saved" : "Updated"}</h2>
        <p>A project cost estimation has been ${isNew ? "created" : "updated"} (still editable / draft).</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 480px;">
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Estimation ID</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">${estimationId}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Project Name</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">${header.ProjectName || "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Manpower</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">${header.TotalManpower ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Revenue</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">₹${header.TotalRevenue ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Cost</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">₹${header.TotalCost ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold;">Total Result</td><td style="padding:6px 10px;">₹${header.TotalResult ?? "N/A"}</td></tr>
        </table>
        <p style="margin-top:12px; color:#F59E0B; font-size:12px;">Note: This is a draft — not yet submitted/locked.</p>
        <p style="margin-top:8px; color:#6B7399; font-size:12px;">This is an automated notification from Haven Technical Services.</p>
      </div>
    `;

    const text = `Project Estimation ${isNew ? "Created" : "Updated"}\n\nEstimation ID: ${estimationId}\nProject: ${header.ProjectName || "N/A"}\nTotal Revenue: ${header.TotalRevenue ?? "N/A"}\nTotal Cost: ${header.TotalCost ?? "N/A"}\nTotal Result: ${header.TotalResult ?? "N/A"}\n\n(Draft — not yet submitted)`;

    let mailInfo = null;
    try {
      mailInfo = await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_TO_DEFAULT,
        subject,
        text,
        html,
      });
      console.log("InsertUpdateProjectEstimation mail accepted:", mailInfo.accepted);
    } catch (mailErr) {
      console.error("InsertUpdateProjectEstimation email send failed:", mailErr.message);
    }

    res.json({
      success: true,
      EstimationID: estimationId,
      emailSent: !!mailInfo,
      emailedTo: mailInfo?.accepted || [],
    });
  } catch (err) {
    console.error("InsertUpdateProjectEstimation error:", err);
    const locked = /submitted and cannot be edited/i.test(err.message);
    res.status(locked ? 409 : 500).json({ success: false, message: err.message });
  }
});


router.post("/SubmitProjectEstimation", async (req, res) => {
  try {
    const { EstimationID, UserID } = req.body;
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("EstimationID", sql.Int, EstimationID)
      .input("UserID", sql.Int, UserID || null)
      .execute("sp_SubmitProjectEstimation");

    res.json({ success: true });
  } catch (err) {
    console.error("SubmitProjectEstimation error:", err);
    const already = /already submitted/i.test(err.message);
    res.status(already ? 409 : 500).json({ success: false, message: err.message });
  }
});

router.post("/DeleteProjectEstimation", async (req, res) => {
  try {
    const { EstimationID } = req.body;
    const pool = await sql.connect(dbConfig); 
    await pool.request()
      .input("EstimationID", sql.Int, EstimationID)
      .execute("sp_DeleteProjectEstimation");

    res.json({ success: true });
  } catch (err) {
    console.error("DeleteProjectEstimation error:", err);
    const locked = /Only draft/i.test(err.message);
    res.status(locked ? 409 : 500).json({ success: false, message: err.message });
  }
});

module.exports = router;