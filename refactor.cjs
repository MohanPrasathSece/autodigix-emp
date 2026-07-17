const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const adminViewsDir = path.join(srcDir, 'admin', 'views');
const employeeViewsDir = path.join(srcDir, 'employee', 'views');

fs.mkdirSync(adminViewsDir, { recursive: true });
fs.mkdirSync(employeeViewsDir, { recursive: true });

function refactorRoute(domain, relPath, viewName) {
  const routePath = path.join(srcDir, 'routes', domain, '_layout', relPath);
  if (!fs.existsSync(routePath)) {
    console.log(`Skipping ${routePath}, does not exist`);
    return;
  }
  
  let content = fs.readFileSync(routePath, 'utf8');
  
  // The route file usually has:
  // export const Route = createFileRoute('...')({ component: ComponentName })
  // We want to extract the ComponentName and the rest of the file into the view,
  // and make the route file just import it.
  
  // Find the component name
  const match = content.match(/component:\s*([A-Za-z0-9_]+)/);
  let componentName = match ? match[1] : 'UnknownView';
  
  // If it's an inline component like () => <div>, handle specially
  if (componentName === '()') {
      componentName = viewName;
      content = content.replace(/component:\s*\(\)\s*=>\s*(<[^>]+>.*<\/[^>]+>)/g, `component: ${componentName}`);
      content += `\n\nexport function ${componentName}() { return ${RegExp.$1}; }`;
  }
  
  // Now split the route logic from the component logic.
  // Actually, it's easier to just copy the whole file to views/, remove the Route export,
  // and in the route file, just import the view.
  
  let viewContent = content.replace(/export const Route = createFileRoute[^;]+;/g, '');
  // make sure the component is exported
  viewContent = viewContent.replace(new RegExp(`function ${componentName}`), `export function ${componentName}`);
  
  const viewFileBase = path.basename(relPath, '.tsx') === 'index' 
      ? path.basename(path.dirname(relPath)) + 'View.tsx' 
      : path.basename(relPath, '.tsx').replace(/-([a-z])/g, g => g[1].toUpperCase()) + 'View.tsx';
  
  // Capitalize first letter
  const finalViewFileName = viewFileBase.charAt(0).toUpperCase() + viewFileBase.slice(1);
  const viewsDir = domain === 'admin' ? adminViewsDir : employeeViewsDir;
  
  fs.writeFileSync(path.join(viewsDir, finalViewFileName), viewContent);
  
  // Rewrite the route file
  const routeImportPath = `@/${domain}/views/${finalViewFileName.replace('.tsx', '')}`;
  const newRouteContent = `import { createFileRoute } from "@tanstack/react-router";
import { ${componentName} } from "${routeImportPath}";

export const Route = createFileRoute("/${domain}/_layout/${relPath.replace(/\/index\.tsx$/, '/').replace(/\.tsx$/, '')}")({
  component: ${componentName},
});
`;

  fs.writeFileSync(routePath, newRouteContent);
  console.log(`Refactored ${relPath} into ${finalViewFileName}`);
}

// Admin
refactorRoute('admin', 'dashboard.tsx', 'AdminDashboardView');
refactorRoute('admin', 'employees/index.tsx', 'AdminEmployeesView');
refactorRoute('admin', 'employees/add.tsx', 'AdminAddEmployeeView');
refactorRoute('admin', 'attendance.tsx', 'AdminAttendanceView');
refactorRoute('admin', 'leaves.tsx', 'AdminLeavesView');
refactorRoute('admin', 'payroll.tsx', 'AdminPayrollView');
refactorRoute('admin', 'reports.tsx', 'AdminReportsView');
refactorRoute('admin', 'settings.tsx', 'AdminSettingsView');
refactorRoute('admin', 'calendar.tsx', 'AdminCalendarView');
refactorRoute('admin', 'profile.tsx', 'AdminProfileView');
refactorRoute('admin', 'overview.tsx', 'AdminOverviewView');
refactorRoute('admin', 'holidays.tsx', 'AdminHolidaysView');
refactorRoute('admin', 'notifications.tsx', 'AdminNotificationsView');

// Employee
refactorRoute('employee', 'dashboard.tsx', 'EmployeeDashboardView');
refactorRoute('employee', 'attendance.tsx', 'EmployeeAttendanceView');
refactorRoute('employee', 'apply-leave.tsx', 'EmployeeApplyLeaveView');
refactorRoute('employee', 'calendar.tsx', 'EmployeeCalendarView');
refactorRoute('employee', 'profile.tsx', 'EmployeeProfileView');
refactorRoute('employee', 'settings.tsx', 'EmployeeSettingsView');
refactorRoute('employee', 'leave-history.tsx', 'EmployeeLeaveHistoryView');
refactorRoute('employee', 'attendance-history.tsx', 'EmployeeAttendanceHistoryView');
refactorRoute('employee', 'notifications.tsx', 'EmployeeNotificationsView');

console.log("Refactoring complete.");
