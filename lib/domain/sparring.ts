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
