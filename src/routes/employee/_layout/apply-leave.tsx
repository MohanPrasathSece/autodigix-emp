import { createFileRoute } from "@tanstack/react-router";
import { LeavePage } from "@/employee/views/ApplyLeaveView";

export const Route = createFileRoute("/employee/_layout/apply-leave")({
  component: LeavePage,
});
