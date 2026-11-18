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
 * BACKFILL FUNCTION:
 *   To backfill all November attendance, use the custom menu:
 *   1. Reload the page (F5 or Ctrl+Shift+R to clear cache)
 *   2. Go to menu: Custom > Backfill Attendance from Supabase
 *   3. Authorize when prompted
 *   4. Wait for completion message
 *
 * NOTE: After editing this script, create a NEW deployment version
 * (the existing webhook URL will not pick up changes automatically).
 */

var SHEET_NAME = 'Attendance';

// Supabase config — update these with your actual credentials
var SUPABASE_URL = 'https://epkrsokdvllyqzakqqwv.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwa3Jzb2tkdmxseXF6YWtxcXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzODY3NDgsImV4cCI6MjA0Njk2Mjc0OH0.EfpJl6iIfVTYZGVXhX-hPvGtYhbfqLjnUqHVxxqUaXc';

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom')
    .addItem('Backfill Attendance from Supabase', 'backfillAttendanceFromSupabase')
    .addItem('Test Webhook Connection', 'testWebhookConnection')
    .addToUi();
}

function testWebhookConnection() {
  try {
    Logger.log('Testing Supabase connection...');
    var options = {
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true,
      timeout: 10
    };
    
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/employees?select=id&limit=1', options);
    
    if (response.getResponseCode() === 200) {
      SpreadsheetApp.getUi().alert('✅ Supabase connection OK\n\nYour credentials are working correctly.');
      Logger.log('✅ Connection test passed');
    } else {
      SpreadsheetApp.getUi().alert('❌ Supabase connection failed\n\nResponse code: ' + response.getResponseCode() + '\n\nPlease check your SUPABASE_URL and SUPABASE_KEY in the script.');
      Logger.log('❌ Connection test failed: ' + response.getResponseCode());
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert('❌ Connection error:\n\n' + err.toString());
    Logger.log('❌ Error: ' + err.toString());
  }
}

function backfillAttendanceFromSupabase() {
  try {
    Logger.log('🔄 Starting backfill...');
    var sheet = getOrCreateSheet();
    var ui = SpreadsheetApp.getUi();
    
    // Fetch all attendance records from Supabase
    Logger.log('📥 Fetching attendance records from Supabase...');
    var url = SUPABASE_URL + '/rest/v1/attendance_history?select=*&order=date.desc';
    var options = {
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true,
      timeout: 30
    };
    
    var response = UrlFetchApp.fetch(url, options);
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Supabase API returned: ' + response.getResponseCode() + ' - ' + response.getContentText());
    }
    
    var data = JSON.parse(response.getContentText());
    
    if (!Array.isArray(data)) {
      throw new Error('Unexpected response format. Expected array, got: ' + typeof data);
    }
    
    Logger.log('✅ Fetched ' + data.length + ' attendance record(s)');
    
    // Get all employee names
    Logger.log('📥 Fetching employee names...');
    var empUrl = SUPABASE_URL + '/rest/v1/employees?select=id,name';
    var empResponse = UrlFetchApp.fetch(empUrl, options);
    
    if (empResponse.getResponseCode() !== 200) {
      throw new Error('Failed to fetch employees: ' + empResponse.getResponseCode());
    }
    
    var employees = JSON.parse(empResponse.getContentText());
    var empMap = {};
    employees.forEach(function(e) {
      empMap[e.id] = e.name || e.id;
    });
    Logger.log('✅ Fetched ' + employees.length + ' employee(s)');
    
    // Build lookup for existing rows
    var lastRow = sheet.getLastRow();
    var existingKeys = {};
    if (lastRow > 1) {
      var allData = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
      for (var i = 0; i < allData.length; i++) {
        var empId = String(allData[i][1] || '');
        var dateStr = String(allData[i][2] || '');
        existingKeys[empId + '|' + dateStr] = i + 2; // row number
      }
    }
    
    // Insert each record
    Logger.log('📤 Processing ' + data.length + ' records...');
    var inserted = 0;
    var updated = 0;
    
    for (var idx = 0; idx < data.length; idx++) {
      var rec = data[idx];
      
      // Format date: from "2026-11-18" to "18/11/2026"
      var dateStr = String(rec.date || '');
      var dateParts = dateStr.split('-');
      var formattedDate = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];
      
      // Format times (handle ISO strings)
      var loginTime = '';
      if (rec.clock_in_time) {
        try {
          var inTime = new Date(rec.clock_in_time);
          loginTime = inTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
        } catch (e) {
          loginTime = rec.clock_in_time;
        }
      }
      
      var logoutTime = '';
      if (rec.clock_out_time) {
        try {
          var outTime = new Date(rec.clock_out_time);
          logoutTime = outTime.toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
        } catch (e) {
          logoutTime = rec.clock_out_time;
        }
      }
      
      var row = [
        empMap[rec.employee_id] || rec.employee_id,
        rec.employee_id,
        formattedDate,
        loginTime,
        logoutTime,
        rec.hours || 0,
        rec.status || ''
      ];
      
      // Check if row exists
      var key = rec.employee_id + '|' + formattedDate;
      var rowIndex = existingKeys[key];
      
      if (rowIndex) {
        sheet.getRange(rowIndex, 1, 1, 7).setValues([row]);
        updated++;
      } else {
        sheet.appendRow(row);
        existingKeys[key] = sheet.getLastRow();
        inserted++;
      }
      
      // Log progress every 50 records
      if ((idx + 1) % 50 === 0) {
        Logger.log('  Progress: ' + (idx + 1) + '/' + data.length);
      }
    }
    
    var message = '✅ Backfill complete!\n\n' +
                  'Inserted: ' + inserted + ' new records\n' +
                  'Updated: ' + updated + ' existing records\n' +
                  'Total: ' + (inserted + updated) + ' records\n\n' +
                  'Check the "Attendance" sheet for all data.';
    
    Logger.log(message);
    ui.alert(message);
    
  } catch (err) {
    var errorMsg = '❌ Backfill Error:\n\n' + err.toString();
    Logger.log(errorMsg);
    SpreadsheetApp.getUi().alert(errorMsg);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getOrCreateSheet();

    var employeeId = String(data.employeeId || data.employee_id || '');
    var date = String(data.date || '');
    var employeeName = String(data.employeeName || data.employee_name || '');

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
      employeeName,
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
      if (!row[3] && existing[3]) row[3] = existing[3];
      if (!row[4] && existing[4]) row[4] = existing[4];
      if ((row[5] === '' || row[5] === 0) && existing[5]) row[5] = existing[5];
      sheet.getRange(rowIndex, 1, 1, 7).setValues([row]);
      Logger.log('Updated: ' + employeeName + ' (' + date + ')');
    } else {
      sheet.appendRow(row);
      Logger.log('Added: ' + employeeName + ' (' + date + ')');
    }

    return jsonResponse({ ok: true, message: 'Synced to sheet' });
  } catch (err) {
    Logger.log('Webhook error: ' + err.toString());
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
