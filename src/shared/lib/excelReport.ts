import * as XLSX from 'xlsx';
import { formatLeaveDate, getMonthKey, parseLeaveDate } from './dateUtils';

type Row = Record<string, string | number>;

interface EmployeeLike {
  id: string;
  name?: string;
  email?: string;
  payslip_email?: string;
  role?: string;
  department?: string;
  status?: string;
  access_level?: string;
  base_salary?: number;
  monthly_allowance?: number;
  monthly_benefits_deduction?: number;
  leave_balance?: number;
  attendance?: number;
  created_at?: string;
  phone?: string;
  location?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

interface AttendanceLike {
  employee_id: string;
  date?: string;
  hours?: number | string;
  status?: string;
  clock_in_time?: string | null;
  clock_out_time?: string | null;
}

interface LeaveLike {
  employee_id: string;
  name?: string;
  type?: string;
  from?: string;
  to?: string;
  days?: number;
  status?: string;
  lop_days?: number;
  subject?: string;
  description?: string;
}

interface PayslipLike {
  employee_id: string;
  period: string;
  gross?: number;
  net?: number;
  lop_days?: number;
  unpaid_leave_amount?: number;
}

export interface ExcelReportInput {
  employees: EmployeeLike[];
  attendanceHistory: AttendanceLike[];
  leaveRequests: LeaveLike[];
  payslips: PayslipLike[];
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const monthLabel = (key: string): string => {
  if (!key) return '';
  const [y, m] = key.split('-');
  const idx = Number(m) - 1;
  if (isNaN(idx) || idx < 0 || idx > 11) return key;
  return `${MONTHS_SHORT[idx]} ${y}`;
};

/** Group an ISO date string to a "YYYY-MM" key (prefers ISO, falls back to parser). */
const monthKeyOf = (value?: string): string => {
  if (!value) return '';
  const iso = String(value).match(/^(\d{4})-(\d{2})-/);
  if (iso) return `${iso[1]}-${iso[2]}`;
  const parsed = parseLeaveDate(value);
  return parsed ? getMonthKey(parsed) : '';
};

const formatTime = (value?: string | null): string => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const toNum = (value: unknown): number => {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
};

/** Whole months an employee has been with the company, from created_at. */
const monthsOfService = (createdAt?: string): number => {
  if (!createdAt) return 0;
  const start = new Date(createdAt);
  if (isNaN(start.getTime())) return 0;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
};

/** In-cell bar for lightweight pictorial charts. */
const bar = (value: number, max: number, width = 28): string => {
  if (max <= 0) return '';
  const filled = Math.max(0, Math.min(width, Math.round((value / max) * width)));
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
};

const nameOf = (employees: EmployeeLike[]): Map<string, string> =>
  new Map(employees.map((e) => [e.id, e.name || e.id]));

const applyCols = (ws: XLSX.WorkSheet, widths: number[]) => {
  ws['!cols'] = widths.map((w) => ({ wch: w }));
};

const addSheet = (wb: XLSX.WorkBook, name: string, rows: Row[], widths: number[]) => {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  applyCols(ws, widths);
  XLSX.utils.book_append_sheet(wb, ws, name);
};

// ---------------------------------------------------------------------------
// Sheet builders
// ---------------------------------------------------------------------------

const buildEmployeeDetails = (input: ExcelReportInput): Row[] =>
  input.employees.map((e) => ({
    'Employee ID': e.id,
    Name: e.name || '',
    Email: e.email || '',
    'Payslip Email': e.payslip_email || '',
    'Job Title': e.role || '',
    Department: e.department || '',
    Status: e.status || '',
    'Access Level': e.access_level === 'admin' ? 'Admin' : 'Employee',
    'Annual Salary': toNum(e.base_salary),
    'Monthly Allowance': toNum(e.monthly_allowance),
    'Monthly Benefits Deduction': toNum(e.monthly_benefits_deduction),
    'Leave Balance (days)': toNum(e.leave_balance),
    'Attendance (%)': toNum(e.attendance),
    'Date of Joining': e.created_at ? new Date(e.created_at).toLocaleDateString('en-GB') : '',
    'Working Duration (months)': monthsOfService(e.created_at),
    Phone: e.phone || '',
    Location: e.location || '',
    'Emergency Contact': e.emergency_contact_name || '',
    'Emergency Phone': e.emergency_contact_phone || '',
  }));

const buildDailyAttendance = (input: ExcelReportInput): Row[] => {
  const names = nameOf(input.employees);
  return input.attendanceHistory
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .map((a) => ({
      Date: a.date || '',
      'Employee ID': a.employee_id,
      'Employee Name': names.get(a.employee_id) || a.employee_id,
      Status: a.status || '',
      'Working Hours': toNum(a.hours),
      'Login Time': formatTime(a.clock_in_time),
      'Logout Time': formatTime(a.clock_out_time),
    }));
};

const buildMonthlyAttendance = (input: ExcelReportInput): Row[] => {
  const names = nameOf(input.employees);
  const map = new Map<string, { name: string; month: string; present: number; hours: number }>();

  input.attendanceHistory.forEach((a) => {
    const month = monthKeyOf(a.date);
    if (!month) return;
    const key = `${a.employee_id}|${month}`;
    const entry = map.get(key) || { name: names.get(a.employee_id) || a.employee_id, month, present: 0, hours: 0 };
    entry.present += 1;
    entry.hours += toNum(a.hours);
    map.set(key, entry);
  });

  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month) || a.name.localeCompare(b.name))
    .map((e) => ({
      Month: monthLabel(e.month),
      'Employee Name': e.name,
      'Days Present': e.present,
      'Total Hours': Number(e.hours.toFixed(2)),
      'Avg Hours/Day': e.present ? Number((e.hours / e.present).toFixed(2)) : 0,
    }));
};

