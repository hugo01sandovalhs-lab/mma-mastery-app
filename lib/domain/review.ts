import { computeMasteryStage } from "./skill";
import {
  MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL,
  RECENCY_WINDOW_DAYS,
  STALE_PRACTICE_DAYS,
  type SkillIntelligenceInput,
} from "./training-intelligence";

/**
 * Learning/review loop: a flat, explainable "to review" list built directly
 * from raw signals (unlike Training Intelligence, which scores and picks a
 * single focus). No spaced-repetition scheduling — there is no primitive for
 * it in the data model yet, so this only surfaces what is already known:
 * unresolved questions/difficulties, and skills going stale or still
 * developing.
 */

export const REVIEW_ITEM_TYPES = ["question", "difficulty", "stale", "developing", "never_applied"] as const;
export type ReviewItemType = (typeof REVIEW_ITEM_TYPES)[number];

/** i18n dictionary key for each review item type — look up via `dict[REVIEW_ITEM_TYPE_LABEL_KEYS[type]]`. */
export const REVIEW_ITEM_TYPE_LABEL_KEYS: Record<ReviewItemType, `reviewItemType.${ReviewItemType}`> = {
  question: "reviewItemType.question",
  difficulty: "reviewItemType.difficulty",
  stale: "reviewItemType.stale",
  developing: "reviewItemType.developing",
  never_applied: "reviewItemType.never_applied",
};

/**
 * `detailKey` is an i18n dictionary key (under `review.detail.*`) and
 * `detailVars` its interpolation vars — translate at render time via
 * `formatT(dict[item.detailKey], item.detailVars)`. `developingStage`'s
 * `stage` var is a raw `MasteryStage` code, not a translated string: resolve
 * it through `MASTERY_STAGE_LABEL_KEYS` first if it needs to appear inline.
 */
export type ReviewItem = {
  skillId: string;
  skillName: string;
  type: ReviewItemType;
  detailKey: string;
  detailVars: Record<string, string | number>;
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
  const neverApplied: ReviewItem[] = [];

  for (const input of inputs) {
    for (const obs of input.observations) {
      if (daysBetween(obs.occurredAt, now) > RECENCY_WINDOW_DAYS) continue;
      const item: ReviewItem = {
        skillId: input.skillId,
        skillName: input.skillName,
        type: obs.type,
        detailKey: "review.detail.quoted",
        detailVars: { content: truncate(obs.content) },
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
        detailKey: "review.detail.stale",
        detailVars: { days: daysBetween(input.lastPracticedAt, now) },
        occurredAt: input.lastPracticedAt,
      });
    } else if ((stage === "introduced" || stage === "drilling") && !input.lastPracticedAt) {
      developing.push({
        skillId: input.skillId,
        skillName: input.skillName,
        type: "developing",
        detailKey: "review.detail.developingStage",
        detailVars: { stage },
        occurredAt: null,
      });
    }

    if (
      input.progress.drilling_reps >= MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL &&
      input.progress.live_application_count === 0 &&
      input.progress.sparring_attempt_count === 0
    ) {
      neverApplied.push({
        skillId: input.skillId,
        skillName: input.skillName,
        type: "never_applied",
        detailKey: "review.detail.neverApplied",
        detailVars: { reps: input.progress.drilling_reps },
        occurredAt: input.lastPracticedAt,
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
    ...neverApplied.sort(byRecency).slice(0, limitPerType),
  ];
}

const WEEK_DAYS = 7;

export type WeeklyReviewDigest = {
  skillsTouchedCount: number;
  questionCount: number;
  difficultyCount: number;
};

/**
 * "Review this week": a pure count of what actually got logged in the last 7
 * days, from the same observation data `buildReviewQueue` uses — no separate
 * fetch, no inference, just a tighter time window.
 */
export function buildWeeklyReviewDigest(
  inputs: SkillIntelligenceInput[],
  now: Date = new Date(),
): WeeklyReviewDigest {
  const skillsTouched = new Set<string>();
  let questionCount = 0;
  let difficultyCount = 0;

  for (const input of inputs) {
    for (const obs of input.observations) {
      if (daysBetween(obs.occurredAt, now) > WEEK_DAYS) continue;
      skillsTouched.add(input.skillId);
      if (obs.type === "question") questionCount += 1;
      else difficultyCount += 1;
    }
  }

  return { skillsTouchedCount: skillsTouched.size, questionCount, difficultyCount };
}

export type ResolvedDifficulty = {
  skillId: string;
  skillName: string;
  detailKey: string;
  detailVars: Record<string, string | number>;
  occurredAt: string;
};

/**
 * "Last difficulty resolved": the most recent difficulty observation that has
 * aged out of the active review window (`RECENCY_WINDOW_DAYS`) with no newer
 * difficulty logged for that same skill since. This never claims mastery —
 * it only reports that a flagged difficulty has gone quiet, which is a fact
 * directly derivable from existing observation dates, not an invented one.
 */
export function findLastResolvedDifficulty(
  inputs: SkillIntelligenceInput[],
  now: Date = new Date(),
): ResolvedDifficulty | null {
  let best: ResolvedDifficulty | null = null;

  for (const input of inputs) {
    const difficulties = input.observations.filter((o) => o.type === "difficulty");
    if (difficulties.length === 0) continue;
    const mostRecent = difficulties.reduce((a, b) => (new Date(a.occurredAt) > new Date(b.occurredAt) ? a : b));
    if (daysBetween(mostRecent.occurredAt, now) < RECENCY_WINDOW_DAYS) continue;

    if (!best || new Date(mostRecent.occurredAt) > new Date(best.occurredAt)) {
      best = {
        skillId: input.skillId,
        skillName: input.skillName,
        detailKey: "review.detail.quoted",
        detailVars: { content: truncate(mostRecent.content) },
        occurredAt: mostRecent.occurredAt,
      };
    }
  }

  return best;
}
