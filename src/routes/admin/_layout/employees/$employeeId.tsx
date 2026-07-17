import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetailsView } from "@/admin/views/EmployeeDetailsView";

export const Route = createFileRoute("/admin/_layout/employees/$employeeId")({
  component: EmployeeDetailsView,
});
