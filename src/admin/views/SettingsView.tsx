import { User, Bell } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/shared/store/auth";
import { useEmployees } from "@/shared/api/queries";
import { useUpdateEmployee } from "@/shared/api/mutations";
import { useState, useEffect } from "react";
import { toast } from "sonner";



const sections = [
  { icon: User, id: "account", title: "Account", desc: "Personal details and login" },
  { icon: Bell, id: "notifications", title: "Notifications", desc: "How we reach you" },
];

export function SettingsPage() {
  const { user } = useAuthStore();
  const { data: employees = [] } = useEmployees();
  const updateEmployee = useUpdateEmployee();
  
  const employeeData = employees.find((e: any) => e.id === user?.id);
  
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });

  useEffect(() => {
    if (employeeData) {
      const parts = employeeData.name.split(" ");
      setProfile({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        email: employeeData.email || ""
      });
    }
  }, [employeeData]);

  const handleSave = () => {
    updateEmployee.mutate({
      id: user?.id || employeeData?.id,
      name: `${profile.firstName} ${profile.lastName}`.trim(),
      email: profile.email
    }, {
      onSuccess: () => {
        toast.success("Account settings updated successfully.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your workspace and personal preferences." />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border bg-card p-2 shadow-soft lg:sticky lg:top-20 lg:flex-col lg:self-start">
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <s.icon className="size-4" />
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-6">
          <section id="account" className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold">Account</h2>
            <p className="text-xs text-muted-foreground">Update your personal details.</p>
            <div className="my-5 border-t" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">First name</Label>
                <Input value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Last name</Label>
                <Input value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="h-11 rounded-xl" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl">Cancel</Button>
              <Button className="rounded-xl" onClick={handleSave} disabled={updateEmployee.isPending}>
                {updateEmployee.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </section>

          <section id="notifications" className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold">Notifications</h2>
            <p className="text-xs text-muted-foreground">Choose what we email you about.</p>
            <div className="my-5 border-t" />
            <div className="space-y-4">
              {[
                { title: "Leave approvals", desc: "Get notified when your requests are decided.", on: true },
                { title: "Payslip ready", desc: "Email me when a new payslip is available.", on: true },
              ].map((n) => (
                <div key={n.title} className="flex items-center justify-between gap-4 rounded-xl border bg-background/60 p-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                  </div>
                  <Switch defaultChecked={n.on} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
