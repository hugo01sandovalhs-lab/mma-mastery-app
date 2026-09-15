import { z } from "zod";

/**
 * Knowledge base primitives (docs/decisions/0008): resources, bookmarks,
 * study queue and skill notes. All owner-scoped (user's own curated links and
 * notes, not a shared moderated catalog — see ADR for why) so there is no
 * admin/service-role step required before a user can use any of this.
 */

export const RESOURCE_TYPES = ["video", "article", "channel", "course"] as const;
export const resourceTypeSchema = z.enum(RESOURCE_TYPES);
export type ResourceType = z.infer<typeof resourceTypeSchema>;

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  video: "Vidéo",
  article: "Article",
  channel: "Chaîne",
  course: "Cours",
};

export const resourceInputSchema = z.object({
  type: resourceTypeSchema,
  title: z.string().trim().min(1, "Titre requis").max(160),
  author: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : undefined)),
  url: z.string().trim().url("URL invalide").max(2000),
  skill_id: z.string().uuid().optional(),
  /** Timestamp in the source video this resource points to, if applicable. Never a re-hosted video. */
  timestamp_seconds: z.number().int().min(0).optional().nullable(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type ResourceInput = z.infer<typeof resourceInputSchema>;

export const BOOKMARK_TARGET_TYPES = ["skill", "resource"] as const;
export const bookmarkTargetTypeSchema = z.enum(BOOKMARK_TARGET_TYPES);
export type BookmarkTargetType = z.infer<typeof bookmarkTargetTypeSchema>;

export const STUDY_STATUSES = ["queued", "studying", "studied"] as const;
export const studyStatusSchema = z.enum(STUDY_STATUSES);
export type StudyStatus = z.infer<typeof studyStatusSchema>;

export const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  queued: "À étudier",
  studying: "En cours",
  studied: "Étudié",
};

export const skillNoteInputSchema = z.object({
  skill_id: z.string().uuid(),
  content: z.string().trim().min(1, "Contenu requis").max(4000),
});
export type SkillNoteInput = z.infer<typeof skillNoteInputSchema>;

export const GOAL_HORIZONS = ["short", "medium", "long"] as const;
export const goalHorizonSchema = z.enum(GOAL_HORIZONS);
export type GoalHorizon = z.infer<typeof goalHorizonSchema>;

export const GOAL_HORIZON_LABELS: Record<GoalHorizon, string> = {
  short: "Court terme",
  medium: "Moyen terme",
  long: "Long terme",
};

export const GOAL_STATUSES = ["active", "done", "abandoned"] as const;
export const goalStatusSchema = z.enum(GOAL_STATUSES);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: "En cours",
  done: "Atteint",
  abandoned: "Abandonné",
};

export const goalInputSchema = z.object({
  horizon: goalHorizonSchema,
  title: z.string().trim().min(1, "Titre requis").max(160),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  skill_id: z.string().uuid().optional(),
  due_date: z
    .string()
    .date("Date invalide")
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type GoalInput = z.infer<typeof goalInputSchema>;
