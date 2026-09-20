"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { tServer } from "@/lib/i18n-server";
import {
  matchInputSchema,
  sequenceInputSchema,
  type MatchInput,
  type MatchResult,
  type SequenceInput,
} from "@/lib/domain/competition";

type TranslationKey = Parameters<typeof tServer>[0];

const MATCH_FIELD_ERRORS: Record<string, [TranslationKey, string]> = {
  discipline_id: ["competition.errors.disciplineRequired", "Discipline requise"],
  date: ["competition.errors.dateInvalid", "Date invalide"],
};

const SEQUENCE_FIELD_ERRORS: Record<string, [TranslationKey, string]> = {
  title: ["competition.errors.titleRequired", "Titre requis"],
  source_url: ["competition.errors.urlInvalid", "URL invalide"],
  timestamp_end: ["competition.errors.endBeforeStart", "La fin doit être après le début"],
};

async function firstFieldError(
  issues: { path: PropertyKey[] }[],
  fieldErrors: Record<string, [TranslationKey, string]>,
): Promise<string> {
  const field = issues[0]?.path[0];
  const mapped = typeof field === "string" ? fieldErrors[field] : undefined;
  return mapped ? tServer(mapped[0], mapped[1]) : tServer("error.invalidForm", "Formulaire invalide");
}

export type CompetitionActionState = { error: string | null };

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

// === Athletes ===

export type AthleteListItem = { id: string; name: string };

export async function getAthletes(): Promise<AthleteListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase.from("athletes").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AthleteListItem[];
}

/** Resolves an athlete by name for this user, creating it if it doesn't exist yet. */
async function resolveOrCreateAthlete(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string,
): Promise<string> {
  const trimmed = name.trim();
  const { data: existing, error: findError } = await supabase
    .from("athletes")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", trimmed)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return existing.id as string;

  const { data: created, error: insertError } = await supabase
    .from("athletes")
    .insert({ user_id: userId, name: trimmed })
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);
  return created.id as string;
}

// === Matches ===

export type MatchListItem = {
  id: string;
  date: string;
  event_name: string | null;
  result: MatchResult | null;
  method: string | null;
  discipline: { id: string; name: string } | null;
  athlete: { id: string; name: string } | null;
};

export async function getMatches(): Promise<MatchListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, date, event_name, result, method, discipline:disciplines(id, name), athlete:athletes(id, name)",
    )
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MatchListItem[];
}

export type MatchDetail = MatchListItem & {
  notes: string | null;
  training_session_id: string | null;
};

export async function getMatch(matchId: string): Promise<MatchDetail | null> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, date, event_name, result, method, notes, training_session_id, discipline:disciplines(id, name), athlete:athletes(id, name)",
    )
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as MatchDetail | null;
}

/** Competition-type training sessions, for optionally linking a match to the session that logged it. */
export type CompetitionSessionOption = { id: string; date: string; title: string | null };

export async function getCompetitionSessionOptions(): Promise<CompetitionSessionOption[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, date, title")
    .eq("session_type", "competition")
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CompetitionSessionOption[];
}

