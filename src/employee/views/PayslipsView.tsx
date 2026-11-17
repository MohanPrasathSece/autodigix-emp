import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { usePayslips, useEmployees } from "@/shared/api/queries";
import { useAuthStore } from "@/shared/store/auth";
import { generatePayslipPDFBase64 } from "@/shared/lib/pdfGenerator";
import { useMemo } from "react";

/** Parse a "MMM YYYY" period (e.g. "Nov 2026") into a comparable timestamp. */
const parsePeriodDate = (period: string): number => {
  const d = new Date(`1 ${period}`);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export function EmployeePayslipsView() {
  const { user } = useAuthStore();
  const { data: allPayslips = [], isLoading } = usePayslips();
  const { data: employees = [] } = useEmployees();

  const myEmployee = useMemo(
    () => employees.find((e: any) => e.id === user?.id),
    [employees, user]
  );

  // All of the logged-in employee's payslips, newest month first.
  const payslips = useMemo(() => {
    if (!user) return [];
    return allPayslips
      .filter((slip: any) => slip.employee_id === user.id)
      .sort((a: any, b: any) => parsePeriodDate(b.period) - parsePeriodDate(a.period));
  }, [allPayslips, user]);

  const ytdGross = payslips.reduce((sum: number, slip: any) => sum + (Number(slip.gross) || 0), 0);
  const ytdNet = payslips.reduce((sum: number, slip: any) => sum + (Number(slip.net) || 0), 0);
  const ytdDeductions = ytdGross - ytdNet;

  // Indian financial year (Apr–Mar) derived from today's date.
  const now = new Date();
  const fyStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyLabel = `${String(fyStartYear).slice(2)}-${String(fyStartYear + 1).slice(2)}`;

  // Employee identity for the PDF — from the session, enriched by the employees row.
  const empInfo = {
    name: user?.name || myEmployee?.name || "Employee",
    id: user?.id || myEmployee?.id || "EMP",
    email: user?.email || myEmployee?.email || "",
    department: myEmployee?.department || "General",
    role: myEmployee?.role || "Staff",
  };

  const handleDownload = (slip: any) => {
    try {
      const pdfBase64 = generatePayslipPDFBase64({
        employeeName: empInfo.name,
        employeeId: empInfo.id,
        email: empInfo.email,
        department: empInfo.department,
        role: empInfo.role,
        period: slip.period,
        base_amount: slip.base_amount ?? 0,
        allowances_amount: slip.allowances_amount ?? 0,
        unpaid_leave_amount: slip.unpaid_leave_amount ?? 0,
        gross: slip.gross,
        tax_amount: slip.tax_amount ?? 0,
        benefits_amount: slip.benefits_amount ?? 0,
        net: slip.net,
      });

      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `Payslip_${slip.period.replace(/\s+/g, '_')}_${empInfo.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Payslip for ${slip.period} downloaded!`);
    } catch (err: any) {
      toast.error(`Failed to download payslip: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Payslips"
        description="View your monthly salary breakdowns and download official payslips."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* YTD Summary */}
        <Card className="col-span-1 border-primary/20 bg-primary/5 shadow-soft border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="grid size-10 place-items-center rounded-full bg-primary/20 text-primary">
                <Wallet className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">Financial Year {fyLabel}</h3>
                <p className="text-xs text-muted-foreground">Year to Date (YTD) Earnings</p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Gross Earnings</span>
                <span className="font-medium">₹ {ytdGross.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Total Deductions</span>
                <span className="font-medium text-red-500">₹ {ytdDeductions.toLocaleString('en-IN')}</span>
              </div>
              <Separator className="my-3 border-primary/20" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Net Pay</span>
                <span className="text-xl font-bold text-primary">₹ {ytdNet.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Payslips List */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Payslip History</h2>

          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No payslips found.</div>
          ) : payslips.map((slip: any) => {
            const base = slip.base_amount ?? 0;
            const allowances = slip.allowances_amount ?? 0;
            const gross = base + allowances;
            const tax = slip.tax_amount ?? 0;
            const benefits = slip.benefits_amount ?? 0;
            const unpaid = slip.unpaid_leave_amount ?? 0;
            const totalDeductions = tax + benefits + unpaid;
            return (
              <div key={slip.id} className="rounded-2xl border bg-card p-5 shadow-soft transition-colors hover:border-primary/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{slip.period}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">Monthly Salary</span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] h-4 px-1.5 rounded-sm">
                          {slip.status === "Paid" ? "Issued" : slip.status || "Issued"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Net Pay</p>
                      <p className="font-bold text-lg">₹ {(Number(slip.net) || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <Button variant="outline" size="icon" className="rounded-xl hidden sm:flex shrink-0" onClick={() => handleDownload(slip)} title="Download PDF Payslip">
                      <Download className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 text-sm">
                  <div>
                    <h4 className="font-semibold text-emerald-600 mb-3 border-b pb-2">Earnings</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Base Salary</span><span>₹ {base.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Allowances</span><span>₹ {allowances.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between font-semibold pt-2 border-t"><span className="text-foreground">Total Gross</span><span>₹ {gross.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-500 mb-3 border-b pb-2">Deductions</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Income Tax (TDS)</span><span>₹ {tax.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Benefits</span><span>₹ {benefits.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Unpaid Leave / LOP{(slip.lop_days || 0) > 0 ? ` (${slip.lop_days}d)` : ""}</span><span>₹ {unpaid.toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between font-semibold pt-2 border-t"><span className="text-foreground">Total Deductions</span><span>₹ {totalDeductions.toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                </div>

                {/* Mobile Download Button */}
                <Button variant="outline" className="w-full mt-6 rounded-xl sm:hidden" onClick={() => handleDownload(slip)}>
                  <Download className="mr-2 size-4" /> Download PDF
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
