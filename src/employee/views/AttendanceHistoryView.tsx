import { useState, useMemo } from "react";
import { Calendar, TrendingUp, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendanceHistory } from "@/shared/api/queries";
import { useAuthStore } from "@/shared/store/auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function EmployeeAttendanceHistoryView() {
  const { user } = useAuthStore();
  const { data: allAttendance = [] } = useAttendanceHistory();

  // Filter to only this employee's records
  const myAttendance = useMemo(() => {
    return allAttendance.filter((record: any) => record.employee_id === user?.id);
  }, [allAttendance, user?.id]);

  // Sort records by date (newest first)
  const sortedAttendance = useMemo(() => {
    const sorted = [...myAttendance];
    sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted;
  }, [myAttendance]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = sortedAttendance.length;
    const totalHours = sortedAttendance.reduce((sum: number, r: any) => sum + (r.hours || 0), 0);
    const avgHoursPerDay = total > 0 ? (totalHours / total).toFixed(2) : "0";

    return { total, totalHours, avgHoursPerDay };
  }, [sortedAttendance]);

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "—";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr + "T00:00:00"), "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Clocked Out":
        return { text: "Clocked Out", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
      case "Clocked In":
        return { text: "Clocked In", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" };
      default:
        return { text: status || "Unknown", color: "bg-gray-500/10 text-gray-700 dark:text-gray-300" };
    }
  };

  return (
    <>
      <PageHeader
        title="Attendance History"
        description="View your daily clock-in/clock-out records from November onwards."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Days</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Calendar className="size-5 text-muted-foreground opacity-50" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{stats.totalHours}</p>
            </div>
            <TrendingUp className="size-5 text-blue-500 opacity-70" />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg Hours/Day</p>
              <p className="text-2xl font-bold">{stats.avgHoursPerDay}h</p>
            </div>
            <Clock className="size-5 text-purple-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Daily Records</h2>
        </div>

        {sortedAttendance.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No attendance records yet.</p>
            <p className="text-xs mt-1">Records from November onwards will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAttendance.map((record: any) => {
                  const badge = getStatusBadge(record.status);
                  return (
                    <TableRow key={`${record.date}-${record.employee_id}`}>
                      <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                      <TableCell className="text-sm">{formatTime(record.clock_in_time)}</TableCell>
                      <TableCell className="text-sm">{formatTime(record.clock_out_time)}</TableCell>
                      <TableCell className="text-right font-medium">{record.hours || 0}h</TableCell>
                      <TableCell>
                        <div className={cn("inline-block px-2.5 py-1 rounded-md text-xs font-medium", badge.color)}>
                          {badge.text}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
