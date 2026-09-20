import "server-only";
import { createClient } from "@/lib/infra/db/supabase-server";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { getSkillsCatalog } from "@/lib/usecases/skill-actions";
import { searchTechniqueVideos } from "@/lib/usecases/video-search-actions";
import {
  expandQueryKeywords,
  extractVideoIntent,
  matchNavigationIntents,
  scoreSkillMatch,
} from "@/lib/domain/search";

/**
 * Global search (docs/decisions/0008, extended for "Search as app
 * navigator"): three layers, tried together and merged —
 *   1. deterministic navigation intents (curated phrases that mean "take me
 *      to a page", e.g. "mes séances" → /training);
 *   2. the skill catalog, matched in-memory against the already-cached
 *      catalog (`getSkillsCatalog`, shared with /skills — no extra DB query)
 *      with alias/category expansion and small fuzzy tolerance for typos;
 *   3. structured `ILIKE` across the signed-in user's own data (resources,
 *      sessions, observations/problems, goals).
 * No pgvector/RAG, no paid AI dependency — plain deterministic matching is
 * enough at this data volume (docs/architecture.md keeps that deferred).
 */

export type SearchResultType = "navigation" | "coach" | "skill" | "resource" | "session" | "observation" | "goal" | "video";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  detail: string;
  href: string;
  /** Only set for type "skill" — lets the UI offer Study/Add-to-goal quick actions and a "watch videos" link without a second lookup. */
  skillId?: string;
  skillName?: string;
  disciplineName?: string;
};

const RESULTS_PER_TYPE = 8;
const SKILL_RESULTS_LIMIT = 8;

type NormalizationRules = {
  stripPrefixes: readonly RegExp[];
  stripSuffixes?: readonly RegExp[];
  stripArticles?: RegExp;
};

