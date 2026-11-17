import { useState, useEffect } from "react";
import { Search, Plus, MoreHorizontal, Mail, Eye, EyeOff, Trash2, Wallet, User, UserPlus, Shield, Phone } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEmployees } from "@/shared/api/queries";
import { useAddEmployee, useDeleteEmployee } from "@/shared/api/mutations";
import { hashPassword } from "@/shared/lib/hash";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialFormData = {
  name: "",
  email: "",
  role: "",
  department: "",
  status: "Active",
  monthly_base_salary: "",
  monthly_allowance: "",
  monthly_benefits_deduction: "",
  tax_percentage: "",
  payslip_email: "",
  password: "AutoDigix2026!",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  access_level: "employee",
};

export function EmployeesPage() {
  const { data: employees = [], isLoading } = useEmployees();
  const addEmployeeMutation = useAddEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState(initialFormData);

  // Open the add-employee dialog when arriving via /admin/employees?add=1
  // (e.g. from the Admin Dashboard's "Add Employee" buttons).
  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) {
      // Clear the ?add=1 param so the modal doesn't reopen on refresh/back.
      setSearchParams({}, { replace: true });
    }
  };

  const rows = employees.filter(
    (e: any) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.role.toLowerCase().includes(q.toLowerCase()),
  );

  const handleCreateAccount = async () => {
    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPayslipEmail = formData.payslip_email.trim().toLowerCase();

    if (!formData.name.trim() || !normalizedEmail || !formData.role.trim()) {
      toast.error("Please fill out name, email, and role.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (normalizedPayslipEmail && !EMAIL_REGEX.test(normalizedPayslipEmail)) {
      toast.error("Please enter a valid payslip email address.");
      return;
    }

    // Block duplicates up front so we never surface a raw
    // "duplicate key ... employees_email_key" Postgres error.
    const isDuplicate = employees.some(
      (emp: any) => (emp.email || "").trim().toLowerCase() === normalizedEmail,
    );
    if (isDuplicate) {
      toast.error("An employee with this email already exists.");
      return;
    }

    const salaryValue = Number(formData.monthly_base_salary);
    if (formData.monthly_base_salary.trim() === "" || isNaN(salaryValue) || salaryValue < 0) {
      toast.error("Please enter a valid monthly salary.");
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
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    const hashedPassword = await hashPassword(formData.password);

    addEmployeeMutation.mutate(
      {
        id: newId,
        name: formData.name.trim(),
        email: normalizedEmail,
        role: formData.role,
        department: formData.department || "General",
        status: formData.status || "Active",
        attendance: 100,
        avatar_color: "from-blue-500 to-indigo-500",
        initials: initials,
        password: hashedPassword,
        tempPassword: formData.password,
        base_salary: Number(formData.monthly_base_salary || 0) * 12,
        monthly_allowance: Number(formData.monthly_allowance || 0),
        monthly_benefits_deduction: Number(formData.monthly_benefits_deduction || 0),
        // Only send tax_percentage when present — the live DB may not have
        // this column until the migration is applied.
        ...(formData.tax_percentage.trim() !== "" ? { tax_percentage: Number(formData.tax_percentage) } : {}),
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        access_level: formData.access_level,
        payslip_email: normalizedPayslipEmail || normalizedEmail,
      },
      {
        onSuccess: () => {
          toast.success("Employee account created successfully.");
          setIsAddModalOpen(false);
          setSearchParams({}, { replace: true });
          setFormData(initialFormData);
        }
      }
    );
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the system?`)) {
      deleteEmployeeMutation.mutate(id, {
        onSuccess: () => {
          toast.success(`${name} has been removed.`);
        }
      });
    }
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
          <Dialog open={isAddModalOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="mr-1.5 size-4" /> Add Employee
              </Button>
            </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border bg-card shadow-elevated">
              <DialogHeader className="px-6 py-4 border-b bg-muted/20 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <UserPlus className="size-4" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">Add New Employee</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Enter employee details to generate their profile and portal credentials.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1 text-left">
                {/* 1. Basic Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <User className="size-3.5 text-primary" />
                    <span>Basic Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
                      <Input 
                        id="name" 
                        placeholder="e.g. John Doe" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium">Work Email <span className="text-red-500">*</span></Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="role" className="text-xs font-medium">Job Title / Role <span className="text-red-500">*</span></Label>
                      <Input 
                        id="role" 
                        placeholder="e.g. Software Engineer" 
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="text-xs font-medium">Department</Label>
                      <Input 
                        id="department" 
                        placeholder="e.g. Engineering" 
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Access & Credentials */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Shield className="size-3.5 text-primary" />
                    <span>Access & Credentials</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Access Level</Label>
                      <Select value={formData.access_level} onValueChange={v => setFormData({...formData, access_level: v})}>
                        <SelectTrigger className="h-9 text-sm rounded-lg">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Standard Employee</SelectItem>
                          <SelectItem value="admin">Administrator (HR / Mgmt)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Account Status</Label>
                      <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                        <SelectTrigger className="h-9 text-sm rounded-lg">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                          <SelectItem value="On Leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-medium">Temporary Password</Label>
                      <div className="relative">
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="h-9 text-sm rounded-lg pr-9"
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Required to change upon first login.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="payslip_email" className="text-xs font-medium">
                        Payslip Email <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <Input 
                        id="payslip_email" 
                        type="email" 
                        placeholder="Defaults to work email" 
                        value={formData.payslip_email}
                        onChange={e => setFormData({...formData, payslip_email: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                      <p className="text-[10px] text-muted-foreground">Monthly statements sent here.</p>
                    </div>
                  </div>
                </div>

                {/* 3. Compensation & Payroll */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Wallet className="size-3.5 text-primary" />
                    <span>Monthly Compensation (₹)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="salary" className="text-xs font-medium">Base Salary (₹/mo) <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₹</span>
                        <Input 
                          id="salary" 
                          type="number" 
                          min="0"
                          placeholder="85000" 
                          value={formData.monthly_base_salary}
                          onChange={e => setFormData({...formData, monthly_base_salary: e.target.value})}
                          className="h-9 text-sm rounded-lg pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="allowance" className="text-xs font-medium">Monthly Allowance (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₹</span>
                        <Input 
                          id="allowance" 
                          type="number" 
                          min="0"
                          placeholder="5000" 
                          value={formData.monthly_allowance}
                          onChange={e => setFormData({...formData, monthly_allowance: e.target.value})}
                          className="h-9 text-sm rounded-lg pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="benefits" className="text-xs font-medium">Benefits Deduction (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₹</span>
                        <Input 
                          id="benefits" 
                          type="number" 
                          min="0"
                          placeholder="2000" 
                          value={formData.monthly_benefits_deduction}
                          onChange={e => setFormData({...formData, monthly_benefits_deduction: e.target.value})}
                          className="h-9 text-sm rounded-lg pl-7"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tax" className="text-xs font-medium">Tax Deduction (%)</Label>
                      <div className="relative">
                        <Input 
                          id="tax" 
                          type="number" 
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="10" 
                          value={formData.tax_percentage}
                          onChange={e => setFormData({...formData, tax_percentage: e.target.value})}
                          className="h-9 text-sm rounded-lg pr-7"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Emergency Contact */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Phone className="size-3.5 text-primary" />
                    <span>Emergency Contact (Optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="ec_name" className="text-xs font-medium">Contact Name</Label>
                      <Input 
                        id="ec_name" 
                        placeholder="e.g. Jane Doe" 
                        value={formData.emergency_contact_name}
                        onChange={e => setFormData({...formData, emergency_contact_name: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ec_phone" className="text-xs font-medium">Contact Phone</Label>
                      <Input 
                        id="ec_phone" 
                        placeholder="e.g. +91 98765 43210" 
                        value={formData.emergency_contact_phone}
                        onChange={e => setFormData({...formData, emergency_contact_phone: e.target.value})}
                        className="h-9 text-sm rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-3.5 border-t bg-muted/30 shrink-0 flex items-center justify-end gap-2.5">
                <Button variant="outline" size="sm" className="rounded-lg h-9 px-4" onClick={() => handleDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="rounded-lg h-9 px-5 font-semibold" onClick={handleCreateAccount} disabled={addEmployeeMutation.isPending}>
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
                <div className="absolute top-4 right-4 flex gap-1 z-20">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="size-7 rounded-full shadow-sm hover:bg-muted" 
                    title={`Email ${e.name}`}
                    onClick={(event) => { 
                      event.stopPropagation(); 
                      window.location.href = `mailto:${e.email}`;
                    }}
                  >
                    <Mail className="size-3.5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                      <Button size="icon" variant="secondary" className="size-7 rounded-full shadow-sm hover:bg-muted" title="More Options">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-xl" onClick={(event) => event.stopPropagation()}>
                      <DropdownMenuItem 
                        onClick={() => navigate(`/admin/employees/${e.id}`)} 
                        className="cursor-pointer gap-2 rounded-xl py-2 text-xs font-medium"
                      >
                        <User className="size-4 text-primary" /> View Details & Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate(`/admin/employees/${e.id}`)} 
                        className="cursor-pointer gap-2 rounded-xl py-2 text-xs font-medium"
                      >
                        <Wallet className="size-4 text-emerald-600" /> Edit Salary & Role
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => window.location.href = `mailto:${e.email}`} 
                        className="cursor-pointer gap-2 rounded-xl py-2 text-xs font-medium"
                      >
                        <Mail className="size-4 text-blue-500" /> Send Direct Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteEmployee(e.id, e.name)} 
                        className="cursor-pointer gap-2 rounded-xl py-2 text-xs font-medium text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40"
                      >
                        <Trash2 className="size-4 text-red-500" /> Remove Employee
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    <span>Access Level</span>
                    <span className="text-foreground">{e.access_level === 'admin' ? "Admin" : "Employee"}</span>
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
