import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, html, pdfBase64, filename } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required fields: to, subject' });
  }

  const smtpEmail = process.env.SMTP_EMAIL || "ZYRADIGITALSofficial@gmail.com";
  const smtpPassword = process.env.SMTP_PASSWORD || "urlu oupv tewx nrzv";

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: filename || 'Payslip.pdf',
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf',
      });
    }

    const info = await transporter.sendMail({
      from: `"Autodigix HR" <${smtpEmail}>`,
      to,
      subject,
      text,
      html: html || `<p>${text.replace(/\n/g, '<br/>')}</p>`,
      attachments,
    });

    console.log('Email dispatched successfully:', info.messageId);
    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send email via SMTP:', error);
    return res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}
