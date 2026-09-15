"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { clubEventInputSchema, type EventType, type RegistrationStatus } from "@/lib/domain/club-event";
import type { ClubRole } from "@/lib/domain/club";

export type ClubEventActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

// === Events ===

export type ClubEventListItem = {
  id: string;
  name: string;
  event_type: EventType;
  starts_at: string;
  location: string | null;
  registrationCount: number;
  myStatus: RegistrationStatus | null;
};

export async function getClubEvents(clubId: string): Promise<ClubEventListItem[]> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("club_events")
    .select("id, name, event_type, starts_at, location, event_registrations(user_id, status)")
    .eq("club_id", clubId)
    .order("starts_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const registrations = (row.event_registrations as unknown as { user_id: string; status: RegistrationStatus }[]) ?? [];
    const active = registrations.filter((r) => r.status === "registered");
    return {
      id: row.id as string,
      name: row.name as string,
      event_type: row.event_type as EventType,
      starts_at: row.starts_at as string,
      location: row.location as string | null,
      registrationCount: active.length,
      myStatus: registrations.find((r) => r.user_id === userId)?.status ?? null,
    };
  });
}

export async function createClubEvent(
  _prevState: ClubEventActionState,
  formData: FormData,
): Promise<ClubEventActionState> {
  const clubId = String(formData.get("club_id") ?? "").trim();
  const parsed = clubEventInputSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    event_type: String(formData.get("event_type") ?? "event"),
    starts_at: String(formData.get("starts_at") ?? ""),
    location: String(formData.get("location") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase.from("club_events").insert({
    club_id: clubId,
    name: parsed.data.name,
    event_type: parsed.data.event_type,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    location: parsed.data.location ?? null,
    notes: parsed.data.notes ?? null,
    created_by: userId,
  });
  if (error) return { error: error.message };

  revalidatePath(`/club/${clubId}/events`);
  return { error: null };
}

export async function deleteClubEvent(eventId: string, clubId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("club_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/events`);
}

// === Event detail + participants ===

export type EventParticipant = { user_id: string; display_name: string | null; status: RegistrationStatus };

export type ClubEventDetail = {
  id: string;
  club_id: string;
  club_name: string;
  name: string;
  event_type: EventType;
  starts_at: string;
  location: string | null;
  notes: string | null;
  myRole: ClubRole;
  myStatus: RegistrationStatus | null;
  participants: EventParticipant[];
};

export async function getClubEventDetail(eventId: string): Promise<ClubEventDetail | null> {
  const { supabase, userId } = await requireUserId();

  const { data: event, error: eventError } = await supabase
    .from("club_events")
    .select("id, club_id, name, event_type, starts_at, location, notes, club:clubs(name)")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError) throw new Error(eventError.message);
  if (!event) return null;

  const { data: membership, error: membershipError } = await supabase
    .from("club_members")
    .select("role")
    .eq("club_id", event.club_id)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw new Error(membershipError.message);
  if (!membership) return null;

  const { data: registrations, error: registrationsError } = await supabase
    .from("event_registrations")
    .select("user_id, status")
    .eq("event_id", eventId);
  if (registrationsError) throw new Error(registrationsError.message);

  const activeRegistrations = (registrations ?? []).filter((r) => r.status === "registered");
  const userIds = activeRegistrations.map((r) => r.user_id as string);
  const nameByUserId = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);
    if (profilesError) throw new Error(profilesError.message);
    for (const p of profiles ?? []) nameByUserId.set(p.user_id as string, p.display_name as string | null);
  }

  return {
    id: event.id as string,
    club_id: event.club_id as string,
    club_name: (event.club as unknown as { name: string } | null)?.name ?? "Club",
    name: event.name as string,
    event_type: event.event_type as EventType,
    starts_at: event.starts_at as string,
    location: event.location as string | null,
    notes: event.notes as string | null,
    myRole: membership.role as ClubRole,
    myStatus: (registrations ?? []).find((r) => r.user_id === userId)?.status ?? null,
    participants: activeRegistrations.map((r) => ({
      user_id: r.user_id as string,
      display_name: nameByUserId.get(r.user_id as string) ?? null,
      status: r.status as RegistrationStatus,
    })),
  };
}

// === Registration ===

export async function registerForEvent(eventId: string, clubId: string): Promise<void> {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("event_registrations")
    .upsert({ event_id: eventId, user_id: userId, status: "registered" }, { onConflict: "event_id,user_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/events/${eventId}`);
  revalidatePath(`/club/${clubId}/events`);
}

export async function cancelRegistration(eventId: string, clubId: string, targetUserId?: string): Promise<void> {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("event_registrations")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", targetUserId ?? userId);
  if (error) throw new Error(error.message);
  revalidatePath(`/club/${clubId}/events/${eventId}`);
  revalidatePath(`/club/${clubId}/events`);
}
