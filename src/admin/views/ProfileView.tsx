import { useState, useRef, useEffect } from "react";
import { Mail, Phone, MapPin, Building2, Edit, Save, Camera, X, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuthStore } from "@/shared/store/auth";
import { useEmployees, useNotifications } from "@/shared/api/queries";
import { useUpdateEmployee } from "@/shared/api/mutations";

const ADMIN_AVATAR_KEY = "autodigix_admin_avatar";

export function AdminProfileView() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: employees = [], isLoading } = useEmployees();
  const { data: notifications = [] } = useNotifications();
  const updateEmployee = useUpdateEmployee();

  const employeeData = employees.find((e: any) => e.id === user?.id) || employees[0];

  const [tempProfile, setTempProfile] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    office: "Headquarters",
    initials: "",
    avatarUrl: ""
  });

  useEffect(() => {
    if (employeeData) {
      setTempProfile(prev => ({
        ...prev,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone || "+1 (555) 019-8234",
        location: employeeData.location || "New York, NY",
        initials: employeeData.initials || employeeData.name.substring(0, 2).toUpperCase(),
        avatarUrl: employeeData.avatar_url || employeeData.avatarUrl || localStorage.getItem(ADMIN_AVATAR_KEY) || ""
      }));
    }
  }, [employeeData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `admin-${user?.id || "admin"}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setTempProfile(prev => ({ ...prev, avatarUrl: url }));
      localStorage.setItem(ADMIN_AVATAR_KEY, url);
      toast.success("Profile photo updated! Click save to apply changes.");
    } catch (error: any) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setTempProfile(prev => ({ ...prev, avatarUrl: "" }));
    localStorage.removeItem(ADMIN_AVATAR_KEY);
    toast.info("Photo removed. Click save to apply changes.");
  };

  const handleSave = () => {
    updateEmployee.mutate({
      id: user?.id || employeeData?.id,
      name: tempProfile.name,
      email: tempProfile.email,
      phone: tempProfile.phone,
      location: tempProfile.location,
      initials: tempProfile.initials,
      avatar_url: tempProfile.avatarUrl
    }, {
      onSuccess: () => {
        setIsEditing(false);
        toast.success("Admin profile updated successfully.");
      }
    });
  };

  const handleCancel = () => {
    if (employeeData) {
      setTempProfile(prev => ({
        ...prev,
        name: employeeData.name,
        email: employeeData.email,
        phone: employeeData.phone || "+1 (555) 019-8234",
        location: employeeData.location || "New York, NY",
        initials: employeeData.initials || employeeData.name.substring(0, 2).toUpperCase(),
        avatarUrl: employeeData.avatar_url || employeeData.avatarUrl || localStorage.getItem(ADMIN_AVATAR_KEY) || ""
      }));
    }
    setIsEditing(false);
  };

  if (isLoading || !employeeData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-64 bg-card border rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Admin Profile"
        description="Manage your system administrator account settings."
        actions={
          !isEditing ? (
            <Button className="rounded-xl" onClick={() => setIsEditing(true)}>
              <Edit className="mr-1.5 size-4" /> Edit profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleCancel}>
                <X className="mr-1.5 size-4" /> Cancel
              </Button>
              <Button className="rounded-xl" onClick={handleSave} disabled={updateEmployee.isPending}>
                <Save className="mr-1.5 size-4" /> {updateEmployee.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )
        }
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft relative">
        <div className="h-32 bg-gradient-to-r from-slate-800 via-blue-900 to-slate-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

            {/* Avatar with hover upload overlay */}
            <div className="relative group -mt-10">
              {tempProfile.avatarUrl ? (
                <img
                  src={tempProfile.avatarUrl}
                  alt="Admin avatar"
                  className="size-24 rounded-2xl object-cover ring-4 ring-card shadow-elevated bg-white"
                />
              ) : (
                <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-3xl font-bold text-white ring-4 ring-card shadow-elevated">
                  {tempProfile.initials || tempProfile.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] gap-2">
                {isUploading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="hover:text-primary transition-colors"
                      title="Change Photo"
                    >
                      <Camera className="size-5" />
                    </button>
                    {tempProfile.avatarUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        className="hover:text-red-400 transition-colors"
                        title="Remove Photo"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    )}
                  </>
                )}
              </div>

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
                <div className="flex items-center gap-3">
                  <Input
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="font-bold text-lg h-9 w-64"
                  />
                  <Input
                    value={tempProfile.initials}
                    onChange={(e) =>
                      setTempProfile({ ...tempProfile, initials: e.target.value.substring(0, 2).toUpperCase() })
                    }
                    className="font-bold text-sm h-9 w-16 text-center"
                    placeholder="Initials"
                    maxLength={2}
                  />
                </div>
              ) : (
                <h2 className="text-2xl font-bold">{tempProfile.name}</h2>
              )}

              <p className="text-sm font-medium text-muted-foreground mt-1">{employeeData.role || "Super Admin"} · {employeeData.department || "Management"}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-blue-500/30 bg-blue-500/10 text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                  System Admin
                </Badge>
                <Badge variant="outline" className="rounded-full text-[11px] font-bold tracking-wider uppercase">
                  Full Access
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Contact & Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">

                {/* Email */}
                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Email Address</div>
                    {isEditing ? (
                      <Input value={tempProfile.email} onChange={e => setTempProfile({ ...tempProfile, email: e.target.value })} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-bold">{tempProfile.email}</div>
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
                      <Input value={tempProfile.phone} onChange={e => setTempProfile({ ...tempProfile, phone: e.target.value })} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-bold">{tempProfile.phone}</div>
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
                      <Input value={tempProfile.location} onChange={e => setTempProfile({ ...tempProfile, location: e.target.value })} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-bold">{tempProfile.location}</div>
                    )}
                  </div>
                </div>

                {/* Office */}
                <div className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Office</div>
                    {isEditing ? (
                      <Input value={tempProfile.office} onChange={e => setTempProfile({ ...tempProfile, office: e.target.value })} className="h-7 text-sm px-2" />
                    ) : (
                      <div className="truncate text-sm font-bold">{tempProfile.office}</div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">System Info</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-medium">Account ID</span>
                  <span className="font-bold">ADM-001</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-medium">Role Level</span>
                  <span className="font-bold text-blue-600">Super Admin</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground font-medium">Joined Date</span>
                  <span className="font-bold">{new Date(employeeData.created_at || new Date()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Last Login</span>
                  <span className="font-bold text-emerald-600">Today, 08:30 AM</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Admin Activity Log</h3>
            <ol className="relative space-y-6 border-l pl-6 ml-2">
              {notifications.slice(0, 10).map((log: any) => (
                <li key={log.id} className="relative">
                  <span className={`absolute -left-[31px] top-1 grid size-3 place-items-center rounded-full border-2 border-background shadow-sm ${
                    log.tone === 'success' ? 'bg-emerald-500' : 
                    log.tone === 'error' ? 'bg-red-500' : 
                    log.tone === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="text-sm font-bold">{log.title} <span className="text-xs font-semibold text-muted-foreground ml-2">{log.time}</span></div>
                  <p className="text-xs font-medium text-muted-foreground mt-1">{log.body}</p>
                </li>
              ))}
              {notifications.length === 0 && (
                <div className="text-sm text-muted-foreground pt-4">No recent activity.</div>
              )}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
