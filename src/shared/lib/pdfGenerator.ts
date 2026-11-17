import jsPDF from 'jspdf';

export interface PayslipPDFData {
  employeeName: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  period: string;
  base_amount: number;
  allowances_amount: number;
  unpaid_leave_amount: number;
  gross: number;
  tax_amount: number;
  benefits_amount: number;
  net: number;
}

export function generatePayslipPDFBase64(data: PayslipPDFData): string {
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

  return doc.output('datauristring').split(',')[1];
}
