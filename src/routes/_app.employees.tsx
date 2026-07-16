import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter, Plus, MoreHorizontal, Mail } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { employees } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/employees")({
  head: () => ({ meta: [{ title: "Employees — Pulse HR" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [q, setQ] = useState("");
  const rows = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(q.toLowerCase()) ||
      e.department.toLowerCase().includes(q.toLowerCase()) ||
      e.role.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Directory of everyone at Acme Inc."
        actions={
          <>
            <Button variant="outline" className="rounded-xl">
              <Filter className="mr-1.5 size-4" /> Filter
            </Button>
            <Button className="rounded-xl">
              <Plus className="mr-1.5 size-4" /> Invite
            </Button>
          </>
        }
      />

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, role, department…"
              className="h-10 rounded-xl bg-muted/40 pl-9"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{rows.length} of {employees.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b hover:bg-transparent">
                <TableHead className="pl-5 text-xs uppercase tracking-wide">Employee</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Department</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wide">Attendance</TableHead>
                <TableHead className="pr-5 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id} className="group transition-colors hover:bg-muted/40">
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-3">
                      <div className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-white", e.avatarColor)}>
                        {e.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{e.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{e.role} · {e.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{e.department}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full text-[11px] font-medium",
                        e.status === "Active" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        e.status === "Remote" && "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        e.status === "On Leave" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${e.attendance}%` }} />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{e.attendance}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <div className="inline-flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="size-8 rounded-lg"><Mail className="size-4" /></Button>
                      <Button size="icon" variant="ghost" className="size-8 rounded-lg"><MoreHorizontal className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                    No employees match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
