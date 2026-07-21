import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { useAddEmployee } from "@/shared/api/mutations";

export function AddEmployeeView() {
  const addEmployeeMutation = useAddEmployee();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "",
    password: "AutoDigix2026!"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.department || !formData.role || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const newId = `EMP-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Generate initials
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
        password: formData.password,
        role: formData.role,
        department: formData.department,
        status: "Active",
        attendance: 100,
        avatar_color: "from-blue-500 to-indigo-500", // Default color
        initials: initials
      },
      {
        onSuccess: () => {
          toast.success("Employee Profile Created", {
            description: "The employee has been added to the system and a welcome email was sent."
          });
          setFormData({ name: "", email: "", department: "", role: "", password: "AutoDigix2026!" });
        }
      }
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-fade-in pb-12">
      <PageHeader
        title="Onboard New Employee"
        description="Create a comprehensive profile for a new hire."
      />

      <form className="space-y-8" onSubmit={handleSubmit}>
        
        {/* Section 1: Personal Information */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold tracking-tight">Personal Information</h2>
            <p className="text-xs text-muted-foreground mt-1">Basic details and contact info.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. John Doe" 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Personal Phone Number</Label>
              <Input type="tel" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Residential Address</Label>
              <Input placeholder="123 Main St, Apt 4B, City, Country" />
            </div>
          </div>
        </div>

        {/* Section 2: Company Information */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold tracking-tight">Employment Details</h2>
            <p className="text-xs text-muted-foreground mt-1">Role, department, and compensation.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Employee ID (Auto-generated)</Label>
              <Input placeholder="EMP-####" disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>Department <span className="text-red-500">*</span></Label>
              <Select required value={formData.department} onValueChange={v => setFormData({...formData, department: v})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Human Resources">Human Resources</SelectItem>
                  <SelectItem value="Sales & Marketing">Sales & Marketing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Job Title / Designation <span className="text-red-500">*</span></Label>
              <Input 
                placeholder="e.g. Senior Software Engineer" 
                required 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select defaultValue="full-time">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-Time (Permanent)</SelectItem>
                  <SelectItem value="part-time">Part-Time</SelectItem>
                  <SelectItem value="contract">Contractor</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Joining <span className="text-red-500">*</span></Label>
              <Input type="date" required />
            </div>
            <div className="space-y-2">
              <Label>Base Salary (Monthly) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input type="number" required placeholder="85000" className="pl-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Credentials */}
        <div className="rounded-2xl border bg-card p-6 shadow-soft space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold tracking-tight">System Access</h2>
            <p className="text-xs text-muted-foreground mt-1">Credentials and portal permissions.</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Work Email Address <span className="text-red-500">*</span></Label>
              <Input 
                type="email" 
                required 
                placeholder="name@autodigix.com" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password <span className="text-red-500">*</span></Label>
              <Input 
                type="text" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Employee will be forced to change this upon first login.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Portal Access Level <span className="text-red-500">*</span></Label>
              <Select defaultValue="employee">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin Access (HR/Management)</SelectItem>
                  <SelectItem value="employee">Standard Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Status</Label>
              <Select defaultValue="active">
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (Can Login)</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" className="rounded-xl px-6">Cancel</Button>
          <Button type="submit" className="rounded-xl px-6" disabled={addEmployeeMutation.isPending}>
            {addEmployeeMutation.isPending ? "Creating..." : "Create Employee Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
