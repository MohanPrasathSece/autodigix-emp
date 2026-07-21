import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, FileText, Settings, Users, ArrowRight, DollarSign } from "lucide-react";
import { useAuthStore } from "@/shared/store/auth";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!user) return null;

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const isAdmin = user.role === "admin";
  const prefix = isAdmin ? "/admin" : "/employee";

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] bg-background/50 backdrop-blur-sm p-4 animate-in fade-in-0"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl bg-card">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input 
            placeholder="Type a command or search..." 
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" 
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
          
          <Command.Group heading="Suggestions" className="overflow-hidden text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
            <Command.Item 
              onSelect={() => runCommand(() => navigate(`${prefix}/dashboard`))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
            >
              <ArrowRight className="mr-2 h-4 w-4" /> Dashboard
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => navigate(`${prefix}/calendar`))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
            >
              <Calendar className="mr-2 h-4 w-4" /> Calendar
            </Command.Item>
            
            {isAdmin ? (
              <>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate(`/admin/employees`))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
                >
                  <Users className="mr-2 h-4 w-4" /> Employee Directory
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate(`/admin/leaves`))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
                >
                  <FileText className="mr-2 h-4 w-4" /> Leave Approvals
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate(`/admin/payroll`))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
                >
                  <DollarSign className="mr-2 h-4 w-4" /> Run Payroll
                </Command.Item>
              </>
            ) : (
              <>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate(`/employee/apply-leave`))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
                >
                  <FileText className="mr-2 h-4 w-4" /> Apply for Leave
                </Command.Item>
                <Command.Item 
                  onSelect={() => runCommand(() => navigate(`/employee/payslips`))}
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
                >
                  <DollarSign className="mr-2 h-4 w-4" /> My Payslips
                </Command.Item>
              </>
            )}
            
            <Command.Item 
              onSelect={() => runCommand(() => navigate(`${prefix}/profile`))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground transition-colors hover:bg-accent"
            >
              <Settings className="mr-2 h-4 w-4" /> My Profile
            </Command.Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
