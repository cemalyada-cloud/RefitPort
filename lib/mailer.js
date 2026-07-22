import nodemailer from 'nodemailer';

export function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,          // mail.privateemail.com (Namecheap)
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,        // noreply@refitport.com
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail({ to, subject, html }) {
  const from = process.env.SMTP_FROM || `RefitPort <${process.env.SMTP_USER}>`;
  const t = getTransport();
  return t.sendMail({ from, to, subject, html });
}
