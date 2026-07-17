import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

const history = [
  { id: "LV-001", type: "Vacation", dates: "Aug 12 - Aug 15, 2026", days: 4, status: "Approved", appliedOn: "Aug 1, 2026" },
  { id: "LV-002", type: "Sick Leave", dates: "Jul 20, 2026", days: 1, status: "Approved", appliedOn: "Jul 19, 2026" },
  { id: "LV-003", type: "Personal", dates: "Jun 05 - Jun 06, 2026", days: 2, status: "Rejected", appliedOn: "May 25, 2026" },
  { id: "LV-004", type: "Vacation", dates: "Dec 24 - Dec 31, 2026", days: 6, status: "Pending", appliedOn: "Jul 16, 2026" },
];

export function EmployeeLeaveHistoryView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leave History"
        description="Track all your past and upcoming leave requests."
      />

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Applied On</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{record.id}</td>
                  <td className="px-6 py-4">{record.type}</td>
                  <td className="px-6 py-4">{record.dates}</td>
                  <td className="px-6 py-4">{record.days}</td>
                  <td className="px-6 py-4 text-muted-foreground">{record.appliedOn}</td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant={record.status === "Approved" ? "default" : record.status === "Pending" ? "outline" : "destructive"}
                      className={record.status === "Approved" ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20" : ""}
                    >
                      {record.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
