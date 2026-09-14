import { z } from "zod";

export const SKILL_RELATION_TYPES = [
  "prerequisite",
  "counter",
  "variation",
  "follow_up",
  "transition",
  "related",
] as const;
export const skillRelationTypeSchema = z.enum(SKILL_RELATION_TYPES);
export type SkillRelationType = z.infer<typeof skillRelationTypeSchema>;

export const SKILL_RELATION_TYPE_LABELS: Record<SkillRelationType, string> = {
  prerequisite: "Prérequis",
  counter: "Contre",
  variation: "Variation",
  follow_up: "Enchaînement",
  transition: "Transition",
  related: "Lié",
};

export const skillSchema = z.object({
  id: z.string().uuid(),
  discipline_id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Skill = z.infer<typeof skillSchema>;

export const skillInputSchema = z.object({
  discipline_id: z.string().uuid("Discipline requise"),
  name: z.string().trim().min(1, "Nom requis").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug invalide (lettres minuscules, chiffres, tirets)")
    .max(140),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  category: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type SkillInput = z.infer<typeof skillInputSchema>;

export const skillRelationSchema = z
  .object({
    id: z.string().uuid(),
    from_skill_id: z.string().uuid(),
    to_skill_id: z.string().uuid(),
    relation_type: skillRelationTypeSchema,
    metadata: z.record(z.string(), z.unknown()).nullable(),
    created_at: z.string(),
  })
  .refine((r) => r.from_skill_id !== r.to_skill_id, {
    message: "Une compétence ne peut pas être en relation avec elle-même",
    path: ["to_skill_id"],
  });
export type SkillRelation = z.infer<typeof skillRelationSchema>;

export const skillRelationInputSchema = z
  .object({
    from_skill_id: z.string().uuid(),
    to_skill_id: z.string().uuid(),
    relation_type: skillRelationTypeSchema,
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((r) => r.from_skill_id !== r.to_skill_id, {
    message: "Une compétence ne peut pas être en relation avec elle-même",
    path: ["to_skill_id"],
  });
export type SkillRelationInput = z.infer<typeof skillRelationInputSchema>;

/**
 * Raw, independently-measured dimensions behind a skill's progress. Source of
 * truth (docs/decisions/0001) — `mastery_stage` is always derived from these,
 * never stored as the primary signal.
 */
export const skillProgressDimensionsSchema = z.object({
  knowledge_level: z.number().int().min(0).max(5).default(0),
  drilling_reps: z.number().int().min(0).default(0),
  live_application_count: z.number().int().min(0).default(0),
  sparring_attempt_count: z.number().int().min(0).default(0),
  sparring_success_count: z.number().int().min(0).default(0),
  consistency_score: z.number().min(0).max(1).nullable().default(null),
  pressure_performance_level: z.number().int().min(0).max(5).nullable().default(null),
  confidence_level: z.number().int().min(0).max(5).nullable().default(null),
  evidence_count: z.number().int().min(0).default(0),
  last_practiced_at: z.string().nullable().default(null),
});
export type SkillProgressDimensions = z.infer<typeof skillProgressDimensionsSchema>;

export const MASTERY_STAGES = [
  "unknown",
  "introduced",
  "drilling",
  "applying",
  "consistent",
  "mastered",
] as const;
export const masteryStageSchema = z.enum(MASTERY_STAGES);
export type MasteryStage = z.infer<typeof masteryStageSchema>;

export const MASTERY_STAGE_LABELS: Record<MasteryStage, string> = {
  unknown: "Inconnu",
  introduced: "Introduit",
  drilling: "En drilling",
  applying: "Appliqué",
  consistent: "Consistant",
  mastered: "Maîtrisé",
};

/**
 * Pure, deterministic derivation of a skill's mastery stage from its raw
 * dimensions. Only uses directly-measured counters — never claims to infer
 * sparring performance or confidence beyond what was explicitly recorded.
 * Sole place to change when mastery criteria evolve (docs/decisions/0001).
 */
export function computeMasteryStage(progress: SkillProgressDimensions): MasteryStage {
  const successRatio =
    progress.sparring_attempt_count > 0
      ? progress.sparring_success_count / progress.sparring_attempt_count
      : 0;

  if (
    progress.sparring_attempt_count >= 10 &&
    successRatio >= 0.7 &&
    progress.knowledge_level >= 4
  ) {
    return "mastered";
  }

  if (progress.sparring_attempt_count >= 5 && successRatio >= 0.5) {
    return "consistent";
  }

  if (progress.live_application_count >= 1 || progress.sparring_attempt_count >= 1) {
    return "applying";
  }

  if (progress.drilling_reps >= 5) {
    return "drilling";
  }

  if (progress.knowledge_level >= 1 || progress.evidence_count >= 1) {
    return "introduced";
  }

  return "unknown";
}

export type SkillProgressSummary = {
  totalTracked: number;
  stageCounts: Partial<Record<MasteryStage, number>>;
  disciplines: { name: string; count: number }[];
};

/**
 * Pure aggregation of raw skill_progress rows into dashboard-ready counts.
 * Stage is always recomputed via `computeMasteryStage` (never trusts a cached
 * column), so this stays consistent with Training Intelligence V1.
 */
export function summarizeSkillProgress(
  items: { progress: SkillProgressDimensions; disciplineName: string | null }[],
): SkillProgressSummary {
  const stageCounts: Partial<Record<MasteryStage, number>> = {};
  const disciplineCounts = new Map<string, number>();

  for (const item of items) {
    const stage = computeMasteryStage(item.progress);
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;

    if (item.disciplineName) {
      disciplineCounts.set(item.disciplineName, (disciplineCounts.get(item.disciplineName) ?? 0) + 1);
    }
  }

  const disciplines = Array.from(disciplineCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return { totalTracked: items.length, stageCounts, disciplines };
}
