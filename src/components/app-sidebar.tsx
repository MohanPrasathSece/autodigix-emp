import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  PlaneTakeoff,
  CheckSquare,
  Wallet,
  BarChart3,
  UserCircle,
  Settings,
  ShieldCheck,
  Sparkles,
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Admin Overview", url: "/admin", icon: ShieldCheck },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
];

const workflows = [
  { title: "Leave", url: "/leave", icon: PlaneTakeoff },
  { title: "Approvals", url: "/approvals", icon: CheckSquare },
  { title: "Payroll", url: "/payroll", icon: Wallet },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

const account = [
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (u: string) => (u === "/" ? pathname === "/" : pathname.startsWith(u));

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
            <div className="truncate text-sm font-semibold">Pulse HR</div>
            <div className="truncate text-xs text-muted-foreground">Acme Inc.</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(primary)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Workflows</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(workflows)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(account)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white">
            AS
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium">Aarav Sharma</div>
            <div className="truncate text-xs text-muted-foreground">Product Designer</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
