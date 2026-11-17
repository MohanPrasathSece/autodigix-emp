import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAttendanceHistory, useEmployees } from "@/shared/api/queries";
import { Download, Search, Calendar, Clock, UserCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ReportsView() {
  const { data: employees = [], isLoading: empLoading } = useEmployees();
  const { data: attendanceHistory = [], isLoading: attLoading } = useAttendanceHistory();

  // Generate options for the last 12 months (e.g. "2026-11", label "November 2026")
  const monthOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      list.push({ value: val, label });
    }
    return list;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value || "");
  const [searchQuery, setSearchQuery] = useState("");

  const activeEmployees = useMemo(() => {
    return employees.filter((e: any) => e.status !== "Terminated");
  }, [employees]);

  // Compute monthly attendance aggregates per employee
  const reportData = useMemo(() => {
    if (!selectedMonth) return [];

    return activeEmployees.map((emp: any) => {
      // Find all attendance records for this employee in the selected month
      const empLogs = (attendanceHistory as any[]).filter((h: any) => {
        if (h.employee_id !== emp.id) return false;
        const dStr = String(h.date || "").slice(0, 7);
        return dStr === selectedMonth;
      });

      // Count distinct days present
      const uniqueDates = new Set(
        empLogs
          .filter((h: any) => h.status === 'Clocked In' || h.status === 'Clocked Out' || Number(h.hours) > 0)
          .map((h: any) => String(h.date).slice(0, 10))
      );
      const daysPresent = uniqueDates.size;

      // Sum total hours worked
      const totalHours = empLogs.reduce((acc: number, curr: any) => {
        return acc + (Number(curr.hours) || 0);
      }, 0);

      const avgHoursPerDay = daysPresent > 0 ? (totalHours / daysPresent).toFixed(1) : "0.0";

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department || "General",
        role: emp.role || "Staff",
        initials: emp.initials || emp.name?.substring(0, 2).toUpperCase() || "EM",
        avatarColor: emp.avatarColor || emp.avatar_color || "from-blue-500 to-indigo-500",
        avatarUrl: emp.avatarUrl || emp.avatar_url,
        daysPresent,
        totalHours: Math.round(totalHours * 10) / 10,
        avgHoursPerDay
      };
    });
  }, [activeEmployees, attendanceHistory, selectedMonth]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter((r) => 
      r.name.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  }, [reportData, searchQuery]);

  // Overall totals for the month
  const totalDaysAcrossTeam = useMemo(() => {
    return reportData.reduce((acc, r) => acc + r.daysPresent, 0);
  }, [reportData]);

  const totalHoursAcrossTeam = useMemo(() => {
    return Math.round(reportData.reduce((acc, r) => acc + r.totalHours, 0) * 10) / 10;
  }, [reportData]);

  const selectedMonthLabel = useMemo(() => {
    return monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth;
  }, [monthOptions, selectedMonth]);

  // Export to CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      toast.info("No data to export.");
      return;
    }

    const headers = ["Employee ID", "Employee Name", "Department", "Role", "Month", "Days Present", "Total Hours Worked", "Avg Hours/Day"];
    const csvRows = [
      headers.join(","),
      ...reportData.map((r) => [
        `"${r.id}"`,
        `"${r.name}"`,
        `"${r.department}"`,
        `"${r.role}"`,
        `"${selectedMonthLabel}"`,
        r.daysPresent,
        r.totalHours,
        r.avgHoursPerDay
      ].join(","))
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monthly-attendance-report-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance report exported to CSV.");
  };

  const isLoading = empLoading || attLoading;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Monthly Attendance Reports"
        description={`Summary of days present and total hours worked for ${selectedMonthLabel}.`}
        actions={
          <div className="flex items-center gap-3">
            <div className="w-52">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-10 rounded-xl bg-card border shadow-sm">
                  <Calendar className="mr-2 size-4 text-muted-foreground" />
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="rounded-xl h-10" onClick={handleExportCSV}>
              <Download className="mr-1.5 size-4" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Employees</p>
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">{activeEmployees.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tracked this month</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Days Present</p>
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{totalDaysAcrossTeam}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Across entire team</p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Working Hours</p>
            <div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{totalHoursAcrossTeam.toFixed(1)} hrs</p>
          <p className="text-xs text-muted-foreground mt-0.5">Logged in {selectedMonthLabel}</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        {/* Search Bar & Header */}
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee by name, role, or ID..."
              className="h-10 rounded-xl pl-9 bg-card"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Showing {filteredRows.length} of {activeEmployees.length} employees
          </span>
        </div>

        {/* Attendance Summary Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold">Employee</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Department & Role</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Days Present</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Total Hours Worked</TableHead>
              <TableHead className="pr-6 text-xs uppercase tracking-wider font-semibold text-right">Avg Hours / Day</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground animate-pulse">
                  Loading attendance records...
                </TableCell>
              </TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                  No attendance records found for {selectedMonthLabel}.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/30">
                  {/* Employee Name & Avatar */}
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      {row.avatarUrl ? (
                        <img
                          src={row.avatarUrl}
                          alt={row.name}
                          className="size-10 rounded-xl object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div
                          className={cn(
                            "grid size-10 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm shrink-0",
                            row.avatarColor
                          )}
                        >
                          {row.initials}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.id} · {row.email}</p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Department & Role */}
                  <TableCell className="py-4">
                    <Badge variant="outline" className="text-xs font-medium rounded-md px-2 py-0.5 mb-1">
                      {row.department}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{row.role}</p>
                  </TableCell>

                  {/* Days Present */}
                  <TableCell className="text-center py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {row.daysPresent} {row.daysPresent === 1 ? "day" : "days"}
                    </span>
                  </TableCell>

                  {/* Total Hours Worked */}
                  <TableCell className="text-center py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {row.totalHours.toFixed(1)} hrs
                    </span>
                  </TableCell>

                  {/* Avg Hours / Day */}
                  <TableCell className="pr-6 py-4 text-right">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {row.avgHoursPerDay} hrs/day
                    </span>
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
