import { createFileRoute } from "@tanstack/react-router";
import { ApprovalsPage } from "@/admin/views/LeavesView";

export const Route = createFileRoute("/admin/_layout/leaves")({
  component: ApprovalsPage,
});
