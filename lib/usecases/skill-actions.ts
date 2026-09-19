import "server-only";
import { createClient } from "@/lib/infra/db/supabase-server";
import { createServiceClient } from "@/lib/infra/db/supabase-service";
import {
  computeMasteryStage,
  skillInputSchema,
  skillRelationInputSchema,
  summarizeSkillProgress,
  type MasteryStage,
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
  stage: MasteryStage;
  lastPracticedAt: string | null;
};

/**
 * Fetches the catalog (1 query) then merges in the signed-in user's progress
 * (1 query for all their skill_progress rows) so each card shows a real,
 * derived mastery stage — never N+1 per skill.
 */
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
  const skills = (data ?? []) as unknown as Omit<SkillListItem, "stage" | "lastPracticedAt">[];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || skills.length === 0) {
    return skills.map((s) => ({ ...s, stage: "unknown" as const, lastPracticedAt: null }));
  }

  const { data: progressRows, error: progressError } = await supabase
    .from("skill_progress")
    .select(
      "skill_id, knowledge_level, drilling_reps, live_application_count, sparring_attempt_count, sparring_success_count, consistency_score, pressure_performance_level, confidence_level, evidence_count, last_practiced_at",
    )
    .eq("user_id", user.id);
  if (progressError) throw new Error(progressError.message);

  type ProgressRow = SkillProgressDimensions & { skill_id: string };
  const progressBySkill = new Map(
    ((progressRows ?? []) as unknown as ProgressRow[]).map((p) => [p.skill_id, p]),
  );

  return skills.map((s) => {
    const progress = progressBySkill.get(s.id);
    return {
      ...s,
      stage: progress ? computeMasteryStage(progress) : "unknown",
      lastPracticedAt: progress?.last_practiced_at ?? null,
    };
  });
}

export type TechniqueOfTheDay = {
  id: string;
  name: string;
  slug: string;
  disciplineName: string;
  category: string | null;
};

/**
 * Deterministic daily catalog spotlight: same calendar day always yields the
 * same pick for a given catalog (no randomness, no extra query beyond
 * `getSkills()`). Prefers skills the user has not tracked yet (stage
 * "unknown") to bias toward discovery, falling back to the full catalog once
 * everything has been touched at least once.
 */
export async function getTechniqueOfTheDay(): Promise<TechniqueOfTheDay | null> {
  const skills = await getSkills();
  if (skills.length === 0) return null;

  const untouched = skills.filter((s) => s.stage === "unknown");
  const pool = untouched.length > 0 ? untouched : skills;
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));

  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear) / (1000 * 60 * 60 * 24));
  const pick = sorted[dayOfYear % sorted.length];

  return {
    id: pick.id,
    name: pick.name,
    slug: pick.slug,
    disciplineName: pick.discipline.name,
    category: pick.category,
  };
}

export type SkillRelationItem = {
  id: string;
  relation_type: SkillRelationType;
  skill: { id: string; name: string; slug: string };
};

export type SkillMapEdge = {
  fromSkillId: string;
  toSkillId: string;
  relationType: SkillRelationType;
};

export type SkillMapData = {
  skills: SkillListItem[];
  edges: SkillMapEdge[];
};

/**
 * Full catalog + relation graph for the mastery map. Reuses `getSkills` for
 * nodes (already 2 queries, no N+1) and adds a single query for every
 * relation edge — no per-skill relation lookups.
 */
export async function getSkillMap(): Promise<SkillMapData> {
  const supabase = await createClient();
  const skills = await getSkills();

  const { data, error } = await supabase
    .from("skill_relations")
    .select("from_skill_id, to_skill_id, relation_type");
  if (error) throw new Error(error.message);

  const edges = (data ?? []).map((r) => ({
    fromSkillId: r.from_skill_id as string,
    toSkillId: r.to_skill_id as string,
    relationType: r.relation_type as SkillRelationType,
  }));

  return { skills, edges };
}

export type SkillHistoryItem =
  | {
      kind: "technique";
      id: string;
      date: string;
      sessionId: string;
      sessionTitle: string | null;
      techniqueName: string;
      notes: string | null;
    }
  | {
      kind: "observation";
      id: string;
      date: string;
      sessionId: string;
      sessionTitle: string | null;
      observationType: "difficulty" | "question" | "insight" | "success";
      content: string;
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
  history: SkillHistoryItem[];
};

const SKILL_HISTORY_LIMIT = 12;

export async function getSkill(id: string): Promise<SkillDetail | null> {
  const supabase = await createClient();

  const { data: skill, error } = await supabase
    .from("skills")
    .select("id, name, slug, description, category, discipline:disciplines(id, code, name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!skill) return null;

  const [{ data: relationsFrom }, { data: relationsTo }, { data: progress }, { data: techniques }, { data: observations }] =
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
      supabase
        .from("session_techniques")
        .select("id, technique_name, notes, session:training_sessions(id, date, title)")
        .eq("skill_id", id),
      supabase
        .from("session_observations")
        .select("id, type, content, session:training_sessions(id, date, title)")
        .eq("related_skill_id", id),
    ]);

  type SessionRef = { id: string; date: string; title: string | null };
  type TechniqueRow = { id: string; technique_name: string; notes: string | null; session: SessionRef | null };
  type ObservationRow = {
    id: string;
    type: "difficulty" | "question" | "insight" | "success";
    content: string;
    session: SessionRef | null;
  };

  const ownTechniques = (techniques ?? []) as unknown as TechniqueRow[];
  const ownObservations = (observations ?? []) as unknown as ObservationRow[];

  const sessionIds = new Set<string>();
  let lastPracticedAt: string | null = null;
  for (const t of ownTechniques) {
    if (!t.session) continue;
    sessionIds.add(t.session.id);
    if (!lastPracticedAt || t.session.date > lastPracticedAt) lastPracticedAt = t.session.date;
  }

  const history: SkillHistoryItem[] = [
    ...ownTechniques
      .filter((t) => t.session)
      .map(
        (t): SkillHistoryItem => ({
          kind: "technique",
          id: t.id,
          date: t.session!.date,
          sessionId: t.session!.id,
          sessionTitle: t.session!.title,
          techniqueName: t.technique_name,
          notes: t.notes,
        }),
      ),
    ...ownObservations
      .filter((o) => o.session)
      .map(
        (o): SkillHistoryItem => ({
          kind: "observation",
          id: o.id,
          date: o.session!.date,
          sessionId: o.session!.id,
          sessionTitle: o.session!.title,
          observationType: o.type,
          content: o.content,
        }),
      ),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, SKILL_HISTORY_LIMIT);

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
      sessionCount: sessionIds.size,
      observationCount: ownObservations.length,
      lastPracticedAt,
    },
    history,
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
