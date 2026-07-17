import { createFileRoute } from "@tanstack/react-router";
import { AddEmployee } from "@/admin/views/AddView";

export const Route = createFileRoute("/admin/_layout/employees/add")({
  component: AddEmployee,
});
