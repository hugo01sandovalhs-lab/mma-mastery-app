import { computeMasteryStage, MASTERY_STAGE_LABELS, type SkillProgressDimensions } from "./skill";

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

export type SkillRecommendation = {
  skillId: string;
  skillName: string;
  priority: PriorityLevel;
  reasons: string[];
  action: string;
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

type Trigger = {
  weight: number;
  reason: string;
  actionCandidate: string;
  actionType: TrainingPlanActionType;
  /** Short, factual data point behind the reason (counts/dates only, never an inference). */
  evidence: string;
};

/**
 * Evaluates a single skill's raw signals into weighted triggers. Never fires
 * on absence of data, and requires a minimum sample size before drawing any
 * conclusion from sparring success rate (a single 0/1 attempt proves nothing).
 */
function evaluateSkill(input: SkillIntelligenceInput, now: Date): Trigger[] {
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
      reason: `Difficulté signalée récemment: "${truncate(mostRecent.content)}"`,
      actionCandidate: "Retravailler ce point en drilling ciblé avant de le remettre en application.",
      actionType: "REVIEW",
      evidence: `Difficulté notée il y a ${daysBetween(mostRecent.occurredAt, now)} jour(s): "${truncate(mostRecent.content)}"`,
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
      reason: `Question récente non résolue: "${truncate(mostRecent.content)}"`,
      actionCandidate: "Clarifier ce point (coach ou révision technique) avant la prochaine séance.",
      actionType: "REVIEW",
      evidence: `Question notée il y a ${daysBetween(mostRecent.occurredAt, now)} jour(s): "${truncate(mostRecent.content)}"`,
    });
  }

  if (
    input.progress.drilling_reps >= MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL &&
    input.progress.live_application_count === 0
  ) {
    triggers.push({
      weight: 2,
      reason: `${input.progress.drilling_reps} répétitions en drilling mais aucune application en situation live`,
      actionCandidate: "Passer du drilling à de l'application live ou du sparring léger.",
      actionType: "LIVE_APPLICATION",
      evidence: `${input.progress.drilling_reps} reps en drilling, 0 application live`,
    });
  }

  if (input.progress.sparring_attempt_count >= MIN_SPARRING_ATTEMPTS_FOR_SUCCESS_SIGNAL) {
    const ratio = input.progress.sparring_success_count / input.progress.sparring_attempt_count;
    if (ratio < LOW_SPARRING_SUCCESS_RATIO) {
      triggers.push({
        weight: 3,
        reason: `Faible réussite en sparring: ${input.progress.sparring_success_count}/${input.progress.sparring_attempt_count} tentatives`,
        actionCandidate: "Isoler ce mouvement en sparring contrôlé pour identifier le blocage.",
        actionType: "SPARRING_FOCUS",
        evidence: `${input.progress.sparring_success_count}/${input.progress.sparring_attempt_count} tentatives réussies en sparring`,
      });
    }
  }

  if (input.lastPracticedAt && stage !== "unknown") {
    const days = daysBetween(input.lastPracticedAt, now);
    if (days >= STALE_PRACTICE_DAYS) {
      triggers.push({
        weight: 1,
        reason: `Non pratiqué depuis ${days} jours`,
        actionCandidate: "Reprogrammer ce skill dans une prochaine séance.",
        actionType: "REINFORCE",
        evidence: `Dernière pratique il y a ${days} jours`,
      });
    }
  }

  if (stage === "introduced" || stage === "drilling") {
    triggers.push({
      weight: 1,
      reason: "Compétence encore en développement (pas encore appliquée en situation live)",
      actionCandidate: "Continuer le drilling puis chercher une première application live.",
      actionType: "DRILL",
      evidence: `Stage actuel: ${MASTERY_STAGE_LABELS[stage]}`,
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
      reasons: triggers.map((t) => t.reason),
      action: topTrigger.actionCandidate,
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
  objective: string;
  reasons: string[];
  evidence: string[];
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
  { drillHint: string; liveWatchFor: string; postObserve: string }
> = {
  REVIEW: {
    drillHint: "Clarifie le point technique signalé avant de le refaire à vitesse.",
    liveWatchFor: "Vérifie si le point signalé revient en situation live.",
    postObserve: "Note si la difficulté ou la question a été résolue ou si elle persiste.",
  },
  DRILL: {
    drillHint: "Continue le drilling technique isolé, en te concentrant sur la mécanique.",
    liveWatchFor: "Cherche une première occasion de l'utiliser en situation live contrôlée.",
    postObserve: "Note si le mouvement sort naturellement ou reste hésitant.",
  },
  LIVE_APPLICATION: {
    drillHint: "Quelques répétitions d'échauffement suffisent, l'accent est ailleurs.",
    liveWatchFor: "Cherche activement à placer ce mouvement en application live ou en sparring léger.",
    postObserve: "Note combien de fois tu as réussi à le placer, et dans quel contexte.",
  },
  SPARRING_FOCUS: {
    drillHint: "Isole le mouvement en drilling avant de le remettre sous pression.",
    liveWatchFor: "En sparring, cherche uniquement ce mouvement pour comprendre ce qui bloque.",
    postObserve: "Note le moment précis où ça échoue (timing, distance, réaction adverse...).",
  },
  REINFORCE: {
    drillHint: "Refais quelques séries pour retrouver la mémoire motrice.",
    liveWatchFor: "Reteste-le en situation live pour vérifier qu'il reste fonctionnel.",
    postObserve: "Note si le niveau a baissé depuis la dernière pratique.",
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
      objective: topTrigger.actionCandidate,
      reasons: best.triggers.map((t) => t.reason),
      evidence: best.triggers.map((t) => t.evidence),
      relatedSkills: best.input.prerequisiteNames,
    },
  };
}
