import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  PlaneTakeoff,
  UserCircle,
  Settings,
  Sparkles,
  Bell,
  Clock,
  History,
  FileText,
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
  { title: "Dashboard", url: "/employee/dashboard", icon: LayoutDashboard },
  { title: "Apply Leave", url: "/employee/apply-leave", icon: PlaneTakeoff },
  { title: "My Payslips", url: "/employee/payslips", icon: FileText },
];

const history = [
  { title: "Leave History", url: "/employee/leave-history", icon: History },
  { title: "Calendar", url: "/employee/calendar", icon: CalendarDays },
];

const account = [
  { title: "Profile", url: "/employee/profile", icon: UserCircle },
];

export function EmployeeSidebar() {
  const { pathname } = useLocation();
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
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold">Employee Portal</div>
            <div className="truncate text-xs text-muted-foreground">Autodigix</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(primary)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(history)}</SidebarMenu>
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
