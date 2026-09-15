"use server";

import { createClient } from "@/lib/infra/db/supabase-server";
import { computeRate } from "@/lib/domain/club-admin";
import type { AttendanceStatus } from "@/lib/domain/class";

const UPCOMING_WINDOW_DAYS = 7;
const ATTENDANCE_WINDOW_DAYS = 30;

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export type UpcomingClassItem = {
  session_id: string;
  class_id: string;
  class_name: string;
  club_id: string;
  club_name: string;
  starts_at: string;
};

export type MemberClubSummary = {
  clubCount: number;
  groupNames: string[];
  upcomingClasses: UpcomingClassItem[];
  attendance: { marked: number; present: number; rate: number };
};

export async function getMemberClubSummary(): Promise<MemberClubSummary | null> {
  const { supabase, userId } = await requireUserId();

  const { data: memberships, error: membershipsError } = await supabase
    .from("club_members")
    .select("club:clubs(id, name)")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membershipsError) throw new Error(membershipsError.message);

  const clubs = (memberships ?? [])
    .map((m) => m.club as unknown as { id: string; name: string } | null)
    .filter((c): c is { id: string; name: string } => !!c);
  if (clubs.length === 0) return null;
  const clubNameById = new Map(clubs.map((c) => [c.id, c.name]));

  const { data: groupRows, error: groupsError } = await supabase
    .from("group_members")
    .select("group:groups(name)")
    .eq("user_id", userId);
  if (groupsError) throw new Error(groupsError.message);
  const groupNames = (groupRows ?? [])
    .map((g) => (g.group as unknown as { name: string } | null)?.name)
    .filter((n): n is string => !!n);

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, club_id")
    .in(
      "club_id",
      clubs.map((c) => c.id),
    );
  if (classesError) throw new Error(classesError.message);
  const classById = new Map((classes ?? []).map((c) => [c.id as string, c]));
  const classIds = (classes ?? []).map((c) => c.id as string);

  let upcomingClasses: UpcomingClassItem[] = [];
  let attendanceMarked = 0;
  let attendancePresent = 0;

  if (classIds.length > 0) {
    const now = new Date();
    const upcomingUntil = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const attendanceSince = new Date(now.getTime() - ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const { data: upcomingSessions, error: upcomingError } = await supabase
      .from("class_sessions")
      .select("id, class_id, starts_at")
      .in("class_id", classIds)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", upcomingUntil.toISOString())
      .order("starts_at", { ascending: true });
    if (upcomingError) throw new Error(upcomingError.message);

    upcomingClasses = (upcomingSessions ?? [])
      .map((s) => {
        const cls = classById.get(s.class_id as string);
        if (!cls) return null;
        return {
          session_id: s.id as string,
          class_id: cls.id as string,
          class_name: cls.name as string,
          club_id: cls.club_id as string,
          club_name: clubNameById.get(cls.club_id as string) ?? "Club",
          starts_at: s.starts_at as string,
        };
      })
      .filter((s): s is UpcomingClassItem => !!s);

    const { data: myAttendance, error: attendanceError } = await supabase
      .from("attendance")
      .select("status, session:class_sessions!inner(class_id, starts_at)")
      .eq("user_id", userId)
      .in("session.class_id", classIds)
      .gte("session.starts_at", attendanceSince.toISOString());
    if (attendanceError) throw new Error(attendanceError.message);

    for (const a of myAttendance ?? []) {
      attendanceMarked += 1;
      if ((a.status as AttendanceStatus) === "present") attendancePresent += 1;
    }
  }

  return {
    clubCount: clubs.length,
    groupNames,
    upcomingClasses,
    attendance: {
      marked: attendanceMarked,
      present: attendancePresent,
      rate: computeRate(attendancePresent, attendanceMarked),
    },
  };
}
