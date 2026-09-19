"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { tServer } from "@/lib/i18n-server";
import {
  classInputSchema,
  classSessionInputSchema,
  type AttendanceStatus,
} from "@/lib/domain/class";

export type ClassActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

// === Classes ===

export type ClassListItem = {
  id: string;
  name: string;
  group_id: string | null;
  group_name: string | null;
  day_of_week: number | null;
  start_time: string | null;
  duration_minutes: number | null;
  capacity: number | null;
};

export async function getClasses(clubId: string): Promise<ClassListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, group_id, day_of_week, start_time, duration_minutes, capacity, group:groups(name)")
    .eq("club_id", clubId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    group_id: row.group_id as string | null,
    group_name: (row.group as unknown as { name: string } | null)?.name ?? null,
    day_of_week: row.day_of_week as number | null,
    start_time: row.start_time as string | null,
    duration_minutes: row.duration_minutes as number | null,
    capacity: row.capacity as number | null,
  }));
}

export async function createClass(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = classInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    group_id: String(formData.get("group_id") ?? ""),
    day_of_week: String(formData.get("day_of_week") ?? ""),
    start_time: String(formData.get("start_time") ?? ""),
    duration_minutes: String(formData.get("duration_minutes") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("classes").insert({ ...parsed.data, club_id: clubId });
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}/classes`);
  return { error: null };
}

export async function deleteClass(classId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/classes`);
}

// === Class detail: class + club role + sessions ===

export type ClassSessionItem = {
  id: string;
  starts_at: string;
  ends_at: string | null;
  checkin_code: string | null;
  checkin_code_expires_at: string | null;
  attendance: { user_id: string; display_name: string | null; status: AttendanceStatus }[];
};

export type ClassDetail = {
  id: string;
  club_id: string;
  name: string;
  group_id: string | null;
  group_name: string | null;
  day_of_week: number | null;
  start_time: string | null;
  duration_minutes: number | null;
  capacity: number | null;
  sessions: ClassSessionItem[];
};

async function attachDisplayNames<T extends { user_id: string }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: T[],
): Promise<(T & { display_name: string | null })[]> {
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  if (userIds.length === 0) return rows.map((r) => ({ ...r, display_name: null }));
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", userIds);
  if (error) throw new Error(error.message);
  const byUserId = new Map((data ?? []).map((p) => [p.user_id as string, p.display_name as string | null]));
  return rows.map((r) => ({ ...r, display_name: byUserId.get(r.user_id) ?? null }));
}

export async function getClassDetail(classId: string): Promise<ClassDetail | null> {
  const { supabase } = await requireUserId();

  const { data: cls, error: classError } = await supabase
    .from("classes")
    .select("id, club_id, name, group_id, day_of_week, start_time, duration_minutes, capacity, group:groups(name)")
    .eq("id", classId)
    .maybeSingle();
  if (classError) throw new Error(classError.message);
  if (!cls) return null;

  const { data: sessions, error: sessionsError } = await supabase
    .from("class_sessions")
    .select("id, starts_at, ends_at, checkin_code, checkin_code_expires_at, attendance(user_id, status)")
    .eq("class_id", classId)
    .order("starts_at", { ascending: false });
  if (sessionsError) throw new Error(sessionsError.message);

  const sessionItems: ClassSessionItem[] = [];
  for (const s of sessions ?? []) {
    const attendanceRows = (s.attendance as unknown as { user_id: string; status: AttendanceStatus }[]) ?? [];
    const withNames = await attachDisplayNames(supabase, attendanceRows);
    sessionItems.push({
      id: s.id as string,
      starts_at: s.starts_at as string,
      ends_at: s.ends_at as string | null,
      checkin_code: s.checkin_code as string | null,
      checkin_code_expires_at: s.checkin_code_expires_at as string | null,
      attendance: withNames,
    });
  }

  return {
    id: cls.id as string,
    club_id: cls.club_id as string,
    name: cls.name as string,
    group_id: cls.group_id as string | null,
    group_name: (cls.group as unknown as { name: string } | null)?.name ?? null,
    day_of_week: cls.day_of_week as number | null,
    start_time: cls.start_time as string | null,
    duration_minutes: cls.duration_minutes as number | null,
    capacity: cls.capacity as number | null,
    sessions: sessionItems,
  };
}

// === Sessions ===

export async function createClassSession(
  _prevState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const classId = String(formData.get("class_id") ?? "").trim();
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = classSessionInputSchema.safeParse({
    starts_at: String(formData.get("starts_at") ?? ""),
    ends_at: String(formData.get("ends_at") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("class_sessions").insert({
    class_id: classId,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: parsed.data.ends_at ? new Date(parsed.data.ends_at).toISOString() : null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}/classes/${classId}`);
  return { error: null };
}

export async function deleteClassSession(sessionId: string, clubId: string, classId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("class_sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/classes/${classId}`);
}

export async function rotateCheckinCode(
  sessionId: string,
  clubId: string,
  classId: string,
): Promise<{ code: string; expiresAt: string }> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase.rpc("rotate_checkin_code", { p_class_session_id: sessionId }).single();
  if (error) throw new Error(error.message);
  const row = data as { checkin_code: string; checkin_code_expires_at: string };
  revalidatePath(`/club/${clubId}/classes/${classId}`);
  return { code: row.checkin_code, expiresAt: row.checkin_code_expires_at };
}

export async function markAttendance(
  sessionId: string,
  userId: string,
  status: AttendanceStatus,
  clubId: string,
  classId: string,
): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("attendance")
    .upsert({ class_session_id: sessionId, user_id: userId, status }, { onConflict: "class_session_id,user_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/classes/${classId}`);
}

// === Public check-in (by code) ===

export type CheckinSessionInfo = { className: string; clubName: string; startsAt: string };

export async function getCheckinSessionInfo(code: string): Promise<CheckinSessionInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_checkin_session_info", { p_code: code }).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const row = data as { class_name: string; club_name: string; starts_at: string };
  return { className: row.class_name, clubName: row.club_name, startsAt: row.starts_at };
}

export type CheckinState = { status: "idle" | "success" | "error"; message: string | null };

export async function checkIn(_prevState: CheckinState, formData: FormData): Promise<CheckinState> {
  const code = String(formData.get("code") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: await tServer("error.loginRequired", "Connexion requise.") };

  const { error } = await supabase.rpc("checkin_to_class_session", { p_code: code });
  if (error) return { status: "error", message: error.message };
  return { status: "success", message: null };
}