function parseMatchForm(formData: FormData) {
  const athleteId = String(formData.get("athlete_id") ?? "").trim();
  const sessionId = String(formData.get("training_session_id") ?? "").trim();
  const result = String(formData.get("result") ?? "").trim();
  return matchInputSchema.safeParse({
    discipline_id: String(formData.get("discipline_id") ?? ""),
    athlete_id: athleteId || undefined,
    training_session_id: sessionId && sessionId !== "__none" ? sessionId : undefined,
    event_name: String(formData.get("event_name") ?? ""),
    date: String(formData.get("date") ?? ""),
    result: result && result !== "__none" ? result : undefined,
    method: String(formData.get("method") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
}

export async function createMatch(
  _prevState: CompetitionActionState,
  formData: FormData,
): Promise<CompetitionActionState> {
  const parsed = parseMatchForm(formData);
  if (!parsed.success) {
    return { error: await firstFieldError(parsed.error.issues, MATCH_FIELD_ERRORS) };
  }
  const { supabase, userId } = await requireUserId();
  const input: MatchInput = parsed.data;

  let athleteId = input.athlete_id;
  const athleteName = String(formData.get("athlete_name") ?? "").trim();
  if (!athleteId && athleteName) {
    athleteId = await resolveOrCreateAthlete(supabase, userId, athleteName);
  }

  const { error } = await supabase
    .from("matches")
    .insert({ ...input, athlete_id: athleteId, user_id: userId });
  if (error) {
    console.error(error);
    return { error: await tServer("error.saveFailed", "Impossible d'enregistrer pour le moment. Réessayez dans un instant.") };
  }

  revalidatePath("/competition");
  return { error: null };
}

export async function deleteMatch(matchId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("matches").delete().eq("id", matchId);
  if (error) throw new Error(error.message);
  revalidatePath("/competition");
}

// === Sequences ===

export type SequenceListItem = {
  id: string;
  title: string;
  source_url: string | null;
  timestamp_start: number | null;
  timestamp_end: number | null;
  notes: string | null;
  created_at: string;
  skills: { id: string; name: string }[];
};

export async function getSequencesForMatch(matchId: string): Promise<SequenceListItem[]> {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("sequences")
    .select(
      "id, title, source_url, timestamp_start, timestamp_end, notes, created_at, sequence_skills(skill:skills(id, name))",
    )
    .eq("match_id", matchId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    skills: (row.sequence_skills as unknown as { skill: { id: string; name: string } }[]).map(
      (s) => s.skill,
    ),
  })) as unknown as SequenceListItem[];
}

function parseSequenceForm(formData: FormData, matchId: string) {
  const skillId = String(formData.get("skill_id") ?? "").trim();
  const startRaw = String(formData.get("timestamp_start") ?? "").trim();
  const endRaw = String(formData.get("timestamp_end") ?? "").trim();
  return sequenceInputSchema.safeParse({
    match_id: matchId,
    title: String(formData.get("title") ?? ""),
    source_url: String(formData.get("source_url") ?? ""),
    timestamp_start: startRaw ? Number(startRaw) : undefined,
    timestamp_end: endRaw ? Number(endRaw) : undefined,
    skill_id: skillId || undefined,
    notes: String(formData.get("notes") ?? ""),
  });
}

export async function createSequence(
  _prevState: CompetitionActionState,
  formData: FormData,
): Promise<CompetitionActionState> {
  const matchId = String(formData.get("match_id") ?? "").trim();
  const parsed = parseSequenceForm(formData, matchId);
  if (!parsed.success) {
    return { error: await firstFieldError(parsed.error.issues, SEQUENCE_FIELD_ERRORS) };
  }
  const { supabase, userId } = await requireUserId();
  const input: SequenceInput = parsed.data;
  const { skill_id, ...sequenceFields } = input;

  const { data: created, error } = await supabase
    .from("sequences")
    .insert({ ...sequenceFields, user_id: userId })
    .select("id")
    .single();
  if (error) {
    console.error(error);
    return { error: await tServer("error.saveFailed", "Impossible d'enregistrer pour le moment. Réessayez dans un instant.") };
  }

  if (skill_id) {
    const { error: junctionError } = await supabase
      .from("sequence_skills")
      .insert({ sequence_id: created.id, skill_id });
    if (junctionError) {
      console.error(junctionError);
      return { error: await tServer("error.saveFailed", "Impossible d'enregistrer pour le moment. Réessayez dans un instant.") };
    }
  }

  revalidatePath(`/competition/${matchId}`);
  return { error: null };
}

export async function deleteSequence(sequenceId: string, matchId: string): Promise<void> {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("sequences").delete().eq("id", sequenceId);
  if (error) throw new Error(error.message);
  revalidatePath(`/competition/${matchId}`);
}
