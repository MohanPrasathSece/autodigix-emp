import { createFileRoute } from "@tanstack/react-router";
import { PayrollPage } from "@/admin/views/PayrollView";

export const Route = createFileRoute("/admin/_layout/payroll")({
  component: PayrollPage,
});
