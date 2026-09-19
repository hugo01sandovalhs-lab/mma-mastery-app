import { z } from "zod";

/**
 * Competition tracking primitives (docs/decisions/0009): athletes, matches
 * and sequences. Owner-scoped, reusing the Skill catalog and
 * `training_sessions` (session_type = 'competition') rather than duplicating
 * either.
 */

export const athleteInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(120),
  federation: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  discipline_id: z.string().uuid().optional(),
});
export type AthleteInput = z.infer<typeof athleteInputSchema>;

export const MATCH_RESULTS = ["win", "loss", "draw", "no_contest"] as const;
export const matchResultSchema = z.enum(MATCH_RESULTS);
export type MatchResult = z.infer<typeof matchResultSchema>;

/** i18n dictionary key for each match result — look up via `dict[MATCH_RESULT_LABEL_KEYS[result]]`. */
export const MATCH_RESULT_LABEL_KEYS: Record<
  MatchResult,
  "matchResult.win" | "matchResult.loss" | "matchResult.draw" | "matchResult.no_contest"
> = {
  win: "matchResult.win",
  loss: "matchResult.loss",
  draw: "matchResult.draw",
  no_contest: "matchResult.no_contest",
};

export const matchInputSchema = z.object({
  discipline_id: z.string().uuid("Discipline requise"),
  athlete_id: z.string().uuid().optional(),
  training_session_id: z.string().uuid().optional(),
  event_name: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined)),
  date: z.string().date("Date invalide"),
  result: matchResultSchema.optional(),
  method: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined)),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type MatchInput = z.infer<typeof matchInputSchema>;

export const sequenceInputSchema = z
  .object({
    match_id: z.string().uuid().optional(),
    title: z.string().trim().min(1, "Titre requis").max(160),
    source_url: z
      .string()
      .trim()
      .url("URL invalide")
      .max(2000)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
    timestamp_start: z.number().int().min(0).optional().nullable(),
    timestamp_end: z.number().int().min(0).optional().nullable(),
    skill_id: z.string().uuid().optional(),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .refine(
    (v) => v.timestamp_start == null || v.timestamp_end == null || v.timestamp_end >= v.timestamp_start,
    { message: "La fin doit être après le début", path: ["timestamp_end"] },
  );
export type SequenceInput = z.infer<typeof sequenceInputSchema>;
