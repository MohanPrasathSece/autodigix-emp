import { createFileRoute } from "@tanstack/react-router";
import { EmployeeLayout } from "@/layouts/EmployeeLayout";

export const Route = createFileRoute("/employee/_layout")({
  component: EmployeeLayout,
});
