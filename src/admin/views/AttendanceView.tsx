import { useState, useMemo, useEffect } from "react";
import { Clock, CalendarCheck, Users, AlertTriangle, Play, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEmployees, useAttendanceHistory } from "@/shared/api/queries";
import { supabase } from "@/lib/supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, subMonths, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths } from "date-fns";
import { getLocalToday, isOnLeaveOn } from "@/shared/lib/dateUtils";

type EmpState = "Working" | "On Leave" | "Clocked Out" | "Absent";

// Coherent status pill derived from the employee's real attendance state.
const getStatus = (state: EmpState) => {
  switch (state) {
    case "Working":
      return { text: "Working", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", active: true };
    case "On Leave":
      return { text: "On Leave", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", active: false };
    case "Clocked Out":
      return { text: "Clocked Out", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", active: false };
    default:
      return { text: "Absent", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", active: false };
  }
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


// Format total seconds as "Xh Ym".
function fmtHours(totalSeconds: number) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

// Real attendance records (newest first) — one row per employee/day.
function AttendanceHistoryTable({ rows, employees }: { rows: any[]; employees: any[] }) {
  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    (employees || []).forEach((e: any) => map.set(e.id, e.name));
    return map;
  }, [employees]);

  const sorted = useMemo(() => {
    return [...(rows || [])].sort((a: any, b: any) => {
      if (a?.date !== b?.date) return String(b?.date || "").localeCompare(String(a?.date || ""));
      return (Number(b?.id) || 0) - (Number(a?.id) || 0);
    });
  }, [rows]);

  const fmtTime = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-soft max-w-3xl mx-auto">
      <h3 className="text-lg font-bold mb-4">Attendance History</h3>
      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Clock In</TableHead>
              <TableHead>Clock Out</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No attendance records yet.</TableCell>
              </TableRow>
            ) : (
              sorted.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs tabular-nums">{r.date}</TableCell>
                  <TableCell className="text-sm font-medium">{nameById.get(r.employee_id) || r.employee_id}</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtTime(r.clock_in_time)}</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtTime(r.clock_out_time)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{Number(r.hours || 0).toFixed(2)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border",
                      r.status === "Clocked In"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    )}>
                      {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function AttendancePage() {
  const { data: employees = [] } = useEmployees();
  const { data: attendanceHistory = [] } = useAttendanceHistory();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("live");
  const [confirmAction, setConfirmAction] = useState<{ type: "Start" | "Stop", empId: string, name: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [now, setNow] = useState(new Date());

  const SHIFT_HOURS = 8; // Full shift duration in hours

  // Live clock — ticks every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const todayLabel = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const currentTimeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Build today's attendance data from attendance_history (one row per employee/day).
  const today = getLocalToday();

  // Most-recent today row per employee (ordered by id desc so duplicates resolve to the newest).
  const todayRecordsMap = useMemo(() => {
    const map = new Map<string, { id: number; status: string; clock_in_time: string | null; clock_out_time: string | null; hours: number }>();
    (attendanceHistory as any[])
      .filter((record: any) => record?.date === today && record?.employee_id)
      .sort((a: any, b: any) => (Number(b.id) || 0) - (Number(a.id) || 0))
      .forEach((record: any) => {
        if (map.has(record.employee_id)) return; // keep only the newest row
        map.set(record.employee_id, {
          id: record.id,
          status: record.status,
          clock_in_time: record.clock_in_time || record.created_at || null,
          clock_out_time: record.clock_out_time || null,
          hours: Math.max(0, Number(record.hours) || 0),
        });
      });
    return map;
  }, [attendanceHistory, today]);

  // "On Leave" is derived from today's approved-leave (absent_dates) entries.
  const onLeaveToday = (emp: any): boolean => isOnLeaveOn(emp.absentDates, today);

  // Total hours worked today = accumulated hours + the running session.
  const getTotalHours = (empId: string): number => {
    const rec = todayRecordsMap.get(empId);
    if (!rec) return 0;
    let total = Math.max(0, Number(rec.hours) || 0);
    if (rec.status === "Clocked In" && rec.clock_in_time) {
      const start = new Date(rec.clock_in_time).getTime();
      if (!isNaN(start)) total += Math.max(0, (now.getTime() - start) / 3600000);
    }
    return Math.max(0, Number(total.toFixed(2)));
  };

  // Progress = total hours worked today vs the full shift length.
  const getTodayProgress = (empId: string): number => {
    return Math.min(100, Math.round((getTotalHours(empId) / SHIFT_HOURS) * 100));
  };

  // Coherent per-employee status for the live board.
  const getEmployeeState = (emp: any): EmpState => {
    const rec = todayRecordsMap.get(emp.id);
    if (rec?.status === "Clocked In") return "Working";
    if (onLeaveToday(emp)) return "On Leave";
    if (rec?.status === "Clocked Out") return "Clocked Out";
    return "Absent";
  };

  const activeCount = employees.filter((e: any) => getEmployeeState(e) === "Working").length;
  const completedCount = employees.filter((e: any) => getEmployeeState(e) === "Clocked Out").length;
  const leaveCount = employees.filter((e: any) => getEmployeeState(e) === "On Leave").length;
  const notStartedCount = employees.filter((e: any) => getEmployeeState(e) === "Absent").length;

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setIsConfirming(true);

    try {
      const existing = todayRecordsMap.get(confirmAction.empId) || null;
      const nowIso = new Date().toISOString();

      if (confirmAction.type === "Start") {
        // Mirror a normal Clock In: keep accumulated hours and resume the session.
        if (existing) {
          const { error } = await supabase
            .from('attendance_history')
            .update({
              status: 'Clocked In',
              clock_in_time: nowIso,
              clock_out_time: null,
            })
            .eq('id', existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from('attendance_history').insert([{
            date: today,
            employee_id: confirmAction.empId,
            hours: 0,
            status: 'Clocked In',
            clock_in_time: nowIso,
          }]);
          if (error) throw new Error(error.message);
        }
      } else {
        // Force Stop: accumulate this session's length onto the day's total.
        const startMs = existing?.clock_in_time ? new Date(existing.clock_in_time).getTime() : NaN;
        const sessionHours = isNaN(startMs) ? 0 : Math.max(0, (Date.now() - startMs) / 3600000);
        const totalHours = Number(((existing ? Math.max(0, Number(existing.hours) || 0) : 0) + sessionHours).toFixed(2));

        if (existing) {
          const { error } = await supabase.from('attendance_history').update({
            hours: Math.max(0, totalHours),
            status: 'Clocked Out',
            clock_out_time: nowIso,
          }).eq('id', existing.id);
          if (error) throw new Error(error.message);
        } else {
          const { error } = await supabase.from('attendance_history').insert([{
            date: today,
            employee_id: confirmAction.empId,
            hours: Math.max(0, totalHours),
            status: 'Clocked Out',
            clock_out_time: nowIso,
          }]);
          if (error) throw new Error(error.message);
        }
      }

      // Manually invalidate to ensure the view refetches
      await queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });

      toast.success(`Successfully manually ${confirmAction.type.toLowerCase()}ed work for ${confirmAction.name}`);
      setConfirmAction(null);
    } catch (e: any) {
      toast.error(e.message || `Failed to ${confirmAction.type.toLowerCase()} work`);
    } finally {
      setIsConfirming(false);
    }
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
          <TabsTrigger value="history" className="rounded-lg">History</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
              <div className="grid size-10 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Completed</p>
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
              <div className="grid size-10 place-items-center rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notStartedCount}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Absent</p>
              </div>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((emp: any) => {
              const onLeave = onLeaveToday(emp);
              const state = getEmployeeState(emp);
              const working = state === "Working";
              const progress = getTodayProgress(emp.id);
              const status = getStatus(state);
              const empClockIn = working ? (todayRecordsMap.get(emp.id)?.clock_in_time || null) : null;
              const totalSeconds = Math.floor(getTotalHours(emp.id) * 3600);

              let ringColor = "var(--primary)";
              if (state === "On Leave") ringColor = "#f59e0b"; // amber-500
              else if (state === "Absent") ringColor = "#ef4444"; // red-500
              else if (state === "Clocked Out") ringColor = "#10b981"; // emerald-500

              const canStart = !working && !onLeave;
              const canStop = working;

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
                    <div className="text-center">
                      <span className="text-[10px] text-muted-foreground">Today: </span>
                      <span className="font-mono text-[10px] font-bold text-primary">{fmtHours(totalSeconds)}</span>
                      {working && empClockIn && (
                        <>
                          <span className="mx-1 text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">Session since </span>
                          <span className="text-[10px] font-semibold">{new Date(empClockIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <AttendanceHistoryTable rows={attendanceHistory as any[]} employees={employees as any[]} />
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
              disabled={isConfirming}
            >
              {isConfirming ? "Confirming..." : `Confirm ${confirmAction?.type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
