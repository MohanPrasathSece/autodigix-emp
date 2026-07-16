import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Filter } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaveRequests } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/approvals")({
  head: () => ({ meta: [{ title: "Approvals — Pulse HR" }] }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("Pending");
  const rows = leaveRequests.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave approvals"
        description="Review requests from your team."
        actions={
          <Button variant="outline" className="rounded-xl"><Filter className="mr-1.5 size-4" />Filter</Button>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="Pending" className="rounded-lg">Pending</TabsTrigger>
          <TabsTrigger value="Approved" className="rounded-lg">Approved</TabsTrigger>
          <TabsTrigger value="Rejected" className="rounded-lg">Rejected</TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="divide-y">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center">
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white">
                {r.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">requested</span>
                  <span className="text-sm font-medium">{r.type}</span>
                </div>
                <div className="text-xs text-muted-foreground">{r.from} — {r.to} · {r.days} day{r.days > 1 ? "s" : ""} · #{r.id}</div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-[11px]",
                  r.status === "Approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  r.status === "Pending" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  r.status === "Rejected" && "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                )}
              >
                {r.status}
              </Badge>
              {r.status === "Pending" && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast.error(`Declined ${r.name}'s request`)}>
                    <X className="mr-1 size-3.5" />Decline
                  </Button>
                  <Button size="sm" className="rounded-lg" onClick={() => toast.success(`Approved ${r.name}'s request`)}>
                    <Check className="mr-1 size-3.5" />Approve
                  </Button>
                </div>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">Nothing to review.</div>
          )}
        </div>
      </div>
    </div>
  );
}
