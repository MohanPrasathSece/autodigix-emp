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
  avatarUrl?: string;
  absentDates?: { date: string; subject: string }[];
};

export const employees: Employee[] = [
  { id: "EMP-001", name: "Aarav Sharma", email: "aarav@autodigix.com", role: "Frontend Engineer", department: "Engineering", status: "Active", attendance: 96, avatarColor: "from-blue-500 to-indigo-500", initials: "AS", avatarUrl: "https://i.pravatar.cc/150?u=EMP-001", absentDates: [{ date: "2026-06-12", subject: "Sick Leave" }, { date: "2026-05-04", subject: "Family Emergency" }] },
  { id: "EMP-002", name: "Sofia Martinez", email: "sofia@autodigix.com", role: "Backend Engineer", department: "Engineering", status: "Remote", attendance: 92, avatarColor: "from-emerald-500 to-teal-500", initials: "SM", absentDates: [{ date: "2026-07-02", subject: "Doctor Appointment" }] },
  { id: "EMP-003", name: "Liam O'Brien", email: "liam@autodigix.com", role: "Product Manager", department: "Product", status: "Active", attendance: 99, avatarColor: "from-amber-500 to-orange-500", initials: "LO", avatarUrl: "https://i.pravatar.cc/150?u=EMP-003", absentDates: [] },
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
  { id: 3, title: "Team all-hands", body: "Friday 10:00 AM - Product roadmap.", time: "2d ago", tone: "info" as const },
];

export const leaveRequests = [
  { id: "LR-101", name: "Yuki Tanaka", type: "Sick Leave", from: "Jul 16", to: "Jul 18", days: 3, status: "Pending" as const, subject: "Feeling unwell", description: "I have caught a severe flu and the doctor has advised me to rest for a few days." },
  { id: "LR-102", name: "Noah Bennett", type: "Vacation", from: "Jul 22", to: "Jul 26", days: 5, status: "Pending" as const, subject: "Annual Family Vacation", description: "Taking my annual leave to go on a trip with my family. I will have limited access to email." },
  { id: "LR-103", name: "Ava Chen", type: "Personal", from: "Jul 19", to: "Jul 19", days: 1, status: "Approved" as const, subject: "Personal Errands", description: "Need to take a day off to handle some urgent banking and personal administrative tasks." },
  { id: "LR-104", name: "Mateo Rossi", type: "Vacation", from: "Aug 04", to: "Aug 08", days: 5, status: "Pending" as const, subject: "Summer Break", description: "Planned summer break. All my current tasks will be handed over to Sofia before I leave." },
  { id: "LR-105", name: "Priya Patel", type: "Sick Leave", from: "Jul 11", to: "Jul 12", days: 2, status: "Rejected" as const, subject: "Dental Surgery", description: "Having a minor dental surgery and need time to recover." },
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
