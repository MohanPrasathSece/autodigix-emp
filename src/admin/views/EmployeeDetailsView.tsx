import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { useEmployees, usePayslips, useLeaveRequests } from "@/shared/api/queries";
import { cn } from "@/lib/utils";
import { Wallet, FileText, Download, Phone, MapPin, Briefcase, Mail as MailIcon, Calendar, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

export function EmployeeDetailsView() {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: payslips = [] } = usePayslips();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const emp = employees.find((e: any) => e.id === employeeId);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading employee...</div>;
  if (!emp) return <div>Employee not found</div>;

  const empPayslips = payslips.filter((slip: any) => slip.employee_id === emp.id);
  const empLeaves = leaveRequests.filter((leave: any) => leave.name === emp.name || leave.employee_id === emp.id);
  
  const leavesTaken = empLeaves.filter((l: any) => l.status === "Approved").reduce((sum: number, l: any) => sum + l.days, 0);
  const leaveStats = {
    total: 24,
    taken: leavesTaken,
    balance: 24 - leavesTaken
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <PageHeader
        title="Employee Profile"
        description="View and manage employee details, payroll, and history."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl">Edit Profile</Button>
            <Button variant="destructive" className="rounded-xl" onClick={() => setIsRemoveConfirmOpen(true)}>Remove Employee</Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft col-span-1 h-fit">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              {emp.avatarUrl ? (
                <img
                  src={emp.avatarUrl}
                  alt={emp.name}
                  className="size-24 rounded-3xl object-cover shadow-lg ring-1 ring-border"
                />
              ) : (
                <div className={cn("grid size-24 place-items-center rounded-3xl bg-gradient-to-br text-3xl font-bold text-white shadow-lg", emp.avatarColor)}>
                  {emp.initials}
                </div>
              )}
              {emp.status === "Active" && (
                <div className="absolute -bottom-1 -right-1 size-6 rounded-full border-4 border-card bg-emerald-500 shadow-sm flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{emp.name}</h2>
              <p className="text-sm text-muted-foreground">{emp.role}</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full text-[11px] font-medium mt-1 px-3 py-0.5",
                emp.status === "Active" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                emp.status === "Remote" && "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                emp.status === "On Leave" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              {emp.status}
            </Badge>

            <div className="w-full pt-4 border-t space-y-4 text-sm text-left mt-4">
              <div className="flex items-center gap-3">
                <MailIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">{emp.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="size-4 text-muted-foreground" />
                <span className="font-medium">{emp.department}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="font-medium">Joined {emp.created_at ? new Date(emp.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Tabs */}
        <div className="col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 rounded-xl">
              <TabsTrigger value="personal" className="rounded-lg">Personal Info</TabsTrigger>
              <TabsTrigger value="payroll" className="rounded-lg">Payroll & Payslips</TabsTrigger>
              <TabsTrigger value="leaves" className="rounded-lg">Leave History</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal" className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border bg-card p-6 shadow-soft">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><User className="size-5 text-primary" /> Personal Details</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Phone Number</p>
                    <p className="flex items-center gap-2 text-sm"><Phone className="size-4 text-muted-foreground" /> {emp.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Manager ID</p>
                    <p className="text-sm">{emp.manager_id || "Unassigned"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Home Address</p>
                    <p className="flex items-center gap-2 text-sm"><MapPin className="size-4 text-muted-foreground" /> {emp.location || "Not provided"}</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider">Emergency Contact</h4>
                  <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20">
                    <AlertTriangle className="size-5 text-amber-500" />
                    <span className="text-sm font-medium">No emergency contact provided</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Payroll Tab */}
            <TabsContent value="payroll" className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                {empPayslips.length === 0 ? (
                  <div className="text-center text-muted-foreground p-8 border rounded-2xl">No payslips found for this employee.</div>
                ) : empPayslips.map((slip: any) => (
                  <div key={slip.id} className="rounded-2xl border bg-card p-5 shadow-soft transition-colors hover:border-primary/30">
                    <div className="flex items-center justify-between mb-4 border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                          <FileText className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{slip.period}</h3>
                          <p className="text-xs text-muted-foreground">Salary Processed ({slip.status})</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Final Net Pay</p>
                        <p className="text-xl font-black text-primary">₹ {slip.net.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-sm">
                      <div>
                        <h4 className="font-semibold text-emerald-600 mb-2">Earnings</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Gross Salary</span><span>₹ {slip.gross.toLocaleString('en-IN')}</span></div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-red-500 mb-2">Deductions</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Total Deductions</span><span>₹ {(slip.gross - slip.net).toLocaleString('en-IN')}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                       <Button variant="outline" size="sm" className="rounded-lg">
                        <Download className="mr-2 size-4" /> Download Statement
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Leaves Tab */}
            <TabsContent value="leaves" className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
                  <p className="text-3xl font-black text-primary">{leaveStats.total}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Total Annual Leaves</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
                  <p className="text-3xl font-black text-amber-500">{leaveStats.taken}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Leaves Taken</p>
                </div>
                <div className="rounded-2xl border bg-card p-4 shadow-soft text-center">
                  <p className="text-3xl font-black text-emerald-600">{leaveStats.balance}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Available Balance</p>
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-6 shadow-soft">
                <h3 className="text-base font-bold mb-4">Recent Leave Requests</h3>
                <div className="space-y-3">
                  {empLeaves.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-4 text-center">No leave history.</div>
                  ) : empLeaves.map((leave: any) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                      <div>
                        <p className="text-sm font-semibold">{leave.type}</p>
                        <p className="text-xs text-muted-foreground">{leave.from} to {leave.to} · {leave.days} day(s)</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[10px]",
                        leave.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                        leave.status === 'Rejected' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                        "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>{leave.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to remove <strong>{emp.name}</strong> from the organization? This action cannot be undone and will revoke all access.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              setIsRemoveConfirmOpen(false);
              navigate('/admin/employees');
            }}>Confirm Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
