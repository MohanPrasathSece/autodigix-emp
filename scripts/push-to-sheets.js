#!/usr/bin/env node

/**
 * Direct push to Google Sheets
 * Reads all attendance from Supabase and POSTs to Google Sheets webhook
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SHEETS_WEBHOOK = process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;

console.log('🚀 Push to Google Sheets');
console.log('━'.repeat(60));
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Sheets Webhook: ${SHEETS_WEBHOOK ? '✅ Configured' : '❌ Missing'}`);
console.log('━'.repeat(60));

if (!SHEETS_WEBHOOK) {
  console.error('❌ Error: VITE_GOOGLE_SHEETS_WEBHOOK_URL not set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function formatTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${mins}`;
  } catch {
    return isoString;
  }
}

async function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

async function main() {
  try {
    console.log('\n📥 Fetching attendance records...');
    
    const { data: records, error } = await supabase
      .from('attendance_history')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    if (!records || records.length === 0) {
      console.log('⚠️  No records found in Supabase');
      return;
    }

    console.log(`✅ Found ${records.length} records\n`);

    // Fetch employee names
    console.log('📥 Fetching employee names...');
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name');

    const empMap = new Map(employees.map(e => [e.id, e.name || e.id]));
    console.log(`✅ Found ${employees.length} employees\n`);

    // Push each record to Google Sheets
    console.log('📤 Pushing records to Google Sheets...\n');
    
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      const empName = empMap.get(rec.employee_id) || rec.employee_id;

      const loginTime = await formatTime(rec.clock_in_time);
      const logoutTime = await formatTime(rec.clock_out_time);
      const date = await formatDate(rec.date);

      const payload = {
        employeeId: rec.employee_id,
        employeeName: empName,
        date: date,
        loginTime: loginTime,
        logoutTime: logoutTime,
        totalHours: rec.hours || 0,
        status: rec.status || 'Unknown',
      };

      try {
        const response = await fetch(SHEETS_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          sent++;
          // Update progress
          process.stdout.write(`\r  ✅ Progress: ${sent}/${records.length} (${Math.round((sent/records.length)*100)}%)`);
        } else {
          failed++;
          const errorText = await response.text();
          console.error(`\n  ❌ Failed for ${empName} on ${date}: ${response.status} ${errorText}`);
        }
      } catch (err) {
        failed++;
        console.error(`\n  ❌ Error for ${empName}: ${err.message}`);
      }

      // Small delay to avoid rate limiting
      await sleep(50);
    }

    console.log(`\n\n${'━'.repeat(60)}`);
    console.log('✅ PUSH COMPLETE!');
    console.log('━'.repeat(60));
    console.log(`📊 Results:`);
    console.log(`   ✓ Sent: ${sent}/${records.length}`);
    if (failed > 0) {
      console.log(`   ✗ Failed: ${failed}`);
    }
    console.log(`\n📌 Check your Google Sheet for all ${sent} attendance records!`);
    console.log('━'.repeat(60));

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
