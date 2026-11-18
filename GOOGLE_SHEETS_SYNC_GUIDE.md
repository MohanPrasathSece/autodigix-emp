# Google Sheets Attendance Sync — Complete Setup Guide

## Overview
This guide walks you through syncing all November attendance data to Google Sheets. The system works in two ways:

1. **Real-time sync**: Every clock-in/clock-out automatically syncs to the sheet
2. **Backfill**: One-time bulk import of all existing attendance records

---

## Prerequisites
- A Google Sheet where you want attendance data
- Access to Google Apps Script
- Your Supabase credentials (already in the script)

---

## Step 1: Deploy the Google Apps Script

### 1.1 Open the Google Sheet
- Open or create your Google Sheet where you want attendance data
- Make sure you have edit access

### 1.2 Open Apps Script Editor
- Click **Extensions → Apps Script**
- This opens the Google Apps Script editor in a new tab

### 1.3 Replace the Script
- Delete any existing code in `Code.gs`
- Copy the entire contents from: `google-apps-script/attendance-sync.gs`
- Paste it into the editor
- Click **Save**

### 1.4 Deploy as Web App
- Click **Deploy → New deployment**
- Select **Type**: "Web app"
- Set **Execute as**: Your account (should default to this)
- Set **Who has access**: "Anyone"
- Click **Deploy**
- A window will pop up asking for permissions — click **Authorize**
- Copy the **Deployment URL** (looks like `https://script.google.com/macros/s/xxxxx/exec`)

### 1.5 Add Webhook URL to Project
- Open your `.env` file in the project
- Add/update this line:
  ```
  VITE_GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/xxxxx/exec"
  ```
  (Replace `xxxxx` with your actual deployment ID)
- Restart your dev server or redeploy your site

---

## Step 2: Backfill All November Attendance

### 2.1 Verify Connection
- Go back to your Google Sheet (where the script is deployed)
- Click **Custom → Test Webhook Connection**
- You should see ✅ "Supabase connection OK"
- If you see ❌ error, check that the SUPABASE_URL and SUPABASE_KEY in the script are correct

### 2.2 Run Backfill
- In your Google Sheet, click **Custom → Backfill Attendance from Supabase**
- Click **Authorize** if prompted
- Wait for the completion message (this may take 30-60 seconds depending on data size)
- You should see: "✅ Backfill complete! Inserted: X records, Updated: Y records"

### 2.3 Verify Data
- Check the "Attendance" sheet tab in your Google Sheet
- You should now see all attendance records with columns:
  - Employee Name
  - Employee ID
  - Date (format: DD/MM/YYYY)
  - Login Time
  - Logout Time
  - Total Hours
  - Status

---

## How It Works

### Real-time Sync
Every time an employee clocks in or out in the website:
1. Record is saved to Supabase
2. Webhook automatically sends data to Google Sheets
3. If the row exists (same employee + date), it updates; otherwise creates new row

### Backfill Sync
Reads all attendance records from Supabase and writes them to Google Sheets in batch:
- Creates new rows for records not in sheet
- Updates existing rows if they already exist
- Does NOT modify Supabase (read-only operation)

---

## Troubleshooting

### "Backfill complete! Inserted: 0"
- This usually means all records already exist in the sheet
- Clear the "Attendance" sheet and run backfill again if you want fresh data

### "Connection failed"
- Check that `SUPABASE_URL` and `SUPABASE_KEY` in the script are correct
- Go to Apps Script editor → View → Logs to see detailed error messages

### "Authorization error"
- You must authorize the script when first running it
- Go to the script again and click the ⚠️ icon, then "Authorize"

### Webhook URL not working
- Make sure you created a **NEW deployment** (not just saved the script)
- Old deployment URLs won't pick up code changes
- Delete old deployments and create a fresh one

### Data not appearing in Google Sheets after clock-in/out
1. Check that `VITE_GOOGLE_SHEETS_WEBHOOK_URL` is set in `.env`
2. Restart the dev server after adding the URL
3. Check the webhook response: Open browser DevTools → Network → look for requests to `script.google.com`

---

## Testing

### Manual Webhook Test
To send a test attendance record:

```javascript
// In browser console (when on the website):
fetch('YOUR_WEBHOOK_URL_HERE', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    employeeId: 'EMP-001',
    employeeName: 'John Doe',
    date: '18/11/2026',
    loginTime: '09:30 AM',
    logoutTime: '06:30 PM',
    totalHours: 9,
    status: 'Clocked Out'
  })
})
```

---

## Next Steps

1. ✅ Deploy the script (Step 1)
2. ✅ Test connection (Step 2.1)
3. ✅ Run backfill (Step 2.2)
4. ✅ Verify data appears (Step 2.3)
5. ✅ Test real-time sync by clocking in/out on the website

Once complete, all attendance will be stored in both:
- **Website**: Supabase database (for app features, reports, payroll)
- **Google Sheets**: For admin viewing, sharing, and backup

---

## Additional Info

- **Backfill updates**: If you need to re-run backfill, it will update existing records without duplicating
- **Multiple sheets**: You can deploy this script to multiple Google Sheets using different deployment URLs
- **Custom filtering**: You can modify the script to filter by date range or employee if needed
