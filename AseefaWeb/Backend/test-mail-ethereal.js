// test-mail-ethereal.js
// No real email account needed — this creates a temporary throwaway test inbox.
// Run with: node test-mail-ethereal.js

const nodemailer = require('nodemailer');

async function main() {
  // 1. Ask Nodemailer to create a temporary Ethereal test account (free, auto-generated)
  const testAccount = await nodemailer.createTestAccount();
  console.log('Created temporary test account:');
  console.log('  user:', testAccount.user);
  console.log('  pass:', testAccount.pass);

  // 2. Build a transporter using those temporary credentials
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // 3. Send a test email (goes nowhere real — it's captured by Ethereal)
  const info = await transporter.sendMail({
    from: '"Test Sender" <test@example.com>',
    to: 'arun@microtechsoftware.com', 
    subject: 'Test Email - Nodemailer Working',
    text: 'This is a test email sent through Ethereal (no real account used).',
  });

  console.log('Message sent!');
  console.log('Message ID:', info.messageId);

  // 4. This is the important part — a link to VIEW the actual email that was "sent"
  console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
}

main().catch(console.error);