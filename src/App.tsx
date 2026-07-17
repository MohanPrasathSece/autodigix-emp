import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { AdminLayout } from "@/layouts/AdminLayout";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";

// Public Views
import { LandingView } from "@/public/views/LandingView";

// Admin Views
import { AdminDashboardView } from "@/admin/views/DashboardView";
import { EmployeesPage } from "@/admin/views/EmployeesView";
import { EmployeeDetailsView } from "@/admin/views/EmployeeDetailsView";
import { AddEmployeeView } from "@/admin/views/AddView";
import { AttendancePage } from "@/admin/views/AttendanceView";
import { ApprovalsPage } from "@/admin/views/LeavesView";
import { CalendarPage as AdminCalendarPage } from "@/admin/views/CalendarView";
import { ReportsView } from "@/admin/views/ReportsView";
import { AdminNotificationsView } from "@/admin/views/NotificationsView";
import { SettingsPage } from "@/admin/views/SettingsView";
import { AdminProfileView } from "@/admin/views/ProfileView";
import { AdminHolidaysView } from "@/admin/views/HolidaysView";
import { AdminDashboard } from "@/admin/views/OverviewView";
import { PayrollPage } from "@/admin/views/PayrollView";

// Employee Views
import { EmployeeDashboard } from "@/employee/views/DashboardView";
import { LeavePage } from "@/employee/views/ApplyLeaveView";
import { EmployeeLeaveHistoryView } from "@/employee/views/LeaveHistoryView";
import { EmployeePayslipsView } from "@/employee/views/PayslipsView";
import { ProfilePage as EmployeeProfileView } from "@/employee/views/ProfileView";
import { CalendarPage as EmployeeCalendarPage } from "@/employee/views/CalendarView";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingView />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardView />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="employees/add" element={<AddEmployeeView />} />
          <Route path="employees/:employeeId" element={<EmployeeDetailsView />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<ApprovalsPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="notifications" element={<AdminNotificationsView />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<AdminProfileView />} />
          <Route path="holidays" element={<AdminHolidaysView />} />
          <Route path="overview" element={<AdminDashboard />} />
          <Route path="payroll" element={<PayrollPage />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="apply-leave" element={<LeavePage />} />
          <Route path="leave-history" element={<EmployeeLeaveHistoryView />} />
          <Route path="payslips" element={<EmployeePayslipsView />} />
          <Route path="profile" element={<EmployeeProfileView />} />
          <Route path="calendar" element={<EmployeeCalendarPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
