import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAttendanceHistory, useEmployees } from "@/shared/api/queries";
import { Download, Search, Calendar, Clock, UserCheck, Users, TrendingUp, AlertTriangle, CheckCircle2, Timer, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { eachDayOfInterval, startOfMonth, endOfMonth, isWeekend, format } from "date-fns";
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line
} from "recharts";

function getWorkingDaysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length;
}

interface EmployeeReport {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  daysPresent: number;
  workingDays: number;
  attendanceRate: number;
  totalHours: number;
  avgHoursPerDay: string;
  onTimeDays: number;
  lateDays: number;
  longestStreak: number;
  undertimeDays: number;
  overtimeDays: number;
  dailyLogs: { date: string; clockIn: string; clockOut: string; hours: number; status: string }[];
}

export function ReportsView() {
  const { data: rawEmployees = [], isLoading: empLoading } = useEmployees();
  const { data: attendanceHistory = [], isLoading: attLoading } = useAttendanceHistory();
  const [selectedEmp, setSelectedEmp] = useState<EmployeeReport | null>(null);

  const employees = useMemo(() => {
    return (rawEmployees as any[]).filter((e: any) =>
      e.status !== "Terminated" &&
      e.id !== "EMP-000" &&
      (e.email || "").toLowerCase() !== "admin@company.com" &&
      (e.role || "").toLowerCase() !== "admin" &&
      (e.role || "").toLowerCase() !== "super admin" &&
      (e.name || "").toLowerCase() !== "super admin"
    );
  }, [rawEmployees]);

  const monthOptions = useMemo(() => {
    const list = [];
    const now = new Date();
    // Show only current month + next 12 months (future months only)
    for (let i = 0; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      list.push({ value: val, label });
    }
    return list;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0]?.value || "");
  const [searchQuery, setSearchQuery] = useState("");

  const workingDays = useMemo(() => getWorkingDaysInMonth(selectedMonth), [selectedMonth]);

  // Working days elapsed so far in the selected month (up to today)
  const workingDaysElapsed = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const start = startOfMonth(new Date(year, month - 1));
    const today = new Date();
    const end = today < endOfMonth(new Date(year, month - 1)) ? today : endOfMonth(new Date(year, month - 1));
    if (start > today) return 0;
    return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length;
  }, [selectedMonth]);

  const reportData = useMemo<EmployeeReport[]>(() => {
    if (!selectedMonth) return [];

    return employees.map((emp: any) => {
      const empLogs = (attendanceHistory as any[]).filter((h: any) => {
        if (h.employee_id !== emp.id) return false;
        return String(h.date || "").slice(0, 7) === selectedMonth;
      });

      const uniqueDates = new Set(
        empLogs
          .filter((h: any) => h.status === "Clocked In" || h.status === "Clocked Out" || Number(h.hours) > 0)
          .map((h: any) => String(h.date).slice(0, 10))
      );
      const daysPresent = uniqueDates.size;
      const attendanceRate = workingDays > 0 ? Math.round((daysPresent / workingDays) * 100) : 0;

      const totalHours = empLogs.reduce((acc: number, h: any) => acc + (Number(h.hours) || 0), 0);
      const avgHoursPerDay = daysPresent > 0 ? (totalHours / daysPresent).toFixed(1) : "0.0";

      // Punctuality — 09:30 cutoff
      let onTimeDays = 0;
      let lateDays = 0;
      empLogs.forEach((h: any) => {
        if (!h.clock_in_time) return;
        const d = new Date(h.clock_in_time);
        if (isNaN(d.getTime())) return;
        const mins = d.getHours() * 60 + d.getMinutes();
        if (mins <= 9 * 60 + 30) onTimeDays++;
        else lateDays++;
      });

      // Undertime / Overtime
      let undertimeDays = 0;
      let overtimeDays = 0;
      empLogs.forEach((h: any) => {
        if (h.status !== "Clocked Out") return;
        const hrs = Number(h.hours) || 0;
        if (hrs > 0 && hrs < 8) undertimeDays++;
        if (hrs > 10) overtimeDays++;
      });

      // Longest streak
      const [year, month] = selectedMonth.split("-").map(Number);
      const monthDays = eachDayOfInterval({
        start: startOfMonth(new Date(year, month - 1)),
        end: endOfMonth(new Date(year, month - 1)),
      })
        .filter((d) => !isWeekend(d))
        .map((d) => format(d, "yyyy-MM-dd"));

      let longestStreak = 0;
      let tempStreak = 0;
      for (const day of monthDays) {
        if (uniqueDates.has(day)) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Daily logs
      const dailyLogs = empLogs
        .filter((h: any) => h.date)
        .sort((a: any, b: any) => String(b.date).localeCompare(String(a.date)))
        .map((h: any) => {
          const fmtTime = (val?: string) => {
            if (!val) return "—";
            const d = new Date(val);
            return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
          };
          return {
            date: String(h.date).slice(0, 10),
            clockIn: fmtTime(h.clock_in_time),
            clockOut: fmtTime(h.clock_out_time),
            hours: Number(h.hours) || 0,
            status: h.status || "—",
          };
        });

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department || "General",
        role: emp.role || "Staff",
        initials: emp.initials || emp.name?.substring(0, 2).toUpperCase() || "EM",
        avatarColor: emp.avatar_color || emp.avatarColor || "from-blue-500 to-indigo-500",
        avatarUrl: emp.avatar_url || emp.avatarUrl,
        daysPresent,
        workingDays,
        attendanceRate,
        totalHours: Math.round(totalHours * 10) / 10,
        avgHoursPerDay,
        onTimeDays,
        lateDays,
        longestStreak,
        undertimeDays,
        overtimeDays,
        dailyLogs,
      };
    });
  }, [employees, attendanceHistory, selectedMonth, workingDays]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [reportData, searchQuery]);

  const totalHoursAcrossTeam = useMemo(() => Math.round(reportData.reduce((acc, r) => acc + r.totalHours, 0) * 10) / 10, [reportData]);
  const avgAttendanceRate = useMemo(() => {
    if (reportData.length === 0) return 0;
    return Math.round(reportData.reduce((acc, r) => acc + r.attendanceRate, 0) / reportData.length);
  }, [reportData]);

  const selectedMonthLabel = useMemo(() => monthOptions.find((m) => m.value === selectedMonth)?.label || selectedMonth, [monthOptions, selectedMonth]);

  const handleExportCSV = () => {
    if (reportData.length === 0) { toast.info("No data to export."); return; }
    const headers = ["Employee ID", "Employee Name", "Department", "Role", "Month", "Working Days", "Days Present", "Attendance %", "Total Hours", "Avg Hrs/Day", "On-Time Days", "Late Days", "Undertime Days", "Overtime Days", "Longest Streak"];
    const rows = reportData.map((r) => [
      `"${r.id}"`, `"${r.name}"`, `"${r.department}"`, `"${r.role}"`, `"${selectedMonthLabel}"`,
      r.workingDays, r.daysPresent, r.attendanceRate, r.totalHours, r.avgHoursPerDay,
      r.onTimeDays, r.lateDays, r.undertimeDays, r.overtimeDays, r.longestStreak,
    ].join(","));
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `monthly-attendance-${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance report exported.");
  };

  // --- Charts data ---

  // 1. Pie: attendance rate per employee (Present days vs Absent days)
  const pieData = useMemo(() => {
    return reportData.map((r) => ({
      name: r.name,
      present: r.daysPresent,
      absent: Math.max(0, workingDaysElapsed - r.daysPresent),
    }));
  }, [reportData, workingDaysElapsed]);

  // 2. Bar: total hours per employee
  const hoursBarData = useMemo(() => {
    return reportData.map((r) => ({
      name: r.name,
      hours: r.totalHours,
      expected: workingDaysElapsed * 9,
    }));
  }, [reportData, workingDaysElapsed]);

  // 3. Line: daily avg clock-in time (minutes after midnight) across the month
  const clockInLineData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthDays = eachDayOfInterval({
      start: startOfMonth(new Date(year, month - 1)),
      end: endOfMonth(new Date(year, month - 1)),
    }).filter((d) => !isWeekend(d));

    return monthDays.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const logsForDay = (attendanceHistory as any[]).filter(
        (h: any) => String(h.date).slice(0, 10) === dateStr && h.clock_in_time
      );
      const times = logsForDay.map((h: any) => {
        const d = new Date(h.clock_in_time);
        return isNaN(d.getTime()) ? null : d.getHours() * 60 + d.getMinutes();
      }).filter((v): v is number => v !== null);

      const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
      const label = format(day, "dd MMM");
      const display = avg !== null ? `${Math.floor(avg / 60)}:${String(avg % 60).padStart(2, "0")}` : null;
      return { date: label, avgMinutes: avg, display };
    });
  }, [attendanceHistory, selectedMonth]);

  const PIE_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];
  const ABSENT_COLOR = "#fca5a5";

  const isLoading = empLoading || attLoading;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader
        title="Monthly Attendance Reports"
        description={`Attendance analytics for ${selectedMonthLabel} · ${workingDays} working days`}
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
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employees</p>
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Users className="size-4" /></div>
          </div>
          <p className="text-2xl font-bold mt-2">{employees.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active headcount</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Attendance</p>
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><TrendingUp className="size-4" /></div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{avgAttendanceRate}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Team average</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Working Days</p>
            <div className="grid size-9 place-items-center rounded-xl bg-blue-500/10 text-blue-600"><UserCheck className="size-4" /></div>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {workingDaysElapsed} <span className="text-base font-normal text-muted-foreground">/ {workingDays}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Days elapsed this month</p>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Hours</p>
            <div className="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-600"><Clock className="size-4" /></div>
          </div>
          <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-2">{totalHoursAcrossTeam.toFixed(0)}h</p>
          <p className="text-xs text-muted-foreground mt-0.5">Logged in {selectedMonthLabel}</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, role, or ID..." className="h-10 rounded-xl pl-9 bg-card" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Showing {filteredRows.length} of {employees.length} employees</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-b hover:bg-transparent">
              <TableHead className="pl-6 text-xs uppercase tracking-wider font-semibold">Employee</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Department</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Attendance</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Hours</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Punctuality</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Streak</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-center">Flags</TableHead>
              <TableHead className="pr-6 text-xs uppercase tracking-wider font-semibold text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground animate-pulse">Loading attendance records...</TableCell></TableRow>
            ) : filteredRows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No records found for {selectedMonthLabel}.</TableCell></TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      {row.avatarUrl ? (
                        <img src={row.avatarUrl} alt={row.name} className="size-10 rounded-xl object-cover ring-1 ring-border shrink-0" />
                      ) : (
                        <div className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm shrink-0", row.avatarColor)}>
                          {row.initials}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.id}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <Badge variant="outline" className="text-xs rounded-md px-2 py-0.5 mb-1">{row.department}</Badge>
                    <p className="text-xs text-muted-foreground">{row.role}</p>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <span className={cn("text-sm font-bold", row.attendanceRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : row.attendanceRate >= 60 ? "text-amber-500" : "text-red-500")}>
                        {row.attendanceRate}%
                      </span>
                      <Progress value={row.attendanceRate} className="h-1.5 w-16" />
                      <span className="text-[10px] text-muted-foreground">{row.daysPresent}/{row.workingDays} days</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{row.totalHours.toFixed(1)}h</span>
                    <p className="text-[10px] text-muted-foreground">{row.avgHoursPerDay}h/day avg</p>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="size-3" /> {row.onTimeDays} on time
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                        <Timer className="size-3" /> {row.lateDays} late
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    <span className="text-sm font-bold text-primary">{row.longestStreak}d</span>
                    <p className="text-[10px] text-muted-foreground">best streak</p>
                  </TableCell>

                  <TableCell className="text-center py-4">
                    {row.undertimeDays === 0 && row.overtimeDays === 0 ? (
                      <span className="text-[10px] text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col items-center gap-0.5">
                        {row.undertimeDays > 0 && (
                          <span className="text-[10px] text-amber-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="size-2.5" /> {row.undertimeDays} undertime
                          </span>
                        )}
                        {row.overtimeDays > 0 && (
                          <span className="text-[10px] text-violet-500 font-medium">{row.overtimeDays} overtime</span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="pr-6 text-right py-4">
                    <Button size="sm" variant="ghost" className="rounded-lg text-xs gap-1" onClick={() => setSelectedEmp(row)}>
                      View <ChevronRight className="size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Charts Section ── */}
      {reportData.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-base font-semibold">Visual Analytics — {selectedMonthLabel}</h2>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Pie: Attendance breakdown per employee */}
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold mb-1">Attendance Breakdown</h3>
              <p className="text-xs text-muted-foreground mb-4">Present vs absent days per employee (out of {workingDaysElapsed} elapsed days)</p>
              <div className="flex flex-wrap gap-6 items-center justify-center">
                {reportData.map((emp, i) => {
                  const present = emp.daysPresent;
                  const absent = Math.max(0, workingDaysElapsed - present);
                  const total = present + absent;
                  const data = [
                    { name: "Present", value: present },
                    { name: "Absent", value: absent },
                  ];
                  return (
                    <div key={emp.id} className="flex flex-col items-center gap-1">
                      <ResponsiveContainer width={100} height={100}>
                        <PieChart>
                          <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                            <Cell fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            <Cell fill={ABSENT_COLOR} />
                          </Pie>
                          <RTooltip formatter={(v: any, n: any) => [`${v} days`, n]} contentStyle={{ borderRadius: 8, fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <p className="text-xs font-semibold text-center leading-tight">{emp.name}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{present}/{total} days</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-500 inline-block" /> Present</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-300 inline-block" /> Absent</span>
              </div>
            </div>

            {/* Bar: Hours worked per employee vs expected */}
            <div className="rounded-2xl border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold mb-1">Hours Worked This Month</h3>
              <p className="text-xs text-muted-foreground mb-4">Actual hours logged vs expected ({workingDaysElapsed * 9}h)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hoursBarData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} unit="h" />
                  <RTooltip formatter={(v: any, n: any) => [`${v}h`, n === "hours" ? "Logged" : "Expected"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="expected" name="Expected" fill="var(--muted)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hours" name="Logged" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {hoursBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.hours >= entry.expected ? "#10b981" : entry.hours >= entry.expected * 0.8 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line: Daily avg clock-in time */}
          <div className="rounded-2xl border bg-card p-6 shadow-soft">
            <h3 className="text-sm font-semibold mb-1">Daily Avg Clock-In Time</h3>
            <p className="text-xs text-muted-foreground mb-4">Average team clock-in time per working day · dashed line = 09:30 cutoff</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={clockInLineData.filter(d => d.avgMinutes !== null)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={10} tickLine={false} axisLine={false}
                  domain={[480, 660]}
                  tickFormatter={(v) => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`}
                />
                <RTooltip
                  formatter={(v: any) => [`${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`, "Avg Clock-In"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                {/* 09:30 reference line at 570 minutes */}
                <Line type="monotone" dataKey={() => 570} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="09:30 cutoff" />
                <Line type="monotone" dataKey="avgMinutes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} name="Avg Clock-In" />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Employee Drill-Down Dialog */}
      <Dialog open={!!selectedEmp} onOpenChange={(open) => !open && setSelectedEmp(null)}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedEmp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedEmp.avatarUrl ? (
                    <img src={selectedEmp.avatarUrl} alt={selectedEmp.name} className="size-10 rounded-xl object-cover" />
                  ) : (
                    <div className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shrink-0", selectedEmp.avatarColor)}>
                      {selectedEmp.initials}
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{selectedEmp.name}</p>
                    <p className="text-xs font-normal text-muted-foreground">{selectedEmp.role} · {selectedEmp.department} · {selectedMonthLabel}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {[
                  { label: "Attendance", value: `${selectedEmp.attendanceRate}%`, sub: `${selectedEmp.daysPresent}/${selectedEmp.workingDays} days`, color: selectedEmp.attendanceRate >= 80 ? "text-emerald-600" : "text-amber-500" },
                  { label: "Total Hours", value: `${selectedEmp.totalHours.toFixed(1)}h`, sub: `${selectedEmp.avgHoursPerDay}h avg/day`, color: "text-blue-600" },
                  { label: "Best Streak", value: `${selectedEmp.longestStreak}d`, sub: "consecutive days", color: "text-primary" },
                  { label: "Late Arrivals", value: selectedEmp.lateDays, sub: `${selectedEmp.onTimeDays} on time`, color: selectedEmp.lateDays > 3 ? "text-red-500" : "text-amber-500" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border bg-muted/30 p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {(selectedEmp.undertimeDays > 0 || selectedEmp.overtimeDays > 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 flex flex-wrap gap-3 text-xs">
                  {selectedEmp.undertimeDays > 0 && <span className="text-amber-700 dark:text-amber-400 font-medium">⚠ {selectedEmp.undertimeDays} day(s) worked under 8h</span>}
                  {selectedEmp.overtimeDays > 0 && <span className="text-violet-600 font-medium">🕐 {selectedEmp.overtimeDays} overtime day(s) (over 10h)</span>}
                </div>
              )}

              <div className="mt-2">
                <h4 className="text-sm font-semibold mb-3">Daily Logs</h4>
                {selectedEmp.dailyLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No attendance records for this month.</p>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Clock In</TableHead>
                          <TableHead className="text-xs">Clock Out</TableHead>
                          <TableHead className="text-xs text-right">Hours</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEmp.dailyLogs.map((log, i) => (
                          <TableRow key={i} className="hover:bg-muted/30">
                            <TableCell className="text-xs tabular-nums font-medium">{log.date}</TableCell>
                            <TableCell className={cn("text-xs tabular-nums", (() => {
                                if (log.clockIn === "—") return "";
                                const cleaned = log.clockIn.replace(/\s*(AM|PM)/i, "");
                                const [h, m] = cleaned.split(":").map(Number);
                                return (h * 60 + m) > 9 * 60 + 30 ? "text-amber-500 font-semibold" : "";
                              })())}>
                              {log.clockIn}
                            </TableCell>
                            <TableCell className="text-xs tabular-nums">{log.clockOut}</TableCell>
                            <TableCell className={cn("text-xs tabular-nums text-right font-semibold", log.hours > 10 ? "text-violet-500" : log.hours < 8 && log.hours > 0 ? "text-amber-500" : "")}>
                              {log.hours > 0 ? `${log.hours.toFixed(2)}h` : "—"}
                            </TableCell>
                            <TableCell>
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                log.status === "Clocked In" ? "bg-primary/10 text-primary border-primary/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              )}>
                                {log.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
