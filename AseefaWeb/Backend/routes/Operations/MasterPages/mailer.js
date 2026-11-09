const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // true only if using port 465
  auth: {
    user: process.env.MAIL_USER,   
    pass: process.env.MAIL_PASS,   
  },
});

module.exports = transporter;