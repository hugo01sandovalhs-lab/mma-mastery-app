import { computeMasteryStage, type SkillProgressDimensions } from "./skill";

/**
 * Deterministic "what should I work on now?" engine. Pure domain logic: no
 * Supabase, no React, no randomness. Same input always yields same output
 * (docs requirement: recommendations must be explainable and reproducible).
 */

export const RECENCY_WINDOW_DAYS = 30;
export const STALE_PRACTICE_DAYS = 21;
export const MIN_SPARRING_ATTEMPTS_FOR_SUCCESS_SIGNAL = 3;
export const LOW_SPARRING_SUCCESS_RATIO = 0.5;
export const MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL = 8;
export const MAX_RECOMMENDATIONS = 3;

const SCORE_MEDIUM_THRESHOLD = 2;
const SCORE_HIGH_THRESHOLD = 4;

export type PriorityLevel = "high" | "medium";

export type SkillObservationSignal = {
  type: "difficulty" | "question";
  content: string;
  /** Date (ISO) the observation's training session actually happened. */
  occurredAt: string;
};

export type SkillIntelligenceInput = {
  skillId: string;
  skillName: string;
  progress: SkillProgressDimensions;
  observations: SkillObservationSignal[];
  /** Most recent training session date (ISO) in which this skill was drilled, or null if never. */
  lastPracticedAt: string | null;
  /** Prerequisite skill names, for context only — never a diagnosis driver. */
  prerequisiteNames: string[];
};

export type LocalizedText = { key: string; vars: Record<string, string | number> };

export type SkillRecommendation = {
  skillId: string;
  skillName: string;
  priority: PriorityLevel;
  reasons: LocalizedText[];
  actionKey: string;
  actionVars: Record<string, string | number>;
  prerequisiteContext: string[];
};

export type TrainingIntelligenceResult =
  | { status: "ok"; recommendations: SkillRecommendation[] }
  | { status: "insufficient_data" };

