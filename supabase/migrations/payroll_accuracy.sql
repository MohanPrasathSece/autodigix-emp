-- ============================================================
-- Payroll accuracy: per-employee tax rate (TDS %)
-- ============================================================
-- Payroll previously applied a hard-coded 25% tax to every payslip,
-- which produced incorrect net pay for everyone. Tax is now an explicit,
-- per-employee rate (default 0%) controlled by the admin.
--
-- Safe to run multiple times.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC(5,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN employees.tax_percentage IS
  'Income tax (TDS) percentage applied to gross salary during monthly payroll runs.';
