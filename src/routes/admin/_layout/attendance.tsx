import { createFileRoute } from "@tanstack/react-router";
import { AttendancePage } from "@/admin/views/AttendanceView";

export const Route = createFileRoute("/admin/_layout/attendance")({
  component: AttendancePage,
});
