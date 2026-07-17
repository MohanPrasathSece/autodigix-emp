import { createFileRoute } from "@tanstack/react-router";
import { ReportsView } from "@/admin/views/ReportsView";

export const Route = createFileRoute("/admin/_layout/reports")({
  component: ReportsView,
});