const buildLoginLogout = (input: ExcelReportInput): Row[] => {
  const names = nameOf(input.employees);
  return input.attendanceHistory
    .filter((a) => a.clock_in_time || a.clock_out_time)
    .slice()
    .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    .map((a) => ({
      Date: a.date || '',
      'Employee Name': names.get(a.employee_id) || a.employee_id,
      'Employee ID': a.employee_id,
      'Login Time': formatTime(a.clock_in_time),
      'Logout Time': formatTime(a.clock_out_time),
      'Total Working Hours': toNum(a.hours),
    }));
};

const buildTotalWorkingHours = (input: ExcelReportInput): Row[] => {
  const names = nameOf(input.employees);
  const map = new Map<string, { name: string; days: number; hours: number }>();

  input.attendanceHistory.forEach((a) => {
    const entry = map.get(a.employee_id) || { name: names.get(a.employee_id) || a.employee_id, days: 0, hours: 0 };
    entry.days += 1;
    entry.hours += toNum(a.hours);
    map.set(a.employee_id, entry);
  });

  return Array.from(map.entries())
    .map(([, e]) => e)
    .sort((a, b) => b.hours - a.hours)
    .map((e) => ({
      'Employee Name': e.name,
      'Days Worked': e.days,
      'Total Working Hours': Number(e.hours.toFixed(2)),
      'Avg Hours/Day': e.days ? Number((e.hours / e.days).toFixed(2)) : 0,
    }));
};

const buildMonthlyWorkingHours = (input: ExcelReportInput): Row[] => {
  const monthly = buildMonthlyAttendance(input);
  return monthly.map((row) => ({
    Month: row.Month,
    'Employee Name': row['Employee Name'],
    'Working Hours': row['Total Hours'],
    'Days Present': row['Days Present'],
  }));
};

const buildLeaveRecords = (input: ExcelReportInput): Row[] => {
  const names = nameOf(input.employees);
  return input.leaveRequests.map((l) => ({
    'Employee Name': l.name || names.get(l.employee_id) || l.employee_id,
    'Employee ID': l.employee_id,
    'Leave Type': l.type || '',
    From: l.from ? formatLeaveDate(l.from) : '',
    To: l.to ? formatLeaveDate(l.to) : '',
    Days: toNum(l.days),
    Status: l.status || '',
    'Loss of Pay (days)': toNum(l.lop_days),
    Subject: l.subject || '',
  }));
};

const buildLopDetails = (input: ExcelReportInput): Row[] => {
  const names = nameOf(input.employees);
  const rows: Row[] = [];

  // From approved leave requests carrying LOP days.
  input.leaveRequests
    .filter((l) => toNum(l.lop_days) > 0)
    .forEach((l) => {
      rows.push({
        'Employee Name': l.name || names.get(l.employee_id) || l.employee_id,
        'Employee ID': l.employee_id,
        Month: monthLabel(monthKeyOf(l.from)),
        Source: `${l.type || 'Leave'} (${l.status || ''})`.trim(),
        'LOP Days': toNum(l.lop_days),
        'Deduction Amount': '',
      });
    });

  // From processed payslips (carry a monetary deduction).
  input.payslips
    .filter((p) => toNum(p.lop_days) > 0 || toNum(p.unpaid_leave_amount) > 0)
    .forEach((p) => {
      rows.push({
        'Employee Name': names.get(p.employee_id) || p.employee_id,
        'Employee ID': p.employee_id,
        Month: p.period || '',
        Source: 'Payslip deduction',
        'LOP Days': toNum(p.lop_days),
        'Deduction Amount': toNum(p.unpaid_leave_amount),
      });
    });

  return rows.sort((a, b) => String(a.Month).localeCompare(String(b.Month)));
};

