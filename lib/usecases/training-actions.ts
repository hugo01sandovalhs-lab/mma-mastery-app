"use server";

import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/infra/db/supabase-server";
import { createServiceClient } from "@/lib/infra/db/supabase-service";
import { tServer } from "@/lib/i18n-server";
import {
  trainingSessionInputSchema,
  type Discipline,
  type ObservationType,
  type SessionType,
} from "@/lib/domain/training";

export type TrainingActionState = { error: string | null };

function parseFormInput(formData: FormData) {
  const durationRaw = String(formData.get("duration_minutes") ?? "").trim();
  const rpeRaw = String(formData.get("rpe") ?? "").trim();

  let techniques: unknown[] = [];
  let observations: unknown[] = [];
  try {
    techniques = JSON.parse(String(formData.get("techniques_json") ?? "[]"));
    observations = JSON.parse(String(formData.get("observations_json") ?? "[]"));
  } catch {
    // left empty; zod validation below will reject
  }

  return trainingSessionInputSchema.safeParse({
    date: String(formData.get("date") ?? ""),
    discipline_id: String(formData.get("discipline_id") ?? ""),
    session_type: String(formData.get("session_type") ?? ""),
    title: String(formData.get("title") ?? ""),
    duration_minutes: durationRaw ? Number(durationRaw) : null,
    rpe: rpeRaw ? Number(rpeRaw) : null,
    notes: String(formData.get("notes") ?? ""),
    techniques,
    observations,
  });
}

export async function createTrainingSession(
  _prevState: TrainingActionState,
  formData: FormData,
): Promise<TrainingActionState> {
  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? (await tServer("error.invalidForm", "Formulaire invalide")) };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: sessionId, error } = await supabase.rpc("create_training_session", {
    p_date: input.date,
    p_discipline_id: input.discipline_id,
    p_session_type: input.session_type,
    p_title: input.title ?? null,
    p_duration_minutes: input.duration_minutes ?? null,
    p_rpe: input.rpe ?? null,
    p_notes: input.notes ?? null,
    p_techniques: input.techniques,
    p_observations: input.observations,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/training/${sessionId as string}`);
}

export async function updateTrainingSession(
  sessionId: string,
  _prevState: TrainingActionState,
  formData: FormData,
): Promise<TrainingActionState> {
  const parsed = parseFormInput(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? (await tServer("error.invalidForm", "Formulaire invalide")) };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_training_session", {
    p_session_id: sessionId,
    p_date: input.date,
    p_discipline_id: input.discipline_id,
    p_session_type: input.session_type,
    p_title: input.title ?? null,
    p_duration_minutes: input.duration_minutes ?? null,
    p_rpe: input.rpe ?? null,
    p_notes: input.notes ?? null,
    p_techniques: input.techniques,
    p_observations: input.observations,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/training/${sessionId}`);
}

export async function deleteTrainingSession(
  sessionId: string,
  prevState: TrainingActionState,
): Promise<TrainingActionState> {
  void prevState;
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("training_sessions")
    .delete({ count: "exact" })
    .eq("id", sessionId);

  if (error) {
    return { error: error.message };
  }
  if (!count) {
    return { error: await tServer("error.sessionNotFound", "Séance introuvable ou déjà supprimée.") };
  }

  redirect("/training");
}

export type TrainingSessionListItem = {
  id: string;
  date: string;
  session_type: SessionType;
  title: string | null;
  duration_minutes: number | null;
  rpe: number | null;
  discipline: { code: string; name: string };
  techniques: { technique_name: string }[];
  observations: { count: number }[];
};

export async function getTrainingSessions(): Promise<TrainingSessionListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, date, session_type, title, duration_minutes, rpe, discipline:disciplines(code, name), techniques:session_techniques(technique_name), observations:session_observations(count)",
    )
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TrainingSessionListItem[];
}

export type TrainingSessionDetail = {
  id: string;
  date: string;
  session_type: SessionType;
  title: string | null;
  duration_minutes: number | null;
  rpe: number | null;
  notes: string | null;
  discipline: { id: string; code: string; name: string };
  techniques: {
    id: string;
    technique_name: string;
    skill_id: string | null;
    skill: { name: string } | null;
    category: string | null;
    notes: string | null;
    outcome: "success" | "failure" | null;
    partner_name: string | null;
    pressure_level: number | null;
    problem: string | null;
    position: string | null;
    round_seconds: number | null;
    ruleset: string | null;
  }[];
  observations: {
    id: string;
    type: ObservationType;
    content: string;
    related_skill_id: string | null;
    skill: { name: string } | null;
  }[];
};

export async function getTrainingSession(id: string): Promise<TrainingSessionDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_sessions")
    .select(
      "id, date, session_type, title, duration_minutes, rpe, notes, discipline:disciplines(id, code, name), techniques:session_techniques(id, technique_name, skill_id, category, notes, outcome, partner_name, pressure_level, problem, position, round_seconds, ruleset, skill:skills(name)), observations:session_observations(id, type, content, related_skill_id, skill:skills(name))",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as TrainingSessionDetail | null;
}

/**
 * Disciplines are static seed data with no write path in the app — cached
 * across requests so every page that populates a discipline filter/select
 * (skills, training) skips the round trip on each navigation.
 */
const getDisciplinesCached = unstable_cache(
  async (): Promise<Discipline[]> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("disciplines").select("id, code, name").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
  ["disciplines"],
  { tags: ["disciplines"], revalidate: 3600 },
);

export async function getDisciplines(): Promise<Discipline[]> {
  return getDisciplinesCached();
}