function daysBetween(earlier: string, now: Date): number {
  const ms = now.getTime() - new Date(earlier).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function truncate(text: string, max = 80): string {
  const trimmed = text.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * V2 action taxonomy: what a user should physically do next, derived from
 * which signal fired. Kept separate from the human-readable `actionCandidate`
 * text so the plan UI can branch on a stable value instead of parsing prose.
 */
export const TRAINING_PLAN_ACTION_TYPES = [
  "REVIEW",
  "DRILL",
  "LIVE_APPLICATION",
  "SPARRING_FOCUS",
  "REINFORCE",
] as const;
export type TrainingPlanActionType = (typeof TRAINING_PLAN_ACTION_TYPES)[number];

export type Trigger = {
  weight: number;
  reasonKey: string;
  reasonVars: Record<string, string | number>;
  actionKey: string;
  actionVars: Record<string, string | number>;
  actionType: TrainingPlanActionType;
  /** Short, factual data point behind the reason (counts/dates only, never an inference). */
  evidenceKey: string;
  evidenceVars: Record<string, string | number>;
};

/**
 * Evaluates a single skill's raw signals into weighted triggers. Never fires
 * on absence of data, and requires a minimum sample size before drawing any
 * conclusion from sparring success rate (a single 0/1 attempt proves nothing).
 */
/**
 * Exported so callers outside V1/V2 (e.g. Technique of the Day) can reuse the
 * exact same evidence-based triggers instead of re-deriving their own scoring
 * — one source of truth for "why does this skill deserve attention".
 */
export function evaluateSkill(input: SkillIntelligenceInput, now: Date): Trigger[] {
  const triggers: Trigger[] = [];
  const stage = computeMasteryStage(input.progress);

  const recentDifficulties = input.observations.filter(
    (o) => o.type === "difficulty" && daysBetween(o.occurredAt, now) <= RECENCY_WINDOW_DAYS,
  );
  if (recentDifficulties.length > 0) {
    const mostRecent = recentDifficulties.reduce((a, b) =>
      new Date(a.occurredAt) > new Date(b.occurredAt) ? a : b,
    );
    triggers.push({
      weight: 3,
      reasonKey: "trainingIntel.difficulty.reason",
      reasonVars: { content: truncate(mostRecent.content) },
      actionKey: "trainingIntel.difficulty.action",
      actionVars: {},
      actionType: "REVIEW",
      evidenceKey: "trainingIntel.difficulty.evidence",
      evidenceVars: { days: daysBetween(mostRecent.occurredAt, now), content: truncate(mostRecent.content) },
    });
  }
  if (recentDifficulties.length >= 2) {
    triggers.push({
      weight: 2,
      reasonKey: "trainingIntel.recurringDifficulty.reason",
      reasonVars: { count: recentDifficulties.length },
      actionKey: "trainingIntel.recurringDifficulty.action",
      actionVars: {},
      actionType: "REVIEW",
      evidenceKey: "trainingIntel.recurringDifficulty.evidence",
      evidenceVars: { count: recentDifficulties.length, days: RECENCY_WINDOW_DAYS },
    });
  }

  const recentQuestions = input.observations.filter(
    (o) => o.type === "question" && daysBetween(o.occurredAt, now) <= RECENCY_WINDOW_DAYS,
  );
  if (recentQuestions.length > 0) {
    const mostRecent = recentQuestions.reduce((a, b) =>
      new Date(a.occurredAt) > new Date(b.occurredAt) ? a : b,
    );
    triggers.push({
      weight: 2,
      reasonKey: "trainingIntel.question.reason",
      reasonVars: { content: truncate(mostRecent.content) },
      actionKey: "trainingIntel.question.action",
      actionVars: {},
      actionType: "REVIEW",
      evidenceKey: "trainingIntel.question.evidence",
      evidenceVars: { days: daysBetween(mostRecent.occurredAt, now), content: truncate(mostRecent.content) },
    });
  }

  if (
    input.progress.drilling_reps >= MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL &&
    input.progress.live_application_count === 0
  ) {
    triggers.push({
      weight: 2,
      reasonKey: "trainingIntel.liveTransfer.reason",
      reasonVars: { reps: input.progress.drilling_reps },
      actionKey: "trainingIntel.liveTransfer.action",
      actionVars: {},
      actionType: "LIVE_APPLICATION",
      evidenceKey: "trainingIntel.liveTransfer.evidence",
      evidenceVars: { reps: input.progress.drilling_reps },
    });
  }

  if (input.progress.sparring_attempt_count >= MIN_SPARRING_ATTEMPTS_FOR_SUCCESS_SIGNAL) {
    const ratio = input.progress.sparring_success_count / input.progress.sparring_attempt_count;
    if (ratio < LOW_SPARRING_SUCCESS_RATIO) {
      triggers.push({
        weight: 3,
        reasonKey: "trainingIntel.sparringLow.reason",
        reasonVars: { success: input.progress.sparring_success_count, attempts: input.progress.sparring_attempt_count },
        actionKey: "trainingIntel.sparringLow.action",
        actionVars: {},
        actionType: "SPARRING_FOCUS",
        evidenceKey: "trainingIntel.sparringLow.evidence",
        evidenceVars: { success: input.progress.sparring_success_count, attempts: input.progress.sparring_attempt_count },
      });
    }
  }

  if (input.lastPracticedAt && stage !== "unknown") {
    const days = daysBetween(input.lastPracticedAt, now);
    if (days >= STALE_PRACTICE_DAYS) {
      triggers.push({
        weight: 1,
        reasonKey: "trainingIntel.stale.reason",
        reasonVars: { days },
        actionKey: "trainingIntel.stale.action",
        actionVars: {},
        actionType: "REINFORCE",
        evidenceKey: "trainingIntel.stale.evidence",
        evidenceVars: { days },
      });
    }
  }

  if (stage === "introduced" || stage === "drilling") {
    triggers.push({
      weight: 1,
      reasonKey: "trainingIntel.developing.reason",
      reasonVars: {},
      actionKey: "trainingIntel.developing.action",
      actionVars: {},
      actionType: "DRILL",
      evidenceKey: "trainingIntel.developing.evidence",
      evidenceVars: { stage },
    });
  }

  return triggers;
}

function priorityFromScore(score: number): PriorityLevel | null {
  if (score >= SCORE_HIGH_THRESHOLD) return "high";
  if (score >= SCORE_MEDIUM_THRESHOLD) return "medium";
  return null;
}

export function buildTrainingIntelligence(
  inputs: SkillIntelligenceInput[],
  now: Date = new Date(),
): TrainingIntelligenceResult {
  const candidates: SkillRecommendation[] = [];

  for (const input of inputs) {
    const triggers = evaluateSkill(input, now);
    const score = triggers.reduce((sum, t) => sum + t.weight, 0);
    const priority = priorityFromScore(score);
    if (!priority) continue;

    const topTrigger = triggers.reduce((a, b) => (b.weight > a.weight ? b : a));

    candidates.push({
      skillId: input.skillId,
      skillName: input.skillName,
      priority,
      reasons: triggers.map((t) => ({ key: t.reasonKey, vars: t.reasonVars })),
      actionKey: topTrigger.actionKey,
      actionVars: topTrigger.actionVars,
      prerequisiteContext: input.prerequisiteNames,
    });
  }

  if (candidates.length === 0) {
    return { status: "insufficient_data" };
  }

  const priorityWeight: Record<PriorityLevel, number> = { high: 1, medium: 0 };
  candidates.sort((a, b) => {
    const byPriority = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (byPriority !== 0) return byPriority;
    return a.skillName.localeCompare(b.skillName);
  });

  return { status: "ok", recommendations: candidates.slice(0, MAX_RECOMMENDATIONS) };
}

/**
 * Training Intelligence V2: a single, explainable plan for the next session
 * ("what should I do, and why"), built on top of the same deterministic
 * triggers as V1. Never fabricates duration or confidence — a field is only
 * populated when the underlying data supports it.
 */
export type TrainingPlanSuggestion = {
  focusSkillId: string;
  focusSkillName: string;
  actionType: TrainingPlanActionType;
  objectiveKey: string;
  objectiveVars: Record<string, string | number>;
  reasons: LocalizedText[];
  evidence: LocalizedText[];
  relatedSkills: string[];
};

export type TrainingPlanResult =
  | { status: "ok"; plan: TrainingPlanSuggestion }
  | { status: "insufficient_data" };

/**
 * Generic, per-actionType coaching copy for what to look for during drilling,
 * live application and post-session review. This is fixed UX text, not a
 * per-user inference — the data-driven part is which actionType applies.
 */
export const TRAINING_PLAN_ACTION_COPY: Record<
  TrainingPlanActionType,
  { drillHintKey: string; liveWatchForKey: string; postObserveKey: string }
> = {
  REVIEW: {
    drillHintKey: "trainingPlanCopy.REVIEW.drillHint",
    liveWatchForKey: "trainingPlanCopy.REVIEW.liveWatchFor",
    postObserveKey: "trainingPlanCopy.REVIEW.postObserve",
  },
  DRILL: {
    drillHintKey: "trainingPlanCopy.DRILL.drillHint",
    liveWatchForKey: "trainingPlanCopy.DRILL.liveWatchFor",
    postObserveKey: "trainingPlanCopy.DRILL.postObserve",
  },
  LIVE_APPLICATION: {
    drillHintKey: "trainingPlanCopy.LIVE_APPLICATION.drillHint",
    liveWatchForKey: "trainingPlanCopy.LIVE_APPLICATION.liveWatchFor",
    postObserveKey: "trainingPlanCopy.LIVE_APPLICATION.postObserve",
  },
  SPARRING_FOCUS: {
    drillHintKey: "trainingPlanCopy.SPARRING_FOCUS.drillHint",
    liveWatchForKey: "trainingPlanCopy.SPARRING_FOCUS.liveWatchFor",
    postObserveKey: "trainingPlanCopy.SPARRING_FOCUS.postObserve",
  },
  REINFORCE: {
    drillHintKey: "trainingPlanCopy.REINFORCE.drillHint",
    liveWatchForKey: "trainingPlanCopy.REINFORCE.liveWatchFor",
    postObserveKey: "trainingPlanCopy.REINFORCE.postObserve",
  },
};

/**
 * Picks the single skill with the strongest combined signal and turns it into
 * one actionable plan. Reuses the exact same triggers as V1, so a skill only
 * becomes the focus if it would also have surfaced as a V1 recommendation.
 */
export function buildTrainingPlanSuggestion(
  inputs: SkillIntelligenceInput[],
  now: Date = new Date(),
): TrainingPlanResult {
  let best: { input: SkillIntelligenceInput; triggers: Trigger[]; score: number } | null = null;

  for (const input of inputs) {
    const triggers = evaluateSkill(input, now);
    const score = triggers.reduce((sum, t) => sum + t.weight, 0);
    if (!priorityFromScore(score)) continue;

    if (
      !best ||
      score > best.score ||
      (score === best.score && input.skillName.localeCompare(best.input.skillName) < 0)
    ) {
      best = { input, triggers, score };
    }
  }

  if (!best) return { status: "insufficient_data" };

  const topTrigger = best.triggers.reduce((a, b) => (b.weight > a.weight ? b : a));

  return {
    status: "ok",
    plan: {
      focusSkillId: best.input.skillId,
      focusSkillName: best.input.skillName,
      actionType: topTrigger.actionType,
      objectiveKey: topTrigger.actionKey,
      objectiveVars: topTrigger.actionVars,
      reasons: best.triggers.map((t) => ({ key: t.reasonKey, vars: t.reasonVars })),
      evidence: best.triggers.map((t) => ({ key: t.evidenceKey, vars: t.evidenceVars })),
      relatedSkills: best.input.prerequisiteNames,
    },
  };
}
