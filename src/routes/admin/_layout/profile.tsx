import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/admin/views/ProfileView";

export const Route = createFileRoute("/admin/_layout/profile")({
  component: ProfilePage,
});
