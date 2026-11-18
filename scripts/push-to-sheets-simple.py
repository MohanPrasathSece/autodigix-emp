#!/usr/bin/env python3
import requests
import json
import os
from datetime import datetime
from dotenv import load_dotenv
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
SHEETS_WEBHOOK = os.getenv('VITE_GOOGLE_SHEETS_WEBHOOK_URL')

print('=' * 60)
print('Push Attendance to Google Sheets')
print('=' * 60)
print('Supabase URL: ' + str(SUPABASE_URL))
print('Sheets Webhook: ' + ('CONFIGURED' if SHEETS_WEBHOOK else 'MISSING'))
print('=' * 60)

if not SHEETS_WEBHOOK:
    print('ERROR: VITE_GOOGLE_SHEETS_WEBHOOK_URL not set in .env')
    exit(1)

def format_time(iso_string):
    if not iso_string:
        return ''
    try:
        dt = datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        return dt.strftime('%H:%M')
    except:
        return iso_string

def format_date(date_str):
    if not date_str:
        return ''
    try:
        parts = date_str.split('-')
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    except:
        return date_str

try:
    print('\nFetching attendance records...')
    headers = {
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        f'{SUPABASE_URL}/rest/v1/attendance_history?order=date.desc',
        headers=headers,
        timeout=10,
        verify=False
    )
    response.raise_for_status()
    records = response.json()
    
    if not records:
        print('No records found in Supabase')
        exit(0)
    
    print(f'Found {len(records)} records')
    
    # Fetch employee names
    print('Fetching employee names...')
    emp_response = requests.get(
        f'{SUPABASE_URL}/rest/v1/employees?select=id,name',
        headers=headers,
        timeout=10,
        verify=False
    )
    emp_response.raise_for_status()
    employees = emp_response.json()
    
    emp_map = {e['id']: e.get('name', e['id']) for e in employees}
    print(f'Found {len(employees)} employees')
    
    # Push each record
    print('Pushing records to Google Sheets...')
    sent = 0
    failed = 0
    
    for i, rec in enumerate(records):
        emp_name = emp_map.get(rec['employee_id'], rec['employee_id'])
        
        payload = {
            'employeeId': rec['employee_id'],
            'employeeName': emp_name,
            'date': format_date(rec['date']),
            'loginTime': format_time(rec.get('clock_in_time')),
            'logoutTime': format_time(rec.get('clock_out_time')),
            'totalHours': rec.get('hours', 0),
            'status': rec.get('status', 'Unknown'),
        }
        
        try:
            webhook_response = requests.post(
                SHEETS_WEBHOOK,
                json=payload,
                timeout=10,
                verify=False
            )
            
            if webhook_response.status_code == 200:
                sent += 1
                pct = round((sent / len(records)) * 100)
                print(f'\r  Progress: {sent}/{len(records)} ({pct}%)', end='', flush=True)
            else:
                failed += 1
                print(f'\n  FAILED for {emp_name}: {webhook_response.status_code}')
        except Exception as err:
            failed += 1
            print(f'\n  ERROR for {emp_name}: {err}')
    
    print(f'\n\n' + '=' * 60)
    print('PUSH COMPLETE!')
    print('=' * 60)
    print('Results:')
    print(f'  Sent: {sent}/{len(records)}')
    if failed > 0:
        print(f'  Failed: {failed}')
    print(f'\nCheck your Google Sheet for {sent} records!')
    print('=' * 60)
    
except Exception as err:
    print(f'ERROR: {err}')
    import traceback
    traceback.print_exc()
    exit(1)
