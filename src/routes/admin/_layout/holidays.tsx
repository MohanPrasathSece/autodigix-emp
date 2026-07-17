import { createFileRoute } from "@tanstack/react-router";
import { AdminHolidaysView } from "@/admin/views/HolidaysView";

export const Route = createFileRoute("/admin/_layout/holidays")({
  component: AdminHolidaysView,
});
