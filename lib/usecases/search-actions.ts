import "server-only";
import { createClient } from "@/lib/infra/db/supabase-server";
import { DICTIONARIES, formatT, type Locale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

/**
 * Global search (docs/decisions/0008): structured `ILIKE` across the
 * catalog (skills) and the signed-in user's own data (resources, sessions,
 * observations/problems, goals). No pgvector/RAG — plain text matching is
 * enough at this data volume (docs/architecture.md keeps that deferred).
 */

export type SearchResultType = "skill" | "resource" | "session" | "observation" | "goal";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  detail: string;
  href: string;
};

const RESULTS_PER_TYPE = 8;

type NormalizationRules = {
  stripPrefixes: readonly RegExp[];
  stripSuffixes?: readonly RegExp[];
  stripArticles?: RegExp;
};

const NORMALIZATION_RULES: Record<Locale, NormalizationRules> = {
  fr: {
    stripPrefixes: [/^(comment faire|qu['’]est-ce que|comment maîtriser|quelles sont les erreurs les plus courantes en)\s+/i],
    stripArticles: /^(une|un|les|le|la|l['’])\s*/i,
  },
  en: {
    stripPrefixes: [/^(how do i do|how do i master|how do i|what are the most common mistakes in|what is)\s+/i],
    stripArticles: /^(an|a|the)\s*/i,
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

export async function search(query: string): Promise<SearchResult[]> {
  const locale = await getServerLocale();
  const q = normalizeSearchQuery(query, locale);
  if (q.length < 2) return [];
  const like = `%${q}%`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [skills, resources, sessions, observations, goals] = await Promise.all([
    supabase
      .from("skills")
      .select("id, name, category, discipline:disciplines(name)")
      .or(`name.ilike.${like},category.ilike.${like}`)
      .limit(RESULTS_PER_TYPE),
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
      .ilike("content", like)
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("goals")
      .select("id, title, description, status")
      .eq("user_id", user.id)
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(RESULTS_PER_TYPE),
  ]);

  for (const r of [skills, resources, sessions, observations, goals]) {
    if (r.error) throw new Error(r.error.message);
  }

  const results: SearchResult[] = [];

  type SkillRow = { id: string; name: string; category: string | null; discipline: { name: string } | null };
  for (const s of (skills.data ?? []) as unknown as SkillRow[]) {
    results.push({
      type: "skill",
      id: s.id,
      title: s.name,
      detail: [s.discipline?.name, s.category].filter(Boolean).join(" · "),
      href: `/skills/${s.id}`,
    });
  }

  type ResourceRow = { id: string; title: string; author: string | null; type: string };
  for (const r of (resources.data ?? []) as unknown as ResourceRow[]) {
    results.push({
      type: "resource",
      id: r.id,
      title: r.title,
      detail: [r.type, r.author].filter(Boolean).join(" · "),
      href: `/study`,
    });
  }

  type SessionRow = { id: string; date: string; title: string | null; notes: string | null };
  for (const s of (sessions.data ?? []) as unknown as SessionRow[]) {
    results.push({
      type: "session",
      id: s.id,
      title: s.title || formatT(DICTIONARIES[locale]["search.sessionOn"], { date: new Date(s.date).toLocaleDateString(locale) }),
      detail: s.notes ?? "",
      href: `/training/${s.id}`,
    });
  }

  type ObservationRow = { id: string; type: string; content: string; session: { id: string } | null };
  for (const o of (observations.data ?? []) as unknown as ObservationRow[]) {
    if (!o.session) continue;
    results.push({
      type: "observation",
      id: o.id,
      title: o.content,
      detail: o.type,
      href: `/training/${o.session.id}`,
    });
  }

  type GoalRow = { id: string; title: string; description: string | null; status: string };
  for (const g of (goals.data ?? []) as unknown as GoalRow[]) {
    results.push({
      type: "goal",
      id: g.id,
      title: g.title,
      detail: [g.status, g.description].filter(Boolean).join(" · "),
      href: `/goals`,
    });
  }

  return results;
}
