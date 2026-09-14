import "server-only";
import type { AIProvider, CoachContext, CoachFact, CoachResponse } from "@/lib/domain/ai-coach";
import { DeterministicCoachProvider } from "@/lib/infra/ai/deterministic-provider";
import { getTrainingIntelligenceBundle } from "@/lib/usecases/training-intelligence-actions";
import { getReviewQueue } from "@/lib/usecases/review-actions";

const defaultProvider: AIProvider = new DeterministicCoachProvider();

/**
 * Builds the coach context from the same deterministic sources already
 * surfaced elsewhere in the app (Training Intelligence, review queue) — no
 * new query path, no fact invented for the occasion.
 */
export async function buildCoachContext(): Promise<CoachContext> {
  const [{ intelligence, plan }, reviewItems] = await Promise.all([
    getTrainingIntelligenceBundle(),
    getReviewQueue(),
  ]);

  const facts: CoachFact[] = [];

  if (plan.status === "ok") {
    facts.push({
      kind: "INFERRED",
      statement: `Focus recommandé: ${plan.plan.focusSkillName} — ${plan.plan.objective}`,
      skillId: plan.plan.focusSkillId,
    });
    for (const evidence of plan.plan.evidence) {
      facts.push({ kind: "OBSERVED", statement: evidence, skillId: plan.plan.focusSkillId });
    }
  }

  if (intelligence.status === "ok") {
    for (const rec of intelligence.recommendations) {
      if (plan.status === "ok" && rec.skillId === plan.plan.focusSkillId) continue;
      facts.push({
        kind: "INFERRED",
        statement: `${rec.skillName}: ${rec.action}`,
        skillId: rec.skillId,
      });
    }
  }

  for (const item of reviewItems) {
    facts.push({
      kind: "OBSERVED",
      statement: `${item.skillName}: ${item.detail}`,
      skillId: item.skillId,
    });
  }

  return { generatedAt: new Date().toISOString(), facts };
}

export async function getCoachResponse(
  question?: string,
  provider: AIProvider = defaultProvider,
): Promise<CoachResponse> {
  const context = await buildCoachContext();
  return provider.generateCoachResponse(context, question);
}
