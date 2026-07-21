import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { useLeaveRequests } from "@/shared/api/queries";
import { useAuthStore } from "@/shared/store/auth";
import { CalendarX } from "lucide-react";

export function EmployeeLeaveHistoryView() {
  const { data: leaveRequests = [], isLoading } = useLeaveRequests();
  const { user } = useAuthStore();

  const myHistory = leaveRequests.filter((l: any) => l.employee_id === user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-muted rounded-xl" />
        <div className="h-64 bg-card border rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Leave History"
        description="Track all your past and upcoming leave requests."
      />

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        {myHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-muted text-muted-foreground mb-4">
              <CalendarX className="size-8" />
            </div>
            <h3 className="text-lg font-semibold">No leave history</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">You haven't applied for any leaves yet. When you do, they will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Request ID</th>
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Dates</th>
                  <th className="px-6 py-4">Days</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {myHistory.map((record: any) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{record.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">{record.type}</td>
                    <td className="px-6 py-4 text-nowrap">{record.from} to {record.to}</td>
                    <td className="px-6 py-4">{record.days}</td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate" title={record.subject}>{record.subject || "-"}</td>
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
        )}
      </div>
    </div>
  );
}
