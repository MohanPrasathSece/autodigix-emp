import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  PlaneTakeoff,
  Wallet,
  BarChart3,
  UserCircle,
  Settings,
  ShieldCheck,
  Bell,
  Sun,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const primary = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Employee Management", url: "/admin/employees", icon: Users },
  { title: "Attendance Management", url: "/admin/attendance", icon: CalendarCheck },
  { title: "Leave Approvals", url: "/admin/leaves", icon: PlaneTakeoff },
];

const secondary = [
  { title: "Calendar", url: "/admin/calendar", icon: CalendarDays },
  { title: "Reports", url: "/admin/reports", icon: BarChart3 },
];

const account = [
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Profile", url: "/admin/profile", icon: UserCircle },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (u: string) => pathname.startsWith(u);

  const renderItems = (items: typeof primary) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
          <Link to={item.url}>
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-400 text-primary-foreground shadow-soft">
            <ShieldCheck className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold">Admin Portal</div>
            <div className="truncate text-xs text-muted-foreground">Autodigix</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(primary)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(secondary)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(account)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
