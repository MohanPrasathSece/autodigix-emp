import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/admin/views/EmployeesView";

export const Route = createFileRoute("/admin/_layout/employees/")({
  component: EmployeesPage,
});
