"use server";

import { createClient } from "@/lib/infra/db/supabase-server";
import {
  monthGridRange,
  toDateKey,
  toTimeString,
  type CalendarEvent,
  type CalendarMonth,
} from "@/lib/domain/calendar";
import { EVENT_TYPE_LABEL_KEYS, type EventType } from "@/lib/domain/club-event";
import { SESSION_TYPE_LABEL_KEYS, type SessionType } from "@/lib/domain/training";
import { MATCH_RESULT_LABEL_KEYS, type MatchResult } from "@/lib/domain/competition";
import { getServerLocale } from "@/lib/i18n-server";
import { DICTIONARIES } from "@/lib/i18n";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function getCalendarEvents(
  monthArg: CalendarMonth,
): Promise<{ events: CalendarEvent[]; gridDays: string[] }> {
  const { supabase, userId } = await requireUserId();
  const dict = DICTIONARIES[await getServerLocale()];
  const { start, end, days } = monthGridRange(monthArg.year, monthArg.month);
  const gridDays = days.map((d) => toDateKey(d));
  const startIso = start.toISOString();
  const endIso = new Date(end.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const startDateKey = toDateKey(start);
  const endDateKey = toDateKey(end);

  const events: CalendarEvent[] = [];

  // === Club-scoped: classes (class_sessions) + club_events ===
  const { data: memberships, error: membershipsError } = await supabase
    .from("club_members")
    .select("club:clubs(id, name)")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membershipsError) throw new Error(membershipsError.message);

  const clubs = (memberships ?? [])
    .map((m) => m.club as unknown as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => !!c);
  const clubIds = clubs.map((c) => c.id);
  const clubNameById = new Map(clubs.map((c) => [c.id, c.name]));

  if (clubIds.length > 0) {
    const { data: classes, error: classesError } = await supabase
      .from("classes")
      .select("id, name, club_id")
      .in("club_id", clubIds);
    if (classesError) throw new Error(classesError.message);
    const classById = new Map((classes ?? []).map((c) => [c.id as string, c]));
    const classIds = (classes ?? []).map((c) => c.id as string);

    if (classIds.length > 0) {
      const { data: sessions, error: sessionsError } = await supabase
        .from("class_sessions")
        .select("id, class_id, starts_at")
        .in("class_id", classIds)
        .gte("starts_at", startIso)
        .lt("starts_at", endIso);
      if (sessionsError) throw new Error(sessionsError.message);

      for (const s of sessions ?? []) {
        const cls = classById.get(s.class_id as string);
        if (!cls) continue;
        const startsAt = new Date(s.starts_at as string);
        events.push({
          id: `class_session:${s.id}`,
          type: "class",
          title: cls.name as string,
          date: toDateKey(startsAt),
          time: toTimeString(startsAt),
          href: `/club/${cls.club_id}/classes/${cls.id}`,
          subtitle: clubNameById.get(cls.club_id as string) ?? null,
        });
      }
    }

    const { data: clubEvents, error: clubEventsError } = await supabase
      .from("club_events")
      .select("id, club_id, name, event_type, starts_at")
      .in("club_id", clubIds)
      .gte("starts_at", startIso)
      .lt("starts_at", endIso);
    if (clubEventsError) throw new Error(clubEventsError.message);

    for (const e of clubEvents ?? []) {
      const startsAt = new Date(e.starts_at as string);
      events.push({
        id: `club_event:${e.id}`,
        type: "club_event",
        title: e.name as string,
        date: toDateKey(startsAt),
        time: toTimeString(startsAt),
        href: `/club/${e.club_id}/events/${e.id}`,
        subtitle: dict[EVENT_TYPE_LABEL_KEYS[e.event_type as EventType]],
      });
    }
  }

  // === Personal: training_sessions + matches (date-only, own data) ===
  const { data: trainingSessions, error: trainingError } = await supabase
    .from("training_sessions")
    .select("id, date, title, session_type, discipline:disciplines(name)")
    .eq("user_id", userId)
    .gte("date", startDateKey)
    .lte("date", endDateKey);
  if (trainingError) throw new Error(trainingError.message);

  for (const t of trainingSessions ?? []) {
    const sessionType = t.session_type as SessionType;
    events.push({
      id: `training:${t.id}`,
      type: "training",
      title: (t.title as string | null) || dict[SESSION_TYPE_LABEL_KEYS[sessionType]],
      date: t.date as string,
      time: null,
      href: `/training/${t.id}`,
      subtitle: (t.discipline as unknown as { name: string } | null)?.name ?? null,
    });
  }

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, date, event_name, result, discipline:disciplines(name)")
    .eq("user_id", userId)
    .gte("date", startDateKey)
    .lte("date", endDateKey);
  if (matchesError) throw new Error(matchesError.message);

  for (const m of matches ?? []) {
    const result = m.result as MatchResult | null;
    events.push({
      id: `match:${m.id}`,
      type: "competition",
      title: (m.event_name as string | null) || dict["calendarEventType.competition"],
      date: m.date as string,
      time: null,
      href: `/competition/${m.id}`,
      subtitle: result ? dict[MATCH_RESULT_LABEL_KEYS[result]] : ((m.discipline as unknown as { name: string } | null)?.name ?? null),
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? ""));

  return { events, gridDays };
}
