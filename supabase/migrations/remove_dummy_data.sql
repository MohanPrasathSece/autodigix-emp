-- ============================================================
-- Harmony HR — Remove Dummy / Test Data
-- Run ONCE in the Supabase SQL Editor.
-- ============================================================
-- This wipes all sample/test records so the site can be used for
-- real, long-term operation. Admin accounts are PRESERVED.
--
-- Before running, make sure you have completed the schema migrations:
--   - employee_management_enhancements.sql
--   - payroll_accuracy.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. CLEAR ALL TRANSACTIONAL / SAMPLE DATA
-- (attendance, payslips, leaves, absences, notifications, messages)
-- ------------------------------------------------------------
DELETE FROM attendance_history;
DELETE FROM payslips;
DELETE FROM leave_requests;
DELETE FROM absent_dates;
DELETE FROM notifications;
DELETE FROM contact_messages;

-- ------------------------------------------------------------
-- 2. REMOVE ALL NON-ADMIN (SAMPLE) EMPLOYEES
-- Keeps every administrator account (access_level = 'admin') plus the
-- built-in Super Admin, so you can still log in.
-- ------------------------------------------------------------
DELETE FROM employees
WHERE COALESCE(access_level, 'employee') <> 'admin'
  AND id <> 'EMP-000';

COMMIT;

-- ------------------------------------------------------------
-- 3. VERIFY
-- ------------------------------------------------------------
-- SELECT id, name, email, role, access_level FROM employees ORDER BY id;
-- SELECT COUNT(*) AS attendance_rows FROM attendance_history;
-- SELECT COUNT(*) AS payslip_rows    FROM payslips;
-- SELECT COUNT(*) AS leave_rows      FROM leave_requests;
