import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/infra/db/supabase-server";
import type { SkillProgressDimensions } from "@/lib/domain/skill";
import {
  buildTrainingIntelligence,
  buildTrainingPlanSuggestion,
  type SkillIntelligenceInput,
  type SkillObservationSignal,
  type TrainingIntelligenceResult,
  type TrainingPlanResult,
} from "@/lib/domain/training-intelligence";

const defaultProgress: SkillProgressDimensions = {
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
};

/**
 * "Last practiced" decision: this use case derives lastPracticedAt from the
 * max `training_sessions.date` across a skill's `session_techniques`, not
 * from `skill_progress.last_practiced_at` (unmaintained — nothing writes it
 * automatically today) nor from `session_techniques.created_at` (row insert
 * time, not the actual training date, unlike what `getSkill()` currently
 * uses). The session date is the most faithful signal for "when was this
 * skill actually trained".
 */
async function loadSkillIntelligenceInputsUncached(): Promise<SkillIntelligenceInput[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: progressRows }, { data: techniqueRows }, { data: observationRows }] =
    await Promise.all([
      supabase
        .from("skill_progress")
        .select(
          "skill_id, knowledge_level, drilling_reps, live_application_count, sparring_attempt_count, sparring_success_count, consistency_score, pressure_performance_level, confidence_level, evidence_count, last_practiced_at, skill:skills(id, name, category, discipline:disciplines(name))",
        )
        .eq("user_id", user.id),
      supabase
        .from("session_techniques")
        .select("skill_id, skill:skills(id, name, category, discipline:disciplines(name)), session:training_sessions(date)")
        .not("skill_id", "is", null),
      supabase
        .from("session_observations")
        .select(
          "type, content, related_skill_id, skill:skills(id, name, category, discipline:disciplines(name)), session:training_sessions(date)",
        )
        .not("related_skill_id", "is", null)
        .in("type", ["difficulty", "question"]),
    ]);

  type SkillRef = { id: string; name: string; category: string | null; discipline: { name: string } | null };
  type ProgressRow = SkillProgressDimensions & { skill_id: string; skill: SkillRef | null };
  type TechniqueRow = { skill_id: string; skill: SkillRef | null; session: { date: string } | null };
  type ObservationRow = {
    type: "difficulty" | "question";
    content: string;
    related_skill_id: string;
    skill: SkillRef | null;
    session: { date: string } | null;
  };

  const progress = (progressRows ?? []) as unknown as ProgressRow[];
  const techniques = (techniqueRows ?? []) as unknown as TechniqueRow[];
  const observations = (observationRows ?? []) as unknown as ObservationRow[];

  const skillNames = new Map<string, string>();
  const skillMetadata = new Map<string, { category: string | null; disciplineName: string }>();
  const progressBySkill = new Map<string, SkillProgressDimensions>();
  const lastPracticedBySkill = new Map<string, string>();
  const observationsBySkill = new Map<string, SkillObservationSignal[]>();

  for (const row of progress) {
    if (!row.skill) continue;
    skillNames.set(row.skill_id, row.skill.name);
    skillMetadata.set(row.skill_id, { category: row.skill.category, disciplineName: row.skill.discipline?.name ?? "MMA" });
    progressBySkill.set(row.skill_id, {
      knowledge_level: row.knowledge_level,
      drilling_reps: row.drilling_reps,
      live_application_count: row.live_application_count,
      sparring_attempt_count: row.sparring_attempt_count,
      sparring_success_count: row.sparring_success_count,
      consistency_score: row.consistency_score,
      pressure_performance_level: row.pressure_performance_level,
      confidence_level: row.confidence_level,
      evidence_count: row.evidence_count,
      last_practiced_at: row.last_practiced_at,
    });
  }

  for (const row of techniques) {
    if (!row.skill || !row.session?.date) continue;
    skillNames.set(row.skill_id, row.skill.name);
    skillMetadata.set(row.skill_id, { category: row.skill.category, disciplineName: row.skill.discipline?.name ?? "MMA" });
    const current = lastPracticedBySkill.get(row.skill_id);
    if (!current || row.session.date > current) {
      lastPracticedBySkill.set(row.skill_id, row.session.date);
    }
  }

  for (const row of observations) {
    if (!row.skill || !row.session?.date) continue;
    skillNames.set(row.related_skill_id, row.skill.name);
    skillMetadata.set(row.related_skill_id, { category: row.skill.category, disciplineName: row.skill.discipline?.name ?? "MMA" });
    const list = observationsBySkill.get(row.related_skill_id) ?? [];
    list.push({ type: row.type, content: row.content, occurredAt: row.session.date });
    observationsBySkill.set(row.related_skill_id, list);
  }

  const skillIds = Array.from(skillNames.keys());
  if (skillIds.length === 0) return [];

  const { data: relationRows } = await supabase
    .from("skill_relations")
    .select("from_skill_id, to_skill_id, relation_type, prerequisite:to_skill_id(name)")
    .eq("relation_type", "prerequisite")
    .in("from_skill_id", skillIds);

  const prerequisitesBySkill = new Map<string, string[]>();
  for (const row of (relationRows ?? []) as unknown as {
    from_skill_id: string;
    prerequisite: { name: string } | null;
  }[]) {
    if (!row.prerequisite) continue;
    const list = prerequisitesBySkill.get(row.from_skill_id) ?? [];
    list.push(row.prerequisite.name);
    prerequisitesBySkill.set(row.from_skill_id, list);
  }

  return skillIds.map((skillId) => ({
    skillId,
    skillName: skillNames.get(skillId) as string,
    disciplineName: skillMetadata.get(skillId)?.disciplineName,
    category: skillMetadata.get(skillId)?.category,
    progress: progressBySkill.get(skillId) ?? defaultProgress,
    observations: observationsBySkill.get(skillId) ?? [],
    lastPracticedAt: lastPracticedBySkill.get(skillId) ?? null,
    prerequisiteNames: prerequisitesBySkill.get(skillId) ?? [],
  }));
}

