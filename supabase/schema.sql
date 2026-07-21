-- ==========================================
-- 1. EXTENSIONS & FUNCTIONS
-- ==========================================
-- Enable UUID generation for secure, globally unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 2. CORE TABLES
-- ==========================================

-- EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'On Leave', 'Remote')),
    attendance INTEGER NOT NULL DEFAULT 100,
    avatar_color TEXT NOT NULL,
    initials TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    location TEXT,
    manager_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if the table was created previously
ALTER TABLE employees ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT 'password123';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id TEXT;

-- ATTENDANCE HISTORY
CREATE TABLE IF NOT EXISTS attendance_history (
    id SERIAL PRIMARY KEY,
    date TEXT NOT NULL,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    hours DECIMAL NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- SEED ADMIN USER
INSERT INTO employees (id, name, email, password, role, department, status, attendance, avatar_color, initials) 
VALUES ('EMP-000', 'Super Admin', 'admin@company.com', 'admin123', 'Admin', 'Management', 'Active', 100, 'from-blue-500 to-indigo-500', 'SA')
ON CONFLICT (email) DO NOTHING;

-- ABSENT DATES
CREATE TABLE IF NOT EXISTS absent_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LEAVE REQUESTS
CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    name TEXT NOT NULL, 
    type TEXT NOT NULL,
    from_date TEXT NOT NULL,
    to_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    subject TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PAYSLIPS
CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    gross INTEGER NOT NULL,
    net INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Paid', 'Processing', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. COMPANY-WIDE TABLES
-- ==========================================

-- HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL, 
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    time TEXT NOT NULL,
    tone TEXT NOT NULL CHECK (tone IN ('success', 'info', 'warning', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. ANALYTICS & TREND VIEWS (Dynamic Aggregates)
-- ==========================================

-- Drop old tables if they exist
DROP TABLE IF EXISTS attendance_trend CASCADE;
DROP TABLE IF EXISTS payroll_trend CASCADE;
DROP TABLE IF EXISTS department_split CASCADE;

CREATE OR REPLACE VIEW department_split_view AS
SELECT 
    department AS name, 
    COUNT(*) AS value
FROM employees
GROUP BY department;

CREATE OR REPLACE VIEW payroll_trend_view AS
SELECT 
    period AS month, 
    SUM(net) AS payroll
FROM payslips
GROUP BY period;

-- A simple view showing overall present/absent for today based on attendance score
CREATE OR REPLACE VIEW attendance_trend_view AS
SELECT 
    'Today' AS day,
    COUNT(*) FILTER (WHERE attendance >= 50 AND status != 'On Leave') AS present,
    COUNT(*) FILTER (WHERE attendance < 50 OR status = 'On Leave') AS absent
FROM employees;

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- The following policies allow full access to all tables so the application functions correctly
-- while RLS is technically enabled.

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to employees" ON employees;
CREATE POLICY "Allow public access to employees" ON employees FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to leave_requests" ON leave_requests;
CREATE POLICY "Allow public access to leave_requests" ON leave_requests FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to payslips" ON payslips;
CREATE POLICY "Allow public access to payslips" ON payslips FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to holidays" ON holidays;
CREATE POLICY "Allow public access to holidays" ON holidays FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to notifications" ON notifications;
CREATE POLICY "Allow public access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE attendance_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to attendance_history" ON attendance_history;
CREATE POLICY "Allow public access to attendance_history" ON attendance_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to contact_messages" ON contact_messages;
CREATE POLICY "Allow public access to contact_messages" ON contact_messages FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 6. STORAGE BUCKETS
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update their avatar." ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can delete their avatar." ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
