import "server-only";
import { createClient } from "@/lib/infra/db/supabase-server";
import { createServiceClient } from "@/lib/infra/db/supabase-service";
import {
  computeMasteryStage,
  skillInputSchema,
  skillRelationInputSchema,
  summarizeSkillProgress,
  type SkillInput,
  type SkillProgressDimensions,
  type SkillProgressSummary,
  type SkillRelationInput,
  type SkillRelationType,
} from "@/lib/domain/skill";

export type SkillListItem = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  discipline: { id: string; code: string; name: string };
};

export async function getSkills(filters?: {
  disciplineId?: string;
  search?: string;
}): Promise<SkillListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("skills")
    .select("id, name, slug, category, discipline:disciplines(id, code, name)")
    .order("name");

  if (filters?.disciplineId) {
    query = query.eq("discipline_id", filters.disciplineId);
  }
  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SkillListItem[];
}

export type SkillRelationItem = {
  id: string;
  relation_type: SkillRelationType;
  skill: { id: string; name: string; slug: string };
};

export type SkillDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  discipline: { id: string; code: string; name: string };
  relationsFrom: SkillRelationItem[];
  relationsTo: SkillRelationItem[];
  progress: SkillProgressDimensions & { mastery_stage_cache: string | null };
  stats: {
    sessionCount: number;
    observationCount: number;
    lastPracticedAt: string | null;
  };
};

export async function getSkill(id: string): Promise<SkillDetail | null> {
  const supabase = await createClient();

  const { data: skill, error } = await supabase
    .from("skills")
    .select("id, name, slug, description, category, discipline:disciplines(id, code, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!skill) return null;

  const [{ data: relationsFrom }, { data: relationsTo }, { data: progress }, { data: techniques }] =
    await Promise.all([
      supabase
        .from("skill_relations")
        .select("id, relation_type, skill:to_skill_id(id, name, slug)")
        .eq("from_skill_id", id),
      supabase
        .from("skill_relations")
        .select("id, relation_type, skill:from_skill_id(id, name, slug)")
        .eq("to_skill_id", id),
      supabase.from("skill_progress").select("*").eq("skill_id", id).maybeSingle(),
      supabase.from("session_techniques").select("session_id, created_at").eq("skill_id", id),
    ]);

  const { count: observationCount } = await supabase
    .from("session_observations")
    .select("id", { count: "exact", head: true })
    .eq("related_skill_id", id);

  const ownTechniques = (techniques ?? []) as unknown as {
    session_id: string;
    created_at: string;
  }[];
  const sessionCount = new Set(ownTechniques.map((t) => t.session_id)).size;
  const lastPracticedAt =
    ownTechniques.length > 0
      ? ownTechniques.reduce((latest, t) => (t.created_at > latest ? t.created_at : latest), ownTechniques[0].created_at)
      : null;

  const defaultProgress: SkillProgressDimensions & { mastery_stage_cache: string | null } = {
    knowledge_level: 0,
    drilling_reps: 0,
    live_application_count: 0,
    sparring_attempt_count: 0,
    sparring_success_count: 0,
    consistency_score: null,
    pressure_performance_level: null,
    confidence_level: null,
    evidence_count: 0,
    last_practiced_at: null,
    mastery_stage_cache: null,
  };

  return {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    description: skill.description,
    category: skill.category,
    discipline: (skill as unknown as { discipline: SkillDetail["discipline"] }).discipline,
    relationsFrom: (relationsFrom ?? []) as unknown as SkillRelationItem[],
    relationsTo: (relationsTo ?? []) as unknown as SkillRelationItem[],
    progress: progress ? (progress as unknown as typeof defaultProgress) : defaultProgress,
    stats: {
      sessionCount,
      observationCount: observationCount ?? 0,
      lastPracticedAt,
    },
  };
}

export async function getSkillProgress(
  skillId: string,
): Promise<(SkillProgressDimensions & { mastery_stage_cache: string | null }) | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("skill_progress")
    .select("*")
    .eq("skill_id", skillId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as (SkillProgressDimensions & { mastery_stage_cache: string | null }) | null;
}

export async function updateSkillProgress(
  skillId: string,
  dimensions: Partial<SkillProgressDimensions>,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("skill_progress")
    .select("*")
    .eq("skill_id", skillId)
    .maybeSingle();

  const merged: SkillProgressDimensions = {
    knowledge_level: dimensions.knowledge_level ?? existing?.knowledge_level ?? 0,
    drilling_reps: dimensions.drilling_reps ?? existing?.drilling_reps ?? 0,
    live_application_count: dimensions.live_application_count ?? existing?.live_application_count ?? 0,
    sparring_attempt_count: dimensions.sparring_attempt_count ?? existing?.sparring_attempt_count ?? 0,
    sparring_success_count: dimensions.sparring_success_count ?? existing?.sparring_success_count ?? 0,
    consistency_score: dimensions.consistency_score ?? existing?.consistency_score ?? null,
    pressure_performance_level:
      dimensions.pressure_performance_level ?? existing?.pressure_performance_level ?? null,
    confidence_level: dimensions.confidence_level ?? existing?.confidence_level ?? null,
    evidence_count: dimensions.evidence_count ?? existing?.evidence_count ?? 0,
    last_practiced_at: dimensions.last_practiced_at ?? existing?.last_practiced_at ?? null,
  };

  const mastery_stage_cache = computeMasteryStage(merged);

  const { error } = await supabase.from("skill_progress").upsert(
    {
      user_id: user.id,
      skill_id: skillId,
      ...merged,
      mastery_stage_cache,
      mastery_stage_computed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,skill_id" },
  );
  if (error) throw new Error(error.message);
}

export type { SkillProgressSummary };

/**
 * One-query fetch of the signed-in user's skill progress, aggregated for
 * dashboard display via the pure `summarizeSkillProgress` domain function.
 */
export async function getSkillsProgressSummary(): Promise<SkillProgressSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return summarizeSkillProgress([]);

  const { data, error } = await supabase
    .from("skill_progress")
    .select(
      "knowledge_level, drilling_reps, live_application_count, sparring_attempt_count, sparring_success_count, consistency_score, pressure_performance_level, confidence_level, evidence_count, last_practiced_at, skill:skills(discipline:disciplines(name))",
    )
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  type Row = SkillProgressDimensions & { skill: { discipline: { name: string } | null } | null };
  const rows = (data ?? []) as unknown as Row[];

  return summarizeSkillProgress(
    rows.map((row) => ({ progress: row, disciplineName: row.skill?.discipline?.name ?? null })),
  );
}

/** Catalog write — service role only, never exposed to arbitrary users. */
export async function createSkill(input: SkillInput): Promise<string> {
  const parsed = skillInputSchema.parse(input);
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("skills").insert(parsed).select("id").single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

/** Catalog write — service role only, never exposed to arbitrary users. */
export async function updateSkill(id: string, input: SkillInput): Promise<void> {
  const parsed = skillInputSchema.parse(input);
  const supabase = createServiceClient();
  const { error } = await supabase.from("skills").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Catalog write — service role only, never exposed to arbitrary users. */
export async function createSkillRelation(input: SkillRelationInput): Promise<string> {
  const parsed = skillRelationInputSchema.parse(input);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("skill_relations")
    .insert(parsed)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}
