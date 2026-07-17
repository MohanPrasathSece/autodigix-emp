import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Clock, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DayKind = "govt-holiday" | "weekend" | "none";

// Mock Data for Govt Holidays
const govtHolidays: Record<string, string> = {
  "2026-07-04": "Independence Day",
  "2026-08-15": "National Day",
  "2026-10-02": "Gandhi Jayanti",
};

const kindStyles: Record<DayKind, string> = {
  "govt-holiday": "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60 font-semibold",
  weekend: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 hover:border-green-500/40",
  none: "",
};

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date?: Date; kind: DayKind; note?: string }[] = [];
  
  for (let i = 0; i < startOffset; i++) cells.push({ kind: "none" });
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dow = dt.getDay();
    const dateKey = formatDateKey(dt);
    
    let kind: DayKind = "none";
    let note = "Working Day";

    if (dow === 0 || dow === 6) {
      kind = "weekend";
      note = "Weekend (Leave)";
    } else if (govtHolidays[dateKey]) {
      kind = "govt-holiday";
      note = `${govtHolidays[dateKey]} - Government Holiday`;
    }
    
    cells.push({ date: dt, kind, note });
  }
  
  while (cells.length % 7 !== 0) cells.push({ kind: "none" });
  return cells;
}

const legend: { kind: DayKind; label: string }[] = [
  { kind: "weekend", label: "Weekend" },
  { kind: "govt-holiday", label: "Govt Holiday" },
];

const mockLogs = [
  { id: 1, type: "work", message: "Aarav Sharma started work", time: "Today, 09:00 AM", timestamp: new Date(Date.now() - 2 * 3600000) },
  { id: 2, type: "leave", message: "Priya Patel's leave request approved", time: "Today, 09:15 AM", timestamp: new Date(Date.now() - 3 * 3600000) },
  { id: 3, type: "work", message: "Rahul Verma started work", time: "Today, 09:30 AM", timestamp: new Date(Date.now() - 4 * 3600000) },
  { id: 4, type: "leave", message: "Vikram Singh's leave request rejected", time: "Yesterday, 10:00 AM", timestamp: new Date(Date.now() - 26 * 3600000) },
  { id: 5, type: "work", message: "Neha Gupta stopped work", time: "Yesterday, 06:00 PM", timestamp: new Date(Date.now() - 30 * 3600000) },
  { id: 6, type: "work", message: "Aarav Sharma stopped work", time: "2 Days ago, 06:15 PM", timestamp: new Date(Date.now() - 48 * 3600000) },
  { id: 7, type: "leave", message: "System auto-deleted logs older than 7 days", time: "1 Week ago", timestamp: new Date(Date.now() - 7 * 24 * 3600000) },
];

export function CalendarPage() {
  const [baseDate, setBaseDate] = useState(new Date()); // Starts current month
  const [selectedDay, setSelectedDay] = useState<{ date: Date; kind: DayKind; note: string } | null>(null);

  // Filter logs to last 7 days only (to simulate auto deletion)
  const recentLogs = mockLogs.filter(log => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return log.timestamp >= oneWeekAgo;
  });

  // Build data for 1 month
  const targetDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthData = {
    label: targetDate.toLocaleString("en", { month: "long", year: "numeric" }),
    cells: buildDays(targetDate.getFullYear(), targetDate.getMonth())
  };

  const nextMonth = () => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1));
  const prevMonth = () => setBaseDate(new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1));
  const goToday = () => setBaseDate(new Date());

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Calendar & Logs"
        description="View holidays, weekends, and real-time organization logs."
        actions={
          <div className="flex gap-2">
            <Button size="icon" variant="outline" className="rounded-xl" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={goToday}>
              Today
            </Button>
            <Button size="icon" variant="outline" className="rounded-xl" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{monthData.label}</h2>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="size-8 rounded-lg" onClick={prevMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" className="h-8 text-xs rounded-lg" onClick={goToday}>
                  Today
                </Button>
                <Button size="icon" variant="outline" className="size-8 rounded-lg" onClick={nextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1.5">
              {monthData.cells.map((c, i) => (
                <button
                  key={i}
                  disabled={!c.date}
                  onClick={() => c.date && setSelectedDay({ date: c.date, kind: c.kind, note: c.note || "" })}
                  className={cn(
                    "h-10 sm:h-12 rounded-lg border transition-all text-sm font-medium flex items-center justify-center relative hover:bg-muted/50",
                    c.date ? kindStyles[c.kind] : "opacity-0 pointer-events-none border-transparent",
                  )}
                >
                  {c.date && c.date.getDate()}
                </button>
              ))}
            </div>
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
        </div>

        {/* Activity Logs Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border bg-card shadow-soft h-full flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Notification Logs
              </h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <AlertCircle className="size-3" /> Auto-deletes after 7 days
              </p>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm border-b pb-4 last:border-0">
                  <div className={`mt-1 size-2 shrink-0 rounded-full ${log.type === 'work' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                  <div>
                    <p className="font-medium text-sm leading-tight">{log.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
              
              {recentLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent logs found.
                </div>
              )}
            </div>
          </div>
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
                  {selectedDay?.kind === "none" && "This is a standard working day."}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
