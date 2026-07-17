import { createFileRoute } from "@tanstack/react-router";
import { EmployeeLeaveHistoryView } from "@/employee/views/LeaveHistoryView";

export const Route = createFileRoute("/employee/_layout/leave-history")({
  component: EmployeeLeaveHistoryView,
});