/**
 * Deduped per-request via React's `cache()` — coach/dashboard/review each
 * call this (directly or through getTrainingIntelligence/getTrainingPlan/
 * getReviewQueue/getWeeklyReviewDigest/getLastResolvedDifficulty/
 * getTechniqueOfTheDay) and previously fired the same 3-4 Supabase queries
 * once per call, up to 4x on a single /coach render. Same dedup idiom as
 * `getUser()` in supabase-server.ts and the dashboard's local cache() wrappers.
 */
export const loadSkillIntelligenceInputs = cache(loadSkillIntelligenceInputsUncached);

export async function getTrainingIntelligence(): Promise<TrainingIntelligenceResult> {
  const inputs = await loadSkillIntelligenceInputs();
  if (inputs.length === 0) return { status: "insufficient_data" };
  return buildTrainingIntelligence(inputs);
}

/**
 * Training Intelligence V1 + V2 computed from a single fetch, so a caller
 * that needs both the full recommendation list and the single-focus plan
 * (the dashboard) does not issue the underlying queries twice.
 */
export async function getTrainingPlan(): Promise<TrainingPlanResult> {
  const inputs = await loadSkillIntelligenceInputs();
  if (inputs.length === 0) return { status: "insufficient_data" };
  return buildTrainingPlanSuggestion(inputs);
}

export async function getTrainingIntelligenceBundle(): Promise<{
  intelligence: TrainingIntelligenceResult;
  plan: TrainingPlanResult;
}> {
  const inputs = await loadSkillIntelligenceInputs();
  if (inputs.length === 0) {
    return { intelligence: { status: "insufficient_data" }, plan: { status: "insufficient_data" } };
  }
  return { intelligence: buildTrainingIntelligence(inputs), plan: buildTrainingPlanSuggestion(inputs) };
}
