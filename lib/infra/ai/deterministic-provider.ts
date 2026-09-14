import type { AIProvider, CoachContext, CoachResponse } from "@/lib/domain/ai-coach";
import { hasEnoughContext } from "@/lib/domain/ai-coach";

/**
 * Default AIProvider: no model call, no network, no secret. It only
 * reorganizes the OBSERVED/INFERRED facts it was given — never adds a claim
 * that wasn't already in the context. Used until a real provider (local or
 * hosted) is wired behind the same interface; see docs/decisions/0005.
 */
export class DeterministicCoachProvider implements AIProvider {
  readonly name = "deterministic-fallback";

  async generateCoachResponse(context: CoachContext): Promise<CoachResponse> {
    if (!hasEnoughContext(context)) {
      return {
        status: "insufficient_data",
        reason: "Pas assez de données enregistrées pour un retour du coach.",
      };
    }

    const observed = context.facts.filter((f) => f.kind === "OBSERVED");
    const inferred = context.facts.filter((f) => f.kind === "INFERRED");

    const summaryParts = [
      observed.length > 0 ? `${observed.length} observation(s) directe(s)` : null,
      inferred.length > 0 ? `${inferred.length} déduction(s) de Training Intelligence` : null,
    ].filter((p): p is string => p !== null);

    return {
      status: "ok",
      summary:
        summaryParts.length > 0
          ? `Résumé basé sur ${summaryParts.join(" et ")}.`
          : "Résumé basé sur les données disponibles.",
      recommendations: inferred.map((fact) => ({
        statement: fact.statement,
        basedOnFactIndexes: [context.facts.indexOf(fact)].filter((idx) => idx >= 0),
      })),
    };
  }
}
