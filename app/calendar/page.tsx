import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { CalendarView } from "@/components/calendar-view";
import { createClient } from "@/lib/infra/db/supabase-server";
import { getCalendarEvents } from "@/lib/usecases/calendar-actions";
import { monthParam, parseCalendarMonth } from "@/lib/domain/calendar";

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { month: monthQuery } = await searchParams;
  const current = parseCalendarMonth(monthQuery);
  const prev = shiftMonth(current.year, current.month, -1);
  const next = shiftMonth(current.year, current.month, 1);

  const { events, gridDays } = await getCalendarEvents(current);

  const monthLabel = new Date(current.year, current.month, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight capitalize sm:text-3xl">
              {monthLabel}
            </h1>
            <p className="text-sm text-muted-foreground">
              Cours, événements club, entraînements et compétitions
            </p>
          </div>
          <div className="flex w-fit gap-2">
            <Button variant="outline" size="icon" render={<Link href={`/calendar?month=${monthParam(prev)}`} />}>
              <ChevronLeft />
            </Button>
            <Button variant="outline" render={<Link href="/calendar" />}>
              Aujourd&apos;hui
            </Button>
            <Button variant="outline" size="icon" render={<Link href={`/calendar?month=${monthParam(next)}`} />}>
              <ChevronRight />
            </Button>
          </div>
        </div>

        <CalendarView events={events} gridDays={gridDays} currentMonth={current.month} />
      </div>
    </AppShell>
  );
}
