import { z } from "zod";

export const SESSION_TYPES = ["class", "drilling", "sparring", "competition"] as const;
export const sessionTypeSchema = z.enum(SESSION_TYPES);
export type SessionType = z.infer<typeof sessionTypeSchema>;

export const OBSERVATION_TYPES = ["difficulty", "question", "insight", "success"] as const;
export const observationTypeSchema = z.enum(OBSERVATION_TYPES);
export type ObservationType = z.infer<typeof observationTypeSchema>;

export const REQUIRED_OBSERVATION_TYPES = new Set<ObservationType>(["difficulty", "question"]);

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  class: "Cours",
  drilling: "Drilling",
  sparring: "Sparring",
  competition: "Compétition",
};

export const OBSERVATION_TYPE_LABELS: Record<ObservationType, string> = {
  difficulty: "Difficulté",
  question: "Question",
  insight: "Insight",
  success: "Réussite",
};

export const disciplineSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});
export type Discipline = z.infer<typeof disciplineSchema>;

export const sessionTechniqueInputSchema = z.object({
  technique_name: z.string().trim().min(1, "Nom de technique requis").max(160),
  category: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type SessionTechniqueInput = z.infer<typeof sessionTechniqueInputSchema>;

export const sessionObservationInputSchema = z.object({
  type: observationTypeSchema,
  content: z.string().trim().min(1, "Contenu requis").max(2000),
});
export type SessionObservationInput = z.infer<typeof sessionObservationInputSchema>;

/**
 * Product invariant (docs/decisions/0002): a session must carry at least one
 * `difficulty` or `question` observation. Enforced here for immediate UI
 * feedback, and again in the `create_training_session`/`update_training_session`
 * Postgres functions as the source of truth (docs/decisions/0003).
 */
export function hasRequiredObservation(
  observations: readonly Pick<SessionObservationInput, "type">[],
): boolean {
  return observations.some((o) => REQUIRED_OBSERVATION_TYPES.has(o.type));
}

export const trainingSessionInputSchema = z
  .object({
    date: z.string().date("Date invalide"),
    discipline_id: z.string().uuid("Discipline requise"),
    session_type: sessionTypeSchema,
    title: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v ? v : undefined)),
    duration_minutes: z
      .number()
      .int()
      .positive()
      .max(1000)
      .optional()
      .nullable(),
    rpe: z.number().int().min(1).max(10).optional().nullable(),
    notes: z
      .string()
      .trim()
      .max(4000)
      .optional()
      .transform((v) => (v ? v : undefined)),
    techniques: z.array(sessionTechniqueInputSchema).default([]),
    observations: z
      .array(sessionObservationInputSchema)
      .min(1, "Au moins une observation est requise"),
  })
  .refine((data) => hasRequiredObservation(data.observations), {
    message: "Ajoutez au moins une observation de type difficulté ou question",
    path: ["observations"],
  });

export type TrainingSessionInput = z.infer<typeof trainingSessionInputSchema>;

export const trainingSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  date: z.string(),
  discipline_id: z.string().uuid(),
  session_type: sessionTypeSchema,
  title: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  rpe: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TrainingSession = z.infer<typeof trainingSessionSchema>;
