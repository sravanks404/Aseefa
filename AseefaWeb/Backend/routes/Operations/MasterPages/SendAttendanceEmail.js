const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const transporter = require('../../../mailer'); // ← 3 levels up to reach Backend/mailer.js
const dbConfig = require('../../../config/mssql');

router.post('/SendAttendanceEmail', async (req, res) => {
  const { fileName, fileBase64, subject, message, html } = req.body;

  if (!fileName || !fileBase64) {
    return res.status(400).json({ success: false, message: 'fileName and fileBase64 are required.' });
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO_DEFAULT,
      subject: subject || 'Attendance Sheet',
      text: message || 'Please find attached the attendance sheet.',
      html: html || undefined,
      attachments: [{ filename: fileName, content: fileBase64, encoding: 'base64' }],
    });

    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Response:', info.response);

    res.json({ success: true, accepted: info.accepted, rejected: info.rejected });
  } catch (err) {
    console.error('SendAttendanceEmail error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;