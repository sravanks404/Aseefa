const express = require("express");
const router = express.Router();
const sql = require("mssql");
const dbConfig = require('../../../config/mssql');
const transporter = require('./mailer');

// ... (keep all your other existing routes unchanged) ...

router.post("/SubmitProjectEstimation", async (req, res) => {
  try {
    const { EstimationID, UserID } = req.body;
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input("EstimationID", sql.Int, EstimationID)
      .input("UserID", sql.Int, UserID || null)
      .execute("sp_SubmitProjectEstimation");

    // ── Fetch estimation summary for the email body ──
    const detailResult = await pool.request()
      .input("EstimationID", sql.Int, EstimationID)
      .execute("sp_GetProjectEstimation");

    const [headerRows] = detailResult.recordsets;
    const header = headerRows[0] || {};

    // ── Build email content ──
    const subject = `Project Estimation Submitted — ${header.ProjectName || "Untitled"} (ID: ${EstimationID})`;

    const html = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #1C2340;">
        <h2 style="color: #2D4BA9;">Project Estimation Submitted</h2>
        <p>The following project cost estimation has been submitted and is now locked for editing.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 480px;">
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Estimation ID</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">${EstimationID}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Project Name</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">${header.ProjectName || "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Manpower</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">${header.TotalManpower ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Revenue</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">₹${header.TotalRevenue ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Cost</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">₹${header.TotalCost ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold; border-bottom:1px solid #eee;">Total Result</td><td style="padding:6px 10px; border-bottom:1px solid #eee;">₹${header.TotalResult ?? "N/A"}</td></tr>
          <tr><td style="padding:6px 10px; font-weight:bold;">Net Profit / Loss</td><td style="padding:6px 10px;">₹${header.NetProfitLoss ?? "N/A"}</td></tr>
        </table>
        <p style="margin-top:16px; color:#6B7399; font-size:12px;">This is an automated notification from Haven Technical Services.</p>
      </div>
    `;

    const text = `Project Estimation Submitted\n\nEstimation ID: ${EstimationID}\nProject: ${header.ProjectName || "N/A"}\nTotal Revenue: ${header.TotalRevenue ?? "N/A"}\nTotal Cost: ${header.TotalCost ?? "N/A"}\nNet Profit/Loss: ${header.NetProfitLoss ?? "N/A"}`;

    let mailInfo = null;
    try {
      mailInfo = await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
        to: process.env.MAIL_TO_DEFAULT, 
        subject,
        text,
        html,
      });
      console.log("SubmitProjectEstimation mail accepted:", mailInfo.accepted);
    } catch (mailErr) {
      // Don't fail the whole submission if email fails — estimation is already locked in DB
      console.error("SubmitProjectEstimation email send failed:", mailErr.message);
    }

    res.json({
      success: true,
      emailSent: !!mailInfo,
      emailedTo: mailInfo?.accepted || [],
    });
  } catch (err) {
    console.error("SubmitProjectEstimation error:", err);
    const already = /already submitted/i.test(err.message);
    res.status(already ? 409 : 500).json({ success: false, message: err.message });
  }
});

module.exports = router;