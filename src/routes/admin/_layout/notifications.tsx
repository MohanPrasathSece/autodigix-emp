import { createFileRoute } from "@tanstack/react-router";
import { AdminNotificationsView } from "@/admin/views/NotificationsView";

export const Route = createFileRoute("/admin/_layout/notifications")({
  component: AdminNotificationsView,
});
