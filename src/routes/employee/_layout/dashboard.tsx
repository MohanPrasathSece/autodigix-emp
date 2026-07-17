import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDashboard } from "@/employee/views/DashboardView";

export const Route = createFileRoute("/employee/_layout/dashboard")({
  component: EmployeeDashboard,
});
