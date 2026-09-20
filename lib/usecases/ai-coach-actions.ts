import "server-only";
import type { AIProvider, CoachContext, CoachFact, CoachResponse } from "@/lib/domain/ai-coach";
import {
  buildYouTubeSearchSuggestions,
  inferVideoSearchQuery,
  type VideoSearchQuery,
  type VideoSearchResult,
} from "@/lib/domain/video-search";
import { DeterministicCoachProvider } from "@/lib/infra/ai/deterministic-provider";
import { OllamaCoachProvider } from "@/lib/infra/ai/ollama-provider";
import { getTrainingIntelligenceBundle } from "@/lib/usecases/training-intelligence-actions";
import { getReviewQueue } from "@/lib/usecases/review-actions";
import { getUpcomingGoals } from "@/lib/usecases/goals-actions";
import { getStudyQueue } from "@/lib/usecases/knowledge-actions";
import { YouTubeVideoSearchProvider } from "@/lib/infra/video/youtube-video-search-provider";
import { MASTERY_STAGE_LABEL_KEYS, type MasteryStage } from "@/lib/domain/skill";
import { DICTIONARIES, formatT } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

const defaultProvider: AIProvider = new DeterministicCoachProvider();
const videoProvider = new YouTubeVideoSearchProvider(process.env.YOUTUBE_API_KEY);

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
  // Each source below is an independent fact stream — one failing (a
  // transient DB/network error) must only drop that stream's facts, not
  // crash the whole coach page, same as the catalog/progress split
  // elsewhere in the reliability pass.
  const [{ intelligence, plan }, reviewItems, upcomingGoals, studyQueue, locale] = await Promise.all([
    getTrainingIntelligenceBundle().catch(
      (): Awaited<ReturnType<typeof getTrainingIntelligenceBundle>> => ({
        intelligence: { status: "insufficient_data" },
        plan: { status: "insufficient_data" },
      }),
    ),
    getReviewQueue().catch(() => []),
    getUpcomingGoals().catch(() => []),
    getStudyQueue().catch(() => []),
    getServerLocale(),
  ]);
  const dict = DICTIONARIES[locale];

  const facts: CoachFact[] = [];

  if (plan.status === "ok") {
    const objectiveVars = { ...plan.plan.objectiveVars };
    if (typeof objectiveVars.stage === "string") {
      objectiveVars.stage = dict[MASTERY_STAGE_LABEL_KEYS[objectiveVars.stage as MasteryStage]];
    }
    const objective = formatT(dict[plan.plan.objectiveKey as keyof (typeof DICTIONARIES)["fr"]], objectiveVars);
    facts.push({
      kind: "INFERRED",
      statement: formatT(dict["coach.fact.focus"], { skill: plan.plan.focusSkillName, objective }),
      skillId: plan.plan.focusSkillId,
    });
    for (const evidence of plan.plan.evidence) {
      const vars = { ...evidence.vars };
      if (typeof vars.stage === "string") {
        vars.stage = dict[MASTERY_STAGE_LABEL_KEYS[vars.stage as MasteryStage]];
      }
      const statement = formatT(dict[evidence.key as keyof (typeof DICTIONARIES)["fr"]], vars);
      facts.push({ kind: "OBSERVED", statement, skillId: plan.plan.focusSkillId });
    }
  }

  if (intelligence.status === "ok") {
    for (const rec of intelligence.recommendations) {
      if (plan.status === "ok" && rec.skillId === plan.plan.focusSkillId) continue;
      const action = formatT(dict[rec.actionKey as keyof (typeof DICTIONARIES)["fr"]], rec.actionVars);
      facts.push({
        kind: "INFERRED",
        statement: formatT(dict["coach.fact.recommendation"], { skill: rec.skillName, action }),
        skillId: rec.skillId,
      });
    }
  }

  for (const item of reviewItems) {
    const vars = { ...item.detailVars };
    if (item.type === "developing" && typeof vars.stage === "string") {
      vars.stage = dict[MASTERY_STAGE_LABEL_KEYS[vars.stage as MasteryStage]];
    }
    const detail = formatT(dict[item.detailKey as keyof (typeof DICTIONARIES)["fr"]], vars);
    facts.push({
      kind: "OBSERVED",
      statement: formatT(dict["coach.fact.reviewItem"], { skill: item.skillName, detail }),
      skillId: item.skillId,
    });
  }

  for (const goal of upcomingGoals) {
    facts.push({
      kind: "OBSERVED",
      statement: goal.due_date
        ? formatT(dict["coach.fact.goalWithDue"], { title: goal.title, date: goal.due_date })
        : formatT(dict["coach.fact.goalNoDue"], { title: goal.title }),
      skillId: goal.skill?.id,
    });
  }

  const queued = studyQueue.filter((i) => i.status !== "studied");
  if (queued.length > 0) {
    facts.push({
      kind: "OBSERVED",
      statement: formatT(dict["coach.fact.studyQueueCount"], { count: queued.length }),
    });
  }

  return { generatedAt: new Date().toISOString(), facts };
}

export type CoachAnswerText = {
  context: CoachContext;
  response: CoachResponse;
  providerName: string;
  videoQuery: VideoSearchQuery;
  videoSuggestions: string[];
};

export type CoachAnswer = CoachAnswerText & {
  videos: VideoSearchResult[];
};

function buildAnswerText(
  context: CoachContext,
  response: CoachResponse,
  providerName: string,
  question?: string,
): CoachAnswerText {
  const fallback = response.status === "ok" ? response.recommendations[0]?.statement ?? "technique" : "technique";
  const videoQuery = inferVideoSearchQuery(question, fallback);
  const videoSuggestions = buildYouTubeSearchSuggestions(videoQuery);
  return { context, response, providerName, videoQuery, videoSuggestions };
}

/** Runs the external YouTube lookup — kept separate so callers can stream it in behind Suspense instead of blocking on it. */
export async function getCoachVideos(videoQuery: VideoSearchQuery): Promise<VideoSearchResult[]> {
  return videoProvider.search(videoQuery);
}

/**
 * Resolves the configured provider, falling back to the deterministic one on
 * any error (network failure, Ollama not running, bad response) so a broken
 * local model never takes the coach down — it just quietly becomes the
 * honest rules-based fallback again. Does not fetch YouTube videos; use
 * getCoachVideos(base.videoQuery) for that, separately.
 */
export async function getCoachResponseText(question?: string): Promise<CoachAnswerText> {
  const context = await buildCoachContext();
  const provider = resolveProvider();
  const locale = await getServerLocale();

  if (provider.name === defaultProvider.name) {
    const response = await defaultProvider.generateCoachResponse(context, question, locale);
    return buildAnswerText(context, response, defaultProvider.name, question);
  }

  try {
    const response = await provider.generateCoachResponse(context, question, locale);
    return buildAnswerText(context, response, provider.name, question);
  } catch {
    const response = await defaultProvider.generateCoachResponse(context, question, locale);
    return buildAnswerText(context, response, defaultProvider.name, question);
  }
}

export async function getCoachResponse(question?: string): Promise<CoachAnswer> {
  const base = await getCoachResponseText(question);
  return { ...base, videos: await getCoachVideos(base.videoQuery) };
}
