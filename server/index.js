import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Set up Nodemailer transporter using Google SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // Use an App Password, not normal password
  },
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing required fields: to, subject' });
  }

  // If SMTP is not configured, we simulate success for demo purposes but log a warning
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.warn(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return res.status(200).json({ success: true, simulated: true });
  }

  try {
    const info = await transporter.sendMail({
      from: `"Autodigix HR" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Generic logging route for frontend to send logs to terminal
app.post('/api/log', (req, res) => {
  const { action, details, status } = req.body;
  const timestamp = new Date().toISOString();
  
  const statusColor = status === 'error' ? '\x1b[31m' : '\x1b[32m'; // Red or Green
  const resetColor = '\x1b[0m';
  
  console.log(`\n[${timestamp}] ${statusColor}Operation: ${action}${resetColor}`);
  console.log(`Details: ${JSON.stringify(details, null, 2)}`);
  
  res.status(200).json({ success: true });
});

const PORT = process.env.SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

// Prevent nodemon from crashing on unhandled errors — log them instead
process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31m[SERVER] Unhandled Promise Rejection:\x1b[0m', reason);
});
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m[SERVER] Uncaught Exception:\x1b[0m', err.message);
});
