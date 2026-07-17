import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, X, Filter, AlertTriangle, Calendar as CalendarIcon, AlignLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { leaveRequests } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LeaveRequest = typeof leaveRequests[0];

export function ApprovalsPage() {
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("Pending");
  
  // State for the detailed view modal
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // State for the confirmation step inside the detailed modal
  const [confirmAction, setConfirmAction] = useState<"Approve" | "Decline" | null>(null);

  const rows = leaveRequests.filter((r) => (filter === "all" ? true : r.status === filter));

  const handleConfirm = () => {
    if (!selectedRequest || !confirmAction) return;
    if (confirmAction === "Approve") {
      toast.success(`Approved ${selectedRequest.name}'s request`);
    } else {
      toast.error(`Declined ${selectedRequest.name}'s request`);
    }
    setConfirmAction(null);
    setSelectedRequest(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Leave approvals"
        description="Review requests from your team."
        actions={
          <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Filter modal coming soon")}><Filter className="mr-1.5 size-4" />Filter</Button>
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

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="divide-y">
          {rows.map((r) => (
            <div 
              key={r.id} 
              className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center cursor-pointer"
              onClick={() => setSelectedRequest(r)}
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold text-white shadow-soft">
                {r.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{r.name}</span>
                  <span className="text-xs text-muted-foreground">requested</span>
                  <span className="text-sm font-medium">{r.type}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.from} - {r.to} · {r.days} day{r.days > 1 ? "s" : ""} · #{r.id}</div>
              </div>
              
              <div className="flex items-center gap-3">
                {r.subject && (
                  <span className="hidden md:inline-flex text-xs text-muted-foreground italic truncate max-w-[200px]">
                    "{r.subject}"
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[11px] font-semibold tracking-wide",
                    r.status === "Approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    r.status === "Pending" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    r.status === "Rejected" && "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  )}
                >
                  {r.status}
                </Badge>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">Nothing to review.</div>
          )}
        </div>
      </div>

      {/* Detailed Request Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => {
        if (!open) {
          setSelectedRequest(null);
          setConfirmAction(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden">
          {selectedRequest && (
            <>
              <div className="p-6 bg-muted/10 border-b">
                <div className="flex items-center gap-4">
                  <div className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-lg font-bold text-white shadow-soft">
                    {selectedRequest.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedRequest.name}</h2>
                    <p className="text-sm text-muted-foreground">Requested {selectedRequest.type}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="size-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold">Date & Duration</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRequest.from} to {selectedRequest.to} ({selectedRequest.days} day{selectedRequest.days > 1 ? "s" : ""})
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlignLeft className="size-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold">Reason</h4>
                    <div className="mt-2 rounded-xl bg-muted/30 p-4 border text-sm">
                      <p className="font-semibold mb-1">{selectedRequest.subject || "No Subject provided"}</p>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedRequest.description || "No description provided by the employee."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.status === "Pending" && (
                <div className="p-4 bg-muted/20 border-t flex flex-col gap-3">
                  {!confirmAction ? (
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950" onClick={() => setConfirmAction("Decline")}>
                        <X className="mr-2 size-4" /> Decline Request
                      </Button>
                      <Button className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setConfirmAction("Approve")}>
                        <Check className="mr-2 size-4" /> Approve Request
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                      <h4 className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 mb-2">
                        <AlertTriangle className="size-4" /> 
                        Confirm {confirmAction}
                      </h4>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mb-4">
                        Are you sure you want to {confirmAction.toLowerCase()} this leave request? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => setConfirmAction(null)}>Cancel</Button>
                        <Button 
                          size="sm" 
                          className={cn("flex-1 rounded-lg text-white", confirmAction === "Decline" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700")}
                          onClick={handleConfirm}
                        >
                          Yes, {confirmAction}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
