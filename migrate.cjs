const fs = require('fs');
const path = require('path');

const srcRoutes = path.join(__dirname, 'src', 'routes');

function migrateRoute(oldName, newPathString, destPath) {
  const oldPath = path.join(srcRoutes, oldName);
  if (!fs.existsSync(oldPath)) {
    console.log(`Skipping ${oldName}, does not exist`);
    return;
  }
  
  let content = fs.readFileSync(oldPath, 'utf8');
  // Replace the route path in createFileRoute
  content = content.replace(/createFileRoute\(['"][^'"]+['"]\)/, `createFileRoute('${newPathString}')`);
  
  const destFullPath = path.join(srcRoutes, destPath);
  fs.mkdirSync(path.dirname(destFullPath), { recursive: true });
  fs.writeFileSync(destFullPath, content, 'utf8');
  console.log(`Migrated ${oldName} to ${destPath}`);
}

// 1. Login
migrateRoute('login.tsx', '/', 'index.tsx');

// 2. Admin Layout
fs.writeFileSync(path.join(srcRoutes, 'admin', '_layout.tsx'), `import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/layouts/AdminLayout";

export const Route = createFileRoute("/admin/_layout")({
  component: AdminLayout,
});
`);

// 3. Employee Layout
fs.writeFileSync(path.join(srcRoutes, 'employee', '_layout.tsx'), `import { createFileRoute } from "@tanstack/react-router";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";

export const Route = createFileRoute("/employee/_layout")({
  component: EmployeeLayout,
});
`);

// 4. Admin Routes
migrateRoute('_app.index.tsx', '/admin/_layout/dashboard', 'admin/_layout/dashboard.tsx');
migrateRoute('_app.employees.tsx', '/admin/_layout/employees/', 'admin/_layout/employees/index.tsx');
migrateRoute('_app.attendance.tsx', '/admin/_layout/attendance', 'admin/_layout/attendance.tsx');
migrateRoute('_app.approvals.tsx', '/admin/_layout/leaves', 'admin/_layout/leaves.tsx');
migrateRoute('_app.payroll.tsx', '/admin/_layout/payroll', 'admin/_layout/payroll.tsx');
migrateRoute('_app.reports.tsx', '/admin/_layout/reports', 'admin/_layout/reports.tsx');
migrateRoute('_app.settings.tsx', '/admin/_layout/settings', 'admin/_layout/settings.tsx');
migrateRoute('_app.calendar.tsx', '/admin/_layout/calendar', 'admin/_layout/calendar.tsx');
migrateRoute('_app.profile.tsx', '/admin/_layout/profile', 'admin/_layout/profile.tsx');
migrateRoute('_app.admin.tsx', '/admin/_layout/overview', 'admin/_layout/overview.tsx');

// Admin Add Employee (dummy)
fs.writeFileSync(path.join(srcRoutes, 'admin', '_layout', 'employees', 'add.tsx'), `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_layout/employees/add")({
  component: () => <div className="p-6"><h2>Add Employee (Dummy)</h2></div>,
});
`);

// Admin Holidays (dummy)
fs.writeFileSync(path.join(srcRoutes, 'admin', '_layout', 'holidays.tsx'), `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_layout/holidays")({
  component: () => <div className="p-6"><h2>Holidays (Dummy)</h2></div>,
});
`);

// Admin Notifications (dummy)
fs.writeFileSync(path.join(srcRoutes, 'admin', '_layout', 'notifications.tsx'), `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_layout/notifications")({
  component: () => <div className="p-6"><h2>Notifications (Dummy)</h2></div>,
});
`);


// 5. Employee Routes (Reuse some, dummy others)
// Reuse profile, settings, calendar, leave, attendance
migrateRoute('_app.index.tsx', '/employee/_layout/dashboard', 'employee/_layout/dashboard.tsx'); // We will modify this to be employee specific later
migrateRoute('_app.attendance.tsx', '/employee/_layout/attendance', 'employee/_layout/attendance.tsx');
migrateRoute('_app.leave.tsx', '/employee/_layout/apply-leave', 'employee/_layout/apply-leave.tsx');
migrateRoute('_app.calendar.tsx', '/employee/_layout/calendar', 'employee/_layout/calendar.tsx');
migrateRoute('_app.profile.tsx', '/employee/_layout/profile', 'employee/_layout/profile.tsx');
migrateRoute('_app.settings.tsx', '/employee/_layout/settings', 'employee/_layout/settings.tsx');

// Employee specific dummies
fs.writeFileSync(path.join(srcRoutes, 'employee', '_layout', 'leave-history.tsx'), `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee/_layout/leave-history")({
  component: () => <div className="p-6"><h2>Leave History (Dummy)</h2></div>,
});
`);

fs.writeFileSync(path.join(srcRoutes, 'employee', '_layout', 'attendance-history.tsx'), `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee/_layout/attendance-history")({
  component: () => <div className="p-6"><h2>Attendance History (Dummy)</h2></div>,
});
`);

fs.writeFileSync(path.join(srcRoutes, 'employee', '_layout', 'notifications.tsx'), `import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/employee/_layout/notifications")({
  component: () => <div className="p-6"><h2>Notifications (Dummy)</h2></div>,
});
`);

// 6. Delete old files
const filesToDelete = [
  'login.tsx',
  '_app.index.tsx',
  '_app.admin.tsx',
  '_app.employees.tsx',
  '_app.attendance.tsx',
  '_app.leave.tsx',
  '_app.approvals.tsx',
  '_app.payroll.tsx',
  '_app.reports.tsx',
  '_app.settings.tsx',
  '_app.calendar.tsx',
  '_app.profile.tsx',
  '_app.tsx'
];
filesToDelete.forEach(f => {
  const p = path.join(srcRoutes, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

console.log("Migration complete.");
