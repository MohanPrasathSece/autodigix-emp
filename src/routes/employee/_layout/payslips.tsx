import { createFileRoute } from "@tanstack/react-router";
import { EmployeePayslipsView } from "@/employee/views/PayslipsView";

export const Route = createFileRoute("/employee/_layout/payslips")({
  component: EmployeePayslipsView,
});
