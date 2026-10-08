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

  // Colors
  const primaryColor = [30, 41, 59]; // Slate 800
  const textDark = [15, 23, 42]; // Slate 900
  const textMuted = [100, 116, 139]; // Slate 500

  // 1. Top Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('AUTODIGIX HR', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('MONTHLY PAYSLIP STATEMENT', 14, 26);

  // Period Badge on Header Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Period: ${data.period}`, 196, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 196, 26, { align: 'right' });

  // 2. Employee Details Card
  let y = 44;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('EMPLOYEE DETAILS', 20, y + 10);

  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Col 1
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', 20, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(data.employeeName, 52, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', 20, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(data.employeeId, 52, y + 28);

  // Col 2
  doc.setFont('helvetica', 'bold');
  doc.text('Department:', 115, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(data.department, 142, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.text('Designation:', 115, y + 28);
  doc.setFont('helvetica', 'normal');
  doc.text(data.role, 142, y + 28);

  // 3. Compensation Breakdown Header
  y = 90;

  // Earnings Header Block
  doc.setFillColor(239, 246, 255); // Light blue
  doc.rect(14, y, 88, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 64, 175);
  doc.text('EARNINGS', 18, y + 6);
  doc.text('AMOUNT (₹)', 96, y + 6, { align: 'right' });

  // Deductions Header Block
  doc.setFillColor(254, 242, 242); // Light red
  doc.rect(108, y, 88, 9, 'F');
  doc.setTextColor(153, 27, 27);
  doc.text('DEDUCTIONS', 112, y + 6);
  doc.text('AMOUNT (₹)', 190, y + 6, { align: 'right' });

  y += 14;
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.text('Basic Salary', 18, y);
  doc.text(`₹ ${data.base_amount.toLocaleString('en-IN')}`, 96, y, { align: 'right' });

  doc.text('Income Tax (TDS)', 112, y);
  doc.text(`₹ ${data.tax_amount.toLocaleString('en-IN')}`, 190, y, { align: 'right' });

  // Row 2
  y += 9;
  doc.text('Allowances', 18, y);
  doc.text(`₹ ${data.allowances_amount.toLocaleString('en-IN')}`, 96, y, { align: 'right' });

  doc.text('Benefits & Insurance', 112, y);
  doc.text(`₹ ${data.benefits_amount.toLocaleString('en-IN')}`, 190, y, { align: 'right' });

  // Row 3 (Unpaid Leave if present)
  y += 9;
  if (data.unpaid_leave_amount > 0) {
    doc.text('Unpaid Leave Deduction', 112, y);
    doc.text(`₹ ${data.unpaid_leave_amount.toLocaleString('en-IN')}`, 190, y, { align: 'right' });
    y += 9;
  }

  // Divider Lines
  y += 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 102, y);
  doc.line(108, y, 196, y);

  // Totals
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Gross Salary', 18, y);
  doc.text(`₹ ${data.gross.toLocaleString('en-IN')}`, 96, y, { align: 'right' });

  const totalDeductions = data.tax_amount + data.benefits_amount + data.unpaid_leave_amount;
  doc.text('Total Deductions', 112, y);
  doc.text(`₹ ${totalDeductions.toLocaleString('en-IN')}`, 190, y, { align: 'right' });

  // 4. Net Salary Highlight Box
  y += 16;
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(14, y, 182, 24, 3, 3, 'FD');

  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NET TAKE-HOME PAY', 22, y + 14);

  doc.setFontSize(16);
  doc.text(`₹ ${data.net.toLocaleString('en-IN')}`, 190, y + 15, { align: 'right' });

  // 5. Payment Note & Footer
  y += 36;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Payment Status: Paid via Direct Deposit', 20, y + 7);
  doc.text('Note: For any discrepancies in this payslip, please contact the HR department.', 20, y + 13);

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated document and does not require a physical signature.', 105, 275, { align: 'center' });
  doc.text('Autodigix HR Management System • Confidential', 105, 280, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
