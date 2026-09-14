/**
 * AI Coach foundation (docs/decisions/0005). Pure types and contracts only —
 * no network calls, no model-specific code. Every fact fed to a provider must
 * be traceable to real user data; a provider must never claim knowledge that
 * isn't present in the context.
 */

/**
 * OBSERVED: a fact read directly from stored data (counts, dates, quoted
 * content). INFERRED: a deterministic derivation from observed facts (e.g.
 * Training Intelligence's mastery stage or trigger). HYPOTHESIS: a provider's
 * own guess, always presented as uncertain and never mixed with the above two.
 */
export const COACH_FACT_KINDS = ["OBSERVED", "INFERRED", "HYPOTHESIS"] as const;
export type CoachFactKind = (typeof COACH_FACT_KINDS)[number];

export type CoachFact = {
  kind: CoachFactKind;
  statement: string;
  skillId?: string;
};

export type CoachContext = {
  generatedAt: string;
  facts: CoachFact[];
};

export type CoachRecommendation = {
  statement: string;
  /** Indices into CoachContext.facts this recommendation is grounded in. */
  basedOnFactIndexes: number[];
};

export type CoachResponse =
  | { status: "ok"; summary: string; recommendations: CoachRecommendation[] }
  | { status: "insufficient_data"; reason: string };

/**
 * Provider boundary: any AI backend (local model, hosted API, or the
 * deterministic fallback) implements this. Callers pass a `CoachContext`
 * built entirely from real data — the provider decides how to reason over it,
 * but never receives raw database access.
 */
export interface AIProvider {
  readonly name: string;
  generateCoachResponse(context: CoachContext, question?: string): Promise<CoachResponse>;
}

export function hasEnoughContext(context: CoachContext): boolean {
  return context.facts.length > 0;
}
