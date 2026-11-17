import { useState } from "react";
import { CalendarDays, Plus, Sun } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHolidays } from "@/shared/api/queries";
import { useAddHoliday } from "@/shared/api/mutations";
import { formatLeaveDate } from "@/shared/lib/dateUtils";
import { toast } from "sonner";

export function AdminHolidaysView() {
  const { data: holidays = [], isLoading } = useHolidays();
  const addHoliday = useAddHoliday();

  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = () => {
    const trimmedName = name.trim();

    if (!trimmedName || !date) {
      toast.error("Please provide both a holiday name and date.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      toast.error("Please enter a valid date.");
      return;
    }

    const duplicate = (holidays as any[]).some((h: any) => {
      const existingDate = String(h?.date ?? "").slice(0, 10);
      const sameDate = existingDate === date;
      const sameNameAndDate =
        String(h?.name ?? "").trim().toLowerCase() === trimmedName.toLowerCase() && sameDate;
      return sameDate || sameNameAndDate;
    });

    if (duplicate) {
      toast.error("This holiday already exists.");
      return;
    }

    addHoliday.mutate(
      { name: trimmedName, date },
      { onSuccess: () => { setName(""); setDate(""); } }
    );
  };

  const sorted = [...(holidays as any[])].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <PageHeader title="Holidays" description="Manage the company holiday calendar." />

      <div className="rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="text-base font-semibold mb-4">Add a holiday</h2>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Holiday name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Diwali"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            className="h-11 rounded-xl"
            onClick={handleAdd}
            disabled={addHoliday.isPending || !name.trim() || !date}
          >
            <Plus className="mr-1.5 size-4" /> Add
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Holiday calendar</h2>
          <span className="text-xs text-muted-foreground">{sorted.length} holidays</span>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Sun className="size-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No holidays added yet.</p>
            </div>
          ) : (
            sorted.map((h: any) => (
              <div key={h.id ?? `${h.name}-${h.date}`} className="flex items-center gap-4 p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{formatLeaveDate(h.date)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
