export const getLocalToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Convert a Date to a local YYYY-MM-DD string (no UTC shift). */
export const toLocalISO = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Parse a leave date string.
 * Supports the current ISO format ("2026-11-20") and the legacy
 * "MMM dd" format ("Nov 20") that older leave records were stored in.
 * Returns a local Date, or null if the value cannot be parsed.
 */
export const parseLeaveDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = String(value).trim();

  // ISO yyyy-mm-dd
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Legacy "MMM dd" (year defaults to the current year)
  const legacyMatch = trimmed.match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
  if (legacyMatch) {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months.indexOf(legacyMatch[1].toLowerCase());
    if (month >= 0) {
      return new Date(new Date().getFullYear(), month, Number(legacyMatch[2]));
    }
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/** Human-friendly display of a stored leave date ("Nov 20, 2026"). */
export const formatLeaveDate = (value?: string | null): string => {
  const parsed = parseLeaveDate(value);
  if (!parsed) return value ? String(value) : '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** "YYYY-MM" key for a date string/Date — used for monthly grouping. */
export const getMonthKey = (value: string | Date): string => {
  const d = typeof value === 'string' ? parseLeaveDate(value) : value;
  if (!d || isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Number of weekdays (Mon–Fri) in the month described by a "YYYY-MM" key.
 * Used as the divisor for the per-day salary rate so unpaid leave is priced
 * against the real working days of that month instead of a fixed 22.
 */
export const getWorkingDaysInMonth = (monthKey: string): number => {
  const [y, m] = String(monthKey).split('-').map(Number);
  if (!y || !m) return 22;
  const daysInMonth = new Date(y, m, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dow = new Date(y, m - 1, day).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count || 22;
};

/**
 * True when an employee has an approved-leave entry (absent_dates row) on the
 * given local date. Used to derive "On Leave" status instead of relying on the
 * manually-set employees.status column.
 */
export const isOnLeaveOn = (
  absentDates: { date: string }[] | undefined | null,
  dateStr: string
): boolean =>
  Array.isArray(absentDates) &&
  absentDates.some((d) => String(d?.date ?? '').slice(0, 10) === dateStr);
