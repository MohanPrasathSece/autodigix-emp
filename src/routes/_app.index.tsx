import { createFileRoute } from "@tanstack/react-router";
import { Clock, CalendarCheck, PlaneTakeoff, TrendingUp, Coffee, FileText, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { holidays, notifications } from "@/lib/mock-data";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_app/")({
  component: EmployeeDashboard,
});

const weekHours = [
  { day: "Mon", h: 8.2 },
  { day: "Tue", h: 7.9 },
  { day: "Wed", h: 8.6 },
  { day: "Thu", h: 8.1 },
  { day: "Fri", h: 6.8 },
];

function EmployeeDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Good morning, Aarav"
        description="Here's a calm overview of your day at Pulse HR."
        actions={
          <>
            <Button variant="outline" className="rounded-xl">
              <Coffee className="mr-1.5 size-4" /> Break
            </Button>
            <Button className="rounded-xl">
              <Clock className="mr-1.5 size-4" /> Clock out
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value="6h 42m" delta="+12m" trend="up" icon={Clock} hint="Clocked in at 9:12 AM" />
        <StatCard label="This week" value="34.6h" delta="+2.1h" trend="up" icon={TrendingUp} hint="Target 40h" />
        <StatCard label="Attendance" value="96%" icon={CalendarCheck} hint="Last 30 days" />
        <StatCard label="Leave balance" value="14 days" icon={PlaneTakeoff} hint="Resets Dec 31" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Working hours</h2>
              <p className="text-xs text-muted-foreground">Weekly average 7.9h · Target 8h</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg text-xs text-muted-foreground">
              This week <ChevronRight className="ml-1 size-3" />
            </Button>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekHours}>
                <defs>
                  <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="h" stroke="var(--primary)" strokeWidth={2} fill="url(#gradHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold">Leave balance</h2>
            <p className="text-xs text-muted-foreground">Annual allocation</p>
            <div className="mt-4 space-y-4 text-sm">
              {[
                { label: "Vacation", used: 6, total: 20 },
                { label: "Sick leave", used: 2, total: 10 },
                { label: "Personal", used: 1, total: 5 },
              ].map((l) => (
                <div key={l.label}>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">{l.label}</span>
                    <span className="font-medium">
                      {l.total - l.used} / {l.total} left
                    </span>
                  </div>
                  <Progress value={(l.used / l.total) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        </div>
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
              { icon: Clock, label: "Timesheet" },
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
