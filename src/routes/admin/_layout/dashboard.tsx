import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardView } from "@/admin/views/DashboardView";

export const Route = createFileRoute("/admin/_layout/dashboard")({
  component: AdminDashboardView,
});
