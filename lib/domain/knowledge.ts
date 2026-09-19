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

/** i18n dictionary key for each enum value — look up via `dict[RESOURCE_TYPE_LABEL_KEYS[type]]`. */
export const RESOURCE_TYPE_LABEL_KEYS: Record<
  ResourceType,
  "resourceType.video" | "resourceType.article" | "resourceType.channel" | "resourceType.course"
> = {
  video: "resourceType.video",
  article: "resourceType.article",
  channel: "resourceType.channel",
  course: "resourceType.course",
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

/** i18n dictionary key for each enum value — look up via `dict[STUDY_STATUS_LABEL_KEYS[status]]`. */
export const STUDY_STATUS_LABEL_KEYS: Record<
  StudyStatus,
  "studyStatus.queued" | "studyStatus.studying" | "studyStatus.studied"
> = {
  queued: "studyStatus.queued",
  studying: "studyStatus.studying",
  studied: "studyStatus.studied",
};

export const skillNoteInputSchema = z.object({
  skill_id: z.string().uuid(),
  content: z.string().trim().min(1, "Contenu requis").max(4000),
});
export type SkillNoteInput = z.infer<typeof skillNoteInputSchema>;

export const GOAL_HORIZONS = ["short", "medium", "long"] as const;
export const goalHorizonSchema = z.enum(GOAL_HORIZONS);
export type GoalHorizon = z.infer<typeof goalHorizonSchema>;

/** i18n dictionary key for each enum value — look up via `dict[GOAL_HORIZON_LABEL_KEYS[horizon]]`. */
export const GOAL_HORIZON_LABEL_KEYS: Record<
  GoalHorizon,
  "goalHorizon.short" | "goalHorizon.medium" | "goalHorizon.long"
> = {
  short: "goalHorizon.short",
  medium: "goalHorizon.medium",
  long: "goalHorizon.long",
};

export const GOAL_STATUSES = ["active", "done", "abandoned"] as const;
export const goalStatusSchema = z.enum(GOAL_STATUSES);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

/** i18n dictionary key for each enum value — look up via `dict[GOAL_STATUS_LABEL_KEYS[status]]`. */
export const GOAL_STATUS_LABEL_KEYS: Record<
  GoalStatus,
  "goalStatus.active" | "goalStatus.done" | "goalStatus.abandoned"
> = {
  active: "goalStatus.active",
  done: "goalStatus.done",
  abandoned: "goalStatus.abandoned",
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
