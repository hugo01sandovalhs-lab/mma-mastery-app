import { z } from "zod";

/**
 * Club events / competitions (docs/decisions/0007, P3.5): a club-organized
 * event with self-service member registration. Results/reporting reuse the
 * existing personal competition tracking (`lib/domain/competition.ts`)
 * rather than a parallel results model.
 */

export const EVENT_TYPES = ["interclub", "competition", "seminar", "event"] as const;
export const eventTypeSchema = z.enum(EVENT_TYPES);
export type EventType = z.infer<typeof eventTypeSchema>;

/**
 * French-only labels — kept for the few call sites not yet converted to
 * `getServerLocale()`/`useI18n()`. Locale-aware call sites should use
 * `EVENT_TYPE_LABEL_KEYS` with the active dictionary instead.
 */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  interclub: "Interclub",
  competition: "Compétition",
  seminar: "Stage",
  event: "Événement",
};

/** i18n dictionary key for each event type — look up via `dict[EVENT_TYPE_LABEL_KEYS[type]]`. */
export const EVENT_TYPE_LABEL_KEYS: Record<
  EventType,
  "eventType.interclub" | "eventType.competition" | "eventType.seminar" | "eventType.event"
> = {
  interclub: "eventType.interclub",
  competition: "eventType.competition",
  seminar: "eventType.seminar",
  event: "eventType.event",
};

export const REGISTRATION_STATUSES = ["registered", "cancelled"] as const;
export const registrationStatusSchema = z.enum(REGISTRATION_STATUSES);
export type RegistrationStatus = z.infer<typeof registrationStatusSchema>;

export const clubEventInputSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(160),
  event_type: eventTypeSchema.default("event"),
  starts_at: z.string().trim().min(1, "Date requise"),
  location: z
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
export type ClubEventInput = z.infer<typeof clubEventInputSchema>;

export function isUpcoming(startsAt: string): boolean {
  return new Date(startsAt).getTime() > Date.now();
}
