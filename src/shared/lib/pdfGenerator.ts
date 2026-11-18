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

// ─── Helpers ────────────────────────────────────────────────────────────────

function inr(n: number): string {
  return `Rs. ${(n || 0).toLocaleString('en-IN')}`;
}

function drawHRule(doc: jsPDF, x: number, y: number, w: number, r = 0, g = 226, b = 232) {
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);
}

function sectionHeader(
  doc: jsPDF,
  label: string,
  x: number,
  y: number,
  w: number,
  bgR: number, bgG: number, bgB: number
) {
  doc.setFillColor(bgR, bgG, bgB);
  doc.rect(x, y, w, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(label, x + 4, y + 5.5);
}

function tableRow(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  w: number,
  bold = false,
  highlight = false
) {
  if (highlight) {
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y - 4, w, 8, 'F');
  }
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(9);
  doc.setTextColor(bold ? 15 : 71, bold ? 23 : 85, bold ? 42 : 105);
  doc.text(label, x + 4, y);
  doc.setTextColor(15, 23, 42);
  doc.text(value, x + w - 4, y, { align: 'right' });
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generatePayslipPDFBase64(data: PayslipPDFData): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;   // 182 mm

  // ── Colours ────────────────────────────────────────────────────────────────
  const navy   = [15,  23,  42 ] as const;
  const blue   = [37,  99,  235] as const;
  const green  = [22,  163, 74 ] as const;
  const slate  = [100, 116, 139] as const;
  const dark   = [15,  23,  42 ] as const;
  const border = [226, 232, 240] as const;
  const bgGray = [248, 250, 252] as const;

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // ══════════════════════════════════════════════════════════════════
  // 1. HEADER BANNER
  // ══════════════════════════════════════════════════════════════════
  // Dark background
  doc.setFillColor(...navy);
  doc.rect(0, 0, PAGE_W, 44, 'F');

  // Thin blue accent strip at top
  doc.setFillColor(...blue);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('AUTODIGIX', MARGIN, 20);

  // "HR" in blue
  doc.setTextColor(...blue);
  const autoW = doc.getTextWidth('AUTODIGIX');
  doc.text(' HR', MARGIN + autoW, 20);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('MONTHLY SALARY STATEMENT', MARGIN, 28);

  // Right side — period pill + date
  doc.setFillColor(...blue);
  doc.roundedRect(PAGE_W - MARGIN - 48, 10, 48, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(data.period, PAGE_W - MARGIN - 24, 16.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${generatedDate}`, PAGE_W - MARGIN, 26, { align: 'right' });

  // ══════════════════════════════════════════════════════════════════
  // 2. EMPLOYEE INFO CARD
  // ══════════════════════════════════════════════════════════════════
  let y = 52;

  doc.setFillColor(...bgGray);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, 36, 2, 2, 'FD');

  // Section label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...blue);
  doc.text('EMPLOYEE INFORMATION', MARGIN + 5, y + 7);

  drawHRule(doc, MARGIN + 5, y + 10, CONTENT_W - 10);

  // 4-column info grid
  const col1 = MARGIN + 5;
  const col2 = MARGIN + 50;
  const col3 = MARGIN + 100;
  const col4 = MARGIN + 145;
  const infoY = y + 19;

  const fields: [string, string, string, string, string, string, string, string] = [
    'Employee Name', data.employeeName || '—',
    'Employee ID',  data.employeeId || '—',
    'Department',   data.department || 'General',
    'Designation',  data.role || 'Employee',
  ];

  // Row 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(fields[0], col1, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(fields[1], col1, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(fields[2], col2, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(fields[3], col2, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(fields[4], col3, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(fields[5], col3, infoY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(fields[6], col4, infoY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...dark);
  doc.text(fields[7], col4, infoY + 6);

  // ══════════════════════════════════════════════════════════════════
  // 3. EARNINGS TABLE  (full width)
  // ══════════════════════════════════════════════════════════════════
  y += 44;

  sectionHeader(doc, 'EARNINGS', MARGIN, y, CONTENT_W, ...blue);
  y += 8;

  // Amount column header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text('COMPONENT', MARGIN + 4, y + 4);
  doc.text('AMOUNT', MARGIN + CONTENT_W - 4, y + 4, { align: 'right' });
  y += 8;

  drawHRule(doc, MARGIN, y, CONTENT_W);
  y += 6;

  const earningsRows: [string, number][] = [
    ['Basic Salary',  data.base_amount || 0],
    ['Allowances',    data.allowances_amount || 0],
  ];

  earningsRows.forEach(([label, val], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...bgGray);
      doc.rect(MARGIN, y - 4, CONTENT_W, 8, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(label, MARGIN + 4, y);
    doc.setTextColor(...dark);
    doc.text(inr(val), MARGIN + CONTENT_W - 4, y, { align: 'right' });
    y += 9;
  });

  drawHRule(doc, MARGIN, y, CONTENT_W);
  y += 6;

  // Gross total
  doc.setFillColor(37, 99, 235, 0.08 as any);
  doc.setFillColor(239, 246, 255);
  doc.rect(MARGIN, y - 4, CONTENT_W, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...blue);
  doc.text('GROSS SALARY', MARGIN + 4, y + 1);
  doc.text(inr(data.gross || 0), MARGIN + CONTENT_W - 4, y + 1, { align: 'right' });
  y += 14;

  // ══════════════════════════════════════════════════════════════════
  // 4. DEDUCTIONS TABLE  (full width)
  // ══════════════════════════════════════════════════════════════════
  sectionHeader(doc, 'DEDUCTIONS', MARGIN, y, CONTENT_W, 239, 68, 68);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text('COMPONENT', MARGIN + 4, y + 4);
  doc.text('AMOUNT', MARGIN + CONTENT_W - 4, y + 4, { align: 'right' });
  y += 8;

  drawHRule(doc, MARGIN, y, CONTENT_W);
  y += 6;

  const totalDeductions = (data.tax_amount || 0) + (data.benefits_amount || 0) + (data.unpaid_leave_amount || 0);

  const deductionRows: [string, number][] = [
    ['Income Tax (TDS)',        data.tax_amount || 0],
    ['Benefits & Insurance',    data.benefits_amount || 0],
    ['Unpaid Leave / LOP',      data.unpaid_leave_amount || 0],
  ];

  deductionRows.forEach(([label, val], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(...bgGray);
      doc.rect(MARGIN, y - 4, CONTENT_W, 8, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(label, MARGIN + 4, y);
    doc.setTextColor(val > 0 ? 185 : 15, val > 0 ? 28 : 23, val > 0 ? 28 : 42);
    doc.text(inr(val), MARGIN + CONTENT_W - 4, y, { align: 'right' });
    y += 9;
  });

  drawHRule(doc, MARGIN, y, CONTENT_W);
  y += 6;

  // Total deductions row
  doc.setFillColor(255, 247, 247);
  doc.rect(MARGIN, y - 4, CONTENT_W, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(185, 28, 28);
  doc.text('TOTAL DEDUCTIONS', MARGIN + 4, y + 1);
  doc.text(inr(totalDeductions), MARGIN + CONTENT_W - 4, y + 1, { align: 'right' });
  y += 14;

  // ══════════════════════════════════════════════════════════════════
  // 5. NET PAY — prominent highlight box
  // ══════════════════════════════════════════════════════════════════
  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(...green);
  doc.setLineWidth(0.8);
  doc.roundedRect(MARGIN, y, CONTENT_W, 26, 3, 3, 'FD');

  // Left text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...green);
  doc.text('NET PAY', MARGIN + 6, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text(`Take-home for ${data.period}`, MARGIN + 6, y + 18);

  // Right — big number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(21, 128, 61);
  doc.text(inr(data.net || 0), MARGIN + CONTENT_W - 6, y + 16, { align: 'right' });

  y += 34;

  // ══════════════════════════════════════════════════════════════════
  // 6. SUMMARY STRIP  (3 quick-stat boxes)
  // ══════════════════════════════════════════════════════════════════
  const boxW = (CONTENT_W - 8) / 3;

  const stats: [string, string, number[]][] = [
    ['Gross Salary',       inr(data.gross || 0),        [...blue]],
    ['Total Deductions',   inr(totalDeductions),         [239, 68, 68]],
    ['Net Take-Home',      inr(data.net || 0),           [...green]],
  ];

  stats.forEach(([label, val, colour], i) => {
    const bx = MARGIN + i * (boxW + 4);
    doc.setFillColor(...bgGray as [number,number,number]);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, boxW, 20, 2, 2, 'FD');

    // colour accent bar on left
    doc.setFillColor(...colour as [number,number,number]);
    doc.rect(bx, y, 2, 20, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slate);
    doc.text(label, bx + 6, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...colour as [number,number,number]);
    doc.text(val, bx + 6, y + 15);
  });

  y += 28;

  // ══════════════════════════════════════════════════════════════════
  // 7. NOTICE BOX
  // ══════════════════════════════════════════════════════════════════
  doc.setFillColor(...bgGray);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...dark);
  doc.text('NOTICE', MARGIN + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slate);
  doc.text(
    'This is an official monthly salary statement. For discrepancies contact HR at Info@autodigix.in',
    MARGIN + 5, y + 13
  );

  // ══════════════════════════════════════════════════════════════════
  // 8. FOOTER
  // ══════════════════════════════════════════════════════════════════
  doc.setFillColor(...navy);
  doc.rect(0, 282, PAGE_W, 15, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Computer-generated document — no signature required  •  Autodigix HR Management System  •  Confidential',
    PAGE_W / 2, 291,
    { align: 'center' }
  );

  return doc.output('datauristring').split(',')[1];
}
