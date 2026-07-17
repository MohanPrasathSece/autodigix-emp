import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { AdminLayout } from "@/layouts/AdminLayout";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";

// Public Views
import { LandingView } from "@/public/views/LandingView";

// Admin Views
import { AdminDashboardView } from "@/admin/views/DashboardView";
import { EmployeesPage } from "@/admin/views/EmployeesView";
import { EmployeeDetailsPage } from "@/admin/views/EmployeeDetailsView";
import { AddEmployeeView } from "@/admin/views/AddView";
import { AttendancePage } from "@/admin/views/AttendanceView";
import { ApprovalsPage } from "@/admin/views/LeavesView";
import { CalendarPage as AdminCalendarPage } from "@/admin/views/CalendarView";
import { ReportsView } from "@/admin/views/ReportsView";
import { NotificationsView } from "@/admin/views/NotificationsView";
import { SettingsView } from "@/admin/views/SettingsView";
import { AdminProfileView } from "@/admin/views/ProfileView";
import { HolidaysView } from "@/admin/views/HolidaysView";
import { OverviewView } from "@/admin/views/OverviewView";
import { PayrollView } from "@/admin/views/PayrollView";

// Employee Views
import { EmployeeDashboardView } from "@/employee/views/DashboardView";
import { ApplyLeaveView } from "@/employee/views/ApplyLeaveView";
import { LeaveHistoryView } from "@/employee/views/LeaveHistoryView";
import { PayslipsView } from "@/employee/views/PayslipsView";
import { EmployeeProfileView } from "@/employee/views/ProfileView";
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
          <Route path="employees/:employeeId" element={<EmployeeDetailsPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="leaves" element={<ApprovalsPage />} />
          <Route path="calendar" element={<AdminCalendarPage />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="profile" element={<AdminProfileView />} />
          <Route path="holidays" element={<HolidaysView />} />
          <Route path="overview" element={<OverviewView />} />
          <Route path="payroll" element={<PayrollView />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboardView />} />
          <Route path="apply-leave" element={<ApplyLeaveView />} />
          <Route path="leave-history" element={<LeaveHistoryView />} />
          <Route path="payslips" element={<PayslipsView />} />
          <Route path="profile" element={<EmployeeProfileView />} />
          <Route path="calendar" element={<EmployeeCalendarPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
