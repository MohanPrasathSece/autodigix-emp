import { useState, useMemo, useEffect } from "react";
import { Clock, CalendarCheck, Users, AlertTriangle, Play, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEmployees } from "@/shared/api/queries";
import { useUpdateAttendance } from "@/shared/api/mutations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths } from "date-fns";

const getStatus = (progress: number, status: string) => {
  if (status === "On Leave") return { text: "On Leave", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" };
  if (progress === 0) return { text: "Not Started", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
  if (progress >= 100) return { text: "Completed Shift", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  return { text: "Working", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", active: true };
};

// --- Components ---

function CircularProgress({ value, color = "var(--primary)" }: { value: number, color?: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 size-24">
        <circle className="text-muted/30" strokeWidth="6" stroke="currentColor" fill="transparent" r={radius} cx="48" cy="48" />
        <circle
          style={{ color }}
          className="transition-all duration-1000 ease-in-out"
          strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="48" cy="48"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold">{value}%</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Done</span>
      </div>
    </div>
  );
}

// 6-Month Calendar Component
function AbsenceCalendar() {
  const { data: employees = [] } = useEmployees();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Gather all absent dates for easy lookup
  const allAbsences = useMemo(() => {
    const map = new Map<string, { emp: any, subject: string }[]>();
    employees.forEach((emp: any) => {
      if (emp.absentDates) {
        emp.absentDates.forEach((ab: any) => {
          const arr = map.get(ab.date) || [];
          arr.push({ emp, subject: ab.subject });
          map.set(ab.date, arr);
        });
      }
    });
    return map;
  }, [employees]);

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Absence Calendar</h3>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={prevMonth} className="size-8 rounded-lg"><ChevronLeft className="size-4" /></Button>
          <div className="font-semibold min-w-[120px] text-center">{format(currentMonth, "MMMM yyyy")}</div>
          <Button variant="outline" size="icon" onClick={nextMonth} className="size-8 rounded-lg"><ChevronRight className="size-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d: any) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day, i: any) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const absences = allAbsences.get(dateStr) || [];
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div 
              key={i} 
              className={cn(
                "min-h-[80px] rounded-xl border p-1 transition-colors relative flex flex-col",
                !isCurrentMonth && "opacity-30 bg-muted/50",
                isCurrentMonth && isWeekend && "bg-emerald-50 dark:bg-emerald-950/20",
                isCurrentMonth && !isWeekend && "bg-background",
                absences.length > 0 && isCurrentMonth && "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
              )}
            >
              <span className={cn(
                "text-xs font-semibold p-1",
                absences.length > 0 && isCurrentMonth ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </span>
              
              <div className="flex-1 flex flex-wrap gap-1 mt-1 content-start">
                {absences.map((ab, idx: any) => (
                  <Popover key={idx}>
                    <PopoverTrigger asChild>
                      {ab.emp.avatarUrl ? (
                        <img src={ab.emp.avatarUrl} className="size-6 rounded-full cursor-pointer ring-2 ring-background shadow-sm hover:scale-110 transition-transform" alt={ab.emp.name} />
                      ) : (
                        <div className={cn("grid size-6 place-items-center rounded-full text-[9px] font-bold text-white cursor-pointer ring-2 ring-background shadow-sm hover:scale-110 transition-transform", ab.emp.avatar_color || ab.emp.avatarColor)}>
                          {ab.emp.initials}
                        </div>
                      )}
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        {ab.emp.avatarUrl ? (
                          <img src={ab.emp.avatarUrl} className="size-8 rounded-full" alt={ab.emp.name} />
                        ) : (
                          <div className={cn("grid size-8 place-items-center rounded-full text-xs font-bold text-white", ab.emp.avatar_color || ab.emp.avatarColor)}>
                            {ab.emp.initials}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold">{ab.emp.name}</p>
                          <p className="text-xs text-muted-foreground">{format(day, "PPP")}</p>
                        </div>
                      </div>
                      <div className="text-sm border-t pt-2 mt-2">
                        <span className="font-semibold text-red-600">Subject:</span> {ab.subject}
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// Format seconds to HH:MM:SS
function fmtSecs(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export function AttendancePage() {
  const { data: employees = [] } = useEmployees();
  const updateAttendanceMutation = useUpdateAttendance();
  const [activeTab, setActiveTab] = useState("live");
  const [confirmAction, setConfirmAction] = useState<{ type: "Start" | "Stop", empId: string, name: string } | null>(null);
  const [now, setNow] = useState(new Date());

  // Live clock — ticks every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayLabel = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTimeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Read employee clock-in times from localStorage (keyed by employee id if admin forced, or the shared key)
  const clockInAt = localStorage.getItem("autodigix_clock_in_at");

  const activeCount = employees.filter((e: any) => e.attendance > 0 && e.attendance < 100 && e.status !== "On Leave").length;
  const leaveCount = employees.filter((e: any) => e.status === "On Leave").length;
  const notStartedCount = employees.length - activeCount - leaveCount;

  const handleConfirm = () => {
    if (!confirmAction) return;
    
    const newAttendance = confirmAction.type === "Start" ? 50 : 100;
    
    updateAttendanceMutation.mutate(
      { id: confirmAction.empId, newAttendance },
      {
        onSuccess: () => {
          toast.success(`Successfully manually ${confirmAction.type.toLowerCase()}ed work for ${confirmAction.name}`);
          setConfirmAction(null);
        }
      }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Attendance & Timetracking"
        description={`${todayLabel} · ${currentTimeLabel}`}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl bg-muted/60 p-1 mb-6">
          <TabsTrigger value="live" className="rounded-lg">Live Tracker</TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg">Absence History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border bg-card p-4 flex items-center gap-4 shadow-soft">
              <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Now</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4 flex items-center gap-4 shadow-soft">
              <div className="grid size-10 place-items-center rounded-full bg-amber-500/10 text-amber-500">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{leaveCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">On Leave</p>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4 flex items-center gap-4 shadow-soft">
              <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notStartedCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Not Started</p>
              </div>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((emp: any) => {
              const progress = emp.status === "On Leave" ? 0 : emp.attendance;
              const status = getStatus(progress, emp.status);
              
              let ringColor = "var(--primary)";
              if (emp.status === "On Leave") ringColor = "#f59e0b"; // amber-500
              else if (progress === 0) ringColor = "var(--muted-foreground)";
              else if (progress >= 100) ringColor = "#10b981"; // emerald-500

              const canStart = progress === 0 && emp.status !== "On Leave";
              const canStop = progress > 0 && progress < 100 && emp.status !== "On Leave";

              return (
                <div key={emp.id} className="rounded-3xl border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-md flex flex-col items-center text-center relative overflow-hidden group">
                  <div className="absolute top-4 right-4">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border flex items-center gap-1.5", status.bg, status.color, status.border)}>
                      {status.active && <span className="size-1.5 rounded-full bg-current animate-pulse" />}
                      {status.text}
                    </span>
                  </div>

                  <div className="mt-8 mb-2 flex flex-col items-center justify-center">
                    <CircularProgress value={progress} color={ringColor} />
                    
                    {/* Admin Action Buttons */}
                    <div className="mt-4 flex h-10 w-full items-center justify-center">
                      {canStart ? (
                        <Button variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900 dark:hover:bg-emerald-950" onClick={() => setConfirmAction({ type: "Start", empId: emp.id, name: emp.name })}>
                          <Play className="mr-1.5 size-3" /> Force Start
                        </Button>
                      ) : canStop ? (
                        <Button variant="outline" size="sm" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-950" onClick={() => setConfirmAction({ type: "Stop", empId: emp.id, name: emp.name })}>
                          <Square className="mr-1.5 size-3" /> Force Stop
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">No Actions Available</span>
                      )}
                    </div>
                  </div>

                  {emp.avatarUrl ? (
                    <img src={emp.avatarUrl} alt={emp.name} className="size-10 rounded-xl object-cover shadow-soft mb-3 absolute top-4 left-4 border" />
                  ) : (
                    <div className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-xs font-semibold text-white shadow-soft mb-3 absolute top-4 left-4", emp.avatar_color || emp.avatarColor)}>
                      {emp.initials}
                    </div>
                  )}
                  
                  <h3 className="text-base font-bold">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium mb-4">{emp.role}</p>

                  <div className="w-full pt-4 border-t border-dashed space-y-2">
                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground/80">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <div className="flex items-center gap-1 font-mono"><Clock className="size-3" /> {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    </div>
                    {progress > 0 && progress < 100 && clockInAt && (
                      <div className="text-center">
                        <span className="text-[10px] text-muted-foreground">Started </span>
                        <span className="text-[10px] font-semibold">{new Date(parseInt(clockInAt, 10)).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="mx-1 text-[10px] text-muted-foreground">·</span>
                        <span className="font-mono text-[10px] font-bold text-primary">{fmtSecs(Math.floor((now.getTime() - parseInt(clockInAt, 10)) / 1000))}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <AbsenceCalendar />
        </TabsContent>
      </Tabs>

      {/* Admin Action Confirmation Modal */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className={cn("size-5", confirmAction?.type === "Start" ? "text-emerald-500" : "text-red-500")} />
              Force {confirmAction?.type} Work
            </DialogTitle>
            <DialogDescription className="pt-3">
              Are you sure you want to manually <strong>{confirmAction?.type?.toLowerCase()}</strong> the shift for {confirmAction?.name}? 
              This will create an admin override log in the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button 
              className={cn("rounded-xl text-white", confirmAction?.type === "Stop" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700")}
              onClick={handleConfirm}
              disabled={updateAttendanceMutation.isPending}
            >
              {updateAttendanceMutation.isPending ? "Confirming..." : `Confirm ${confirmAction?.type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
