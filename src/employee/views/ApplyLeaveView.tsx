import { useState, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, AlertCircle, Trash2, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isWeekend, eachDayOfInterval } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAttendance } from "@/lib/attendanceEngine";
import { useLeaveRequests } from "@/shared/api/queries";
import { useApplyLeave, useDeleteLeaveRequest } from "@/shared/api/mutations";
import { useAuthStore } from "@/shared/store/auth";

export function LeavePage() {
  const { user } = useAuthStore();
  const { data: allLeaveRequests = [], isLoading } = useLeaveRequests();
  const applyLeaveMutation = useApplyLeave();
  const deleteLeaveMutation = useDeleteLeaveRequest();

  // Filter leaves for this specific employee
  const myLeaves = useMemo(() => {
    if (!user) return [];
    return allLeaveRequests.filter((lr: any) => lr.employee_id === user.id);
  }, [allLeaveRequests, user]);

  const leavesTaken = useMemo(() => {
    return myLeaves.filter((l: any) => l.status === "Approved").reduce((sum: number, l: any) => sum + l.days, 0);
  }, [myLeaves]);

  const totalLeaves = 24;
  const leavesRemaining = totalLeaves - leavesTaken;

  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("paid");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // Calculate actual business days (ignoring weekends)
  const businessDays = useMemo(() => {
    if (!range.from) return 0;
    if (!range.to) return isWeekend(range.from) ? 0 : 1;
    
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    return days.filter(d => !isWeekend(d)).length;
  }, [range]);

  // Validation Rules
  const maxContinuousExceeded = leaveType === "paid" && businessDays >= 6;
  const isWeekendSelected = range.from && isWeekend(range.from) && !range.to;
  
  const balanceExceeded = leaveType === "paid" && businessDays > leavesRemaining;

  const canSubmit = businessDays > 0 && !maxContinuousExceeded && !balanceExceeded && subject.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit || !user) return;
    
    // Generate sequential ID based on total count
    const maxId = allLeaveRequests.reduce((max: number, req: any) => {
      const numId = parseInt(req.id);
      return !isNaN(numId) && numId > max ? numId : max;
    }, 0);
    const newId = (maxId + 1).toString();
    
    let displayType = "Vacation";
    if (leaveType === "sick") displayType = "Sick Leave";
    if (leaveType === "unpaid") displayType = "Unpaid Leave";

    applyLeaveMutation.mutate(
      {
        id: newId,
        employee_id: user.id,
        name: user.name,
        type: displayType,
        from_date: format(range.from!, "MMM dd"),
        to_date: range.to ? format(range.to, "MMM dd") : format(range.from!, "MMM dd"),
        days: businessDays,
        status: "Pending",
        subject: subject,
        description: description
      },
      {
        onSuccess: () => {
          toast.success("Leave request submitted", {
            description: `Requested ${businessDays} day(s). Your manager will review this shortly.`
          });
          setOpen(false);
          setRange({});
          setSubject("");
          setDescription("");
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leave & Time Off"
        description="Apply for leave. Note: Max 2 paid leaves/month, max 6 continuous."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl"><Plus className="mr-1.5 size-4" />Apply for leave</Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-md overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>New leave request</DialogTitle>
                <DialogDescription>Your request is sent to your manager for approval.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Leave type</label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid Leave</SelectItem>
                      <SelectItem value="sick">Sick leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Dates</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-11 w-full justify-start rounded-xl font-normal", !range.from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 size-4" />
                        {range.from ? (range.to ? `${format(range.from, "PP")} - ${format(range.to, "PP")}` : format(range.from, "PP")) : "Pick a date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar 
                        mode="range" 
                        selected={range as any} 
                        onSelect={(v: any) => setRange(v || {})} 
                        numberOfMonths={1} 
                        className="p-3 pointer-events-auto"
                        disabled={(date) => isWeekend(date)} // Gray out weekends entirely
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {isWeekendSelected && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="size-3" /> Weekends are non-working days.
                    </p>
                  )}
                </div>

                <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Total requested</span>
                    <span className="font-semibold">{businessDays} business day(s)</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Remaining Balance</span>
                    <span>{leavesRemaining} days</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs font-medium">
                    <span>After request</span>
                    <span className={leavesRemaining - businessDays < 0 ? "text-red-500" : ""}>
                      {Math.max(0, leavesRemaining - businessDays)} days
                    </span>
                  </div>
                </div>

                {maxContinuousExceeded && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm border border-red-500/20 text-red-600">
                    <strong>Rule Violation:</strong> You cannot take 6 or more continuous paid leaves.
                  </div>
                )}
                
                {balanceExceeded && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-sm border border-red-500/20 text-red-600">
                    <strong>Rule Violation:</strong> You do not have enough paid leaves.
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Subject</label>
                  <Input 
                    placeholder="E.g., Sick Leave, Doctor Appointment" 
                    className="rounded-xl"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Description / Reason</label>
                  <Textarea 
                    placeholder="Provide more details for your manager…" 
                    className="min-h-24 rounded-xl"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter className="mt-2 flex-row gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button 
                  className="flex-1 rounded-xl" 
                  disabled={!canSubmit || applyLeaveMutation.isPending} 
                  onClick={handleSubmit}
                >
                  {applyLeaveMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Paid Leaves</span>
              <span className="text-xs text-muted-foreground">{leavesRemaining}/{totalLeaves} left</span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{leavesTaken} <span className="text-sm font-normal text-muted-foreground">used</span></div>
            <Progress value={(leavesTaken / totalLeaves) * 100} className="mt-3 h-1.5" />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Recent Leave Requests</h2>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="size-10 rounded-xl bg-muted/60 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-muted/60 rounded w-1/4" />
                    <div className="h-3 bg-muted/60 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : myLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="size-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <CalendarCheck className="size-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Looks like you haven't taken time off yet!</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mb-6">
                You have {leavesRemaining} days remaining. Tap the button above to request some time off.
              </p>
              <Button onClick={() => setOpen(true)} className="rounded-xl shadow-sm">
                <Plus className="mr-2 size-4" /> Apply for leave
              </Button>
            </div>
          ) : myLeaves.map((l: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{l.type}</span>
                  <span className="text-xs text-muted-foreground">· {l.days} day{l.days > 1 ? "s" : ""}</span>
                </div>
                <div className="text-xs text-muted-foreground">{l.from} - {l.to} · {l.subject}</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[11px]",
                    l.status === "Approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    l.status === "Pending" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    l.status === "Rejected" && "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
                  )}
                >
                  {l.status}
                </Badge>
                {l.status !== "Approved" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if(window.confirm("Are you sure you want to cancel this leave request?")) {
                        deleteLeaveMutation.mutate(l.id);
                      }
                    }}
                    title="Cancel Request"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
