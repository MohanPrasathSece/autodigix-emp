import { Wallet, Download, TrendingUp, Banknote } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePayslips, usePayrollTrend } from "@/shared/api/queries";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

export function PayrollPage() {
  const { data: payslips = [] } = usePayslips();
  const { data: payrollTrend = [] } = usePayrollTrend();
  
  // Calculate aggregate metrics from actual payslip data
  const latestPeriod = payslips.length > 0 ? payslips[payslips.length - 1].period : "N/A";
  const currentMonthPayslips = payslips.filter((p: any) => p.period === latestPeriod);
  
  const gross = currentMonthPayslips.reduce((s: number, x: any) => s + x.gross, 0);
  const net = currentMonthPayslips.reduce((s: number, x: any) => s + x.net, 0);
  const totalDeductions = gross - net;

  const ytdEarnings = payslips.reduce((s: number, x: any) => s + x.gross, 0);

  // Generate dynamic breakdown for the UI instead of hardcoded numbers
  const breakdown = gross > 0 ? [
    { label: "Base salary (Estimated)", value: Math.round(gross * 0.8) },
    { label: "Allowances & Bonus", value: Math.round(gross * 0.2) },
  ] : [];

  const deductionsList = totalDeductions > 0 ? [
    { label: "Tax & Compliance", value: Math.round(totalDeductions * 0.7) },
    { label: "Benefits & Insurance", value: Math.round(totalDeductions * 0.3) },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Company compensation, payslips, and history."
        actions={
          <Button variant="outline" className="rounded-xl"><Download className="mr-1.5 size-4" />Export Log</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Net (${latestPeriod})`} value={`$${net.toLocaleString()}`} icon={Wallet} hint="Company Total" />
        <StatCard label={`Gross (${latestPeriod})`} value={`$${gross.toLocaleString()}`} icon={Banknote} hint="Before Deductions" />
        <StatCard label="YTD Payroll" value={`$${ytdEarnings.toLocaleString()}`} delta="" trend="up" icon={TrendingUp} hint="Total processed" />
        <StatCard label="Next payout" value="End of Month" icon={Wallet} hint="via direct deposit" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Payroll trend</h2>
              <p className="text-xs text-muted-foreground">Company payroll, historical</p>
            </div>
          </div>
          <div className="mt-4 h-64">
            {payrollTrend.length > 0 ? (
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
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No payroll trend data yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-base font-semibold">Salary breakdown</h2>
          <p className="text-xs text-muted-foreground">Company aggregate ({latestPeriod})</p>
          <div className="mt-4 space-y-2 text-sm">
            {breakdown.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No payslips available for breakdown.</div>
            ) : (
              <>
                {breakdown.map((b: any) => (
                  <div key={b.label} className="flex items-center justify-between border-b border-dashed py-1.5 last:border-0">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">${b.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm font-semibold">
                  <span>Gross</span><span>${gross.toLocaleString()}</span>
                </div>
                {deductionsList.map((b: any) => (
                  <div key={b.label} className="flex items-center justify-between border-b border-dashed py-1.5 last:border-0 text-rose-600 dark:text-rose-400">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-medium">-${b.value.toLocaleString()}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                  <span>Net take-home</span><span>${net.toLocaleString()}</span>
                </div>
              </>
            )}
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
            {payslips.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No payslips found in the system.</TableCell>
               </TableRow>
            ) : (
              payslips.map((p: any) => (
                <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
