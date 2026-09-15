"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { clubAnnouncementInputSchema, isUnread } from "@/lib/domain/club-announcement";

export type ClubAnnouncementActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export type ClubAnnouncementListItem = {
  id: string;
  title: string;
  content: string;
  group_id: string | null;
  group_name: string | null;
  author_name: string | null;
  created_at: string;
  unread: boolean;
};

export async function getClubAnnouncements(clubId: string): Promise<ClubAnnouncementListItem[]> {
  const { supabase, userId } = await requireUserId();

  const { data: membership, error: membershipError } = await supabase
    .from("club_members")
    .select("announcements_last_read_at")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message);
  if (!membership) return [];
  const lastReadAt = membership.announcements_last_read_at as string | null;

  const { data, error } = await supabase
    .from("club_announcements")
    .select("id, title, content, group_id, created_at, created_by, group:groups(name)")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const authorIds = [...new Set((data ?? []).map((a) => a.created_by as string | null).filter((v): v is string => !!v))];
  const nameByUserId = new Map<string, string | null>();
  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", authorIds);
    if (profilesError) throw new Error(profilesError.message);
    for (const p of profiles ?? []) nameByUserId.set(p.user_id as string, p.display_name as string | null);
  }

  return (data ?? []).map((a) => ({
    id: a.id as string,
    title: a.title as string,
    content: a.content as string,
    group_id: a.group_id as string | null,
    group_name: (a.group as unknown as { name: string } | null)?.name ?? null,
    author_name: a.created_by ? (nameByUserId.get(a.created_by as string) ?? null) : null,
    created_at: a.created_at as string,
    unread: isUnread(a.created_at as string, lastReadAt),
  }));
}

export async function getClubAnnouncement(announcementId: string): Promise<ClubAnnouncementListItem & { club_id: string; club_name: string } | null> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("club_announcements")
    .select("id, club_id, title, content, group_id, created_at, created_by, group:groups(name), club:clubs(name)")
    .eq("id", announcementId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  let authorName: string | null = null;
  if (data.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", data.created_by as string)
      .maybeSingle();
    authorName = profile?.display_name ?? null;
  }

  return {
    id: data.id as string,
    club_id: data.club_id as string,
    club_name: (data.club as unknown as { name: string } | null)?.name ?? "Club",
    title: data.title as string,
    content: data.content as string,
    group_id: data.group_id as string | null,
    group_name: (data.group as unknown as { name: string } | null)?.name ?? null,
    author_name: authorName,
    created_at: data.created_at as string,
    unread: false,
  };
}

export async function createClubAnnouncement(
  _prevState: ClubAnnouncementActionState,
  formData: FormData,
): Promise<ClubAnnouncementActionState> {
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = clubAnnouncementInputSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    group_id: String(formData.get("group_id") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("club_announcements").insert({
    club_id: clubId,
    group_id: parsed.data.group_id ?? null,
    title: parsed.data.title,
    content: parsed.data.content,
    created_by: userId,
  });
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}/announcements`);
  return { error: null };
}

export async function updateClubAnnouncement(
  _prevState: ClubAnnouncementActionState,
  formData: FormData,
): Promise<ClubAnnouncementActionState> {
  const announcementId = String(formData.get("announcement_id") ?? "").trim();
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = clubAnnouncementInputSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    group_id: String(formData.get("group_id") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("club_announcements")
    .update({
      group_id: parsed.data.group_id ?? null,
      title: parsed.data.title,
      content: parsed.data.content,
    })
    .eq("id", announcementId);
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}/announcements`);
  revalidatePath(`/club/${clubId}/announcements/${announcementId}`);
  return { error: null };
}

export async function deleteClubAnnouncement(announcementId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("club_announcements").delete().eq("id", announcementId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/announcements`);
}

export async function markAnnouncementsRead(clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.rpc("mark_announcements_read", { p_club_id: clubId });
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/announcements`);
  revalidatePath(`/club/${clubId}`);
}

export async function getUnreadAnnouncementCount(clubId: string): Promise<number> {
  const items = await getClubAnnouncements(clubId);
  return items.filter((a) => a.unread).length;
}
