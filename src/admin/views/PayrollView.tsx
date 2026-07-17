import { Wallet, Download, TrendingUp, Banknote } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { payslips, payrollTrend } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";



const breakdown = [
  { label: "Base salary", value: 5800 },
  { label: "Performance bonus", value: 600 },
  { label: "Health benefits", value: 220 },
  { label: "Meal allowance", value: 180 },
];
const deductions = [
  { label: "Federal tax", value: 980 },
  { label: "State tax", value: 320 },
  { label: "Retirement 401(k)", value: 200 },
  { label: "Health insurance", value: 60 },
];

export function PayrollPage() {
  const gross = breakdown.reduce((s, x) => s + x.value, 0);
  const total = deductions.reduce((s, x) => s + x.value, 0);
  const net = gross - total;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Your compensation, payslips, and history."
        actions={
          <Button variant="outline" className="rounded-xl"><Download className="mr-1.5 size-4" />Latest payslip</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Net (July)" value={`$${net.toLocaleString()}`} icon={Wallet} hint="Processing" />
        <StatCard label="Gross (July)" value={`$${gross.toLocaleString()}`} icon={Banknote} />
        <StatCard label="YTD earnings" value="$36,680" delta="+4.2%" trend="up" icon={TrendingUp} hint="vs last year" />
        <StatCard label="Next payout" value="Jul 30" icon={Wallet} hint="via direct deposit" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Payroll trend</h2>
              <p className="text-xs text-muted-foreground">Company payroll, last 7 months</p>
            </div>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={payrollTrend}>
                <defs>
                  <linearGradient id="gradPay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }} />
                <Area type="monotone" dataKey="payroll" stroke="var(--primary)" strokeWidth={2} fill="url(#gradPay)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Salary breakdown</h2>
          <p className="text-xs text-muted-foreground">Your July payslip</p>
          <div className="mt-4 space-y-2 text-sm">
            {breakdown.map((b) => (
              <div key={b.label} className="flex items-center justify-between border-b border-dashed py-1.5 last:border-0">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">${b.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm font-semibold">
              <span>Gross</span><span>${gross.toLocaleString()}</span>
            </div>
            {deductions.map((b) => (
              <div key={b.label} className="flex items-center justify-between border-b border-dashed py-1.5 last:border-0 text-rose-600 dark:text-rose-400">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-medium">-${b.value.toLocaleString()}</span>
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
              <span>Net take-home</span><span>${net.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Payslip history</h2>
          <Button size="sm" variant="ghost" className="rounded-lg text-xs">Export all</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="pl-5 text-xs uppercase tracking-wide">Period</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Gross</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Net</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="pr-5 text-right text-xs uppercase tracking-wide">Payslip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payslips.map((p) => (
              <TableRow key={p.period} className="transition-colors hover:bg-muted/30">
                <TableCell className="pl-5 font-medium">{p.period}</TableCell>
                <TableCell className="text-sm tabular-nums">${p.gross.toLocaleString()}</TableCell>
                <TableCell className="text-sm font-semibold tabular-nums">${p.net.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full text-[11px]",
                      p.status === "Paid" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      p.status === "Processing" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    )}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button size="sm" variant="ghost" className="rounded-lg"><Download className="size-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
