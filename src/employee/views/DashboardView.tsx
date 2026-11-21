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
import { useEffect, useState } from "react";

export function EmployeeDashboard() {
  const { isWorking, seconds, startWork, stopWork, isLoading } = useAttendance();
  const { data: holidays = [] } = useHolidays();
  const { user } = useAuthStore();
  const { data: notifications = [] } = useNotifications(user?.id);
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: employees = [] } = useEmployees();
  const { data: attendanceHistory = [] } = useAttendanceHistory();
  const navigate = useNavigate();

  // Dynamic live clock ensuring 9:25 AM and 6:30 PM button states update in real-time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically calculate the user's leaves taken
  const myLeaves = leaveRequests.filter((l: any) => l.employee_id === user?.id && l.status === "Approved");
  const leavesTaken = myLeaves.reduce((sum: number, l: any) => sum + l.days, 0);
  const me = employees.find((e: any) => e.id === user?.id);
  const totalLeaves = me?.leave_balance ?? 24;
  const leavesRemaining = Math.max(0, totalLeaves - leavesTaken);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isBeforeShiftStart = currentMinutes < (9 * 60 + 25); // Cannot clock in before 9:25 AM (5 mins before 9:30 AM shift start)
  const isAfterShiftEnd = currentMinutes >= (18 * 60 + 30);   // Shift ends at 6:30 PM

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
            {isAfterShiftEnd
              ? "Today's shift ended at 6:30 PM. Clock-out is automatically closed for today."
              : isWorking
                ? "You are currently clocked in and tracking time."
                : isBeforeShiftStart
                  ? "Clock-in opens at 9:25 AM (5 minutes before 9:30 AM shift start)."
                  : "You are currently clocked out. You can resume before 6:30 PM."}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="default"
              variant={isAfterShiftEnd ? "secondary" : isWorking ? "destructive" : isBeforeShiftStart ? "secondary" : "default"} 
              className="z-10 rounded-xl px-8 shadow-sm hover:scale-105 transition-all mt-2"
              disabled={isLoading || isAfterShiftEnd || (!isWorking && isBeforeShiftStart)}
            >
              <Clock className="mr-2 size-4" /> 
              {isLoading
                ? "Loading…"
                : isAfterShiftEnd
                  ? "Shift Ended"
                  : isWorking
                    ? "Stop Work"
                    : isBeforeShiftStart
                      ? "Opens at 9:25 AM"
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
