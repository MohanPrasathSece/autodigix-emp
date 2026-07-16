import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Pulse HR" }] }),
  component: CalendarPage,
});

type DayKind = "present" | "leave-approved" | "leave-pending" | "holiday" | "weekend" | "absent" | "none";

const kindStyles: Record<DayKind, string> = {
  present: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  "leave-approved": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
  "leave-pending": "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20",
  holiday: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/20",
  weekend: "bg-muted text-muted-foreground",
  absent: "bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/20",
  none: "",
};

function buildDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date?: Date; kind: DayKind }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ kind: "none" });
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    const dow = dt.getDay();
    let kind: DayKind = "present";
    if (dow === 0 || dow === 6) kind = "weekend";
    if ([4, 5].includes(d)) kind = "leave-approved";
    if ([18, 19].includes(d)) kind = "leave-pending";
    if (d === 20) kind = "holiday";
    if (d === 8) kind = "absent";
    cells.push({ date: dt, kind });
  }
  while (cells.length % 7 !== 0) cells.push({ kind: "none" });
  return cells;
}

const legend: { kind: DayKind; label: string }[] = [
  { kind: "present", label: "Present" },
  { kind: "leave-approved", label: "Approved leave" },
  { kind: "leave-pending", label: "Pending leave" },
  { kind: "holiday", label: "Holiday" },
  { kind: "weekend", label: "Weekend" },
  { kind: "absent", label: "Absent" },
];

function CalendarPage() {
  const [ref, setRef] = useState(new Date(2026, 6, 1));
  const cells = buildDays(ref.getFullYear(), ref.getMonth());
  const monthLabel = ref.toLocaleString("en", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="See attendance, holidays, and leave at a glance."
        actions={
          <Link to="/leave">
            <Button className="rounded-xl"><Plus className="mr-1.5 size-4" />Apply for leave</Button>
          </Link>
        }
      />

      <div className="rounded-2xl border bg-card p-4 shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
            <p className="text-xs text-muted-foreground">Click a day to view or apply for leave</p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="rounded-lg" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setRef(new Date(2026, 6, 1))}>Today</Button>
            <Button size="icon" variant="outline" className="rounded-lg" onClick={() => setRef(new Date(ref.getFullYear(), ref.getMonth() + 1, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => (
            <button
              key={i}
              disabled={!c.date}
              className={cn(
                "group relative aspect-square rounded-xl border border-transparent p-2 text-left text-sm transition-all",
                c.date && "hover:border-border hover:shadow-soft",
                !c.date && "opacity-0 pointer-events-none",
              )}
            >
              {c.date && (
                <>
                  <span className="text-xs font-medium text-muted-foreground">{c.date.getDate()}</span>
                  {c.kind !== "none" && (
                    <span className={cn("mt-2 inline-block rounded-md px-1.5 py-0.5 text-[10px] font-medium", kindStyles[c.kind])}>
                      {c.kind === "present" && "Present"}
                      {c.kind === "leave-approved" && "PTO"}
                      {c.kind === "leave-pending" && "Pending"}
                      {c.kind === "holiday" && "Holiday"}
                      {c.kind === "weekend" && "Off"}
                      {c.kind === "absent" && "Absent"}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t pt-4">
          {legend.map((l) => (
            <div key={l.kind} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-2.5 rounded-sm", kindStyles[l.kind])} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
