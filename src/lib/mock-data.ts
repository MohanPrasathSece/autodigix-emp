export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "On Leave" | "Remote";
  attendance: number;
  avatarColor: string;
  initials: string;
};

export const employees: Employee[] = [
  { id: "EMP-001", name: "Aarav Sharma", email: "aarav@pulse.co", role: "Product Designer", department: "Design", status: "Active", attendance: 96, avatarColor: "from-blue-500 to-indigo-500", initials: "AS" },
  { id: "EMP-002", name: "Sofia Martinez", email: "sofia@pulse.co", role: "Frontend Engineer", department: "Engineering", status: "Remote", attendance: 92, avatarColor: "from-emerald-500 to-teal-500", initials: "SM" },
  { id: "EMP-003", name: "Liam O'Brien", email: "liam@pulse.co", role: "People Ops Lead", department: "HR", status: "Active", attendance: 99, avatarColor: "from-amber-500 to-orange-500", initials: "LO" },
  { id: "EMP-004", name: "Yuki Tanaka", email: "yuki@pulse.co", role: "Data Analyst", department: "Analytics", status: "On Leave", attendance: 88, avatarColor: "from-fuchsia-500 to-pink-500", initials: "YT" },
  { id: "EMP-005", name: "Noah Bennett", email: "noah@pulse.co", role: "Backend Engineer", department: "Engineering", status: "Active", attendance: 94, avatarColor: "from-sky-500 to-cyan-500", initials: "NB" },
  { id: "EMP-006", name: "Ava Chen", email: "ava@pulse.co", role: "Marketing Manager", department: "Marketing", status: "Active", attendance: 91, avatarColor: "from-rose-500 to-red-500", initials: "AC" },
  { id: "EMP-007", name: "Mateo Rossi", email: "mateo@pulse.co", role: "Finance Associate", department: "Finance", status: "Remote", attendance: 90, avatarColor: "from-violet-500 to-purple-500", initials: "MR" },
  { id: "EMP-008", name: "Priya Patel", email: "priya@pulse.co", role: "QA Engineer", department: "Engineering", status: "Active", attendance: 97, avatarColor: "from-lime-500 to-green-500", initials: "PP" },
];

export const holidays = [
  { date: "Jul 20", name: "Summer Company Day" },
  { date: "Aug 15", name: "Independence Day" },
  { date: "Sep 02", name: "Labor Day" },
  { date: "Oct 14", name: "Fall Retreat" },
];

export const notifications = [
  { id: 1, title: "Leave approved", body: "Your PTO for Jul 22–24 is approved.", time: "2h ago", tone: "success" as const },
  { id: 2, title: "Payslip ready", body: "June payslip is available to download.", time: "1d ago", tone: "info" as const },
  { id: 3, title: "Team all-hands", body: "Friday 10:00 AM — Product roadmap.", time: "2d ago", tone: "info" as const },
];

export const leaveRequests = [
  { id: "LR-101", name: "Yuki Tanaka", type: "Sick Leave", from: "Jul 16", to: "Jul 18", days: 3, status: "Pending" as const },
  { id: "LR-102", name: "Noah Bennett", type: "Vacation", from: "Jul 22", to: "Jul 26", days: 5, status: "Pending" as const },
  { id: "LR-103", name: "Ava Chen", type: "Personal", from: "Jul 19", to: "Jul 19", days: 1, status: "Approved" as const },
  { id: "LR-104", name: "Mateo Rossi", type: "Vacation", from: "Aug 04", to: "Aug 08", days: 5, status: "Pending" as const },
  { id: "LR-105", name: "Priya Patel", type: "Sick Leave", from: "Jul 11", to: "Jul 12", days: 2, status: "Rejected" as const },
];

export const attendanceTrend = [
  { day: "Mon", present: 118, absent: 6 },
  { day: "Tue", present: 121, absent: 3 },
  { day: "Wed", present: 116, absent: 8 },
  { day: "Thu", present: 122, absent: 2 },
  { day: "Fri", present: 114, absent: 10 },
  { day: "Sat", present: 40, absent: 84 },
  { day: "Sun", present: 12, absent: 112 },
];

export const payrollTrend = [
  { month: "Jan", payroll: 412 },
  { month: "Feb", payroll: 418 },
  { month: "Mar", payroll: 425 },
  { month: "Apr", payroll: 432 },
  { month: "May", payroll: 441 },
  { month: "Jun", payroll: 456 },
  { month: "Jul", payroll: 468 },
];

export const departmentSplit = [
  { name: "Engineering", value: 48 },
  { name: "Design", value: 14 },
  { name: "Marketing", value: 12 },
  { name: "HR", value: 8 },
  { name: "Finance", value: 10 },
  { name: "Analytics", value: 12 },
];

export const payslips = [
  { period: "July 2026", gross: 6800, net: 5240, status: "Processing" },
  { period: "June 2026", gross: 6800, net: 5240, status: "Paid" },
  { period: "May 2026", gross: 6800, net: 5240, status: "Paid" },
  { period: "April 2026", gross: 6600, net: 5090, status: "Paid" },
  { period: "March 2026", gross: 6600, net: 5090, status: "Paid" },
];
