import { computeMasteryStage, MASTERY_STAGE_LABELS } from "./skill";
import { RECENCY_WINDOW_DAYS, STALE_PRACTICE_DAYS, type SkillIntelligenceInput } from "./training-intelligence";

/**
 * Learning/review loop: a flat, explainable "to review" list built directly
 * from raw signals (unlike Training Intelligence, which scores and picks a
 * single focus). No spaced-repetition scheduling — there is no primitive for
 * it in the data model yet, so this only surfaces what is already known:
 * unresolved questions/difficulties, and skills going stale or still
 * developing.
 */

export const REVIEW_ITEM_TYPES = ["question", "difficulty", "stale", "developing"] as const;
export type ReviewItemType = (typeof REVIEW_ITEM_TYPES)[number];

export const REVIEW_ITEM_TYPE_LABELS: Record<ReviewItemType, string> = {
  question: "Question en attente",
  difficulty: "Difficulté signalée",
  stale: "Pratique arrêtée",
  developing: "En développement",
};

export type ReviewItem = {
  skillId: string;
  skillName: string;
  type: ReviewItemType;
  detail: string;
  /** ISO date driving the sort order within a type; null when not date-based. */
  occurredAt: string | null;
};

function truncate(text: string, max = 100): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function daysBetween(earlier: string, now: Date): number {
  const ms = now.getTime() - new Date(earlier).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

const DEFAULT_LIMIT_PER_TYPE = 5;

/**
 * Builds the review queue for one signal type at a time, most recent first,
 * capped per type so one noisy skill can't crowd out everything else.
 */
export function buildReviewQueue(
  inputs: SkillIntelligenceInput[],
  now: Date = new Date(),
  limitPerType = DEFAULT_LIMIT_PER_TYPE,
): ReviewItem[] {
  const questions: ReviewItem[] = [];
  const difficulties: ReviewItem[] = [];
  const stale: ReviewItem[] = [];
  const developing: ReviewItem[] = [];

  for (const input of inputs) {
    for (const obs of input.observations) {
      if (daysBetween(obs.occurredAt, now) > RECENCY_WINDOW_DAYS) continue;
      const item: ReviewItem = {
        skillId: input.skillId,
        skillName: input.skillName,
        type: obs.type,
        detail: `"${truncate(obs.content)}"`,
        occurredAt: obs.occurredAt,
      };
      if (obs.type === "question") questions.push(item);
      else difficulties.push(item);
    }

    const stage = computeMasteryStage(input.progress);

    if (input.lastPracticedAt && daysBetween(input.lastPracticedAt, now) >= STALE_PRACTICE_DAYS) {
      stale.push({
        skillId: input.skillId,
        skillName: input.skillName,
        type: "stale",
        detail: `Non pratiqué depuis ${daysBetween(input.lastPracticedAt, now)} jours`,
        occurredAt: input.lastPracticedAt,
      });
    } else if ((stage === "introduced" || stage === "drilling") && !input.lastPracticedAt) {
      developing.push({
        skillId: input.skillId,
        skillName: input.skillName,
        type: "developing",
        detail: `Stade actuel: ${MASTERY_STAGE_LABELS[stage]}, pas encore de séance liée`,
        occurredAt: null,
      });
    }
  }

  const byRecency = (a: ReviewItem, b: ReviewItem) => {
    if (!a.occurredAt || !b.occurredAt) return a.skillName.localeCompare(b.skillName);
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime();
  };

  return [
    ...questions.sort(byRecency).slice(0, limitPerType),
    ...difficulties.sort(byRecency).slice(0, limitPerType),
    ...stale.sort(byRecency).slice(0, limitPerType),
    ...developing.sort(byRecency).slice(0, limitPerType),
  ];
}
