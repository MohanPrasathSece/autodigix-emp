import { Clock, CalendarCheck, PlaneTakeoff, TrendingUp, Coffee, FileText, ChevronRight } from "lucide-react";
import { useAttendance } from "@/lib/attendanceEngine";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useHolidays, useNotifications, useLeaveRequests, useEmployees, useAttendanceHistory } from "@/shared/api/queries";
import { formatLeaveDate, getLocalToday } from "@/shared/lib/dateUtils";
import { useAuthStore } from "@/shared/store/auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function EmployeeDashboard() {
  const { isWorking, seconds, startWork, stopWork, isLoading } = useAttendance();
  const { data: holidays = [] } = useHolidays();
  const { user } = useAuthStore();
  const { data: notifications = [] } = useNotifications(user?.id);
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: employees = [] } = useEmployees();
  const { data: attendanceHistory = [] } = useAttendanceHistory();
  const navigate = useNavigate();

  // Dynamically calculate the user's leaves taken
  const myLeaves = leaveRequests.filter((l: any) => l.employee_id === user?.id && l.status === "Approved");
  const leavesTaken = myLeaves.reduce((sum: number, l: any) => sum + l.days, 0);
  const me = employees.find((e: any) => e.id === user?.id);
  const totalLeaves = me?.leave_balance ?? 24;
  const leavesRemaining = Math.max(0, totalLeaves - leavesTaken);

  // ── Clock-in reminder ──────────────────────────────────────────────────────
  // After 9:35am on a weekday, if the employee hasn't clocked in today,
  // send one reminder email (guarded by localStorage so it fires once/day).
  useEffect(() => {
    if (!user || !me) return;

    const now = new Date();
    const day = now.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) return; // skip weekends

    const today = getLocalToday();
    const reminderKey = `clock_in_reminder_${user.id}_${today}`;
    if (localStorage.getItem(reminderKey)) return; // already sent today

    const todayLogs = (attendanceHistory as any[]).filter(
      (h: any) => h.employee_id === user.id && String(h.date).slice(0, 10) === today
    );
    if (todayLogs.length > 0) return; // already clocked in

    const totalMins = now.getHours() * 60 + now.getMinutes();
    const reminderMins = 9 * 60 + 35; // 09:35

    const fireReminder = () => {
      localStorage.setItem(reminderKey, "1");
      const apiUrl = import.meta.env.VITE_API_URL || "";
      fetch(`${apiUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: me.email,
          subject: "Reminder: Please clock in to start your workday",
          text: `Hi ${me.name},\n\nThis is a reminder that you haven't clocked in yet today.\n\nPlease log in and start your work session:\nhttps://autodigix-emp.vercel.app/\n\nIf you are already working, please clock in through the portal.\n\nAutodigix HR`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:12px;background:#fff">
            <div style="background:#1e293b;padding:20px;text-align:center;border-radius:8px 8px 0 0">
              <h2 style="color:#fff;margin:0;font-size:18px">⏰ Clock-In Reminder</h2>
              <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">Autodigix HR</p>
            </div>
            <div style="padding:24px;color:#334155;line-height:1.7">
              <p style="font-size:15px;font-weight:bold;margin-top:0">Hi ${me.name},</p>
              <p>It looks like you haven't clocked in yet today. Please start your work session so your attendance is recorded correctly.</p>
              <a href="https://autodigix-emp.vercel.app/" style="display:inline-block;margin-top:8px;background:#2563eb;color:#fff;padding:11px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">Clock In Now →</a>
              <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0"/>
              <p style="font-size:12px;color:#94a3b8;margin:0">This is an automated reminder from Autodigix HR. If you are on leave or working remotely, please inform your manager.</p>
            </div>
          </div>`
        }),
      }).catch(() => {}); // silent fail — don't disrupt UI
    };

    if (totalMins >= reminderMins) {
      // Already past 9:35 — fire immediately
      fireReminder();
    } else {
      // Schedule for 9:35
      const msUntilReminder = (reminderMins - totalMins) * 60 * 1000 - now.getSeconds() * 1000;
      const timer = setTimeout(fireReminder, msUntilReminder);
      return () => clearTimeout(timer);
    }
  }, [user, me, attendanceHistory]);
  // ──────────────────────────────────────────────────────────────────────────

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAfterShiftEnd = new Date().getHours() > 18 || (new Date().getHours() === 18 && new Date().getMinutes() >= 30);
  const WORKDAY_SECONDS = 9 * 3600;
  const progressPercent = Math.min(100, Math.floor((seconds / WORKDAY_SECONDS) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${user?.name ? user.name.split(" ")[0] : "Employee"}`}
        description="Here's a calm overview of your day at Autodigix."
      />

      <div className="rounded-2xl border bg-card p-6 shadow-soft flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="z-10 space-y-1">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Today's Total Time</h2>
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-primary">
            {formatTime(seconds)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isWorking
              ? "You are currently clocked in and tracking time."
              : isAfterShiftEnd
                ? "Today's shift has ended (6:30 PM). Clock-in is closed for today."
                : "You are currently clocked out. You can resume before 6:30 PM."}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="default"
              variant={isWorking ? "destructive" : isAfterShiftEnd ? "secondary" : "default"} 
              className="z-10 rounded-xl px-8 shadow-sm hover:scale-105 transition-all mt-2"
              disabled={isLoading || (!isWorking && isAfterShiftEnd)}
            >
              <Clock className="mr-2 size-4" /> 
              {isLoading
                ? "Loading…"
                : isWorking
                  ? "Stop Work"
                  : isAfterShiftEnd
                    ? "Shift Ended"
                    : seconds > 0
                      ? "Resume Work"
                      : "Start Work"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {isWorking 
                  ? "You are about to pause your work timer. Your time so far today is saved and you can resume anytime before 6:30 PM."
                  : "You are about to start (or resume) your work timer. Your daily hours will keep accumulating."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="rounded-lg"
                onClick={isWorking ? () => stopWork() : startWork}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Live Attendance" value={`${progressPercent}%`} icon={CalendarCheck} hint="Based on 9-hour workday" />
        <StatCard label="Leaves Available" value={`${leavesRemaining} days`} icon={PlaneTakeoff} hint={`Remaining of ${totalLeaves} days`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Upcoming holidays</h2>
            <span className="text-xs text-muted-foreground">Next 60 days</span>
          </div>
          <ul className="divide-y">
            {(() => {
              const today = new Date();
              const sixtyDaysFromNow = new Date(today);
              sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
              
              const upcomingHolidays = holidays.filter((h: any) => {
                const holidayDate = new Date(h.date);
                return holidayDate >= today && holidayDate <= sixtyDaysFromNow;
              });
              
              return upcomingHolidays.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">No upcoming holidays.</div>
              ) : (
                upcomingHolidays.map((h: any) => (
                  <li key={h.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-sm font-medium">{h.name}</div>
                      <div className="text-xs text-muted-foreground">{formatLeaveDate(h.date)}</div>
                    </div>
                    <div className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Public
                    </div>
                  </li>
                ))
              );
            })()}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Notifications</h2>
          </div>
          <ul className="space-y-3">
            {notifications.length === 0 ? (
               <div className="p-4 text-center text-sm text-muted-foreground">No notifications.</div>
            ) : (
              notifications.map((n: any) => (
                <li key={n.id} className="rounded-xl border bg-background/60 p-3 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-[11px] text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Quick actions</h2>
          <p className="text-xs text-muted-foreground">Shortcuts for the most-used tasks</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { icon: PlaneTakeoff, label: "Apply leave", path: "/employee/apply-leave" },
              { icon: FileText, label: "Payslip", path: "/employee/payslips" },
            ].map((a: any) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className="group flex flex-col items-start gap-2 rounded-xl border bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft"
              >
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <a.icon className="size-4" />
                </div>
                <span className="text-sm font-medium">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
