import { createFileRoute } from "@tanstack/react-router";
import { Users, PlaneTakeoff, Wallet, TrendingUp, Filter, Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { attendanceTrend, payrollTrend, departmentSplit } from "@/lib/mock-data";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/reports")({
  head: () => ({ meta: [{ title: "Reports — Pulse HR" }] }),
  component: ReportsPage,
});

const donutColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.75 0.14 300)"];

const hires = [
  { m: "Jan", v: 4 }, { m: "Feb", v: 6 }, { m: "Mar", v: 3 },
  { m: "Apr", v: 8 }, { m: "May", v: 5 }, { m: "Jun", v: 7 }, { m: "Jul", v: 4 },
];

function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Insights across headcount, attendance, and payroll."
        actions={
          <>
            <Button variant="outline" className="rounded-xl"><Filter className="mr-1.5 size-4" />Filter</Button>
            <Button className="rounded-xl"><Download className="mr-1.5 size-4" />Export</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Headcount" value="124" delta="+3.4%" trend="up" icon={Users} />
        <StatCard label="Avg attendance" value="93.4%" delta="+0.6%" trend="up" icon={TrendingUp} />
        <StatCard label="Leave utilization" value="47%" delta="-1.2%" trend="down" icon={PlaneTakeoff} />
        <StatCard label="Payroll YTD" value="$3.12M" delta="+8.1%" trend="up" icon={Wallet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Payroll growth</h2>
          <p className="text-xs text-muted-foreground">Monthly total ($k)</p>
          <div className="mt-4 h-64">
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

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Weekly attendance</h2>
          <p className="text-xs text-muted-foreground">Present vs absent</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceTrend} barCategoryGap={16}>
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
          <h2 className="text-base font-semibold">New hires</h2>
          <p className="text-xs text-muted-foreground">Trailing 7 months</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hires} barCategoryGap={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Bar dataKey="v" fill="oklch(0.65 0.16 155)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Department split</h2>
          <p className="text-xs text-muted-foreground">Headcount by team</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={departmentSplit} innerRadius={60} outerRadius={92} paddingAngle={3} dataKey="value">
                  {departmentSplit.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} stroke="var(--card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
