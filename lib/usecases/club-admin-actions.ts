"use server";

import { createClient } from "@/lib/infra/db/supabase-server";
import { CLUB_ROLES, hasClubRoleAtLeast, type ClubRole } from "@/lib/domain/club";
import { computeRate, isLowAttendanceSession } from "@/lib/domain/club-admin";
import type { AttendanceStatus } from "@/lib/domain/class";

const ATTENDANCE_WINDOW_DAYS = 30;
const UPCOMING_WINDOW_DAYS = 7;

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export type ClubAdminOverview = {
  clubId: string;
  clubName: string;
  myRole: ClubRole;
  totalMembers: number;
  memberCountsByRole: Record<ClubRole, number>;
  groupCount: number;
  classCount: number;
  upcomingSessionCount: number;
  attendance: { marked: number; present: number; rate: number };
  membersWithoutGroup: { user_id: string; display_name: string | null }[];
  lowAttendanceSessions: {
    session_id: string;
    class_id: string;
    class_name: string;
    starts_at: string;
    present: number;
    marked: number;
  }[];
};

export async function getClubAdminOverview(clubId: string): Promise<ClubAdminOverview | null> {
  const { supabase, userId } = await requireUserId();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("id", clubId)
    .maybeSingle();
  if (clubError) throw new Error(clubError.message);
  if (!club) return null;

  const { data: members, error: membersError } = await supabase
    .from("club_members")
    .select("user_id, role")
    .eq("club_id", clubId)
    .eq("status", "active");
  if (membersError) throw new Error(membersError.message);

  const myMembership = (members ?? []).find((m) => m.user_id === userId);
  if (!myMembership) return null;
  const myRole = myMembership.role as ClubRole;
  if (!hasClubRoleAtLeast(myRole, "COACH")) return null;

  const memberCountsByRole = Object.fromEntries(CLUB_ROLES.map((r) => [r, 0])) as Record<ClubRole, number>;
  for (const m of members ?? []) memberCountsByRole[m.role as ClubRole] += 1;

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, group_members(user_id)")
    .eq("club_id", clubId);
  if (groupsError) throw new Error(groupsError.message);

  const groupedUserIds = new Set<string>();
  for (const g of groups ?? []) {
    for (const gm of (g.group_members as unknown as { user_id: string }[]) ?? []) groupedUserIds.add(gm.user_id);
  }
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, display_name")
    .in("user_id", (members ?? []).map((m) => m.user_id));
  if (profilesError) throw new Error(profilesError.message);
  const nameByUserId = new Map((profiles ?? []).map((p) => [p.user_id as string, p.display_name as string | null]));

  const membersWithoutGroup = (members ?? [])
    .filter((m) => !groupedUserIds.has(m.user_id))
    .map((m) => ({ user_id: m.user_id as string, display_name: nameByUserId.get(m.user_id as string) ?? null }));

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .eq("club_id", clubId);
  if (classesError) throw new Error(classesError.message);
  const classNameById = new Map((classes ?? []).map((c) => [c.id as string, c.name as string]));
  const classIds = (classes ?? []).map((c) => c.id as string);

  let upcomingSessionCount = 0;
  let attendanceMarked = 0;
  let attendancePresent = 0;
  const lowAttendanceSessions: ClubAdminOverview["lowAttendanceSessions"] = [];

  if (classIds.length > 0) {
    const now = new Date();
    const upcomingUntil = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const attendanceSince = new Date(now.getTime() - ATTENDANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const { count: upcomingCount, error: upcomingError } = await supabase
      .from("class_sessions")
      .select("id", { count: "exact", head: true })
      .in("class_id", classIds)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", upcomingUntil.toISOString());
    if (upcomingError) throw new Error(upcomingError.message);
    upcomingSessionCount = upcomingCount ?? 0;

    const { data: recentSessions, error: recentError } = await supabase
      .from("class_sessions")
      .select("id, class_id, starts_at, attendance(status)")
      .in("class_id", classIds)
      .gte("starts_at", attendanceSince.toISOString())
      .lte("starts_at", now.toISOString());
    if (recentError) throw new Error(recentError.message);

    for (const s of recentSessions ?? []) {
      const statuses = (s.attendance as unknown as { status: AttendanceStatus }[]) ?? [];
      const marked = statuses.length;
      const present = statuses.filter((a) => a.status === "present").length;
      attendanceMarked += marked;
      attendancePresent += present;
      if (isLowAttendanceSession(present, marked)) {
        lowAttendanceSessions.push({
          session_id: s.id as string,
          class_id: s.class_id as string,
          class_name: classNameById.get(s.class_id as string) ?? "Cours",
          starts_at: s.starts_at as string,
          present,
          marked,
        });
      }
    }
    lowAttendanceSessions.sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  }

  return {
    clubId: club.id,
    clubName: club.name,
    myRole,
    totalMembers: members?.length ?? 0,
    memberCountsByRole,
    groupCount: groups?.length ?? 0,
    classCount: classIds.length,
    upcomingSessionCount,
    attendance: {
      marked: attendanceMarked,
      present: attendancePresent,
      rate: computeRate(attendancePresent, attendanceMarked),
    },
    membersWithoutGroup,
    lowAttendanceSessions,
  };
}

// === Member detail ===

export type MemberDetail = {
  clubId: string;
  userId: string;
  displayName: string | null;
  role: ClubRole;
  memberSince: string;
  groups: { id: string; name: string }[];
  attendance: { session_id: string; class_name: string; starts_at: string; status: AttendanceStatus }[];
  attendanceRate: number;
};

export async function getMemberDetail(clubId: string, memberUserId: string): Promise<MemberDetail | null> {
  const { supabase, userId } = await requireUserId();

  const { data: myMembership, error: myError } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (myError) throw new Error(myError.message);
  if (!myMembership || !hasClubRoleAtLeast(myMembership.role as ClubRole, "COACH")) return null;

  const { data: member, error: memberError } = await supabase
    .from("club_members")
    .select("user_id, role, created_at")
    .eq("club_id", clubId)
    .eq("user_id", memberUserId)
    .eq("status", "active")
    .maybeSingle();
  if (memberError) throw new Error(memberError.message);
  if (!member) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", memberUserId)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  const { data: groupRows, error: groupError } = await supabase
    .from("group_members")
    .select("group:groups!inner(id, name, club_id)")
    .eq("user_id", memberUserId)
    .eq("group.club_id", clubId);
  if (groupError) throw new Error(groupError.message);
  const groups = (groupRows ?? []).map((g) => {
    const grp = g.group as unknown as { id: string; name: string };
    return { id: grp.id, name: grp.name };
  });

  const { data: classes, error: classesError } = await supabase.from("classes").select("id, name").eq("club_id", clubId);
  if (classesError) throw new Error(classesError.message);
  const classNameById = new Map((classes ?? []).map((c) => [c.id as string, c.name as string]));
  const classIds = (classes ?? []).map((c) => c.id as string);

  let attendance: MemberDetail["attendance"] = [];
  if (classIds.length > 0) {
    const { data: attendanceRows, error: attendanceError } = await supabase
      .from("attendance")
      .select("status, session:class_sessions!inner(id, starts_at, class_id)")
      .eq("user_id", memberUserId)
      .in("session.class_id", classIds);
    if (attendanceError) throw new Error(attendanceError.message);
    attendance = (attendanceRows ?? [])
      .map((a) => {
        const session = a.session as unknown as { id: string; starts_at: string; class_id: string };
        return {
          session_id: session.id,
          class_name: classNameById.get(session.class_id) ?? "Cours",
          starts_at: session.starts_at,
          status: a.status as AttendanceStatus,
        };
      })
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
      .slice(0, 50);
  }

  const presentCount = attendance.filter((a) => a.status === "present").length;

  return {
    clubId,
    userId: memberUserId,
    displayName: profile?.display_name ?? null,
    role: member.role as ClubRole,
    memberSince: member.created_at as string,
    groups,
    attendance,
    attendanceRate: computeRate(presentCount, attendance.length),
  };
}
