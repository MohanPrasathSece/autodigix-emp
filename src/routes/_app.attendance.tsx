import { createFileRoute } from "@tanstack/react-router";
import { Clock, LogIn, LogOut, Coffee, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Pulse HR" }] }),
  component: AttendancePage,
});

const log = [
  { date: "Jul 16", in: "09:12", out: "—", hours: "6h 42m", status: "Working" },
  { date: "Jul 15", in: "09:04", out: "18:22", hours: "9h 18m", status: "Present" },
  { date: "Jul 14", in: "09:22", out: "18:01", hours: "8h 39m", status: "Present" },
  { date: "Jul 13", in: "—", out: "—", hours: "—", status: "Weekend" },
  { date: "Jul 12", in: "—", out: "—", hours: "—", status: "Weekend" },
  { date: "Jul 11", in: "10:01", out: "17:40", hours: "7h 39m", status: "Late" },
  { date: "Jul 10", in: "09:00", out: "18:10", hours: "9h 10m", status: "Present" },
];

function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Clock in, take breaks, and review your log."
        actions={
          <>
            <Button variant="outline" className="rounded-xl"><Coffee className="mr-1.5 size-4" /> Break</Button>
            <Button className="rounded-xl"><LogOut className="mr-1.5 size-4" /> Clock out</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> Working now
          </div>
          <div className="mt-3 flex flex-wrap items-baseline gap-4">
            <div className="text-4xl font-semibold tracking-tight tabular-nums">06:42:18</div>
            <div className="text-sm text-muted-foreground">Since 09:12 AM · Target 8h</div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-background/60">
            <div className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400" style={{ width: "84%" }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="rounded-lg"><LogIn className="mr-1.5 size-3.5" />Log lunch</Button>
            <Button size="sm" variant="outline" className="rounded-lg"><Clock className="mr-1.5 size-3.5" />Adjust time</Button>
          </div>
        </div>
        <StatCard label="This month" value="142h" hint="Target 176h" icon={CalendarCheck} />
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Recent log</h2>
          <Button size="sm" variant="ghost" className="rounded-lg text-xs">Export</Button>
        </div>
        <div className="divide-y">
          {log.map((row) => (
            <div key={row.date} className="grid grid-cols-2 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:grid-cols-5">
              <div className="text-sm font-medium">{row.date}</div>
              <div className="text-sm tabular-nums text-muted-foreground">{row.in}</div>
              <div className="text-sm tabular-nums text-muted-foreground">{row.out}</div>
              <div className="text-sm tabular-nums">{row.hours}</div>
              <div className="text-right">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[11px]",
                    row.status === "Working" && "border-primary/30 bg-primary/10 text-primary",
                    row.status === "Present" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    row.status === "Late" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    row.status === "Weekend" && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {row.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
