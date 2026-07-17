import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/admin/views/SettingsView";

export const Route = createFileRoute("/admin/_layout/settings")({
  component: SettingsPage,
});
