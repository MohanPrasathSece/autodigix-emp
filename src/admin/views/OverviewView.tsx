import { Users, PlaneTakeoff, Wallet, TrendingUp, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEmployees, useLeaveRequests, useAttendanceTrend, usePayrollTrend, useDepartmentSplit, usePayslips, useAttendanceHistory } from "@/shared/api/queries";
import { useUpdateLeaveRequestStatus, useAddNotification } from "@/shared/api/mutations";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/shared/components/ui/alert-dialog";
import { useState } from "react";

const donutColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "oklch(0.75 0.14 300)"];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { data: employees = [] } = useEmployees();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: attendanceTrend = [] } = useAttendanceTrend();
  const { data: payrollTrend = [] } = usePayrollTrend();
  const { data: departmentSplit = [] } = useDepartmentSplit();
  const { data: payslips = [] } = usePayslips();
  const { data: attendanceHistory = [] } = useAttendanceHistory();

  const updateLeaveStatus = useUpdateLeaveRequestStatus();
  const addNotification = useAddNotification();
  
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const totalEmployees = employees.length;
  const onLeaveToday = employees.filter((e: any) => e.status === "On Leave").length;
  
  // Calculate total monthly payroll for current month (or any latest period available)
  const latestPeriod = payslips.length > 0 ? payslips[payslips.length - 1].period : "No Data";
  const monthlyPayroll = payslips
    .filter((p: any) => p.period === latestPeriod)
    .reduce((sum: number, p: any) => sum + p.net, 0);

  // Calculate retention simply as a placeholder (since we don't track terminations yet)
  const retentionRate = totalEmployees > 0 ? "100%" : "0%";

  const handleApproveLeave = (id: string, name: string) => {
    updateLeaveStatus.mutate({ id, status: 'Approved' }, {
      onSuccess: () => {
        toast.success("Leave Approved", { description: `${name}'s leave has been approved.` });
        addNotification.mutate({
          title: "Leave Approved",
          body: `You approved a leave request for ${name}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tone: "success"
        });
      }
    });
  };

  const handleDeclineLeave = (id: string, name: string) => {
    updateLeaveStatus.mutate({ id, status: 'Rejected' }, {
      onSuccess: () => {
        toast.success("Leave Declined", { description: `${name}'s leave has been rejected.` });
        addNotification.mutate({
          title: "Leave Declined",
          body: `You declined a leave request for ${name}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tone: "warning"
        });
      }
    });
  };

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
        <StatCard label="Employees" value={totalEmployees.toString()} delta="" trend="up" icon={Users} hint="Active headcount" />
        <StatCard label="On leave today" value={onLeaveToday.toString()} delta="" trend={onLeaveToday > 0 ? "down" : "up"} icon={PlaneTakeoff} hint="Current absences" />
        <StatCard label="Monthly payroll" value={`$${(monthlyPayroll / 1000).toFixed(1)}k`} delta="" trend="up" icon={Wallet} hint={`Period: ${latestPeriod}`} />
        <StatCard label="Retention" value={retentionRate} delta="" trend="up" icon={TrendingUp} hint="Since inception" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Live Attendance Snapshot</h2>
              <p className="text-xs text-muted-foreground">Present vs absent (Today)</p>
            </div>
          </div>
          <div className="mt-4 h-64">
            {attendanceTrend.length > 0 ? (
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No attendance data yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Departments</h2>
          <p className="text-xs text-muted-foreground">Headcount distribution</p>
          <div className="mt-2 h-52">
            {departmentSplit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentSplit} innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                    {departmentSplit.map((_: any, i: number) => (
                      <Cell key={i} fill={donutColors[i % donutColors.length]} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No employees yet.</div>
            )}
          </div>
          <ul className="mt-2 space-y-1.5 text-xs">
            {departmentSplit.map((d: any, i: number) => (
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
            <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={() => navigate('/admin/leaves')}>View all</Button>
          </div>
          <div className="divide-y">
            {leaveRequests.filter((r: any) => r.status === "Pending").length === 0 ? (
               <div className="py-4 text-center text-sm text-muted-foreground">No pending requests.</div>
            ) : (
              leaveRequests.filter((r: any) => r.status === "Pending").map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-muted/30 px-2 rounded-lg transition-colors" onClick={() => { setSelectedLeave(r); setIsDetailsOpen(true); }}>
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-semibold text-white">
                    {r.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.type} · {r.from_date} – {r.to_date} · {r.days}d</div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave Request Details</DialogTitle>
              </DialogHeader>
              {selectedLeave && (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Employee</div>
                    <div className="text-base">{selectedLeave.name}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Type</div>
                      <div className="text-base">{selectedLeave.type}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Duration</div>
                      <div className="text-base">{selectedLeave.from_date} to {selectedLeave.to_date} ({selectedLeave.days} days)</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Subject</div>
                    <div className="text-base">{selectedLeave.subject || "No subject provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Reason</div>
                    <div className="text-sm bg-muted/30 p-3 rounded-lg min-h-20 whitespace-pre-wrap">{selectedLeave.description || "No additional details provided."}</div>
                  </div>
                  <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="hover:bg-red-50 hover:text-red-600">Decline</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to decline this request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will notify {selectedLeave.name} that their leave request has been rejected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { handleDeclineLeave(selectedLeave.id, selectedLeave.name); setIsDetailsOpen(false); }} className="bg-red-600 hover:bg-red-700">Decline Request</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Approve Leave Request?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will approve {selectedLeave.days} day(s) of {selectedLeave.type} for {selectedLeave.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { handleApproveLeave(selectedLeave.id, selectedLeave.name); setIsDetailsOpen(false); }} className="bg-emerald-600 hover:bg-emerald-700">Approve Request</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Payroll trend</h2>
          <p className="text-xs text-muted-foreground">Recent months ($)</p>
          <div className="mt-2 h-52">
            {payrollTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payrollTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                  <Line type="monotone" dataKey="payroll" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No payroll data yet.</div>
            )}
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
          {employees.filter((e: any) => attendanceHistory.some((h: any) => h.employee_id === e.id && h.status === 'Clocked In' && h.date === new Date().toISOString().split('T')[0])).length === 0 ? (
            <div className="col-span-4 py-8 text-center text-sm text-muted-foreground">No active employees right now.</div>
          ) : (
            employees.filter((e: any) => attendanceHistory.some((h: any) => h.employee_id === e.id && h.status === 'Clocked In' && h.date === new Date().toISOString().split('T')[0])).slice(0, 4).map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                <div className={`grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br ${e.avatarColor || e.avatar_color} text-xs font-semibold text-white`}>
                  {e.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{e.role}</div>
                </div>
                <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                  <span className="mr-1 size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Working
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
