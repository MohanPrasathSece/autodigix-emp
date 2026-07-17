import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/employee/views/ProfileView";

export const Route = createFileRoute("/employee/_layout/profile")({
  component: ProfilePage,
});
