
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Info, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { useHolidays, useLeaveRequests } from "@/shared/api/queries";
import { useAuthStore } from "@/shared/store/auth";

type DayKind = "present" | "leave-approved" | "leave-pending" | "govt-holiday" | "weekend" | "absent" | "none";

const kindStyles: Record<DayKind, string> = {
  present: "bg-primary/10 text-primary border-primary/20 hover:border-primary/40",
  "leave-approved": "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30 hover:border-red-500/50 font-bold overflow-hidden",
  "leave-pending": "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 hover:border-amber-500/40",
  "govt-holiday": "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60 font-semibold",
  weekend: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 hover:border-green-500/40",
  absent: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20 hover:border-rose-500/40",
  none: "",
};

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDays(year: number, month: number, govtHolidaysMap: Record<string, string>, userLeaves: any[]) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date?: Date; kind: DayKind; note?: string }[] = [];
  
  for (let i = 0; i < startOffset; i++) cells.push({ kind: "none" });
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dow = dt.getDay();
    const dateKey = formatDateKey(dt);
    
    let kind: DayKind = "present";
    let note = "Working Day";

    // Check if this date falls in any user leave
    const leaveForDay = userLeaves.find(l => {
      const from = new Date(l.from || l.from_date);
      const to = new Date(l.to || l.to_date);
      return dt >= from && dt <= to;
    });

    if (dow === 0 || dow === 6) {
      kind = "weekend";
      note = "Weekend (Leave)";
    } else if (govtHolidaysMap[dateKey]) {
      kind = "govt-holiday";
      note = `${govtHolidaysMap[dateKey]} - Government Holiday`;
    } else if (leaveForDay) {
      kind = leaveForDay.status === "Approved" ? "leave-approved" : 
             leaveForDay.status === "Pending" ? "leave-pending" : "present";
      note = `${leaveForDay.status} Leave (${leaveForDay.type})`;
    }
    
    cells.push({ date: dt, kind, note });
  }
  
  while (cells.length % 7 !== 0) cells.push({ kind: "none" });
  return cells;
}

const legend: { kind: DayKind; label: string }[] = [
  { kind: "present", label: "Present" },
  { kind: "weekend", label: "Weekend" },
  { kind: "govt-holiday", label: "Govt Holiday" },
  { kind: "leave-approved", label: "Approved leave" },
  { kind: "leave-pending", label: "Pending leave" },
  { kind: "absent", label: "Absent" },
];

export function CalendarPage() {
  const [baseDate, setBaseDate] = useState(new Date(2026, 6, 1)); // Starts July 2026
  const [selectedDay, setSelectedDay] = useState<{ date: Date; kind: DayKind; note: string } | null>(null);

  const { data: holidays = [] } = useHolidays();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { user } = useAuthStore();

  const govtHolidaysMap = holidays.reduce((acc: any, h: any) => {
    acc[h.date] = h.name;
    return acc;
  }, {});

  const myLeaves = leaveRequests.filter((l: any) => l.employee_id === user?.id);

  // Build data for 3 consecutive months
  const monthsData = [0, 1, 2].map(offset => {
    const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    return {
      label: targetDate.toLocaleString("en", { month: "long", year: "numeric" }),
      cells: buildDays(targetDate.getFullYear(), targetDate.getMonth(), govtHolidaysMap, myLeaves)
    };
  });

  const nextQuarter = () => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 3, 1));
  const prevQuarter = () => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 3, 1));
  const goToday = () => setBaseDate(new Date());

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Calendar"
        description="See attendance, holidays, and leave at a glance."
        actions={
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="rounded-xl" onClick={prevQuarter}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={goToday}>
              Today
            </Button>
            <Button size="icon" variant="outline" className="rounded-xl" onClick={nextQuarter}>
              <ChevronRight className="size-4" />
            </Button>
            <Link to="/employee/apply-leave" className="ml-2">
              <Button className="rounded-xl"><Plus className="mr-1.5 size-4" />Apply for leave</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {monthsData.map((month, mIndex) => (
          <div key={mIndex} className="rounded-2xl border bg-card p-4 shadow-soft">
            <h2 className="text-sm font-semibold text-center mb-4">{month.label}</h2>
            
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1.5">
              {month.cells.map((c, i) => (
                <button
                  key={i}
                  disabled={!c.date}
                  onClick={() => c.date && setSelectedDay({ date: c.date, kind: c.kind, note: c.note || "" })}
                  className={cn(
                    "aspect-square rounded-lg border transition-all text-xs font-medium flex items-center justify-center relative",
                    c.date ? kindStyles[c.kind] : "opacity-0 pointer-events-none border-transparent",
                  )}
                >
                  {c.kind === "leave-approved" && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                      <X className="size-full max-w-10 max-h-10 text-red-600" strokeWidth={1} />
                    </div>
                  )}
                  <span className="relative z-10">{c.date && c.date.getDate()}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card p-4 shadow-soft">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          {legend.map((l) => (
            <div key={l.kind} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className={cn("size-3 rounded-[4px] border", kindStyles[l.kind])} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="size-5 text-muted-foreground" />
              {selectedDay?.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className={cn("p-4 rounded-xl border flex gap-3 items-start", selectedDay ? kindStyles[selectedDay.kind] : "")}>
              <Info className="size-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">{selectedDay?.note}</h4>
                <p className="text-xs opacity-90">
                  {selectedDay?.kind === "weekend" && "This is a standard non-working day."}
                  {selectedDay?.kind === "govt-holiday" && "This is a mandatory government public holiday."}
                  {selectedDay?.kind === "leave-approved" && "Your leave request for this day has been approved."}
                  {selectedDay?.kind === "leave-pending" && "Your leave request is awaiting manager approval."}
                  {selectedDay?.kind === "present" && "You were marked present on this day."}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
