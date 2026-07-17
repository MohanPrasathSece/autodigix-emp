import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Clock, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockLogs = [
  { id: 1, type: "work", message: "Aarav Sharma started work", time: "Today, 09:00 AM", timestamp: new Date(Date.now() - 2 * 3600000) },
  { id: 2, type: "leave", message: "Priya Patel's leave request approved", time: "Today, 09:15 AM", timestamp: new Date(Date.now() - 3 * 3600000) },
  { id: 3, type: "work", message: "Rahul Verma started work", time: "Today, 09:30 AM", timestamp: new Date(Date.now() - 4 * 3600000) },
  { id: 4, type: "leave", message: "Vikram Singh's leave request rejected", time: "Yesterday, 10:00 AM", timestamp: new Date(Date.now() - 26 * 3600000) },
  { id: 5, type: "work", message: "Neha Gupta stopped work", time: "Yesterday, 06:00 PM", timestamp: new Date(Date.now() - 30 * 3600000) },
  { id: 6, type: "work", message: "Aarav Sharma stopped work", time: "2 Days ago, 06:15 PM", timestamp: new Date(Date.now() - 48 * 3600000) },
  { id: 7, type: "leave", message: "System auto-deleted logs older than 7 days", time: "1 Week ago", timestamp: new Date(Date.now() - 7 * 24 * 3600000) },
  { id: 8, type: "system", message: "Payroll processing completed for June", time: "3 Days ago, 11:00 AM", timestamp: new Date(Date.now() - 72 * 3600000) },
  { id: 9, type: "work", message: "Sanya Mirza started work", time: "5 Days ago, 08:50 AM", timestamp: new Date(Date.now() - 120 * 3600000) },
  { id: 10, type: "leave", message: "Rahul Verma applied for Sick Leave", time: "6 Days ago, 02:30 PM", timestamp: new Date(Date.now() - 144 * 3600000) },
  // This one will be filtered out as it is older than 7 days
  { id: 11, type: "system", message: "Old log to be deleted", time: "8 Days ago", timestamp: new Date(Date.now() - 8 * 24 * 3600000) },
];

export function AdminNotificationsView() {
  // Filter logs to last 7 days only (auto-deletion policy)
  const recentLogs = mockLogs.filter(log => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return log.timestamp >= oneWeekAgo;
  });

  // Group logs by day string (e.g., "Today", "Yesterday", "2 Days ago")
  const groupedLogs = recentLogs.reduce((acc, log) => {
    const dayString = log.time.split(",")[0] || "Past";
    if (!acc[dayString]) acc[dayString] = [];
    acc[dayString].push(log);
    return acc;
  }, {} as Record<string, typeof recentLogs>);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Notifications & Logs"
        description="Detailed system activity and employee events. Logs are automatically deleted after 7 days."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl">
              <CheckCircle2 className="mr-2 size-4" /> Mark all read
            </Button>
            <Button variant="outline" className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50">
              <Trash2 className="mr-2 size-4" /> Clear Logs
            </Button>
          </div>
        }
      />

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div>
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              7-Day Activity Stream
            </h3>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertCircle className="size-3" /> Showing logs stored for the last week
            </p>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {recentLogs.length} Events Logged
          </div>
        </div>
        
        <div className="divide-y">
          {Object.entries(groupedLogs).map(([dayString, logsForDay]) => (
            <div key={dayString} className="flex flex-col">
              <div className="bg-muted/30 px-5 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-t first:border-t-0 sticky top-0 backdrop-blur-sm z-10">
                {dayString}
              </div>
              <div className="divide-y">
                {logsForDay.map((log) => (
                  <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-muted/10 transition-colors">
                    <div className={`mt-1 size-2.5 shrink-0 rounded-full ${
                      log.type === 'work' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      log.type === 'leave' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                      'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{log.message}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground font-medium">{log.time.split(",")[1] || log.time}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 border px-1.5 py-0.5 rounded-sm">
                          {log.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {recentLogs.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              No recent logs found in the last 7 days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
