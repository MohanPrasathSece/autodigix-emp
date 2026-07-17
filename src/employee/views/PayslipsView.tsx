import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, IndianRupee, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const payslips = [
  {
    month: "July 2026",
    status: "Generated",
    netPay: "₹ 82,450",
    basic: "₹ 85,000",
    paidLeaves: 2,
    lopDays: 0,
    lopDeduction: "₹ 0",
    days: 31,
  },
  {
    month: "June 2026",
    status: "Generated",
    netPay: "₹ 79,450",
    basic: "₹ 85,000",
    paidLeaves: 2,
    lopDays: 1,
    lopDeduction: "₹ 3,000",
    days: 30,
  },
  {
    month: "May 2026",
    status: "Generated",
    netPay: "₹ 82,450",
    basic: "₹ 85,000",
    paidLeaves: 0,
    lopDays: 0,
    lopDeduction: "₹ 0",
    days: 31,
  },
];

export function EmployeePayslipsView() {
  const handleDownload = (month: string) => {
    toast.success("Payslip Downloaded", {
      description: `Your payslip for ${month} has been downloaded securely.`
    });
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
                <span className="font-medium">₹ 3,40,000</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Total Deductions</span>
                <span className="font-medium text-red-500">₹ 10,200</span>
              </div>
              <Separator className="my-3 border-primary/20" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Net Pay</span>
                <span className="text-xl font-bold text-primary">₹ 3,29,800</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Payslips List */}
        <div className="col-span-2 space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Recent Payslips</h2>
          
          {payslips.map((slip) => (
            <div key={slip.month} className="rounded-2xl border bg-card p-5 shadow-soft transition-colors hover:border-primary/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{slip.month}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{slip.days} Paid Days</span>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] h-4 px-1.5 rounded-sm">
                        {slip.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Net Pay</p>
                    <p className="font-bold text-lg">{slip.netPay}</p>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl hidden sm:flex shrink-0" onClick={() => handleDownload(slip.month)}>
                    <Download className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 text-sm">
                <div>
                  <h4 className="font-semibold text-emerald-600 mb-3 border-b pb-2">Salary & Leaves</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Base Salary</span><span>{slip.basic}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Paid Leaves Taken</span><span>{slip.paidLeaves}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Loss of Pay (LOP) Days</span><span>{slip.lopDays}</span></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-red-500 mb-3 border-b pb-2">Deductions</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">LOP Deduction</span><span>{slip.lopDeduction}</span></div>
                  </div>
                </div>
              </div>

              {/* Mobile Download Button */}
              <Button variant="outline" className="w-full mt-6 rounded-xl sm:hidden" onClick={() => handleDownload(slip.month)}>
                <Download className="mr-2 size-4" /> Download PDF
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
