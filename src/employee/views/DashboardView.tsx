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
import { Progress } from "@/components/ui/progress";
import { holidays, notifications } from "@/lib/mock-data";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";





export function EmployeeDashboard() {
  const { isWorking, seconds, startWork, stopWork, paidLeaves } = useAttendance();

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Aarav"
        description="Here's a calm overview of your day at Autodigix."
        actions={
          <div className="flex items-center gap-3">
            {isWorking && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg font-mono text-sm font-medium">
                <Clock className="size-4 animate-pulse" />
                {formatTime(seconds)}
              </div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant={isWorking ? "destructive" : "default"} 
                  className="rounded-xl transition-all min-w-[120px]"
                >
                  <Clock className="mr-1.5 size-4" /> 
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
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Attendance" value="96%" icon={CalendarCheck} hint="Last 30 days" />
        <StatCard label="Leaves Available" value={`${6 - paidLeaves} days`} icon={PlaneTakeoff} hint="Remaining of 6 days" />
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
            {holidays.map((h) => (
              <li key={h.name} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.date}</div>
                </div>
                <div className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Public
                </div>
              </li>
            ))}
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
            {notifications.map((n) => (
              <li key={n.id} className="rounded-xl border bg-background/60 p-3 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-[11px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Quick actions</h2>
          <p className="text-xs text-muted-foreground">Shortcuts for the most-used tasks</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { icon: PlaneTakeoff, label: "Apply leave" },
              { icon: FileText, label: "Payslip" },
              { icon: CalendarCheck, label: "Attendance" },
            ].map((a) => (
              <button
                key={a.label}
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
