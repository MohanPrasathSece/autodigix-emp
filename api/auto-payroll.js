import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';

function generatePayslipPDF(data) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const navyDark = [15, 23, 42];      // #0f172a
  const brandBlue = [37, 99, 235];    // #2563eb
  const textDark = [30, 41, 59];      // #1e293b
  const textMuted = [100, 116, 139];  // #64748b
  const borderColor = [226, 232, 240];// #e2e8f0
  const bgCard = [248, 250, 252];     // #f8fafc

  // 1. Top Header Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, 210, 36, 'F');

  // Accent line
  doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.rect(0, 0, 210, 3, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AUTODIGIX HR', 14, 18);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('MONTHLY SALARY STATEMENT / PAYSLIP', 14, 26);

  // Period Badge on Header Right
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Period: ${data.period}`, 196, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(`Generated: ${formattedDate}`, 196, 26, { align: 'right' });

  // 2. Employee Details Card
  let y = 42;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(14, y, 182, 36, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
  doc.text('EMPLOYEE DETAILS', 20, y + 9);

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(20, y + 12, 190, y + 12);

  doc.setFontSize(9);

  // Col 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Employee Name:', 20, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.employeeName || '—', 56, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Employee ID:', 20, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.employeeId || '—', 56, y + 28);

  // Col 2
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Department:', 115, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.department || 'General', 145, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Designation:', 115, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.role || 'Employee', 145, y + 28);

  // 3. Compensation Breakdown Section
  y = 86;

  // Earnings Table (Left Column: x=14 to 102)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.rect(14, y, 88, 8.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('EARNINGS', 18, y + 5.5);
  doc.text('AMOUNT (INR)', 98, y + 5.5, { align: 'right' });

  // Deductions Table (Right Column: x=108 to 196)
  doc.setFillColor(241, 245, 249);
  doc.rect(108, y, 88, 8.5, 'FD');

  doc.text('DEDUCTIONS', 112, y + 5.5);
  doc.text('AMOUNT (INR)', 192, y + 5.5, { align: 'right' });

  y += 14;
  doc.setFontSize(9);

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Basic Salary', 18, y);
  doc.text(`Rs. ${(data.base_amount || 0).toLocaleString('en-IN')}`, 98, y, { align: 'right' });

  doc.text('Income Tax (TDS)', 112, y);
  doc.text(`Rs. ${(data.tax_amount || 0).toLocaleString('en-IN')}`, 192, y, { align: 'right' });

  // Row 2
  y += 8;
  doc.text('Allowances', 18, y);
  doc.text(`Rs. ${(data.allowances_amount || 0).toLocaleString('en-IN')}`, 98, y, { align: 'right' });

  doc.text('Benefits & Insurance', 112, y);
  doc.text(`Rs. ${(data.benefits_amount || 0).toLocaleString('en-IN')}`, 192, y, { align: 'right' });

  // Row 3 (Unpaid Leave if present)
  y += 8;
  if ((data.unpaid_leave_amount || 0) > 0) {
    doc.text('Unpaid Leave Deduction', 112, y);
    doc.text(`Rs. ${data.unpaid_leave_amount.toLocaleString('en-IN')}`, 192, y, { align: 'right' });
    y += 8;
  }

  // Dividers
  y += 2;
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(14, y, 102, y);
  doc.line(108, y, 196, y);

  // Totals Row
  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Gross Earnings', 18, y);
  doc.text(`Rs. ${(data.gross || 0).toLocaleString('en-IN')}`, 98, y, { align: 'right' });

  const totalDeductions = (data.tax_amount || 0) + (data.benefits_amount || 0) + (data.unpaid_leave_amount || 0);
  doc.text('Total Deductions', 112, y);
  doc.text(`Rs. ${totalDeductions.toLocaleString('en-IN')}`, 192, y, { align: 'right' });

  // 4. Net Salary Highlight Box (Purely Net Statement)
  y += 16;
  doc.setFillColor(240, 253, 244); // Soft emerald tint
  doc.setDrawColor(34, 197, 94);   // Green-500
  doc.roundedRect(14, y, 182, 24, 3, 3, 'FD');

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('TOTAL NET PAYABLE', 22, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text(`Monthly salary entitlement for ${data.period}`, 22, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 101, 52);
  doc.text(`Rs. ${(data.net || 0).toLocaleString('en-IN')}`, 190, y + 15, { align: 'right' });

  // 5. Statement Note (Purely statement notice, no direct payment claims)
  y += 34;
  doc.setFillColor(bgCard[0], bgCard[1], bgCard[2]);
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.roundedRect(14, y, 182, 22, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('STATEMENT NOTICE', 20, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('This document is an official monthly salary slip showing gross earnings, applicable statutory deductions,', 20, y + 12.5);
  doc.text('and the net payable amount. For any payroll inquiries or discrepancies, please contact the HR department.', 20, y + 17);

  // 6. Footer Disclaimer
  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.line(14, 272, 196, 272);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated payslip statement and does not require a physical signature.', 105, 277, { align: 'center' });
  doc.text('Autodigix HR Management System • Confidential & Private', 105, 281.5, { align: 'center' });

  // Return base64
  return doc.output('datauristring').split(',')[1];
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase configuration missing.' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const now = new Date();
  const day = now.getDate();

  // Target period: if day >= 25, current month; if day <= 5, previous month
  let targetDate = now;
  if (day <= 5) {
    targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }

  const period = targetDate.toLocaleString('default', { month: 'short', year: 'numeric' });

  // 1. Check if already processed
  const { data: existing } = await supabase
    .from('payslips')
    .select('id')
    .eq('period', period)
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(200).json({ success: true, message: `Payroll for ${period} was already processed.` });
  }

  // 2. Fetch active staff employees (exclude terminated and super admin)
  const { data: rawEmployees, error: empErr } = await supabase
    .from('employees')
    .select('id, name, email, department, role, status, base_salary, monthly_allowance, monthly_benefits_deduction, payslip_email, tax_percentage')
    .neq('status', 'Terminated');

  const employees = (rawEmployees || []).filter((e) =>
    e.id !== 'EMP-000' &&
    (e.email || '').toLowerCase() !== 'admin@company.com' &&
    (e.role || '').toLowerCase() !== 'admin' &&
    (e.role || '').toLowerCase() !== 'super admin' &&
    (e.name || '').toLowerCase() !== 'super admin'
  );

  if (empErr || employees.length === 0) {
    return res.status(200).json({ message: 'No active employees to process.' });
  }

  // 3. Fetch absent dates for unpaid leaves
  const { data: absentDates } = await supabase
    .from('absent_dates')
    .select('employee_id, subject');

  // 4. Calculate payslips
  const payslipsToInsert = employees.map((emp) => {
    const salary = emp.base_salary || 60000;
    const base_amount = Math.round(salary / 12);
    const allowances_amount = emp.monthly_allowance || 0;

    let unpaid_leave_amount = 0;
    const unpaidDays = (absentDates || [])
      .filter((a) => a.employee_id === emp.id && String(a.subject || '').toLowerCase().includes('unpaid'))
      .reduce((acc, a) => acc + (String(a.subject).toLowerCase().includes('half day') ? 0.5 : 1), 0);

    if (unpaidDays > 0) {
      const dailyRate = base_amount / 22;
      unpaid_leave_amount = Math.round(unpaidDays * dailyRate);
    }

    const gross = base_amount + allowances_amount - unpaid_leave_amount;
    const benefits_amount = emp.monthly_benefits_deduction || 0;
    const taxRate = (emp.tax_percentage !== null && emp.tax_percentage !== undefined && !isNaN(emp.tax_percentage))
      ? Number(emp.tax_percentage) / 100
      : 0.10;
    const tax_amount = Math.round(gross * taxRate);
    const net = gross - tax_amount - benefits_amount;

    return {
      employee_id: emp.id,
      period,
      gross,
      net,
      base_amount,
      allowances_amount,
      unpaid_leave_amount,
      tax_amount,
      benefits_amount,
      status: 'Paid',
    };
  });

  // 5. Insert into Supabase
  const { error: insertErr } = await supabase
    .from('payslips')
    .insert(payslipsToInsert);

  if (insertErr) {
    return res.status(500).json({ error: insertErr.message });
  }

  // 6. Send emails if SMTP configured
  let sentCount = 0;
  if (smtpEmail && smtpPassword) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpEmail, pass: smtpPassword },
      tls: { rejectUnauthorized: false },
    });

    for (const emp of employees) {
      const p = payslipsToInsert.find((ps) => ps.employee_id === emp.id);
      const targetEmail = emp.payslip_email || emp.email;

      if (p && targetEmail) {
        try {
          const pdfBase64 = generatePayslipPDF({
            employeeName: emp.name,
            employeeId: emp.id,
            department: emp.department || 'General',
            role: emp.role || 'Staff',
            period,
            base_amount: p.base_amount,
            allowances_amount: p.allowances_amount,
            unpaid_leave_amount: p.unpaid_leave_amount,
            gross: p.gross,
            tax_amount: p.tax_amount,
            benefits_amount: p.benefits_amount,
            net: p.net,
          });

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="background-color: #1e293b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Autodigix HR</h1>
                <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 14px;">Official Payslip Statement for ${period}</p>
              </div>
              <div style="padding: 24px; color: #334155; line-height: 1.6;">
                <p style="font-size: 16px; font-weight: bold; margin-top: 0;">Hi ${emp.name},</p>
                <p>Your monthly salary for <strong>${period}</strong> has been processed automatically.</p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Gross Salary:</td>
                      <td style="padding: 6px 0; font-weight: bold; text-align: right;">₹ ${p.gross.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #64748b;">Total Deductions:</td>
                      <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #ef4444;">- ₹ ${(p.gross - p.net).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                      <td style="padding: 10px 0 0 0; font-weight: bold; color: #0f172a; font-size: 16px;">Net Take-Home Pay:</td>
                      <td style="padding: 10px 0 0 0; font-weight: bold; text-align: right; color: #16a34a; font-size: 18px;">₹ ${p.net.toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                </div>
                <p style="font-size: 14px;">📄 <strong>Your official payslip is attached as a PDF.</strong></p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 0;">Automated month-end payroll statement from Autodigix HR.</p>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: `"Autodigix HR" <${smtpEmail}>`,
            to: targetEmail,
            subject: `Payslip Statement - ${period}`,
            text: `Hi ${emp.name},\n\nYour salary for ${period} has been processed.\nGross: ₹${p.gross}\nNet: ₹${p.net}\n\nPlease find your attached PDF payslip.`,
            html: emailHtml,
            attachments: [
              {
                filename: `Payslip_${period.replace(/\s+/g, '_')}_${emp.name.replace(/\s+/g, '_')}.pdf`,
                content: Buffer.from(pdfBase64, 'base64'),
                contentType: 'application/pdf',
              },
            ],
          });
          sentCount++;
        } catch (mailErr) {
          console.error(`Failed to email payslip to ${targetEmail}:`, mailErr);
        }
      }
    }
  }

  return res.status(200).json({
    success: true,
    period,
    processed: employees.length,
    emailsSent: sentCount,
  });
}
