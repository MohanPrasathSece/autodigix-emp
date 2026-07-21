import { useState } from "react";
import { Users, UserCheck, PlaneTakeoff, Wallet, ChevronRight, FileSpreadsheet, PlusCircle, UserPlus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLeaveRequests, useEmployees, usePayslips, useAttendanceHistory } from "@/shared/api/queries";
import { useUpdateLeaveRequestStatus, useAddNotification, useRunPayroll, useAddHoliday } from "@/shared/api/mutations";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

export function AdminDashboardView() {
  const navigate = useNavigate();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: employees = [] } = useEmployees();
  const { data: payslips = [] } = usePayslips();
  const { data: attendanceHistory = [] } = useAttendanceHistory();

  const updateLeaveStatus = useUpdateLeaveRequestStatus();
  const addNotification = useAddNotification();
  const runPayroll = useRunPayroll();
  const addHoliday = useAddHoliday();

  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");

  const pendingLeaves = leaveRequests.filter((r: any) => r.status === "Pending").slice(0, 3);
  
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e: any) => e.attendance >= 50 && e.status !== "On Leave").length;
  const onLeaveEmployees = employees.filter((e: any) => e.status === "On Leave").length;

  const attendanceRate = totalEmployees > 0 
    ? Math.round(((totalEmployees - onLeaveEmployees) / totalEmployees) * 100) 
    : 0;

  const latestPeriod = payslips.length > 0 ? payslips[payslips.length - 1].period : "No Data";
  const monthlyPayroll = payslips
    .filter((p: any) => p.period === latestPeriod)
    .reduce((sum: number, p: any) => sum + p.net, 0);

  // Real notification log from attendance_history — today's events only
  const todayStr = new Date().toISOString().split('T')[0];
  const todayHistory = (attendanceHistory as any[])
    .filter((h: any) => h.date === todayStr)
    .sort((a: any, b: any) => b.id - a.id) // latest first
    .slice(0, 6);

  const notificationLog = todayHistory.map((h: any) => {
    const emp = employees.find((e: any) => e.id === h.employee_id);
    const empName = emp?.name || `Employee #${h.employee_id}`;
    const isOut = h.status === 'Clocked Out';
    let timeLabel = h.date;
    if (h.created_at) {
      const d = new Date(h.created_at);
      if (isOut && d.getHours() >= 19) {
        d.setHours(19, 0, 0, 0);
      }
      timeLabel = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
    return {
      id: h.id,
      message: isOut
        ? `${empName} clocked out after ${h.hours ? h.hours.toFixed(1) + ' hrs' : '—'}`
        : `${empName} clocked in`,
      time: timeLabel,
      type: isOut ? 'stop' : 'work',
    };
  });

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
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
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

  const handleRunPayroll = () => {
    const period = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
    runPayroll.mutate(period, {
      onSuccess: () => {
        addNotification.mutate({
          title: "Payroll Processed",
          body: `Payroll for ${period} has been generated successfully.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tone: "info"
        });
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }
    });
  };

  const handleAddHoliday = () => {
    if (!holidayName || !holidayDate) {
      toast.error("Please fill in both name and date.");
      return;
    }
    addHoliday.mutate({ name: holidayName, date: holidayDate }, {
      onSuccess: () => {
        setIsHolidayModalOpen(false);
        setHolidayName("");
        setHolidayDate("");
      }
    });
  };

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
            <Button className="rounded-xl" onClick={() => navigate('/admin/employees')}>
              <UserPlus className="mr-2 size-4" /> Add Employee
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totalEmployees.toString()} delta="" trend="up" icon={Users} hint="Active headcount" />
        <StatCard label="Today's Attendance" value={`${attendanceRate}%`} delta="" trend="up" icon={UserCheck} hint={`${totalEmployees - onLeaveEmployees} / ${totalEmployees} Expected`} />
        <StatCard label="Pending Leaves" value={leaveRequests.filter((r: any) => r.status === "Pending").length.toString()} delta="Requires review" icon={PlaneTakeoff} hint="Urgent" />
        <StatCard label="Monthly Payroll" value={`$${(monthlyPayroll / 1000).toFixed(1)}k`} delta="Processed" trend="up" icon={Wallet} hint={latestPeriod} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Real-time Status Card & Notifications */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold">Today's Team Status</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
             <div className="rounded-xl border bg-muted/20 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{totalEmployees}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Total Employees</p>
             </div>
             <div className="rounded-xl border bg-emerald-500/10 bg-emerald-500/5 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{activeEmployees}</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-1 font-medium">Working Now</p>
             </div>
             <div className="rounded-xl border bg-amber-500/10 bg-amber-500/5 p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{onLeaveEmployees}</p>
                <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1 font-medium">On Leave</p>
             </div>
          </div>

          <div>
             <h3 className="text-sm font-semibold mb-4">Notification Log</h3>
             <div className="space-y-3">
               {notificationLog.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">No recent activity logs.</div>
               ) : (
                 notificationLog.map((log) => (
                   <div key={log.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10 text-sm hover:bg-muted/20 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className={`size-2 rounded-full ${log.type === 'work' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : log.type === 'stop' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                       <span className="font-medium">{log.message}</span>
                     </div>
                     <span className="text-xs text-muted-foreground font-medium">{log.time}</span>
                   </div>
                 ))
               )}
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
              {pendingLeaves.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No pending approvals.</div>
              ) : (
                pendingLeaves.map((leave: any) => (
                  <div key={leave.id} className="p-3 rounded-xl border bg-muted/20 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{leave.name}</p>
                        <p className="text-xs text-muted-foreground">{leave.type} · {leave.days} Day(s)</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{leave.from} - {leave.to}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <Button 
                        size="sm" 
                        className="h-7 w-full text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApproveLeave(leave.id, leave.name)}
                        disabled={updateLeaveStatus.isPending}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-full text-xs rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                        onClick={() => handleDeclineLeave(leave.id, leave.name)}
                        disabled={updateLeaveStatus.isPending}
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs text-muted-foreground" onClick={() => navigate('/admin/leaves')}>View All Requests</Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Onboard Employee */}
        <button
          onClick={() => navigate('/admin/employees/add')}
          className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <UserPlus className="size-5" />
          </div>
          <div>
            <span className="block text-sm font-semibold">Onboard Employee</span>
            <span className="block text-xs text-muted-foreground mt-0.5">Send invite link</span>
          </div>
        </button>

        {/* Run Payroll */}
        <button
          onClick={handleRunPayroll}
          disabled={runPayroll.isPending}
          className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg disabled:opacity-50"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <RefreshCw className={`size-5 ${runPayroll.isPending ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <span className="block text-sm font-semibold">{runPayroll.isPending ? 'Processing...' : 'Run Payroll'}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">Process monthly cycle</span>
          </div>
        </button>

        {/* Add Holiday Dialog */}
        <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
          <DialogTrigger asChild>
            <button className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <PlusCircle className="size-5" />
              </div>
              <div>
                <span className="block text-sm font-semibold">Add Holiday</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Update company calendar</span>
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Public Holiday</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="holiday-name">Holiday Name</Label>
                <Input 
                  id="holiday-name" 
                  placeholder="e.g. Christmas Day" 
                  value={holidayName} 
                  onChange={e => setHolidayName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="holiday-date">Date</Label>
                <Input 
                  id="holiday-date" 
                  type="date" 
                  value={holidayDate} 
                  onChange={e => setHolidayDate(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsHolidayModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddHoliday} disabled={addHoliday.isPending}>
                {addHoliday.isPending ? "Adding..." : "Add Holiday"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Audit Reports */}
        <button
          onClick={() => navigate('/admin/reports')}
          className="group flex flex-col items-start gap-3 rounded-2xl border bg-card p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
            <FileSpreadsheet className="size-5" />
          </div>
          <div>
            <span className="block text-sm font-semibold">Audit Reports</span>
            <span className="block text-xs text-muted-foreground mt-0.5">Generate compliance doc</span>
          </div>
        </button>
      </div>
    </div>
  );
}
