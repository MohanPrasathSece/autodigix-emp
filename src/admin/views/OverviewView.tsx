import { Users, PlaneTakeoff, Wallet, TrendingUp, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { employees, leaveRequests, attendanceTrend, payrollTrend, departmentSplit } from "@/lib/mock-data";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";



const donutColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.75 0.14 300)"];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Company overview"
        description="A calm, live snapshot of your organization."
        actions={
          <>
            <Button variant="outline" className="rounded-xl">Export</Button>
            <Button className="rounded-xl">New report</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value="124" delta="+4" trend="up" icon={Users} hint="6 new this month" />
        <StatCard label="On leave today" value="7" delta="-2" trend="down" icon={PlaneTakeoff} hint="3 pending approval" />
        <StatCard label="Monthly payroll" value="$468k" delta="+2.6%" trend="up" icon={Wallet} hint="Processed Jul 1" />
        <StatCard label="Retention" value="94.2%" delta="+0.8%" trend="up" icon={TrendingUp} hint="Last 12 months" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Attendance this week</h2>
              <p className="text-xs text-muted-foreground">Present vs absent, all departments</p>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="present" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="absent" fill="oklch(0.9 0.02 260)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Departments</h2>
          <p className="text-xs text-muted-foreground">Headcount distribution</p>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentSplit} innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                  {departmentSplit.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {departmentSplit.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: donutColors[i % donutColors.length] }} />
                  {d.name}
                </span>
                <span className="font-medium">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Pending leave requests</h2>
              <p className="text-xs text-muted-foreground">Awaiting your approval</p>
            </div>
            <Button size="sm" variant="ghost" className="rounded-lg text-xs">View all</Button>
          </div>
          <div className="divide-y">
            {leaveRequests.filter(r => r.status === "Pending").map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-semibold text-white">
                  {r.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type} · {r.from} – {r.to} · {r.days}d</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg">Decline</Button>
                <Button size="sm" className="rounded-lg">Approve</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Payroll trend</h2>
          <p className="text-xs text-muted-foreground">Last 7 months ($k)</p>
          <div className="mt-2 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Line type="monotone" dataKey="payroll" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Live activity</h2>
            <p className="text-xs text-muted-foreground">Who's active right now</p>
          </div>
          <Button size="icon" variant="ghost" className="rounded-lg"><MoreHorizontal className="size-4" /></Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {employees.slice(0, 4).map((e) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
              <div className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${e.avatarColor} text-xs font-semibold text-white`}>
                {e.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e.name}</div>
                <div className="truncate text-xs text-muted-foreground">{e.role}</div>
              </div>
              <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                <span className="mr-1 size-1.5 rounded-full bg-emerald-500" /> Active
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
