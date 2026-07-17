import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/admin/views/CalendarView";

export const Route = createFileRoute("/admin/_layout/calendar")({
  component: CalendarPage,
});
