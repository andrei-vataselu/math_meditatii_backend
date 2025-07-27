// Placeholder for email integration (SendGrid, Mailgun, or Google Mail API)
// Configure with your provider and credentials

const nodemailer = require('nodemailer');

let transporter;
if (process.env.EMAIL_PROVIDER === 'sendgrid') {
  transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: process.env.SENDGRID_USERNAME,
      pass: process.env.SENDGRID_PASSWORD
    }
  });
} else if (process.env.EMAIL_PROVIDER === 'mailgun') {
  transporter = nodemailer.createTransport({
    service: 'Mailgun',
    auth: {
      user: process.env.MAILGUN_USERNAME,
      pass: process.env.MAILGUN_PASSWORD
    }
  });
} else {
  // Default: use Gmail for dev/testing
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || 'no-reply@mathmeditations.com',
    to,
    subject,
    html
  });
}

module.exports = { sendEmail };
