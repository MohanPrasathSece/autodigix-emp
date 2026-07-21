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
import { useHolidays, useNotifications, useLeaveRequests } from "@/shared/api/queries";
import { useAuthStore } from "@/shared/store/auth";
import { useNavigate } from "react-router-dom";

export function EmployeeDashboard() {
  const { isWorking, seconds, startWork, stopWork } = useAttendance();
  const { data: holidays = [] } = useHolidays();
  const { data: notifications = [] } = useNotifications();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Dynamically calculate the user's leaves taken
  const myLeaves = leaveRequests.filter((l: any) => l.employee_id === user?.id && l.status === "Approved");
  const leavesTaken = myLeaves.reduce((sum: number, l: any) => sum + l.days, 0);
  const totalLeaves = 24; // Standardized total leaves available per year
  const leavesRemaining = totalLeaves - leavesTaken;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good morning, ${user?.name ? user.name.split(" ")[0] : "Employee"}`}
        description="Here's a calm overview of your day at Autodigix."
      />

      <div className="rounded-2xl border bg-card p-6 shadow-soft flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="z-10 space-y-1">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Session</h2>
          <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight tabular-nums text-primary">
            {formatTime(seconds)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{isWorking ? "You are currently clocked in and tracking time." : "You are currently clocked out."}</p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              size="default"
              variant={isWorking ? "destructive" : "default"} 
              className="z-10 rounded-xl px-8 shadow-sm hover:scale-105 transition-all mt-2"
            >
              <Clock className="mr-2 size-4" /> 
              {isWorking ? "Stop Work" : "Start Work"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {isWorking 
                  ? "You are about to stop your work timer. You can resume it later today, but your active tracking will pause."
                  : "You are about to start your work timer. Your daily hours will be tracked."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="rounded-lg"
                onClick={isWorking ? stopWork : startWork}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Mocked Attendance score since it's difficult to calculate without historical daily clock-in records */}
        <StatCard label="Attendance" value={`${(user as any)?.attendance || 100}%`} icon={CalendarCheck} hint="Your overall attendance score" />
        <StatCard label="Leaves Available" value={`${leavesRemaining} days`} icon={PlaneTakeoff} hint={`Remaining of ${totalLeaves} days`} />
      </div>

      <div className="grid gap-6">
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Upcoming holidays</h2>
            <span className="text-xs text-muted-foreground">Next 60 days</span>
          </div>
          <ul className="divide-y">
            {holidays.length === 0 ? (
               <div className="py-4 text-center text-sm text-muted-foreground">No upcoming holidays.</div>
            ) : (
              holidays.map((h: any) => (
                <li key={h.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.date}</div>
                  </div>
                  <div className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Public
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Notifications</h2>
            <Button size="sm" variant="ghost" className="rounded-lg text-xs">
              View all
            </Button>
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
