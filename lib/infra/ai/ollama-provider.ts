import type { AIProvider, CoachContext, CoachResponse } from "@/lib/domain/ai-coach";
import { hasEnoughContext } from "@/lib/domain/ai-coach";

const REQUEST_TIMEOUT_MS = 8000;

function formatFacts(context: CoachContext): string {
  return context.facts.map((f) => `- (${f.kind}) ${f.statement}`).join("\n");
}

/**
 * Optional local model provider (docs/decisions/0005 "reste à faire").
 * Talks to a self-hosted Ollama instance over plain HTTP — no API key, no
 * client-side code, no npm dependency. Only instantiated when
 * OLLAMA_BASE_URL/OLLAMA_MODEL are set (see resolveProvider in
 * ai-coach-actions.ts); the caller falls back to DeterministicCoachProvider
 * on any error so a missing/unreachable Ollama never breaks the coach.
 *
 * The model's answer is returned as free-text `summary` only — never as
 * `recommendations`, since a generated recommendation would need a
 * basedOnFactIndexes grounding we cannot verify from raw model output. This
 * keeps the OBSERVED/INFERRED/HYPOTHESIS separation honest: the summary is
 * clearly a model hypothesis, not a fact.
 */
export class OllamaCoachProvider implements AIProvider {
  readonly name = "ollama";

  constructor(
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async generateCoachResponse(context: CoachContext, question?: string): Promise<CoachResponse> {
    if (!hasEnoughContext(context)) {
      return {
        status: "insufficient_data",
        reason: "Pas assez de données enregistrées pour un retour du coach.",
      };
    }

    const prompt = [
      "Tu es un assistant d'entraînement MMA. Utilise UNIQUEMENT les faits ci-dessous.",
      "N'invente aucune statistique ni aucun fait. Si l'information manque, dis-le clairement.",
      "Réponds en français, de façon concise (5 phrases maximum).",
      "",
      "FAITS:",
      formatFacts(context),
      "",
      question ? `QUESTION: ${question}` : "Donne un résumé de la situation et 1 à 3 recommandations concrètes.",
    ].join("\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let text: string;
    try {
      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt, stream: false }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = (await res.json()) as { response?: string };
      text = (data.response ?? "").trim();
    } finally {
      clearTimeout(timeout);
    }

    if (!text) {
      return { status: "insufficient_data", reason: "Le modèle local n'a rien retourné." };
    }

    return { status: "ok", summary: text, recommendations: [] };
  }
}
