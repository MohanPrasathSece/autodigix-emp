import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notifications, employees } from "@/shared/lib/mock-data";

export function AppTopbar() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <SidebarTrigger className="shrink-0" />
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-xl"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="relative rounded-xl">
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl p-2">
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notifications
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 rounded-lg px-3 py-2.5">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-[11px] text-muted-foreground">{n.time}</span>
                </div>
                <span className="text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="outline" className="w-full text-xs h-8 rounded-lg" asChild>
                <a href="/admin/notifications">View all notifications</a>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-semibold text-white shadow-soft hover:opacity-90 transition-opacity overflow-hidden">
              {employees[0]?.avatarUrl ? (
                <img src={employees[0].avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                "AS"
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 mt-1">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Aarav Sharma</p>
                <p className="text-xs leading-none text-muted-foreground">aarav@autodigix.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950 cursor-pointer rounded-lg" 
              onClick={() => window.location.href = '/'}
            >
              <LogOut className="mr-2 size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
