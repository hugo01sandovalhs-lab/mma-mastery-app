import "server-only";
import type { AIProvider, CoachContext, CoachFact, CoachResponse } from "@/lib/domain/ai-coach";
import { DeterministicCoachProvider } from "@/lib/infra/ai/deterministic-provider";
import { OllamaCoachProvider } from "@/lib/infra/ai/ollama-provider";
import { getTrainingIntelligenceBundle } from "@/lib/usecases/training-intelligence-actions";
import { getReviewQueue } from "@/lib/usecases/review-actions";
import { getUpcomingGoals } from "@/lib/usecases/goals-actions";
import { getStudyQueue } from "@/lib/usecases/knowledge-actions";

const defaultProvider: AIProvider = new DeterministicCoachProvider();

/**
 * Picks the real provider when configured (OLLAMA_BASE_URL + OLLAMA_MODEL,
 * server-only env vars — never exposed to the client), otherwise the
 * deterministic fallback. Nothing here assumes Ollama is actually running;
 * getCoachResponse() still falls back on any runtime error (docs/decisions/0005).
 */
function resolveProvider(): AIProvider {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL;
  if (baseUrl && model) return new OllamaCoachProvider(baseUrl, model);
  return defaultProvider;
}

/**
 * Builds the coach context from the same deterministic sources already
 * surfaced elsewhere in the app (Training Intelligence, review queue) — no
 * new query path, no fact invented for the occasion.
 */
export async function buildCoachContext(): Promise<CoachContext> {
  const [{ intelligence, plan }, reviewItems, upcomingGoals, studyQueue] = await Promise.all([
    getTrainingIntelligenceBundle(),
    getReviewQueue(),
    getUpcomingGoals(),
    getStudyQueue(),
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

  for (const goal of upcomingGoals) {
    facts.push({
      kind: "OBSERVED",
      statement: `Objectif "${goal.title}"${goal.due_date ? ` — échéance ${goal.due_date}` : ""}`,
      skillId: goal.skill?.id,
    });
  }

  const queued = studyQueue.filter((i) => i.status !== "studied");
  if (queued.length > 0) {
    facts.push({
      kind: "OBSERVED",
      statement: `${queued.length} compétence(s) en file d'étude non terminée(s)`,
    });
  }

  return { generatedAt: new Date().toISOString(), facts };
}

export type CoachAnswer = {
  context: CoachContext;
  response: CoachResponse;
  providerName: string;
};

/**
 * Resolves the configured provider, falling back to the deterministic one on
 * any error (network failure, Ollama not running, bad response) so a broken
 * local model never takes the coach down — it just quietly becomes the
 * honest rules-based fallback again.
 */
export async function getCoachResponse(question?: string): Promise<CoachAnswer> {
  const context = await buildCoachContext();
  const provider = resolveProvider();

  if (provider.name === defaultProvider.name) {
    return { context, response: await defaultProvider.generateCoachResponse(context, question), providerName: defaultProvider.name };
  }

  try {
    const response = await provider.generateCoachResponse(context, question);
    return { context, response, providerName: provider.name };
  } catch {
    const response = await defaultProvider.generateCoachResponse(context, question);
    return { context, response, providerName: defaultProvider.name };
  }
}
