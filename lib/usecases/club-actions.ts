"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import {
  clubInputSchema,
  groupInputSchema,
  inviteMemberInputSchema,
  type ClubRole,
} from "@/lib/domain/club";

export type ClubActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

// === Clubs ===

export type MyClubListItem = { id: string; name: string; role: ClubRole };

export async function getMyClubs(): Promise<MyClubListItem[]> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("club_members")
    .select("role, club:clubs(id, name)")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row) => row.club)
    .map((row) => ({
      id: (row.club as unknown as { id: string; name: string }).id,
      name: (row.club as unknown as { id: string; name: string }).name,
      role: row.role as ClubRole,
    }));
}

export async function createClub(
  _prevState: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const parsed = clubInputSchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("clubs").insert({ ...parsed.data, owner_id: userId });
  if (error) return { error: error.message };

  revalidatePath("/club");
  return { error: null };
}

export async function deleteClub(clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("clubs").delete().eq("id", clubId);
  if (error) throw new Error(error.message);
  revalidatePath("/club");
}

// === Club detail: club + members + groups ===

export type ClubMemberItem = {
  id: string;
  user_id: string;
  role: ClubRole;
  display_name: string | null;
};

export type GroupItem = {
  id: string;
  name: string;
  level: string | null;
  members: { user_id: string; display_name: string | null }[];
};

export type ClubDetail = {
  id: string;
  name: string;
  owner_id: string;
  myRole: ClubRole;
  members: ClubMemberItem[];
  groups: GroupItem[];
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

export async function getClub(clubId: string): Promise<ClubDetail | null> {
  const { supabase, userId } = await requireUserId();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name, owner_id")
    .eq("id", clubId)
    .maybeSingle();
  if (clubError) throw new Error(clubError.message);
  if (!club) return null;

  const { data: members, error: membersError } = await supabase
    .from("club_members")
    .select("id, user_id, role")
    .eq("club_id", clubId)
    .eq("status", "active");
  if (membersError) throw new Error(membersError.message);

  const myMembership = members?.find((m) => m.user_id === userId);
  if (!myMembership) return null;

  const membersWithNames = await attachDisplayNames(supabase, (members ?? []) as { id: string; user_id: string; role: ClubRole }[]);

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id, name, level, group_members(user_id)")
    .eq("club_id", clubId);
  if (groupsError) throw new Error(groupsError.message);

  const groupItems: GroupItem[] = [];
  for (const g of groups ?? []) {
    const groupMembers = (g.group_members as unknown as { user_id: string }[]) ?? [];
    const withNames = await attachDisplayNames(supabase, groupMembers);
    groupItems.push({ id: g.id as string, name: g.name as string, level: g.level as string | null, members: withNames });
  }

  return {
    id: club.id,
    name: club.name,
    owner_id: club.owner_id,
    myRole: myMembership.role as ClubRole,
    members: membersWithNames,
    groups: groupItems,
  };
}

// === Members ===

export async function inviteMember(
  _prevState: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = inviteMemberInputSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "MEMBER"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase } = await requireUserId();
  const { error } = await supabase.rpc("invite_club_member", {
    p_club_id: clubId,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
  });
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}`);
  return { error: null };
}

export async function updateMemberRole(memberId: string, clubId: string, role: ClubRole): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("club_members").update({ role }).eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}`);
}

export async function removeMember(memberId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("club_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}`);
}

// === Groups ===

export async function createGroup(
  _prevState: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = groupInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    level: String(formData.get("level") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("groups").insert({ ...parsed.data, club_id: clubId });
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}`);
  return { error: null };
}

export async function deleteGroup(groupId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("groups").delete().eq("id", groupId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}`);
}

export async function assignMemberToGroup(groupId: string, userId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: userId });
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}`);
}

export async function removeMemberFromGroup(groupId: string, userId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}`);
}
