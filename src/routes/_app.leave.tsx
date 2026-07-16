import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leave")({
  head: () => ({ meta: [{ title: "Leave — Pulse HR" }] }),
  component: LeavePage,
});

const myLeaves = [
  { type: "Vacation", from: "Jul 22", to: "Jul 26", days: 5, status: "Pending" as const, note: "Family trip to Kyoto" },
  { type: "Sick Leave", from: "Jun 12", to: "Jun 12", days: 1, status: "Approved" as const, note: "Flu" },
  { type: "Personal", from: "May 03", to: "May 03", days: 1, status: "Approved" as const, note: "Home errands" },
  { type: "Vacation", from: "Apr 15", to: "Apr 19", days: 5, status: "Approved" as const, note: "Spring break" },
];

function LeavePage() {
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({});
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave"
        description="Track your time away and apply for new leave."
        actions={
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-xl"><Plus className="mr-1.5 size-4" />Apply for leave</Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader>
                <SheetTitle>New leave request</SheetTitle>
                <SheetDescription>Your request is sent to your manager for approval.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5 px-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Leave type</label>
                  <Select defaultValue="vacation">
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick">Sick leave</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
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
                        {range.from ? (range.to ? `${format(range.from, "PP")} — ${format(range.to, "PP")}` : format(range.from, "PP")) : "Pick a date range"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar mode="range" selected={range as any} onSelect={(v: any) => setRange(v || {})} numberOfMonths={1} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining balance</span>
                    <span className="font-semibold">14 days</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>After request</span>
                    <span>{Math.max(0, 14 - (range.from && range.to ? Math.round((+range.to - +range.from) / 86400000) + 1 : 0))} days</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Reason</label>
                  <Textarea placeholder="A short note for your manager…" className="min-h-24 rounded-xl" />
                </div>
              </div>
              <SheetFooter className="mt-6 flex-row gap-2 px-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className="flex-1 rounded-xl" onClick={() => { toast.success("Leave request submitted"); setOpen(false); }}>Submit</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Vacation", used: 6, total: 20 },
          { label: "Sick leave", used: 2, total: 10 },
          { label: "Personal", used: 1, total: 5 },
        ].map((l) => (
          <div key={l.label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{l.label}</span>
              <span className="text-xs text-muted-foreground">{l.total - l.used}/{l.total} left</span>
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">{l.used} <span className="text-sm font-normal text-muted-foreground">used</span></div>
            <Progress value={(l.used / l.total) * 100} className="mt-3 h-1.5" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">My leave history</h2>
        </div>
        <div className="divide-y">
          {myLeaves.map((l, i) => (
            <div key={i} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarIcon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{l.type}</span>
                  <span className="text-xs text-muted-foreground">· {l.days} day{l.days > 1 ? "s" : ""}</span>
                </div>
                <div className="text-xs text-muted-foreground">{l.from} — {l.to} · {l.note}</div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-[11px]",
                  l.status === "Approved" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  l.status === "Pending" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                {l.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
