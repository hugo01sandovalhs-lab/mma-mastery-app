import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
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
import { evaluateSkill } from "@/lib/domain/training-intelligence";
import { loadSkillIntelligenceInputs } from "@/lib/usecases/training-intelligence-actions";

export type SkillListItem = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  discipline: { id: string; code: string; name: string };
  stage: MasteryStage;
  lastPracticedAt: string | null;
};

export type CatalogSkill = Omit<SkillListItem, "stage" | "lastPracticedAt"> & { discipline_id: string };

/**
 * The skill catalog (id/name/slug/category/discipline) is global read-only
 * reference data — identical for every user and rarely written (only via
 * createSkill/updateSkill below). Cached across requests with the Next Data
 * Cache instead of re-querying on every dashboard/skills/goals/study/coach
 * navigation; invalidated on demand by those writers via revalidateTag.
 */
export const getSkillsCatalog = unstable_cache(
  async (): Promise<CatalogSkill[]> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, slug, category, discipline_id, discipline:disciplines(id, code, name)")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as CatalogSkill[];
  },
  ["skills-catalog"],
  { tags: ["skills-catalog"], revalidate: 3600 },
);

/**
 * Fetches the catalog (cached, see getSkillsCatalog) then merges in the
 * signed-in user's progress (1 query for all their skill_progress rows) so
 * each card shows a real, derived mastery stage — never N+1 per skill.
 */
export async function getSkills(filters?: {
  disciplineId?: string;
  search?: string;
}): Promise<SkillListItem[]> {
  const supabase = await createClient();
  let skills = await getSkillsCatalog();

  if (filters?.disciplineId) {
    skills = skills.filter((s) => s.discipline_id === filters.disciplineId);
  }
  if (filters?.search) {
    const needle = filters.search.toLocaleLowerCase();
    skills = skills.filter((s) => s.name.toLocaleLowerCase().includes(needle));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || skills.length === 0) {
    return skills.map((s) => ({ ...s, stage: "unknown" as const, lastPracticedAt: null }));
  }

  // Per-user progress is secondary enrichment on top of the catalog: a
  // transient failure here must not crash the catalog itself (every skill
  // just falls back to stage "unknown", same as a signed-out/new user).
  const { data: progressRows, error: progressError } = await supabase
    .from("skill_progress")
    .select(
      "skill_id, knowledge_level, drilling_reps, live_application_count, sparring_attempt_count, sparring_success_count, consistency_score, pressure_performance_level, confidence_level, evidence_count, last_practiced_at",
    )
    .eq("user_id", user.id);
  if (progressError) {
    console.error(progressError);
    return skills.map((s) => ({ ...s, stage: "unknown" as const, lastPracticedAt: null }));
  }

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
  /** Localized "why today" — reuses the same evidence keys as Training Intelligence when evidence exists. */
  reasonKey: string;
  reasonVars: Record<string, string | number>;
  /** True when the pick is discovery (no tracked evidence yet), not personalization — the UI must say so, never fake a signal. */
  isExploratory: boolean;
};

function dayOfYear(now: Date): number {
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 0);
  return Math.floor((now.getTime() - startOfYear) / (1000 * 60 * 60 * 24));
}

/**
 * Evidence-based, discipline-rotating daily spotlight. Reuses the exact same
 * deterministic triggers as Training Intelligence (`evaluateSkill`) so a
 * pick's "why today" is never invented — a skill only gets an evidence-based
 * reason if it would also have surfaced as a real recommendation. Rotates
 * which discipline is eligible each day (deterministic, day-of-year based)
 * so one discipline can't dominate every visit, then picks the
 * strongest-evidence skill within that discipline; falls back to an
 * untouched skill in that discipline (explicitly marked exploratory) when
 * there is no evidence for it today, or to the old full-catalog fallback if
 * the rotated discipline has no skills at all.
 */
export async function getTechniqueOfTheDay(now: Date = new Date()): Promise<TechniqueOfTheDay | null> {
  const catalog = await getSkillsCatalog();
  if (catalog.length === 0) return null;

  const day = dayOfYear(now);

  const disciplineNames = Array.from(new Set(catalog.map((s) => s.discipline.name))).sort();
  if (disciplineNames.length === 0) return null;
  const rotatedDiscipline = disciplineNames[day % disciplineNames.length];
  const disciplineSkills = catalog.filter((s) => s.discipline.name === rotatedDiscipline);
  const pool = disciplineSkills.length > 0 ? disciplineSkills : catalog;

  // Evidence is secondary enrichment on top of the catalog: a transient
  // failure here (network blip, RLS hiccup) must not take down the whole
  // pick — it just degrades to the same exploratory path used when there's
  // no evidence yet, instead of bubbling up and getting mistaken upstream
  // for an empty catalog.
  const inputs = await loadSkillIntelligenceInputs().catch(() => []);
  const inputBySkillId = new Map(inputs.map((i) => [i.skillId, i]));

  type Candidate = { skill: CatalogSkill; score: number; topReason: { key: string; vars: Record<string, string | number> } | null };
  const evidenceCandidates: Candidate[] = [];
  const untouched: CatalogSkill[] = [];

  for (const skill of pool) {
    const input = inputBySkillId.get(skill.id);
    if (!input) {
      untouched.push(skill);
      continue;
    }
    const stage = computeMasteryStage(input.progress);
    if (stage === "mastered") continue; // avoid re-surfacing what's already mastered
    const triggers = evaluateSkill(input, now);
    const score = triggers.reduce((sum, t) => sum + t.weight, 0);
    if (score === 0) {
      if (stage === "unknown") untouched.push(skill);
      continue;
    }
    const top = triggers.reduce((a, b) => (b.weight > a.weight ? b : a));
    evidenceCandidates.push({ skill, score, topReason: { key: top.reasonKey, vars: top.reasonVars } });
  }

  evidenceCandidates.sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));

  let pick: CatalogSkill;
  let reasonKey: string;
  let reasonVars: Record<string, string | number>;
  let isExploratory: boolean;

  if (evidenceCandidates.length > 0) {
    const best = evidenceCandidates[0];
    pick = best.skill;
    reasonKey = best.topReason!.key;
    reasonVars = best.topReason!.vars;
    isExploratory = false;
  } else {
    const explorationPool = untouched.length > 0 ? untouched : pool;
    const sorted = [...explorationPool].sort((a, b) => a.id.localeCompare(b.id));
    pick = sorted[day % sorted.length];
    reasonKey = "skills.techniqueOfDay.exploratoryReason";
    reasonVars = { discipline: pick.discipline.name };
    isExploratory = true;
  }

  return {
    id: pick.id,
    name: pick.name,
    slug: pick.slug,
    disciplineName: pick.discipline.name,
    category: pick.category,
    reasonKey,
    reasonVars,
    isExploratory,
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
  revalidateTag("skills-catalog");
  return data.id as string;
}

/** Catalog write — service role only, never exposed to arbitrary users. */
export async function updateSkill(id: string, input: SkillInput): Promise<void> {
  const parsed = skillInputSchema.parse(input);
  const supabase = createServiceClient();
  const { error } = await supabase.from("skills").update(parsed).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTag("skills-catalog");
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
