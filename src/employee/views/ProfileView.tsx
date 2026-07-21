import { useState, useEffect, useRef } from "react";
import { Mail, Phone, MapPin, Building2, Calendar, Briefcase, Edit, Camera, Save, X, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useEmployees, useLeaveRequests, usePayslips } from "@/shared/api/queries";
import { useUpdateEmployee } from "@/shared/api/mutations";
import { useAuthStore } from "@/shared/store/auth";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

export function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { data: employees = [], isLoading } = useEmployees();
  const employeeData = employees.find((e: any) => e.id === user?.id) || employees[0];

  const updateEmployee = useUpdateEmployee();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: payslips = [] } = usePayslips();

  const myLeaves = leaveRequests.filter((l: any) => l.employee_id === user?.id);
  const myPayslips = payslips.filter((p: any) => p.employee_id === user?.id);
  
  const activityLogs = [
    ...myLeaves.map((l: any) => ({
      id: `leave-${l.id}`,
      title: `Leave ${l.status}`,
      body: `Your request for ${l.days} days of ${l.type} leave was ${l.status.toLowerCase()}.`,
      time: l.from,
      tone: l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'error' : 'warning'
    })),
    ...myPayslips.map((p: any) => ({
      id: `payslip-${p.id}`,
      title: `Payslip Generated`,
      body: `Your payslip for ${p.period} has been generated. Net pay: ₹${p.net.toLocaleString('en-IN')}`,
      time: p.created_at ? new Date(p.created_at).toLocaleDateString() : p.period,
      tone: 'info'
    }))
  ];

  const [tempProfile, setTempProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    manager_id: "",
    avatarUrl: ""
  });

  useEffect(() => {
    if (employeeData) {
      setTempProfile(prev => ({
        ...prev,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone || "",
        location: employeeData.location || "",
        manager_id: employeeData.manager_id || "",
        avatarUrl: employeeData.avatarUrl || ""
      }));
    }
  }, [employeeData]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setTempProfile(prev => ({ ...prev, avatarUrl: `${data.publicUrl}?t=${Date.now()}` }));
      toast.success("Avatar uploaded successfully! Don't forget to save your profile.");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePicture = () => {
    setTempProfile(prev => ({ ...prev, avatarUrl: "" }));
    toast.info("Avatar removed. Click save to apply changes.");
  };

  const handleSave = () => {
    updateEmployee.mutate({
      id: user?.id,
      name: tempProfile.name,
      email: tempProfile.email,
      phone: tempProfile.phone,
      location: tempProfile.location,
      manager_id: tempProfile.manager_id,
      avatar_url: tempProfile.avatarUrl
    }, {
      onSuccess: () => {
        setIsEditing(false);
        toast.success("Profile updated successfully.");
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isLoading || !employeeData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="h-32 bg-muted" />
          <div className="px-6 pb-6 pt-16 flex gap-4">
            <div className="size-24 rounded-2xl bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-6 bg-muted/60 rounded-md w-1/3" />
              <div className="h-4 bg-muted/60 rounded-md w-1/4" />
            </div>
          </div>
        </div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal and employment information."
        actions={
          !isEditing ? (
            <Button variant="outline" className="rounded-xl" onClick={() => setIsEditing(true)}>
              <Edit className="mr-1.5 size-4" />Edit profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleCancel}>
                <X className="mr-1.5 size-4" /> Cancel
              </Button>
              <Button className="rounded-xl" onClick={handleSave}>
                <Save className="mr-1.5 size-4" /> Save
              </Button>
            </div>
          )
        }
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            
            <div className="relative group">
              {tempProfile.avatarUrl ? (
                <img src={tempProfile.avatarUrl} alt="Avatar" className="size-24 shrink-0 rounded-2xl object-cover ring-1 ring-border shadow-sm" />
              ) : (
                <div className={cn("grid size-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-3xl font-semibold text-white ring-1 ring-border shadow-sm", employeeData.avatarColor || "from-blue-500 to-indigo-500")}>
                  {employeeData.initials || tempProfile.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              {employeeData?.status === "Active" && (
                <div className="absolute bottom-1 -right-1 size-6 rounded-full border-4 border-card bg-emerald-500 shadow-sm flex items-center justify-center">
                  <div className="size-2 rounded-full bg-white animate-pulse" />
                </div>
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] gap-2">
                  {isUploading ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <>
                      <button onClick={() => fileInputRef.current?.click()} className="hover:text-primary transition-colors" title="Change Picture">
                        <Camera className="size-5" />
                      </button>
                      {tempProfile.avatarUrl && (
                        <button onClick={handleRemovePicture} className="hover:text-red-400 transition-colors" title="Remove Picture">
                          <Trash2 className="size-5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="mb-1">
              {isEditing ? (
                <Input 
                  value={tempProfile.name} 
                  onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                  className="font-semibold text-xl h-9 w-64 mb-1"
                />
              ) : (
                <h2 className="text-xl font-semibold">{tempProfile.name}</h2>
              )}
              <p className="text-sm text-muted-foreground">{employeeData.role} · {employeeData.department}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400">Active</Badge>
                <Badge variant="outline" className="rounded-full text-[11px]">Full-time</Badge>
                <Badge variant="outline" className="rounded-full text-[11px]">3.4 yrs</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="rounded-xl bg-muted/60 p-1 mb-6">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">Activity History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
              <h3 className="text-sm font-semibold">Contact</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                
                {/* Email */}
                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Email Address</div>
                    {isEditing ? (
                      <Input value={tempProfile.email} onChange={e => setTempProfile({...tempProfile, email: e.target.value})} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-medium">{tempProfile.email}</div>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Phone Number</div>
                    {isEditing ? (
                      <Input value={tempProfile.phone} onChange={e => setTempProfile({...tempProfile, phone: e.target.value})} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-medium">{tempProfile.phone}</div>
                    )}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Location</div>
                    {isEditing ? (
                      <Input value={tempProfile.location} onChange={e => setTempProfile({...tempProfile, location: e.target.value})} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-medium">{tempProfile.location}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Office</div>
                    <div className="truncate text-sm font-medium">SF HQ · Floor 4</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Briefcase className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Manager</div>
                    {isEditing ? (
                      <Input value={tempProfile.manager_id} onChange={e => setTempProfile({...tempProfile, manager_id: e.target.value})} className="h-7 text-sm px-2" placeholder="Manager ID" />
                    ) : (
                      <div className="truncate text-sm font-medium">{employeeData.manager_id || "Unassigned"}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Calendar className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Joined</div>
                    <div className="truncate text-sm font-medium">
                      {new Date(employeeData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold">Employment</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Employee ID</span><span className="font-medium">{employeeData.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Employment type</span><span className="font-medium">Full-time</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">{employeeData.department}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reports to</span><span className="font-medium">{employeeData.manager_id || "Unassigned"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contract ends</span><span className="font-medium">-</span></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="text-sm font-semibold mb-6">Recent Activity</h3>
            <ol className="relative space-y-6 border-l pl-6 border-muted">
              {activityLogs.slice(0, 5).map((log: any, i: number) => (
                <li key={log.id || i} className="relative">
                  <span className={`absolute -left-[29px] top-1 grid size-4 place-items-center rounded-full border-2 border-card ${
                    log.tone === 'success' ? 'bg-emerald-500' : 
                    log.tone === 'error' ? 'bg-red-500' : 
                    log.tone === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="text-sm font-medium">{log.title} <span className="text-xs font-normal text-muted-foreground ml-2">· {log.time}</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{log.body}</p>
                </li>
              ))}
              {activityLogs.length === 0 && (
                <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl text-center">No recent activity found.</div>
              )}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
