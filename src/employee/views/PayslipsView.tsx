import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { usePayslips } from "@/shared/api/queries";
import { useAuthStore } from "@/shared/store/auth";
import { useMemo } from "react";

export function EmployeePayslipsView() {
  const { user } = useAuthStore();
  const { data: allPayslips = [], isLoading } = usePayslips();

  const payslips = useMemo(() => {
    if (!user) return [];
    return allPayslips.filter((slip: any) => slip.employee_id === user.id);
  }, [allPayslips, user]);

  const ytdGross = payslips.reduce((sum: number, slip: any) => sum + slip.gross, 0);
  const ytdNet = payslips.reduce((sum: number, slip: any) => sum + slip.net, 0);
  const ytdDeductions = ytdGross - ytdNet;

  const handleDownload = (month: string) => {
    toast.info("Preparing PDF", {
      description: `Opening print dialog for ${month} payslip. Please save as PDF.`
    });
    setTimeout(() => {
      window.print();
    }, 500);
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
                <h3 className="font-semibold">Financial Year 26-27</h3>
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
          <h2 className="text-lg font-semibold tracking-tight">Recent Payslips</h2>
          
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading payslips...</div>
          ) : payslips.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No payslips found.</div>
          ) : payslips.map((slip: any) => (
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
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] h-4 px-1.5 rounded-sm">
                        {slip.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Net Pay</p>
                    <p className="font-bold text-lg">₹ {slip.net.toLocaleString('en-IN')}</p>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl hidden sm:flex shrink-0" onClick={() => handleDownload(slip.period)}>
                    <Download className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="font-semibold text-emerald-600 mb-3 border-b pb-2">Salary Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Gross Salary</span><span>₹ {slip.gross.toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-500 mb-3 border-b pb-2">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Deductions</span><span>₹ {(slip.gross - slip.net).toLocaleString('en-IN')}</span></div>
                  </div>
                </div>
              </div>

              {/* Mobile Download Button */}
              <Button variant="outline" className="w-full mt-6 rounded-xl sm:hidden" onClick={() => handleDownload(slip.period)}>
                <Download className="mr-2 size-4" /> Download PDF
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
