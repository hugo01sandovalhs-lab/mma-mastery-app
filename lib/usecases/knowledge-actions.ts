"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { tServer } from "@/lib/i18n-server";
import {
  resourceInputSchema,
  skillNoteInputSchema,
  studyStatusSchema,
  type BookmarkTargetType,
  type ResourceInput,
  type ResourceType,
  type SkillNoteInput,
  type StudyStatus,
} from "@/lib/domain/knowledge";

type TranslationKey = Parameters<typeof tServer>[0];

const RESOURCE_FIELD_ERRORS: Record<string, [TranslationKey, string]> = {
  title: ["resource.errors.titleRequired", "Titre requis"],
  url: ["resource.errors.urlInvalid", "URL invalide"],
};

const SKILL_NOTE_FIELD_ERRORS: Record<string, [TranslationKey, string]> = {
  content: ["skillNote.errors.contentRequired", "Contenu requis"],
};

async function firstFieldError(
  issues: { path: PropertyKey[] }[],
  fieldErrors: Record<string, [TranslationKey, string]>,
): Promise<string> {
  const field = issues[0]?.path[0];
  const mapped = typeof field === "string" ? fieldErrors[field] : undefined;
  return mapped ? tServer(mapped[0], mapped[1]) : tServer("error.invalidForm", "Formulaire invalide");
}

export type KnowledgeActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

// === Resources ===

export type ResourceListItem = {
  id: string;
  type: ResourceType;
  title: string;
  author: string | null;
  url: string;
  skill_id: string | null;
  timestamp_seconds: number | null;
  notes: string | null;
  created_at: string;
};

export async function getResourcesForSkill(skillId: string): Promise<ResourceListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("resources")
    .select("id, type, title, author, url, skill_id, timestamp_seconds, notes, created_at")
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ResourceListItem[];
}

export async function getResources(): Promise<ResourceListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("resources")
    .select("id, type, title, author, url, skill_id, timestamp_seconds, notes, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ResourceListItem[];
}

function parseResourceForm(formData: FormData): ReturnType<typeof resourceInputSchema.safeParse> {
  const timestampRaw = String(formData.get("timestamp_seconds") ?? "").trim();
  const skillId = String(formData.get("skill_id") ?? "").trim();
  return resourceInputSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? ""),
    author: String(formData.get("author") ?? ""),
    url: String(formData.get("url") ?? ""),
    skill_id: skillId || undefined,
    timestamp_seconds: timestampRaw ? Number(timestampRaw) : undefined,
    notes: String(formData.get("notes") ?? ""),
  });
}

export async function createResource(
  _prevState: KnowledgeActionState,
  formData: FormData,
): Promise<KnowledgeActionState> {
  const parsed = parseResourceForm(formData);
  if (!parsed.success) {
    return { error: await firstFieldError(parsed.error.issues, RESOURCE_FIELD_ERRORS) };
  }
  const { supabase, userId } = await requireUserId();
  const input: ResourceInput = parsed.data;
  const { error } = await supabase.from("resources").insert({ ...input, user_id: userId });
  if (error) {
    console.error(error);
    return { error: await tServer("error.saveFailed", "Impossible d'enregistrer pour le moment. Réessayez dans un instant.") };
  }

  if (input.skill_id) revalidatePath(`/skills/${input.skill_id}`);
  revalidatePath("/study");
  return { error: null };
}

export async function deleteResource(resourceId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("resources").delete().eq("id", resourceId);
  if (error) throw new Error(error.message);
  revalidatePath("/study");
}

// === Bookmarks ===

export async function isBookmarked(targetType: BookmarkTargetType, targetId: string): Promise<boolean> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function toggleBookmark(
  targetType: BookmarkTargetType,
  targetId: string,
  path: string,
): Promise<void> {
  const { supabase, userId } = await requireUserId();
  const already = await isBookmarked(targetType, targetId);

  if (already) {
    const { error } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("user_id", userId)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("user_bookmarks")
      .insert({ user_id: userId, target_type: targetType, target_id: targetId });
    if (error) throw new Error(error.message);
  }
  revalidatePath(path);
}

export type BookmarkedSkill = { id: string; name: string; slug: string };

export async function getBookmarkedSkills(): Promise<BookmarkedSkill[]> {
  const { supabase, userId } = await requireUserId();
  const { data: bookmarks, error } = await supabase
    .from("user_bookmarks")
    .select("target_id")
    .eq("user_id", userId)
    .eq("target_type", "skill");
  if (error) throw new Error(error.message);

  const skillIds = (bookmarks ?? []).map((b) => b.target_id as string);
  if (skillIds.length === 0) return [];

  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id, name, slug")
    .in("id", skillIds);
  if (skillsError) throw new Error(skillsError.message);
  return (skills ?? []) as unknown as BookmarkedSkill[];
}

// === Study queue ===

export type StudyQueueItem = {
  id: string;
  status: StudyStatus;
  notes: string | null;
  studied_at: string | null;
  created_at: string;
  skill: { id: string; name: string; slug: string; discipline: { name: string } | null } | null;
};

export async function getStudyQueue(): Promise<StudyQueueItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("study_queue_items")
    .select(
      "id, status, notes, studied_at, created_at, skill:skills(id, name, slug, discipline:disciplines(name))",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as StudyQueueItem[];
}

export async function isInStudyQueue(skillId: string): Promise<boolean> {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("study_queue_items")
    .select("id")
    .eq("user_id", userId)
    .eq("skill_id", skillId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function addToStudyQueue(skillId: string, path: string): Promise<void> {
  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("study_queue_items")
    .upsert({ user_id: userId, skill_id: skillId, status: "queued" }, { onConflict: "user_id,skill_id" });
  if (error) throw new Error(error.message);
  revalidatePath(path);
}

export async function updateStudyStatus(itemId: string, status: string, path: string): Promise<void> {
  const parsed = studyStatusSchema.parse(status);
  const { supabase } = await requireUserId();
  const { error } = await supabase
    .from("study_queue_items")
    .update({ status: parsed, studied_at: parsed === "studied" ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(path);
}

export async function removeFromStudyQueue(itemId: string, path: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("study_queue_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);
  revalidatePath(path);
}

// === Skill notes ===

export type SkillNote = { id: string; content: string; created_at: string };

export async function getSkillNotes(skillId: string): Promise<SkillNote[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("skill_notes")
    .select("id, content, created_at")
    .eq("skill_id", skillId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SkillNote[];
}

export async function createSkillNote(
  _prevState: KnowledgeActionState,
  formData: FormData,
): Promise<KnowledgeActionState> {
  const parsed = skillNoteInputSchema.safeParse({
    skill_id: String(formData.get("skill_id") ?? ""),
    content: String(formData.get("content") ?? ""),
  });
  if (!parsed.success) {
    return { error: await firstFieldError(parsed.error.issues, SKILL_NOTE_FIELD_ERRORS) };
  }
  const { supabase, userId } = await requireUserId();
  const input: SkillNoteInput = parsed.data;
  const { error } = await supabase.from("skill_notes").insert({ ...input, user_id: userId });
  if (error) {
    console.error(error);
    return { error: await tServer("error.saveFailed", "Impossible d'enregistrer pour le moment. Réessayez dans un instant.") };
  }
  revalidatePath(`/skills/${input.skill_id}`);
  return { error: null };
}

export async function deleteSkillNote(noteId: string, skillId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("skill_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
  revalidatePath(`/skills/${skillId}`);
}