const NORMALIZATION_RULES: Record<Locale, NormalizationRules> = {
  fr: {
    stripPrefixes: [
      /^(comment faire|qu['’]est-ce que|comment maîtriser|quelles sont les erreurs les plus courantes en)\s+/i,
      /^(je veux (travailler|améliorer|maîtriser|bosser)|j['’]aimerais (travailler|améliorer)|je dois travailler|comment travailler)\s+/i,
    ],
    stripArticles: /^(une|un|les|le|la|l['’]|ma|mon|mes|ta|ton|tes|sa|son|ses|notre|nos)\s*/i,
  },
  en: {
    stripPrefixes: [
      /^(how do i do|how do i master|how do i|what are the most common mistakes in|what is)\s+/i,
      /^(i want to (work on|improve|master)|i['’]d like to (work on|improve)|i need to work on|how (do|can) i work on)\s+/i,
    ],
    stripArticles: /^(an|a|the|my|your|our|their)\s*/i,
  },
  es: {
    stripPrefixes: [/^(cómo hacer|qué es|cómo dominar|cuáles son los errores más comunes en)\s+/i],
    stripArticles: /^(una|un|los|las|el|la)\s*/i,
  },
  de: {
    stripPrefixes: [/^(wie macht man|wie meistert man|was sind die häufigsten fehler beim|was sind die häufigsten fehler im|was ist)\s+/i],
    stripArticles: /^(einen|eine|ein|der|die|das|den|dem)\s*/i,
  },
  ru: {
    stripPrefixes: [/^(как делать|что такое|как освоить|какие самые частые ошибки в)\s+/i],
  },
  ja: {
    stripPrefixes: [],
    stripSuffixes: [/のやり方は$/, /を極めるには$/, /でよくあるミスは$/, /とは$/],
  },
};

export function normalizeSearchQuery(query: string, locale: Locale = "fr"): string {
  const rules = NORMALIZATION_RULES[locale] ?? NORMALIZATION_RULES.fr;
  let q = query.trim().replace(/^[¿¡]+/, "").replace(/[?!.？！。]+$/, "").trim();
  for (const suffix of rules.stripSuffixes ?? []) {
    q = q.replace(suffix, "");
  }
  q = q.trim();
  for (const prefix of rules.stripPrefixes) {
    q = q.replace(prefix, "");
  }
  if (rules.stripArticles) {
    q = q.replace(rules.stripArticles, "");
  }
  return q.trim();
}

/** Locale-specific "this looks like a question" starter words, for queries a stray `?` doesn't catch (e.g. "comment améliorer mon jab"). Japanese has no leading question word, so it checks a trailing question particle instead. */
const QUESTION_START: Record<Locale, RegExp> = {
  fr: /^(comment|pourquoi|quoi|que\s|qu['’]|montre[- ]moi)\b/i,
  en: /^(how|why|what|show me)\b/i,
  es: /^(c[oó]mo|por qu[ée]|qu[ée]|mu[ée]strame)\b/i,
  de: /^(wie|warum|was|zeig mir)\b/i,
  ru: /^(как|почему|что|покажи)\b/i,
  ja: /(か|教えて|見せて)$/,
};

/**
 * A "comment améliorer mon jab" / "what should I work on" style query is a
 * coaching question, not a navigation/record lookup — that belongs to Coach
 * (P0: /search must stay an app navigator, never a natural-language MMA
 * knowledge engine). Only checked once no curated navigation phrase already
 * matched, so existing intents like "quoi travailler aujourd'hui" keep
 * resolving to the Coach nav card exactly as before.
 */
function isCoachingQuestion(query: string, locale: Locale): boolean {
  if (/[?？]\s*$/.test(query.trim())) return true;
  const pattern = QUESTION_START[locale] ?? QUESTION_START.en;
  return pattern.test(query.trim());
}

/** Ranks a DB-matched row's title against the query so each type block reads most-relevant-first, same scale intent as scoreSkillMatch. */
function textScore(title: string, q: string): number {
  const t = title.toLocaleLowerCase();
  const needle = q.toLocaleLowerCase();
  if (t === needle) return 100;
  if (t.startsWith(needle)) return 85;
  return 70;
}

export async function search(query: string): Promise<SearchResult[]> {
  const locale = await getServerLocale();
  const raw = query.trim();
  if (raw.length < 2) return [];

  const navigationIntents = matchNavigationIntents(raw, locale);
  const dict = DICTIONARIES[locale];

  if (navigationIntents.length === 0 && isCoachingQuestion(raw, locale)) {
    return [
      {
        type: "coach",
        id: "ask-coach",
        title: dict["search.askCoach"],
        detail: raw,
        href: `/coach?q=${encodeURIComponent(raw)}`,
      },
    ];
  }

  const results: SearchResult[] = navigationIntents.map((intent) => ({
    type: "navigation",
    id: intent.destination,
    title: dict[intent.titleKey as keyof (typeof DICTIONARIES)["fr"]],
    detail: dict[intent.descKey as keyof (typeof DICTIONARIES)["fr"]],
    href: intent.href,
  }));

  const { remainder, hasVideoIntent } = extractVideoIntent(raw, locale);
  const q = normalizeSearchQuery(remainder, locale);
  if (q.length < 2) return results;
  const likeRaw = `%${q}%`;
  // PostgREST's .or() filter string treats comma/parentheses as syntax
  // (condition separators / grouping), not just characters — an unquoted
  // value containing them (e.g. "stand-up (boxing)") breaks the whole
  // filter and PostgREST returns an error. Quoting the value per PostgREST's
  // own escaping rules (backslash-escape backslash/double-quote, wrap in
  // double quotes) keeps arbitrary user input safe inside an .or() string.
  // Only .or() needs this — .ilike()/.eq() take the value as a real query
  // param and encode it safely on their own, so they use likeRaw.
  const like = `"%${q.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}%"`;

  const expandedKeywords = expandQueryKeywords(q, locale);
  // Skill matching is one layer among several (navigation/DB rows are the
  // others) — a catalog failure here must degrade to "no skill matches", not
  // crash the whole search route.
  const catalog = await getSkillsCatalog().catch(() => []);
  const skillMatches = catalog
    .map((s) => ({ skill: s, score: scoreSkillMatch({ name: s.name, category: s.category }, q, expandedKeywords) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .slice(0, SKILL_RESULTS_LIMIT);

  for (const { skill } of skillMatches) {
    results.push({
      type: "skill",
      id: skill.id,
      title: skill.name,
      detail: [skill.discipline.name, skill.category].filter(Boolean).join(" · "),
      href: `/skills/${skill.id}`,
      skillId: skill.id,
      skillName: skill.name,
      disciplineName: skill.discipline.name,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (hasVideoIntent) {
    const topSkillName = skillMatches[0]?.skill.name ?? q;
    const videos = await searchTechniqueVideos({ technique: topSkillName, discipline: "MMA", difficulty: "" }).catch(() => []);
    for (const v of videos) {
      results.push({ type: "video", id: v.videoId, title: v.title, detail: v.channelTitle, href: v.url });
    }
  }

  if (!user) return results;

  const [resources, sessions, observations, goals] = await Promise.all([
    supabase
      .from("resources")
      .select("id, title, author, type")
      .eq("user_id", user.id)
      .or(`title.ilike.${like},author.ilike.${like}`)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("training_sessions")
      .select("id, date, title, notes")
      .eq("user_id", user.id)
      .or(`title.ilike.${like},notes.ilike.${like}`)
      .limit(RESULTS_PER_TYPE),
    // RLS (session_observations_select_own) already restricts this to the
    // signed-in user's own sessions — no extra user_id filter needed/possible
    // here since the ownership check is via the parent session, not a column.
    supabase
      .from("session_observations")
      .select("id, type, content, session:training_sessions(id)")
      .ilike("content", likeRaw)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("goals")
      .select("id, title, description, status")
      .eq("user_id", user.id)
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(RESULTS_PER_TYPE),
  ]);

  // Each of these is an independent result block (resources/sessions/
  // observations/goals) — one failing must degrade to "no results in that
  // block", not take down the whole search response. `.data` is already
  // null on error, and the pushRankedBlock calls below fall back to `[]`.
  for (const r of [resources, sessions, observations, goals]) {
    if (r.error) console.error(r.error);
  }

  function pushRankedBlock<Row>(rows: Row[], toResult: (row: Row) => SearchResult, titleOf: (row: Row) => string) {
    const ranked = [...rows].sort((a, b) => textScore(titleOf(b), q) - textScore(titleOf(a), q));
    for (const row of ranked) results.push(toResult(row));
  }

  type ResourceRow = { id: string; title: string; author: string | null; type: string };
  pushRankedBlock(
    (resources.data ?? []) as unknown as ResourceRow[],
    (r) => ({
      type: "resource",
      id: r.id,
      title: r.title,
      detail: [r.type, r.author].filter(Boolean).join(" · "),
      href: `/study`,
    }),
    (r) => r.title,
  );

  type SessionRow = { id: string; date: string; title: string | null; notes: string | null };
  pushRankedBlock(
    (sessions.data ?? []) as unknown as SessionRow[],
    (s) => ({
      type: "session",
      id: s.id,
      title: s.title || formatT(DICTIONARIES[locale]["search.sessionOn"], { date: new Date(s.date).toLocaleDateString(locale) }),
      detail: s.notes ?? "",
      href: `/training/${s.id}`,
    }),
    (s) => s.title ?? "",
  );

  type ObservationRow = { id: string; type: string; content: string; session: { id: string } | null };
  pushRankedBlock(
    ((observations.data ?? []) as unknown as ObservationRow[]).filter((o) => o.session),
    (o) => ({
      type: "observation",
      id: o.id,
      title: o.content,
      detail: o.type,
      href: `/training/${o.session!.id}`,
    }),
    (o) => o.content,
  );

  type GoalRow = { id: string; title: string; description: string | null; status: string };
  pushRankedBlock(
    (goals.data ?? []) as unknown as GoalRow[],
    (g) => ({
      type: "goal",
      id: g.id,
      title: g.title,
      detail: [g.status, g.description].filter(Boolean).join(" · "),
      href: `/goals`,
    }),
    (g) => g.title,
  );

  return results;
}
