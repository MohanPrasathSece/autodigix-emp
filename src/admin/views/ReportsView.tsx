import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

const payrollData = [
  { month: "Jan", cost: 120000 },
  { month: "Feb", cost: 122000 },
  { month: "Mar", cost: 121500 },
  { month: "Apr", cost: 125000 },
  { month: "May", cost: 128000 },
  { month: "Jun", cost: 135000 },
  { month: "Jul", cost: 142000 },
];

const attendanceRateData = [
  { month: "Jan", rate: 95 },
  { month: "Feb", rate: 94 },
  { month: "Mar", rate: 96 },
  { month: "Apr", rate: 97 },
  { month: "May", rate: 95 },
  { month: "Jun", rate: 92 },
  { month: "Jul", rate: 98 },
];

const leaveStatusData = [
  { name: "Approved", value: 145 },
  { name: "Pending", value: 24 },
  { name: "Rejected", value: 12 },
];
const STATUS_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

const workHoursData = [
  { day: "Mon", hours: 8.2 },
  { day: "Tue", hours: 8.5 },
  { day: "Wed", hours: 8.1 },
  { day: "Thu", hours: 8.4 },
  { day: "Fri", hours: 7.9 },
];

export function ReportsView() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Organization Reports"
        description="Detailed analytics and reports for HR management."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl">
              <Download className="mr-2 size-4" /> Download PDF
            </Button>
            <Button className="rounded-xl">
              <FileSpreadsheet className="mr-2 size-4" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attendance Trend */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-6">
            <h2 className="text-base font-bold">Average Attendance Rate</h2>
            <p className="text-sm text-muted-foreground">Monthly percentage of active employees present</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceRateData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis 
                  domain={[80, 100]}
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  stroke="var(--muted-foreground)"
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                  formatter={(value: number) => [`${value}%`, "Attendance"]}
                />
                <Area type="monotone" dataKey="rate" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Work Hours */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="mb-6">
            <h2 className="text-base font-bold">Average Daily Work Hours</h2>
            <p className="text-sm text-muted-foreground">Average hours logged per employee by day</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workHoursData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="var(--muted-foreground)" domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                  formatter={(value: number) => [`${value} hrs`, "Avg Hours"]}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leave Status Distribution */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-1 flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="flex-1 w-full">
            <h2 className="text-base font-bold">Leave Request Status</h2>
            <p className="text-sm text-muted-foreground mb-6">Overview of all leave requests this year</p>
            
            <div className="space-y-4">
              {leaveStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[index] }} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value} reqs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[200px] w-full md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaveStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaveStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payroll Trend */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-1">
          <div className="mb-6">
            <h2 className="text-base font-bold">Monthly Payroll Expense</h2>
            <p className="text-sm text-muted-foreground">Total salary payouts over the year</p>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  fontSize={12} 
                  stroke="var(--muted-foreground)"
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Cost"]}
                />
                <Line type="monotone" dataKey="cost" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
