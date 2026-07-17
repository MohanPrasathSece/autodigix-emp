import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  trend = "up",
  hint,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  trend?: "up" | "down";
  hint?: string;
}) {
  return (
    <div className="group rounded-2xl border bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium",
              trend === "up"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}
          >
            {trend === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta}
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
