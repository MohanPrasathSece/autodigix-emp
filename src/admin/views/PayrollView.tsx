import { Wallet, Download, TrendingUp, Banknote, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePayslips, usePayrollTrend, useEmployees } from "@/shared/api/queries";
import { useRunPayroll } from "@/shared/api/mutations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/shared/lib/exportUtils";
import { generatePayslipPDFBase64 } from "@/shared/lib/pdfGenerator";
import { toast } from "sonner";
import { useState } from "react";

/** Parse a "MMM YYYY" period (e.g. "Nov 2026") into a comparable timestamp. */
const parsePeriodDate = (period: string): number => {
  const d = new Date(`1 ${period}`);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export function PayrollPage() {
  const { data: payslips = [] } = usePayslips();
  const { data: payrollTrend = [] } = usePayrollTrend();
  const { data: employees = [] } = useEmployees();
  const runPayroll = useRunPayroll();

  // Chronologically latest period — parse "MMM YYYY" instead of trusting array order.
  const distinctPeriods = Array.from(new Set(payslips.map((p: any) => p.period).filter(Boolean)))
    .sort((a: string, b: string) => parsePeriodDate(b) - parsePeriodDate(a));
  const latestPeriod = distinctPeriods[0] ?? "N/A";

  const [selectedPeriod, setSelectedPeriod] = useState("");
  const activePeriod = selectedPeriod || latestPeriod;

  // Aggregate metrics for the selected month, straight from the stored payslips.
  const periodPayslips = payslips.filter((p: any) => p.period === activePeriod);

  const totalGross = periodPayslips.reduce((s: number, x: any) => s + (Number(x.gross) || 0), 0);
  const net = periodPayslips.reduce((s: number, x: any) => s + (Number(x.net) || 0), 0);

  const totalBase = periodPayslips.reduce((s: number, x: any) => s + (Number(x.base_amount) || 0), 0);
  const totalAllowances = periodPayslips.reduce((s: number, x: any) => s + (Number(x.allowances_amount) || 0), 0);
  const totalTax = periodPayslips.reduce((s: number, x: any) => s + (Number(x.tax_amount) || 0), 0);
  const totalBenefits = periodPayslips.reduce((s: number, x: any) => s + (Number(x.benefits_amount) || 0), 0);
  const totalUnpaidLeave = periodPayslips.reduce((s: number, x: any) => s + (Number(x.unpaid_leave_amount) || 0), 0);
  const totalLopDays = periodPayslips.reduce((s: number, x: any) => s + (Number(x.lop_days) || 0), 0);

  // GROSS = base + allowances ; DEDUCTIONS = tax + benefits + unpaid leave ; NET = gross - deductions.
  const earningsGross = totalBase + totalAllowances;
  const totalDeductions = totalTax + totalBenefits + totalUnpaidLeave;

  const ytdEarnings = payslips.reduce((s: number, x: any) => s + (Number(x.gross) || 0), 0);

  // Run Payroll targets the current real month; the data layer also guards against re-running.
  const runPeriod = new Date().toLocaleString("default", { month: "short", year: "numeric" });
  const runPeriodProcessed = payslips.some((p: any) => p.period === runPeriod);

  const handleRunPayroll = () => {
    if (runPeriodProcessed) {
      toast.info(`Payroll for ${runPeriod} has already been processed.`);
      return;
    }
    runPayroll.mutate(runPeriod);
  };

  const handleExportCSV = () => {
    if (payslips.length === 0) {
      toast.info("No payslips to export.");
      return;
    }
    exportToCSV("payroll_history", payslips);
    toast.success("Payroll history exported to CSV.");
  };

  const handleDownloadPDF = (p: any) => {
    const emp = employees.find((e: any) => e.id === p.employee_id);

    try {
      const pdfBase64 = generatePayslipPDFBase64({
        employeeName: emp?.name || "Employee",
        employeeId: emp?.id || p.employee_id || "EMP",
        email: emp?.email || "",
        department: emp?.department || "General",
        role: emp?.role || "Staff",
        period: p.period,
        base_amount: p.base_amount ?? 0,
        allowances_amount: p.allowances_amount ?? 0,
        unpaid_leave_amount: p.unpaid_leave_amount ?? 0,
        gross: p.gross,
        tax_amount: p.tax_amount ?? 0,
        benefits_amount: p.benefits_amount ?? 0,
        net: p.net
      });

      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `Payslip_${p.period.replace(/\s+/g, '_')}_${(emp?.name || "Employee").replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Payslip for ${p.period} downloaded!`);
    } catch (err: any) {
      toast.error(`Failed to download PDF: ${err.message}`);
    }
  };

  const employeeName = (id: string) =>
    employees.find((e: any) => e.id === id)?.name || `Employee #${id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="Company compensation, payslips, and history."
        actions={
          <div className="flex gap-2">
            <Button
              className="rounded-xl"
              onClick={handleRunPayroll}
              disabled={runPayroll.isPending || runPeriodProcessed}
              title={runPeriodProcessed ? `Payroll for ${runPeriod} already processed` : `Run payroll for ${runPeriod}`}
            >
              <RefreshCw className={cn("mr-1.5 size-4", runPayroll.isPending && "animate-spin")} />
              {runPayroll.isPending ? "Processing..." : `Run Payroll (${runPeriod})`}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleExportCSV}>
              <Download className="mr-1.5 size-4" />Export Log
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={`Net (${activePeriod})`} value={`₹${net.toLocaleString()}`} icon={Wallet} hint="Company Total" />
        <StatCard label={`Gross (${activePeriod})`} value={`₹${totalGross.toLocaleString()}`} icon={Banknote} hint="Base + Allowances" />
        <StatCard label="YTD Payroll" value={`₹${ytdEarnings.toLocaleString()}`} delta="" trend="up" icon={TrendingUp} hint="Total processed" />
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
          <p className="text-xs text-muted-foreground">Company aggregate ({activePeriod})</p>
          <div className="mt-4 space-y-2 text-sm">
            {periodPayslips.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No payslips available for breakdown.</div>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Earnings</p>
                <div className="flex items-center justify-between border-b border-dashed py-1.5">
                  <span className="text-muted-foreground">Basic / Base</span>
                  <span className="font-medium">₹{totalBase.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed py-1.5">
                  <span className="text-muted-foreground">Allowances</span>
                  <span className="font-medium">₹{totalAllowances.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm font-semibold">
                  <span>Total Gross</span><span>₹{earningsGross.toLocaleString()}</span>
                </div>

                <p className="pt-2 text-[11px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Deductions</p>
                <div className="flex items-center justify-between border-b border-dashed py-1.5 text-rose-600 dark:text-rose-400">
                  <span className="text-muted-foreground">Income Tax (TDS)</span>
                  <span className="font-medium">-₹{totalTax.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed py-1.5 text-rose-600 dark:text-rose-400">
                  <span className="text-muted-foreground">Benefits</span>
                  <span className="font-medium">-₹{totalBenefits.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b border-dashed py-1.5 text-rose-600 dark:text-rose-400">
                  <span className="text-muted-foreground">
                    Unpaid Leave / LOP{totalLopDays > 0 ? ` (${totalLopDays}d)` : ""}
                  </span>
                  <span className="font-medium">-₹{totalUnpaidLeave.toLocaleString()}</span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm font-semibold">
                  <span>Total Deductions</span><span>-₹{totalDeductions.toLocaleString()}</span>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                  <span>Net take-home</span><span>₹{net.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <h2 className="text-base font-semibold">Payslip history</h2>
          <div className="flex items-center gap-2">
            {distinctPeriods.length > 0 && (
              <Select value={activePeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-9 w-40 rounded-lg">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {distinctPeriods.map((period: string) => (
                    <SelectItem key={period} value={period}>{period}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button size="sm" variant="ghost" className="rounded-lg text-xs" onClick={handleExportCSV}>Export all</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="pl-5 text-xs uppercase tracking-wide">Employee</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Gross</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Net</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Payslip Email</TableHead>
              <TableHead className="pr-5 text-right text-xs uppercase tracking-wide">Payslip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periodPayslips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  {distinctPeriods.length === 0
                    ? "No payslips found in the system. Run payroll to generate them."
                    : `No payslips for ${activePeriod}.`}
                </TableCell>
              </TableRow>
            ) : (
              periodPayslips.map((p: any) => (
                <TableRow key={p.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="pl-5 font-medium">{employeeName(p.employee_id)}</TableCell>
                  <TableCell className="text-sm tabular-nums">₹{(Number(p.gross) || 0).toLocaleString()}</TableCell>
                  <TableCell className="text-sm font-semibold tabular-nums">₹{(Number(p.net) || 0).toLocaleString()}</TableCell>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {p.email_status || "—"}
                    {p.email_sent_at ? <span className="block text-[10px]">{new Date(p.email_sent_at).toLocaleDateString('en-GB')}</span> : null}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => handleDownloadPDF(p)} title="Download PDF Payslip">
                      <Download className="size-4" />
                    </Button>
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
