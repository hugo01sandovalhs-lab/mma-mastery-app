"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_TYPE_LABEL_KEYS,
  toDateKey,
  type CalendarEvent,
  type CalendarEventType,
} from "@/lib/domain/calendar";
import { useI18n } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

const TYPE_DOT: Record<CalendarEventType, string> = {
  class: "bg-chart-1",
  club_event: "bg-chart-4",
  training: "bg-chart-2",
  competition: "bg-chart-3",
};

/** 2024-01-01 through 2024-01-07 is a Monday-first week, used only to derive localized short weekday names. */
const REFERENCE_MONDAY_WEEK = [1, 2, 3, 4, 5, 6, 7].map((day) => new Date(2024, 0, day));

export function CalendarView({
  events,
  gridDays,
  currentMonth,
  locale,
}: {
  events: CalendarEvent[];
  gridDays: string[];
  currentMonth: number;
  locale: Locale;
}) {
  const { t } = useI18n();
  const weekdayHeaders = REFERENCE_MONDAY_WEEK.map((d) => d.toLocaleDateString(locale, { weekday: "short" }));
  const todayKey = toDateKey(new Date());
  const [activeTypes, setActiveTypes] = useState<Set<CalendarEventType>>(
    new Set(CALENDAR_EVENT_TYPES),
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    gridDays.includes(todayKey) ? todayKey : gridDays[0],
  );

  const visibleEvents = useMemo(
    () => events.filter((e) => activeTypes.has(e.type)),
    [events, activeTypes],
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of visibleEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [visibleEvents]);

  const selectedEvents = eventsByDay.get(selectedDate) ?? [];

  function toggleType(type: CalendarEventType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {CALENDAR_EVENT_TYPES.map((type) => {
          const active = activeTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-border bg-muted text-foreground"
                  : "border-border/60 text-muted-foreground opacity-60",
              )}
            >
              <span className={cn("size-2 rounded-full", TYPE_DOT[type])} />
              {t(CALENDAR_EVENT_TYPE_LABEL_KEYS[type])}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground sm:gap-1.5">
        {weekdayHeaders.map((d, i) => (
          <div key={i} className="py-1 font-medium">
            {d}
          </div>
        ))}
        {gridDays.map((day) => {
          const dayEvents = eventsByDay.get(day) ?? [];
          const dayNumber = Number(day.slice(8, 10));
          const inMonth = Number(day.slice(5, 7)) - 1 === currentMonth;
          const isToday = day === todayKey;
          const isSelected = day === selectedDate;
          const dotTypes = [...new Set(dayEvents.map((e) => e.type))];

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDate(day)}
              aria-current={isSelected ? "date" : undefined}
              className={cn(
                "flex aspect-square flex-col items-center justify-start gap-1 rounded-lg border px-1 py-1.5 text-xs transition-colors sm:aspect-auto sm:min-h-16",
                inMonth ? "border-border" : "border-transparent text-muted-foreground/50",
                isSelected && "border-primary bg-primary/10",
                !isSelected && isToday && "border-primary/60",
              )}
            >
              <span className={cn("font-medium", isToday && "text-primary")}>{dayNumber}</span>
              {dotTypes.length > 0 ? (
                <span className="flex flex-wrap items-center justify-center gap-0.5">
                  {dotTypes.slice(0, 3).map((t) => (
                    <span key={t} className={cn("size-1.5 rounded-full", TYPE_DOT[t])} />
                  ))}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("calendar.noEvents", "Aucun événement ce jour-là.")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedEvents.map((e) => (
              <li key={e.id}>
                <Link href={e.href} className="group/item block">
                  <Card className="transition-colors group-hover/item:bg-muted/50">
                    <CardContent className="flex items-center gap-3">
                      <span className={cn("size-2 shrink-0 rounded-full", TYPE_DOT[e.type])} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium group-hover/item:underline">{e.title}</span>
                        {e.subtitle ? (
                          <span className="truncate text-xs text-muted-foreground">{e.subtitle}</span>
                        ) : null}
                      </div>
                      {e.time ? <span className="shrink-0 text-xs text-muted-foreground">{e.time}</span> : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
