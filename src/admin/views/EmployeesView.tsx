import { useState } from "react";
import { Search, Plus, MoreHorizontal, Mail, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmployees } from "@/shared/api/queries";
import { useAddEmployee } from "@/shared/api/mutations";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function EmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const addEmployeeMutation = useAddEmployee();
  
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "AutoDigix2026!",
  });

  const rows = employees.filter(
    (e: any) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.role.toLowerCase().includes(q.toLowerCase()),
  );

  const handleCreateAccount = () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast.error("Please fill out name, email, and role.");
      return;
    }

    const maxIdNum = employees.reduce((max: number, emp: any) => {
      if (emp.id.startsWith("EMP-")) {
        const numId = parseInt(emp.id.replace("EMP-", ""));
        return !isNaN(numId) && numId > max ? numId : max;
      }
      return max;
    }, 0);
    const newId = `EMP-${maxIdNum + 1}`;
    
    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    addEmployeeMutation.mutate(
      {
        id: newId,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: "General", // Default
        status: "Active",
        attendance: 100,
        avatar_color: "from-blue-500 to-indigo-500",
        initials: initials,
        password: formData.password
      },
      {
        onSuccess: () => {
          toast.success("Employee account created successfully.");
          setIsAddModalOpen(false);
          setFormData({ name: "", email: "", role: "", password: "AutoDigix2026!" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted rounded-2xl" />
        <div className="h-16 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-64 rounded-3xl border bg-muted/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Employees"
        description="Directory of everyone at Acme Inc."
        actions={
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="mr-1.5 size-4" /> Add Employee
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">Personal & Account Details</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">User will be required to change this upon login.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-2">Employment Details</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role / Job Title <span className="text-red-500">*</span></Label>
                    <Input 
                      id="role" 
                      placeholder="e.g. Software Engineer" 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Access Level</Label>
                    <Select defaultValue="employee">
                      <SelectTrigger>
                        <SelectValue placeholder="Select access level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee Access</SelectItem>
                        <SelectItem value="admin">Admin Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="doj">Date of Joining</Label>
                      <Input id="doj" type="date" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="hours">Work Hours / Day</Label>
                      <Input id="hours" type="number" placeholder="8" defaultValue="8" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="salary">Monthly Salary</Label>
                    <Input id="salary" type="number" placeholder="₹ 0" />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAccount} disabled={addEmployeeMutation.isPending}>
                  {addEmployeeMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="rounded-2xl border bg-card p-4 shadow-soft flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or role..."
              className="h-11 rounded-xl bg-muted/40 pl-9"
            />
          </div>
          <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
            Showing {rows.length} of {employees.length}
          </div>
        </div>

        {/* Employee Grid */}
        {rows.length === 0 ? (
          <div className="rounded-2xl border bg-card py-20 text-center text-sm text-muted-foreground shadow-soft">
            No employees match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rows.map((e: any) => (
              <div 
                key={e.id}
                onClick={() => navigate(`/admin/employees/${e.id}`)}
                className="group relative rounded-3xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col"
              >
                {/* Actions Dropdown / Menu */}
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="secondary" className="size-7 rounded-full shadow-sm" onClick={(event) => { event.stopPropagation(); toast.info(`Emailing ${e.name}...`); }}>
                    <Mail className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="secondary" className="size-7 rounded-full shadow-sm" onClick={(event) => { event.stopPropagation(); toast.info(`More options for ${e.name}`); }}>
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </div>

                {/* Avatar & Basic Info */}
                <div className="flex flex-col items-center text-center mt-2 mb-4">
                  {e.avatarUrl ? (
                    <img src={e.avatarUrl} alt={e.name} className="size-16 rounded-2xl object-cover shadow-inner mb-4 ring-2 ring-primary/20" />
                  ) : (
                    <div className={cn("grid size-16 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white shadow-inner mb-4", e.avatarColor)}>
                      {e.initials}
                    </div>
                  )}
                  <h3 className="text-base font-bold text-foreground leading-tight">{e.name}</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-1">{e.role}</p>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center mb-5">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-[10px] uppercase tracking-wider font-bold px-3 py-1 flex items-center gap-1.5",
                      e.status === "Active" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      e.status === "Remote" && "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      e.status === "On Leave" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {e.status !== "On Leave" && <span className="size-1.5 rounded-full bg-current animate-pulse" />}
                    {e.status}
                  </Badge>
                </div>

                {/* Footer Details */}
                <div className="mt-auto pt-4 border-t border-dashed flex flex-col gap-2 text-xs font-medium text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>Contact</span>
                    <span className="text-foreground">{e.email.split('@')[0]}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Password</span>
                    <span className="text-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">{e.password}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Access Level</span>
                    <span className="text-foreground">{e.role.includes("HR") || e.role.includes("Manager") || e.role.includes("Admin") ? "Admin" : "Employee"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
