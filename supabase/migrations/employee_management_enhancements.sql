-- ============================================================
-- Harmony HR — Employee Management Enhancements
-- Run this ONCE in the Supabase SQL Editor.
-- It is safe to re-run (all statements are idempotent).
-- Existing employees, attendance history and payslips are preserved.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ADMIN ACCESS LEVEL
-- The login flow already reads employees.access_level.
-- ------------------------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'employee';
UPDATE employees SET access_level = 'employee' WHERE access_level IS NULL OR access_level = '';

-- ------------------------------------------------------------
-- 2. PAYSLIP EMAIL (optional override; falls back to employees.email)
-- Lets an admin set/update the address payslips are delivered to.
-- ------------------------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS payslip_email TEXT;

-- ------------------------------------------------------------
-- 3. LOSS OF PAY (LOP) TRACKING
-- ------------------------------------------------------------
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS lop_days NUMERIC(5,2) DEFAULT 0;
ALTER TABLE payslips       ADD COLUMN IF NOT EXISTS lop_days NUMERIC(5,2) DEFAULT 0;

-- ------------------------------------------------------------
-- 4. PAYSLIP EMAIL DELIVERY TRACKING
-- ------------------------------------------------------------
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS email_status TEXT;
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 5. GRANT ADMIN ACCESS TO EXISTING ADMINS / SUPER ADMIN
-- Any employee whose job title contains "admin"/"manager", or the
-- existing Super Admin account, is promoted to admin access.
-- ------------------------------------------------------------
UPDATE employees
SET access_level = 'admin'
WHERE role ILIKE '%admin%'
   OR role ILIKE '%manager%'
   OR id = 'EMP-000';

-- ------------------------------------------------------------
-- 6. ADD VINI AS AN ADMINISTRATOR
-- NOTE: change the email below if Vini's work email is different.
-- Default login password: AutoDigix2026!
-- (SHA-256 of "AutoDigix2026!")
-- ------------------------------------------------------------
INSERT INTO employees
  (id, name, email, password, role, department, status, attendance, avatar_color, initials, base_salary, access_level)
VALUES
  ('EMP-VINI', 'Vini', 'vini@autodigix.in',
   '74efdeb4eb9cea803b7013478c893cc57367dc3327e6aaae37957520069bfcb1',
   'Administrator', 'Human Resources', 'Active', 100,
   'from-blue-500 to-indigo-500', 'VI', 0, 'admin')
ON CONFLICT (id) DO UPDATE
  SET access_level = 'admin',
      role = 'Administrator',
      department = 'Human Resources';

-- ------------------------------------------------------------
-- 7. ALLOW ADMIN TO UPDATE PAYSLIPS (email delivery tracking)
-- ------------------------------------------------------------
ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to payslips" ON payslips;
CREATE POLICY "Allow public access to payslips" ON payslips FOR ALL USING (true) WITH CHECK (true);
