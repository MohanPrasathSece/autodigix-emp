import { Users, UserCheck, PlaneTakeoff, Wallet, ChevronRight, FileSpreadsheet, PlusCircle, UserPlus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

const attendanceTrend = [
  { day: "Mon", present: 142 },
  { day: "Tue", present: 145 },
  { day: "Wed", present: 139 },
  { day: "Thu", present: 148 },
  { day: "Fri", present: 146 },
  { day: "Sat", present: 45 },
  { day: "Sun", present: 40 },
];

const pendingLeaves = [
  { id: "LV-089", employee: "Aarav Sharma", type: "Vacation", days: 3, date: "Aug 12 - Aug 14" },
  { id: "LV-090", employee: "Priya Patel", type: "Sick Leave", days: 1, date: "Aug 02" },
  { id: "LV-091", employee: "Rahul Verma", type: "Personal", days: 2, date: "Aug 05 - Aug 06" },
];

export function AdminDashboardView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        description="Company overview, analytics, and pending approvals."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl">
              <FileSpreadsheet className="mr-2 size-4" /> Export Report
            </Button>
            <Button className="rounded-xl">
              <UserPlus className="mr-2 size-4" /> Add Employee
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value="156" delta="+4 this month" trend="up" icon={Users} hint="Active headcount" />
        <StatCard label="Today's Attendance" value="94%" delta="-2% vs yesterday" trend="down" icon={UserCheck} hint="148 / 156 Present" />
        <StatCard label="Pending Leaves" value="12" delta="Requires review" trend="neutral" icon={PlaneTakeoff} hint="3 urgent" />
        <StatCard label="Monthly Payroll" value="$248,500" delta="Processed" trend="up" icon={Wallet} hint="July 2026" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Real-time Status Card & Notifications */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold">Today's Team Status</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="rounded-xl border bg-muted/20 p-4 text-center">
                <p className="text-3xl font-bold text-primary">4</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Total Employees</p>
             </div>
             <div className="rounded-xl border bg-emerald-500/10 bg-emerald-500/5 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">3</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium">Working Now</p>
             </div>
             <div className="rounded-xl border bg-amber-500/10 bg-amber-500/5 p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">1</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 font-medium">On Leave</p>
             </div>
          </div>

          <div>
             <h3 className="text-sm font-semibold mb-4">Notification Log</h3>
             <div className="space-y-3">
               {[
                 { id: 1, message: "Aarav Sharma started work", time: "09:00 AM", type: "work" },
                 { id: 2, message: "Priya Patel is on leave today", time: "09:15 AM", type: "leave" },
                 { id: 3, message: "Rahul Verma started work", time: "09:30 AM", type: "work" },
                 { id: 4, message: "Vikram Singh started work", time: "10:00 AM", type: "work" },
               ].map((log) => (
                 <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 text-sm hover:bg-muted/20 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className={`size-2 rounded-full ${log.type === 'work' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                     <span className="font-medium">{log.message}</span>
                   </div>
                   <span className="text-xs text-muted-foreground font-medium">{log.time}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Pending Approvals</h2>
              <Badge variant="secondary" className="rounded-md">{pendingLeaves.length} New</Badge>
            </div>
            <div className="space-y-4">
              {pendingLeaves.map((leave) => (
                <div key={leave.id} className="p-3 rounded-xl border bg-muted/20 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{leave.employee}</p>
                      <p className="text-xs text-muted-foreground">{leave.type} · {leave.days} Day(s)</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{leave.date}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" className="h-7 w-full text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                    <Button size="sm" variant="outline" className="h-7 w-full text-xs rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950">Deny</Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground">View All Requests</Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-4">
        {[
          { icon: UserPlus, label: "Onboard Employee", desc: "Send invite link" },
          { icon: RefreshCw, label: "Run Payroll", desc: "Process monthly cycle" },
          { icon: PlusCircle, label: "Add Holiday", desc: "Update company calendar" },
          { icon: FileSpreadsheet, label: "Audit Reports", desc: "Generate compliance doc" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => toast.info(`Action triggered: ${action.label}`)}
            className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
              <action.icon className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-semibold">{action.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{action.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
