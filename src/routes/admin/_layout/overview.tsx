import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/admin/views/OverviewView";

export const Route = createFileRoute("/admin/_layout/overview")({
  component: AdminDashboard,
});
