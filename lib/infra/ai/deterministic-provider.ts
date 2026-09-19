import type { AIProvider, CoachContext, CoachResponse } from "@/lib/domain/ai-coach";
import { hasEnoughContext } from "@/lib/domain/ai-coach";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";

/**
 * Default AIProvider: no model call, no network, no secret. It only
 * reorganizes the OBSERVED/INFERRED facts it was given — never adds a claim
 * that wasn't already in the context. Used until a real provider (local or
 * hosted) is wired behind the same interface; see docs/decisions/0005.
 */
export class DeterministicCoachProvider implements AIProvider {
  readonly name = "deterministic-fallback";

  async generateCoachResponse(context: CoachContext, _question?: string, locale: Locale = "fr"): Promise<CoachResponse> {
    const dict = DICTIONARIES[locale];

    if (!hasEnoughContext(context)) {
      return {
        status: "insufficient_data",
        reason: dict["coach.insufficientDataReason"],
      };
    }

    const observed = context.facts.filter((f) => f.kind === "OBSERVED");
    const inferred = context.facts.filter((f) => f.kind === "INFERRED");

    const summaryParts = [
      observed.length > 0 ? formatT(dict["coach.observedCount"], { count: observed.length }) : null,
      inferred.length > 0 ? formatT(dict["coach.inferredCount"], { count: inferred.length }) : null,
    ].filter((p): p is string => p !== null);

    return {
      status: "ok",
      summary:
        summaryParts.length > 0
          ? formatT(dict["coach.summaryJoined"], { parts: summaryParts.join(dict["coach.joinAnd"]) })
          : dict["coach.summaryDefault"],
      recommendations: inferred.map((fact) => ({
        statement: fact.statement,
        basedOnFactIndexes: [context.facts.indexOf(fact)].filter((idx) => idx >= 0),
      })),
    };
  }
}
