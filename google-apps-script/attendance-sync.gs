/**
 * Google Apps Script — Attendance sync for Harmony HR
 * ====================================================
 *
 * SETUP (5 minutes):
 *   1. Create a Google Sheet (or open the one you want attendance in).
 *   2. Extensions -> Apps Script.
 *   3. Paste this whole file into Code.gs and save.
 *   4. Deploy -> New deployment -> Type: "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *      Copy the Web App URL.
 *   5. Put that URL in your project's .env file as:
 *        VITE_GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/..../exec"
 *   6. Restart the dev server / redeploy the site.
 *
 * Every punch-in / punch-out event is posted here and upserted into the
 * "Attendance" sheet (one row per employee per day) with these columns:
 *
 *   Employee Name | Employee ID | Date | Login Time | Logout Time | Total Hours | Status
 *
 * NOTE: after editing this script you must create a NEW deployment version
 * (or the changes will not be picked up by the existing URL).
 */

var SHEET_NAME = 'Attendance';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    var employeeId = String(data.employeeId || '');
    var date = String(data.date || '');

    // Find an existing row for this employee + date.
    var lastRow = sheet.getLastRow();
    var rowIndex = -1;
    if (lastRow > 1) {
      var keys = sheet.getRange(2, 1, lastRow - 1, 3).getValues(); // Name, ID, Date
      for (var i = 0; i < keys.length; i++) {
        if (String(keys[i][1]) === employeeId && String(keys[i][2]) === date) {
          rowIndex = i + 2;
          break;
        }
      }
    }

    var row = [
      data.employeeName || '',
      employeeId,
      date,
      data.loginTime || '',
      data.logoutTime || '',
      (data.totalHours === null || data.totalHours === undefined) ? '' : Number(data.totalHours),
      data.status || ''
    ];

    if (rowIndex > 0) {
      // Preserve an already-recorded login/logout time if the new payload omits it.
      var existing = sheet.getRange(rowIndex, 1, 1, 7).getValues()[0];
      if (!row[3]) row[3] = existing[3];
      if (!row[4]) row[4] = existing[4];
      if (row[5] === '' || row[5] === 0) row[5] = existing[5];
      sheet.getRange(rowIndex, 1, 1, 7).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  var sheet = getOrCreateSheet();
  return jsonResponse({ ok: true, rows: sheet.getLastRow() });
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Employee Name', 'Employee ID', 'Date',
      'Login Time', 'Logout Time', 'Total Hours', 'Status'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
