// Google Sheets attendance sync.
//
// Attendance punch events are pushed to a Google Apps Script Web App that is
// bound to a Google Sheet (see google-apps-script/attendance-sync.gs).
//
// Configure the deploy URL through the VITE_GOOGLE_SHEETS_WEBHOOK_URL env var.
// When it is not configured the sync is simply skipped, so the app keeps
// working with the in-app records only.

export interface AttendanceSheetEntry {
  employeeName: string;
  employeeId: string;
  date: string;              // YYYY-MM-DD
  loginTime?: string | null;  // e.g. "09:42:10"
  logoutTime?: string | null; // e.g. "18:05:44"
  totalHours?: number | null; // total working hours
  status: string;             // "Clocked In" | "Clocked Out"
}

/**
 * Fire-and-forget sync of a single punch event to Google Sheets.
 * Never throws — a failed sync must not break clock-in/clock-out.
 */
export const syncAttendanceToSheet = (entry: AttendanceSheetEntry) => {
  const url = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined;
  if (!url) return;

  try {
    // text/plain + no-cors avoids the CORS preflight that Apps Script does not answer.
    fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(entry),
    }).catch((err) => {
      console.warn('Google Sheets attendance sync failed:', err);
    });
  } catch (err) {
    console.warn('Google Sheets attendance sync failed:', err);
  }
};

/** Format a timestamp (Date | ISO string | epoch ms) as a local HH:mm:ss string. */
export const formatClockTime = (value?: string | number | Date | null): string | null => {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
