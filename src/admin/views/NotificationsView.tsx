import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Clock, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/shared/store/auth";

import { useNotifications } from "@/shared/api/queries";
import { useMarkNotificationRead, useClearNotifications } from "@/shared/api/mutations";
import { useNotificationRead } from "@/shared/hooks/use-notification-read";

export function AdminNotificationsView() {
  const { user } = useAuthStore();
  const { data: notifications = [], isLoading } = useNotifications(user?.id, true);
  const markAsRead = useMarkNotificationRead();
  const clearNotifications = useClearNotifications();
  const { isRead, isBroadcast, markLocalRead } = useNotificationRead(user?.id);

  const markOne = (n: any) => {
    if (isRead(n)) return;
    if (isBroadcast(n)) markLocalRead(n.id);
    else markAsRead.mutate(n.id);
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n: any) => markOne(n));
  };

  const handleClearLogs = () => {
    if (window.confirm("Delete all activity logs? This cannot be undone.")) {
      clearNotifications.mutate();
    }
  };

  // Filter logs to last 7 days only (auto-deletion policy)
  const recentLogs = notifications.filter((log: any) => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const created = log.created_at ? new Date(log.created_at) : null;
    return created && !isNaN(created.getTime()) ? created >= oneWeekAgo : true;
  });

  // Group logs by day (e.g., "Today", "Yesterday", "3 Days ago"), using created_at.
  const groupedLogs = recentLogs.reduce((acc: any, log: any) => {
    const created = log.created_at ? new Date(log.created_at) : null;
    let dayString = "Earlier";
    if (created && !isNaN(created.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thatDay = new Date(created);
      thatDay.setHours(0, 0, 0, 0);
      const diff = Math.round((today.getTime() - thatDay.getTime()) / 86400000);
      dayString =
        diff <= 0 ? "Today" :
        diff === 1 ? "Yesterday" :
        diff < 7 ? `${diff} Days ago` :
        thatDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
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
            <Button variant="outline" className="rounded-xl" onClick={handleMarkAllRead}>
              <CheckCircle2 className="mr-2 size-4" /> Mark all read
            </Button>
            <Button
              variant="outline"
              className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
              onClick={handleClearLogs}
              disabled={clearNotifications.isPending || recentLogs.length === 0}
            >
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
          {Object.entries(groupedLogs).map(([dayString, logsForDay]: [string, any]) => (
            <div key={dayString} className="flex flex-col">
              <div className="bg-muted/30 px-5 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-t first:border-t-0 sticky top-0 backdrop-blur-sm z-10">
                {dayString}
              </div>
              <div className="divide-y">
                {logsForDay.map((log: any) => (
                  <div 
                    key={log.id} 
                    className={`p-5 flex items-start gap-4 hover:bg-muted/10 transition-colors cursor-pointer ${!isRead(log) ? 'bg-primary/5' : ''}`}
                    onClick={() => markOne(log)}
                  >
                    <div className={`mt-1 size-2.5 shrink-0 rounded-full ${
                      log.tone === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      log.tone === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                      'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    }`} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{log.body}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground font-medium">{log.time}</span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 border px-1.5 py-0.5 rounded-sm">
                          {log.tone}
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
