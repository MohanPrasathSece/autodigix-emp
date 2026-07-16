import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin, Building2, Calendar, Briefcase, Edit } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Pulse HR" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal and employment information."
        actions={<Button variant="outline" className="rounded-xl"><Edit className="mr-1.5 size-4" />Edit profile</Button>}
      />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-blue-300/20 to-fuchsia-300/20" />
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="-mt-10 grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-semibold text-white ring-4 ring-card shadow-elevated">
              AS
            </div>
            <div>
              <h2 className="text-xl font-semibold">Aarav Sharma</h2>
              <p className="text-sm text-muted-foreground">Product Designer · Design Team</p>
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
        <TabsList className="rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg">Documents</TabsTrigger>
          <TabsTrigger value="activity" className="rounded-lg">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
              <h3 className="text-sm font-semibold">Contact</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Mail, label: "Email", value: "aarav@pulse.co" },
                  { icon: Phone, label: "Phone", value: "+1 (415) 555-0134" },
                  { icon: MapPin, label: "Location", value: "San Francisco, CA" },
                  { icon: Building2, label: "Office", value: "SF HQ · Floor 4" },
                  { icon: Briefcase, label: "Manager", value: "Liam O'Brien" },
                  { icon: Calendar, label: "Joined", value: "Mar 2, 2023" },
                ].map((f) => (
                  <div key={f.label} className="flex items-start gap-3 rounded-xl border bg-background/60 p-4">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <f.icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{f.label}</div>
                      <div className="truncate text-sm font-medium">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold">Employment</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Employee ID</span><span className="font-medium">EMP-001</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Employment type</span><span className="font-medium">Full-time</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span className="font-medium">Design</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reports to</span><span className="font-medium">Liam O'Brien</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Contract ends</span><span className="font-medium">—</span></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <div className="rounded-2xl border bg-card p-12 text-center shadow-soft">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <Briefcase className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">No documents yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Contracts and policies will appear here once uploaded.</p>
            <Button className="mt-4 rounded-xl">Upload document</Button>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <ol className="relative space-y-6 border-l pl-6">
              {[
                { t: "Approved leave", d: "Jul 15", body: "Your 3-day leave was approved by Liam." },
                { t: "Payslip issued", d: "Jul 1", body: "June 2026 payslip generated." },
                { t: "Promotion", d: "Apr 2", body: "Promoted to Senior Product Designer." },
              ].map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[29px] top-1 grid size-4 place-items-center rounded-full border-2 border-card bg-primary" />
                  <div className="text-sm font-medium">{e.t} <span className="text-xs font-normal text-muted-foreground">· {e.d}</span></div>
                  <p className="text-xs text-muted-foreground">{e.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
