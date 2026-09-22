import type { SessionTechniqueOutcome } from "./training";

/**
 * A sparring round is a `session_techniques` row logged under a `sparring`
 * session (docs/decisions/0008) — no separate table. These pure functions
 * summarize rounds already fetched by a use case; no I/O here.
 */
export type SparringRoundLike = {
  technique_name: string;
  outcome: SessionTechniqueOutcome | null;
  problem: string | null;
  position?: string | null;
};

export type SparringSummary = {
  attempts: number;
  successes: number;
  /** null when no round has a recorded outcome yet — never fabricate a ratio (docs/decisions/0006). */
  successRate: number | null;
  recurringDifficulties: { problem: string; count: number }[];
};

const DEFAULT_MIN_RECURRENCE = 2;
const DEFAULT_RECURRING_LIMIT = 5;

/**
 * Attempts/successes only count rounds with a recorded `outcome` — an
 * unscored round proves nothing either way (same invariant the
 * `sync_skill_progress_for_skill` trigger enforces at the DB layer).
 */
export function summarizeSparringRounds(
  rounds: readonly SparringRoundLike[],
  minRecurrence = DEFAULT_MIN_RECURRENCE,
  recurringLimit = DEFAULT_RECURRING_LIMIT,
): SparringSummary {
  const attempts = rounds.filter((r) => r.outcome !== null).length;
  const successes = rounds.filter((r) => r.outcome === "success").length;

  const counts = new Map<string, { problem: string; count: number }>();
  for (const round of rounds) {
    const problem = round.problem?.trim();
    if (!problem) continue;
    const key = problem.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, { problem: existing?.problem ?? problem, count: (existing?.count ?? 0) + 1 });
  }

  const recurringDifficulties = Array.from(counts.values())
    .filter((entry) => entry.count >= minRecurrence)
    .sort((a, b) => b.count - a.count || a.problem.localeCompare(b.problem))
    .slice(0, recurringLimit);

  return {
    attempts,
    successes,
    successRate: attempts > 0 ? successes / attempts : null,
    recurringDifficulties,
  };
}

export type PositionBreakdownEntry = { position: string; attempts: number; successRate: number };

const DEFAULT_MIN_POSITION_ATTEMPTS = 2;
const DEFAULT_POSITION_LIMIT = 5;

/**
 * Groups rounds by `position` (only rounds with both a position and a
 * recorded outcome count) and splits them into weak spots (low success
 * rate) and strong spots (high success rate), each requiring a minimum
 * sample size so a single lucky/unlucky round can't look like a pattern.
 */
export function summarizePositionBreakdown(
  rounds: readonly SparringRoundLike[],
  minAttempts = DEFAULT_MIN_POSITION_ATTEMPTS,
  limit = DEFAULT_POSITION_LIMIT,
): { weakPositions: PositionBreakdownEntry[]; strongPositions: PositionBreakdownEntry[] } {
  const counts = new Map<string, { position: string; attempts: number; successes: number }>();
  for (const round of rounds) {
    const position = round.position?.trim();
    if (!position || round.outcome === null) continue;
    const key = position.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, {
      position: existing?.position ?? position,
      attempts: (existing?.attempts ?? 0) + 1,
      successes: (existing?.successes ?? 0) + (round.outcome === "success" ? 1 : 0),
    });
  }

  const entries: PositionBreakdownEntry[] = Array.from(counts.values())
    .filter((e) => e.attempts >= minAttempts)
    .map((e) => ({ position: e.position, attempts: e.attempts, successRate: e.successes / e.attempts }));

  const weakPositions = [...entries]
    .sort((a, b) => a.successRate - b.successRate || b.attempts - a.attempts)
    .slice(0, limit);
  const strongPositions = [...entries]
    .sort((a, b) => b.successRate - a.successRate || b.attempts - a.attempts)
    .slice(0, limit);

  return { weakPositions, strongPositions };
}

export type TechniqueBreakdownEntry = { technique: string; attempts: number; successRate: number | null };

const DEFAULT_MIN_TECHNIQUE_ATTEMPTS = 2;
const DEFAULT_TECHNIQUE_LIMIT = 5;

/**
 * Groups rounds by `technique_name` (every logged round counts toward
 * "attempts" regardless of whether an outcome was recorded, matching how
 * technique tallies work elsewhere in the app — `successRate` only, not
 * the count, stays outcome-gated per docs/decisions/0006).
 */
export function summarizeTechniqueBreakdown(
  rounds: readonly SparringRoundLike[],
  minAttemptsForRate = DEFAULT_MIN_TECHNIQUE_ATTEMPTS,
  limit = DEFAULT_TECHNIQUE_LIMIT,
): { mostAttempted: TechniqueBreakdownEntry[]; leastSuccessful: TechniqueBreakdownEntry[] } {
  const counts = new Map<string, { technique: string; attempts: number; scored: number; successes: number }>();
  for (const round of rounds) {
    const name = round.technique_name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const existing = counts.get(key);
    counts.set(key, {
      technique: existing?.technique ?? name,
      attempts: (existing?.attempts ?? 0) + 1,
      scored: (existing?.scored ?? 0) + (round.outcome !== null ? 1 : 0),
      successes: (existing?.successes ?? 0) + (round.outcome === "success" ? 1 : 0),
    });
  }

  const all = Array.from(counts.values());
  const mostAttempted = [...all]
    .sort((a, b) => b.attempts - a.attempts || a.technique.localeCompare(b.technique))
    .slice(0, limit)
    .map((e) => ({ technique: e.technique, attempts: e.attempts, successRate: e.scored > 0 ? e.successes / e.scored : null }));

  const leastSuccessful = all
    .filter((e) => e.scored >= minAttemptsForRate)
    .map((e) => ({ technique: e.technique, attempts: e.scored, successRate: e.successes / e.scored }))
    .sort((a, b) => (a.successRate as number) - (b.successRate as number) || b.attempts - a.attempts)
    .slice(0, limit);

  return { mostAttempted, leastSuccessful };
}

export type SparringSessionLike = { date: string; rounds: readonly SparringRoundLike[] };
export type RecentTrend = { direction: "up" | "down" | "stable"; recentRate: number; priorRate: number } | null;

const DEFAULT_RECENT_SESSION_COUNT = 3;
const TREND_STABLE_THRESHOLD = 0.1;

/**
 * Compares the success rate of the most recent N sparring sessions against
 * everything before them — `sessions` must already be sorted most-recent
 * first (same order `getSparringSessions()` returns). Returns null when
 * there isn't enough scored data on both sides to compare honestly.
 */
export function computeRecentTrend(
  sessions: readonly SparringSessionLike[],
  recentCount = DEFAULT_RECENT_SESSION_COUNT,
): RecentTrend {
  const recentRounds = sessions.slice(0, recentCount).flatMap((s) => s.rounds);
  const priorRounds = sessions.slice(recentCount).flatMap((s) => s.rounds);
  const recent = summarizeSparringRounds(recentRounds);
  const prior = summarizeSparringRounds(priorRounds);
  if (recent.successRate === null || prior.successRate === null) return null;

  const delta = recent.successRate - prior.successRate;
  const direction = delta > TREND_STABLE_THRESHOLD ? "up" : delta < -TREND_STABLE_THRESHOLD ? "down" : "stable";
  return { direction, recentRate: recent.successRate, priorRate: prior.successRate };
}