const buildCharts = (input: ExcelReportInput): Row[] => {
  const attendanceByDate = new Map<string, Set<string>>();
  input.attendanceHistory.forEach((a) => {
    const d = a.date || '';
    if (!d) return;
    if (!attendanceByDate.has(d)) attendanceByDate.set(d, new Set());
    attendanceByDate.get(d)!.add(a.employee_id);
  });

  const expected = input.employees.filter((e) => e.status !== 'On Leave' && e.status !== 'Remote').length || 1;

  const rows: Row[] = [];
  rows.push({ Chart: 'Attendance Rate by Date', Label: '', Value: 0, Visual: '' });

  const byDate = Array.from(attendanceByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  byDate.forEach(([date, ids]) => {
    const rate = Math.min(100, Math.round((ids.size / expected) * 100));
    rows.push({ Chart: '', Label: date, Value: rate, Visual: bar(rate, 100) });
  });

  rows.push({ Chart: 'Working Hours by Day of Week', Label: '', Value: 0, Visual: '' });
  const hoursByDay = new Map<string, { total: number; count: number }>();
  input.attendanceHistory.forEach((a) => {
    const d = a.date ? new Date(a.date) : null;
    if (!d || isNaN(d.getTime())) return;
    const day = d.toLocaleDateString('en-US', { weekday: 'short' });
    const entry = hoursByDay.get(day) || { total: 0, count: 0 };
    entry.total += toNum(a.hours);
    entry.count += 1;
    hoursByDay.set(day, entry);
  });
  const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayRows = dayOrder
    .filter((d) => hoursByDay.has(d))
    .map((d) => ({ day: d, avg: hoursByDay.get(d)!.count ? hoursByDay.get(d)!.total / hoursByDay.get(d)!.count : 0 }));
  const maxAvg = Math.max(1, ...dayRows.map((r) => r.avg));
  dayRows.forEach((r) => {
    rows.push({ Chart: '', Label: r.day, Value: Number(r.avg.toFixed(2)), Visual: bar(r.avg, maxAvg) });
  });

  rows.push({ Chart: 'Monthly Working Hours (company total)', Label: '', Value: 0, Visual: '' });
  const monthlyTotals = new Map<string, number>();
  input.attendanceHistory.forEach((a) => {
    const month = monthKeyOf(a.date);
    if (!month) return;
    monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + toNum(a.hours));
  });
  const monthRows = Array.from(monthlyTotals.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(1, ...monthRows.map(([, h]) => h));
  monthRows.forEach(([month, hours]) => {
    rows.push({ Chart: '', Label: monthLabel(month), Value: Number(hours.toFixed(2)), Visual: bar(hours, maxMonth) });
  });

  return rows;
};

/**
 * Build and download a multi-tab Excel workbook summarising employees,
 * attendance, working hours, leaves and Loss of Pay.
 */
export const downloadExcelReport = (input: ExcelReportInput): void => {
  const wb = XLSX.utils.book_new();

  addSheet(wb, 'Employee Details', buildEmployeeDetails(input), [12, 22, 28, 28, 22, 18, 12, 12, 14, 16, 22, 16, 12, 16, 20, 16, 20, 20, 20]);
  addSheet(wb, 'Daily Attendance', buildDailyAttendance(input), [12, 12, 22, 14, 14, 12, 12]);
  addSheet(wb, 'Monthly Attendance', buildMonthlyAttendance(input), [12, 22, 14, 14, 14]);
  addSheet(wb, 'Login & Logout', buildLoginLogout(input), [12, 22, 12, 12, 12, 18]);
  addSheet(wb, 'Total Working Hours', buildTotalWorkingHours(input), [22, 14, 20, 16]);
  addSheet(wb, 'Monthly Working Hours', buildMonthlyWorkingHours(input), [12, 22, 16, 14]);
  addSheet(wb, 'Leave Records', buildLeaveRecords(input), [22, 12, 16, 16, 16, 8, 12, 16, 30]);
  addSheet(wb, 'LOP Details', buildLopDetails(input), [22, 12, 14, 22, 12, 18]);
  addSheet(wb, 'Charts & Trends', buildCharts(input), [34, 16, 12, 32]);

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `harmony-hr-report-${dateStr}.xlsx`);
};
