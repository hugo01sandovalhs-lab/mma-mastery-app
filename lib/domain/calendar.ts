/**
 * Calendar (P4.1): read-only aggregation view over existing scheduling data.
 * Never a new source of truth -- each `CalendarEvent` just re-shapes a row
 * already owned by classes/attendance, club events, personal training or
 * competition tracking, and links back to that feature's real page.
 */

export const CALENDAR_EVENT_TYPES = ["class", "club_event", "training", "competition"] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

/** i18n dictionary key for each event type — look up via `dict[CALENDAR_EVENT_TYPE_LABEL_KEYS[type]]`. */
export const CALENDAR_EVENT_TYPE_LABEL_KEYS: Record<
  CalendarEventType,
  "calendarEventType.class" | "calendarEventType.club_event" | "calendarEventType.training" | "calendarEventType.competition"
> = {
  class: "calendarEventType.class",
  club_event: "calendarEventType.club_event",
  training: "calendarEventType.training",
  competition: "calendarEventType.competition",
};

export type CalendarEvent = {
  id: string;
  type: CalendarEventType;
  title: string;
  /** Calendar day this event is bucketed under, `yyyy-mm-dd`. */
  date: string;
  /** `HH:mm` local time, or null for date-only (all-day) entries. */
  time: string | null;
  href: string;
  subtitle: string | null;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeString(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type CalendarMonth = { year: number; month: number };

export function parseCalendarMonth(param: string | undefined): CalendarMonth {
  if (param) {
    const match = /^(\d{4})-(\d{2})$/.exec(param);
    if (match) return { year: Number(match[1]), month: Number(match[2]) - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function monthParam({ year, month }: CalendarMonth): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Inclusive first/last instant of the month grid (including lead/trail days), local time. */
export function monthGridRange(year: number, month: number): { start: Date; end: Date; days: Date[] } {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - firstWeekday);

  const lastOfMonth = new Date(year, month + 1, 0);
  const lastWeekday = (lastOfMonth.getDay() + 6) % 7;
  const end = new Date(year, month + 1, (6 - lastWeekday));

  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return { start, end, days };
}
