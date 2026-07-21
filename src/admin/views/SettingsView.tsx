import { User, Bell, Shield, Palette, Globe } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/shared/store/auth";
import { useEmployees } from "@/shared/api/queries";
import { useUpdateEmployee } from "@/shared/api/mutations";
import { useState, useEffect } from "react";
import { toast } from "sonner";



const sections = [
  { icon: User, id: "account", title: "Account", desc: "Personal details and login" },
  { icon: Bell, id: "notifications", title: "Notifications", desc: "How we reach you" },
  { icon: Shield, id: "security", title: "Security", desc: "Password and sessions" },
  { icon: Palette, id: "appearance", title: "Appearance", desc: "Theme and density" },
  { icon: Globe, id: "language", title: "Language & region", desc: "Locale and time zone" },
];

export function SettingsPage() {
  const { user } = useAuthStore();
  const { data: employees = [] } = useEmployees();
  const updateEmployee = useUpdateEmployee();
  
  const employeeData = employees.find((e: any) => e.id === user?.id) || employees[0];
  
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
            <Separator className="my-5" />
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
            <Separator className="my-5" />
            <div className="space-y-4">
              {[
                { title: "Leave approvals", desc: "Get notified when your requests are decided.", on: true },
                { title: "Payslip ready", desc: "Email me when a new payslip is available.", on: true },
                { title: "Team announcements", desc: "Company-wide updates and events.", on: false },
                { title: "Product tips", desc: "Occasional tips for using Autodigix.", on: false },
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

          <section id="appearance" className="rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="text-xs text-muted-foreground">Pick a theme that fits your day.</p>
            <Separator className="my-5" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Light", g: "from-white to-slate-100" },
                { label: "Dark", g: "from-slate-900 to-slate-800" },
                { label: "System", g: "from-white via-slate-200 to-slate-900" },
              ].map((t, i) => (
                <button
                  key={t.label}
                  className={`group rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft ${i === 0 ? "border-primary ring-2 ring-primary/20" : ""}`}
                >
                  <div className={`h-20 rounded-lg bg-gradient-to-br ${t.g}`} />
                  <div className="mt-2 text-sm font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
