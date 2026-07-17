import { createFileRoute } from "@tanstack/react-router";
import { CalendarPage } from "@/employee/views/CalendarView";

export const Route = createFileRoute("/employee/_layout/calendar")({
  component: CalendarPage,
});
