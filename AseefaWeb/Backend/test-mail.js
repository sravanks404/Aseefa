

require('dotenv').config(); // loads MAIL_HOST, MAIL_USER, MAIL_PASS, etc. from .env
console.log('MAIL_USER:', JSON.stringify(process.env.MAIL_USER));
console.log('MAIL_PASS length:', (process.env.MAIL_PASS || '').length);
console.log('MAIL_PASS preview:', JSON.stringify((process.env.MAIL_PASS || '').slice(0, 4)) + '...');
const transporter = require('./mailer'); // adjust path if mailer.js is elsewhere

async function main() {
  console.log('Using MAIL_USER:', process.env.MAIL_USER);
  console.log('Using MAIL_HOST:', process.env.MAIL_HOST, 'PORT:', process.env.MAIL_PORT);

  try {
    // First, verify the SMTP connection/credentials without sending anything
    await transporter.verify();
    console.log('✅ SMTP connection verified — credentials are accepted.');

    // Now actually send a test email
    const info = await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'Test Sender'}" <${process.env.MAIL_USER}>`,
      to: 'sureshkavyak6@gmail.com',
      subject: 'Test Email — SMTP Working ✅', 
      text: 'This is a test email to confirm Nodemailer + Gmail SMTP credentials are working correctly.',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ Failed to send test email.');
    console.error(err);
  }
}

main();