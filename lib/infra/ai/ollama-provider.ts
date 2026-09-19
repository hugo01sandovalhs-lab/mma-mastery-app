import type { AIProvider, CoachContext, CoachResponse } from "@/lib/domain/ai-coach";
import { hasEnoughContext } from "@/lib/domain/ai-coach";
import { DICTIONARIES, type Locale } from "@/lib/i18n";

const REQUEST_TIMEOUT_MS = 8000;

/**
 * The prompt sent to the model is itself an instruction the model must
 * follow, so it needs to be written in the target response language rather
 * than translated word-for-word from a French template.
 */
const PROMPT_STRINGS: Record<
  Locale,
  { intro: string; noInvent: string; respondIn: string; factsLabel: string; questionLabel: string; defaultAsk: string }
> = {
  fr: {
    intro: "Tu es un assistant d'entraînement MMA. Utilise UNIQUEMENT les faits ci-dessous.",
    noInvent: "N'invente aucune statistique ni aucun fait. Si l'information manque, dis-le clairement.",
    respondIn: "Réponds en français, de façon concise (5 phrases maximum).",
    factsLabel: "FAITS:",
    questionLabel: "QUESTION:",
    defaultAsk: "Donne un résumé de la situation et 1 à 3 recommandations concrètes.",
  },
  en: {
    intro: "You are an MMA training assistant. Use ONLY the facts below.",
    noInvent: "Do not invent any statistic or fact. If information is missing, say so clearly.",
    respondIn: "Respond in English, concisely (5 sentences maximum).",
    factsLabel: "FACTS:",
    questionLabel: "QUESTION:",
    defaultAsk: "Give a summary of the situation and 1 to 3 concrete recommendations.",
  },
  es: {
    intro: "Eres un asistente de entrenamiento de MMA. Usa ÚNICAMENTE los datos a continuación.",
    noInvent: "No inventes ninguna estadística ni ningún dato. Si falta información, dilo claramente.",
    respondIn: "Responde en español, de forma concisa (5 frases como máximo).",
    factsLabel: "DATOS:",
    questionLabel: "PREGUNTA:",
    defaultAsk: "Da un resumen de la situación y de 1 a 3 recomendaciones concretas.",
  },
  de: {
    intro: "Du bist ein MMA-Trainingsassistent. Verwende AUSSCHLIESSLICH die folgenden Fakten.",
    noInvent: "Erfinde keine Statistik und keinen Fakt. Wenn Informationen fehlen, sage das klar.",
    respondIn: "Antworte auf Deutsch, prägnant (maximal 5 Sätze).",
    factsLabel: "FAKTEN:",
    questionLabel: "FRAGE:",
    defaultAsk: "Gib eine Zusammenfassung der Situation und 1 bis 3 konkrete Empfehlungen.",
  },
  ru: {
    intro: "Ты ассистент по тренировкам ММА. Используй ТОЛЬКО факты ниже.",
    noInvent: "Не выдумывай статистику или факты. Если информации не хватает, скажи об этом прямо.",
    respondIn: "Отвечай на русском языке, кратко (максимум 5 предложений).",
    factsLabel: "ФАКТЫ:",
    questionLabel: "ВОПРОС:",
    defaultAsk: "Дай краткое резюме ситуации и от 1 до 3 конкретных рекомендаций.",
  },
  ja: {
    intro: "あなたはMMAトレーニングアシスタントです。以下の事実のみを使用してください。",
    noInvent: "統計や事実を創作しないでください。情報が不足している場合は、その旨を明確に伝えてください。",
    respondIn: "日本語で、簡潔に(最大5文まで)回答してください。",
    factsLabel: "事実:",
    questionLabel: "質問:",
    defaultAsk: "状況の要約と1〜3件の具体的な提案をしてください。",
  },
};

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

  async generateCoachResponse(context: CoachContext, question?: string, locale: Locale = "fr"): Promise<CoachResponse> {
    const dict = DICTIONARIES[locale];
    const strings = PROMPT_STRINGS[locale];

    if (!hasEnoughContext(context)) {
      return {
        status: "insufficient_data",
        reason: dict["coach.insufficientDataReason"],
      };
    }

    const prompt = [
      strings.intro,
      strings.noInvent,
      strings.respondIn,
      "",
      strings.factsLabel,
      formatFacts(context),
      "",
      question ? `${strings.questionLabel} ${question}` : strings.defaultAsk,
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
      return { status: "insufficient_data", reason: dict["coach.localModelEmpty"] };
    }

    return { status: "ok", summary: text, recommendations: [] };
  }
}
