import type { Locale } from "@/lib/i18n";

/**
 * Pure, deterministic matching for the global search / app navigator
 * (docs/decisions/0008 extended for the "Search as app navigator" pass — no
 * pgvector/RAG, no paid AI dependency, same reasoning as the original
 * decision). Three layers, tried in order by the caller:
 *   1. Navigation intent — a handful of curated phrases ("my sessions", "what
 *      should I work on today") that mean "take me to a page", not "find me
 *      a record".
 *   2. Alias/category expansion — a compact multilingual keyword map so a
 *      French "garde" query still finds English-named "Guard" skills (the
 *      catalog is seeded with English technical terms regardless of UI
 *      locale — see supabase/migrations/00000000000003 and 00000000000014).
 *   3. Fuzzy fallback — small Levenshtein tolerance for typos in a technique
 *      name, only once the exact/substring/alias passes above found nothing.
 */

export type NavigationDestination =
  | "dashboard"
  | "training"
  | "trainingNew"
  | "skills"
  | "coach"
  | "study"
  | "goals"
  | "competition"
  | "club"
  | "profile"
  | "calendar"
  | "sparring"
  | "search"
  | "youtube";

export type NavigationIntent = {
  destination: NavigationDestination;
  href: string;
  titleKey: string;
  descKey: string;
};

/**
 * The full app-navigator destination set (P0 "search as Spotlight" redefine)
 * — every top-level page a user can jump to, not just the handful that used
 * to have curated phrases. `titleKey` reuses the existing `nav.*`/`action.*`
 * dictionary entries (already translated for all 6 locales) instead of
 * duplicating a title string per destination.
 */
export const NAVIGATION_INTENTS: Record<NavigationDestination, NavigationIntent> = {
  dashboard: { destination: "dashboard", href: "/dashboard", titleKey: "nav.dashboard", descKey: "search.nav.dashboardDesc" },
  training: { destination: "training", href: "/training", titleKey: "nav.training", descKey: "search.nav.trainingDesc" },
  trainingNew: { destination: "trainingNew", href: "/training/new", titleKey: "action.newSession", descKey: "search.nav.trainingNewDesc" },
  skills: { destination: "skills", href: "/skills", titleKey: "nav.skills", descKey: "search.nav.skillsDesc" },
  coach: { destination: "coach", href: "/coach", titleKey: "nav.coach", descKey: "search.nav.coachDesc" },
  study: { destination: "study", href: "/study", titleKey: "nav.study", descKey: "search.nav.studyDesc" },
  goals: { destination: "goals", href: "/goals", titleKey: "nav.goals", descKey: "search.nav.goalsDesc" },
  competition: { destination: "competition", href: "/competition", titleKey: "nav.competition", descKey: "search.nav.competitionDesc" },
  club: { destination: "club", href: "/club", titleKey: "nav.club", descKey: "search.nav.clubDesc" },
  profile: { destination: "profile", href: "/profile", titleKey: "nav.profile", descKey: "search.nav.profileDesc" },
  calendar: { destination: "calendar", href: "/calendar", titleKey: "nav.calendar", descKey: "search.nav.calendarDesc" },
  sparring: { destination: "sparring", href: "/sparring", titleKey: "nav.sparring", descKey: "search.nav.sparringDesc" },
  search: { destination: "search", href: "/search", titleKey: "nav.search", descKey: "search.nav.searchDesc" },
  youtube: { destination: "youtube", href: "/youtube", titleKey: "nav.youtube", descKey: "search.nav.youtubeDesc" },
};

/**
 * Single-word/short-phrase aliases per destination, accent/case-normalized
 * (see `normalizeForNav`). Matched as a plain substring first; when nothing
 * matches at all, also used as the dictionary for the fuzzy typo-tolerant
 * fallback (`matchNavigationIntents` below) — e.g. "spraring" → sparring.
 */
const NAVIGATION_ALIASES: Record<Locale, Partial<Record<NavigationDestination, string[]>>> = {
  fr: {
    dashboard: ["accueil"],
    training: ["entrainement", "seances", "mes seances", "entrainements", "historique"],
    trainingNew: ["nouvelle seance"],
    skills: ["competences", "techniques"],
    coach: ["coach"],
    study: ["etude", "revision", "favoris"],
    goals: ["objectifs"],
    competition: ["competition"],
    club: ["club"],
    profile: ["profil", "mon compte"],
    calendar: ["calendrier"],
    sparring: ["sparring"],
    search: ["recherche"],
    youtube: ["videos", "youtube"],
  },
  en: {
    dashboard: ["home", "dashboard"],
    training: ["training", "sessions", "my sessions", "workouts"],
    trainingNew: ["new session"],
    skills: ["skills", "techniques"],
    coach: ["coach"],
    study: ["study", "review", "favorites", "favourites"],
    goals: ["goals"],
    competition: ["competition"],
    club: ["club"],
    profile: ["profile", "my account"],
    calendar: ["calendar"],
    sparring: ["sparring"],
    search: ["search"],
    youtube: ["videos", "youtube"],
  },
  es: {
    dashboard: ["inicio"],
    training: ["entrenamiento", "sesiones", "mis sesiones"],
    trainingNew: ["nueva sesion"],
    skills: ["habilidades", "tecnicas"],
    coach: ["coach", "entrenador"],
    study: ["estudio", "revision", "favoritos"],
    goals: ["objetivos"],
    competition: ["competicion"],
    club: ["club"],
    profile: ["perfil", "mi cuenta"],
    calendar: ["calendario"],
    sparring: ["sparring"],
    search: ["buscar", "busqueda"],
    youtube: ["videos", "youtube"],
  },
  de: {
    dashboard: ["start", "dashboard"],
    training: ["training", "einheiten", "meine einheiten"],
    trainingNew: ["neue einheit"],
    skills: ["fahigkeiten", "techniken"],
    coach: ["coach", "trainer"],
    study: ["lernen", "lernliste", "wiederholung", "favoriten"],
    goals: ["ziele"],
    competition: ["wettkampf"],
    club: ["verein", "club"],
    profile: ["profil", "mein konto"],
    calendar: ["kalender"],
    sparring: ["sparring"],
    search: ["suche"],
    youtube: ["videos", "youtube"],
  },
  ru: {
    dashboard: ["главная"],
    training: ["тренировки", "тренировка", "мои тренировки"],
    trainingNew: ["новая тренировка"],
    skills: ["навыки", "техники"],
    coach: ["тренер", "коуч"],
    study: ["обучение", "повторение", "избранное"],
    goals: ["цели"],
    competition: ["соревнования"],
    club: ["клуб"],
    profile: ["профиль", "мой аккаунт"],
    calendar: ["календарь"],
    sparring: ["спарринг"],
    search: ["поиск"],
    youtube: ["видео", "youtube"],
  },
  ja: {
    dashboard: ["ホーム"],
    training: ["トレーニング", "練習記録", "セッション"],
    trainingNew: ["新しいセッション"],
    skills: ["スキル", "技"],
    coach: ["コーチ"],
    study: ["学習", "復習", "お気に入り"],
    goals: ["目標"],
    competition: ["試合"],
    club: ["クラブ"],
    profile: ["プロフィール", "マイアカウント"],
    calendar: ["カレンダー"],
    sparring: ["スパーリング"],
    search: ["検索"],
    youtube: ["動画", "youtube"],
  },
};

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizeForNav(s: string): string {
  return stripDiacritics(s.toLocaleLowerCase()).replace(/['’]/g, "").trim();
}

/** Per-locale phrase → destination. Matched as whole-word/phrase regexes against the normalized (lowercased) query. */
const NAVIGATION_KEYWORDS: Record<Locale, Partial<Record<NavigationDestination, RegExp[]>>> = {
  fr: {
    training: [/\bmes s[ée]ances\b/i, /\bmon historique\b/i, /\bhistorique d'entra[iî]nement\b/i, /\bmes entra[iî]nements\b/i],
    goals: [/\bmes objectifs\b/i],
    coach: [
      /\bquoi travailler( aujourd'hui)?\b/i,
      /\bque dois[- ]je travailler\b/i,
      /\btechnique du jour\b/i,
      /\bdemande(r)? (au|le) coach\b/i,
    ],
    study: [/\bfile d'[ée]tude\b/i, /\bma file d'[ée]tude\b/i, /\bmes ressources\b/i],
    youtube: [/\bvid[ée]os? recommand[ée]es?\b/i],
  },
  en: {
    training: [/\bmy sessions\b/i, /\btraining history\b/i, /\bmy training log\b/i, /\bmy workouts\b/i],
    goals: [/\bmy goals\b/i],
    coach: [/\bwhat should i work on( today)?\b/i, /\btechnique of the day\b/i, /\bask (the )?coach\b/i],
    study: [/\bstudy queue\b/i, /\bmy resources\b/i, /\bmy study queue\b/i],
    youtube: [/\brecommended videos\b/i],
  },
  es: {
    training: [/\bmis sesiones\b/i, /\bmi historial de entrenamiento\b/i],
    goals: [/\bmis objetivos\b/i],
    coach: [/\bqu[ée] debo entrenar( hoy)?\b/i, /\bt[ée]cnica del d[ií]a\b/i, /\bpreguntar al coach\b/i],
    study: [/\bcola de estudio\b/i, /\bmis recursos\b/i],
    youtube: [/\bv[ií]deos recomendados\b/i],
  },
  de: {
    training: [/\bmeine einheiten\b/i, /\bmein trainingsverlauf\b/i],
    goals: [/\bmeine ziele\b/i],
    coach: [/\bwas soll ich( heute)? trainieren\b/i, /\btechnik des tages\b/i, /\bcoach fragen\b/i],
    study: [/\blernliste\b/i, /\bmeine ressourcen\b/i],
    youtube: [/\bempfohlene videos\b/i],
  },
  ru: {
    training: [/\bмои тренировки\b/i, /\bистория тренировок\b/i],
    goals: [/\bмои цели\b/i],
    coach: [/\bчто (мне )?потренировать( сегодня)?\b/i, /\bтехника дня\b/i, /\bспросить тренера\b/i],
    study: [/\bочередь изучения\b/i, /\bмои материалы\b/i],
    youtube: [/\bрекомендуемые видео\b/i],
  },
  ja: {
    training: [/自分の練習記録/, /トレーニング履歴/, /マイセッション/],
    goals: [/自分の目標/, /マイゴール/],
    coach: [/今日何を練習/, /今日の技/, /コーチに聞く/],
    study: [/学習キュー/, /マイリソース/],
    youtube: [/おすすめ動画/],
  },
};

/**
 * Three layers, deterministic first:
 *   1. curated idiomatic phrases (`NAVIGATION_KEYWORDS`, e.g. "mes séances");
 *   2. plain substring match against short aliases (`NAVIGATION_ALIASES`,
 *      accent/case-normalized), covering the single-word destination names
 *      ("profil", "club", "sparring", ...);
 *   3. only when nothing matched at all — fuzzy per-token typo tolerance
 *      against those same aliases (e.g. "spraring" → sparring), so a small
 *      typo still lands on a destination instead of an empty navigator.
 */
export function matchNavigationIntents(query: string, locale: Locale): NavigationIntent[] {
  const keywords = NAVIGATION_KEYWORDS[locale] ?? NAVIGATION_KEYWORDS.en;
  const aliases = NAVIGATION_ALIASES[locale] ?? NAVIGATION_ALIASES.en;
  const matched = new Set<NavigationDestination>();

  for (const destination of Object.keys(NAVIGATION_INTENTS) as NavigationDestination[]) {
    if (keywords[destination]?.some((re) => re.test(query))) matched.add(destination);
  }

  const normalizedQuery = normalizeForNav(query);
  if (matched.size === 0) {
    for (const destination of Object.keys(NAVIGATION_INTENTS) as NavigationDestination[]) {
      if (aliases[destination]?.some((phrase) => normalizedQuery.includes(phrase))) matched.add(destination);
    }
  }

  if (matched.size === 0) {
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    let best: { destination: NavigationDestination; distance: number } | null = null;
    for (const destination of Object.keys(NAVIGATION_INTENTS) as NavigationDestination[]) {
      for (const phrase of aliases[destination] ?? []) {
        for (const word of phrase.split(/\s+/)) {
          if (word.length < 4) continue;
          for (const token of tokens) {
            const tolerance = word.length <= 6 ? 1 : 2;
            const distance = levenshtein(token, word);
            if (distance <= tolerance && (!best || distance < best.distance)) {
              best = { destination, distance };
            }
          }
        }
      }
    }
    if (best) matched.add(best.destination);
  }

  return Array.from(matched).map((d) => NAVIGATION_INTENTS[d]);
}

/**
 * Locale phrase → English keyword(s) that appear in the skill catalog's
 * `name`/`category` columns (always English, see migration note above).
 * Deliberately not exhaustive — covers the category/discipline vocabulary
 * actually used in the seed data, not a full bilingual dictionary.
 */
const CATEGORY_ALIASES: Record<Locale, Record<string, string[]>> = {
  fr: {
    garde: ["guard"],
    "passage de garde": ["pass"],
    passage: ["pass"],
    étranglement: ["choke"],
    étrangler: ["choke"],
    soumission: ["submission"],
    projection: ["throw", "takedown"],
    renversement: ["sweep"],
    échappement: ["escape"],
    évasion: ["escape"],
    défense: ["defense"],
    lutte: ["wrestling"],
    percussion: ["punch", "kick"],
    frappe: ["punch", "kick"],
    "coup de poing": ["punch"],
    "coup de pied": ["kick"],
    genou: ["knee"],
    coude: ["elbow"],
    contrôle: ["control"],
    "clé de bras": ["armbar", "kimura", "americana"],
    "clé de jambe": ["leglock", "kneebar", "heel hook", "toe hold"],
    debout: ["stance", "footwork"],
    jambes: ["leglock", "leg"],
    cage: ["cage"],
    sol: ["ground", "position"],
    plaquage: ["takedown"],
  },
  en: {
    guard: ["guard"],
    pass: ["pass"],
    choke: ["choke"],
    submission: ["submission"],
    throw: ["throw"],
    sweep: ["sweep"],
    escape: ["escape"],
    defense: ["defense"],
    defence: ["defense"],
    wrestling: ["wrestling"],
    striking: ["punch", "kick"],
    punch: ["punch"],
    kick: ["kick"],
    knee: ["knee"],
    elbow: ["elbow"],
    control: ["control"],
    armlock: ["armbar", "kimura", "americana"],
    leglock: ["leglock", "kneebar", "heel hook", "toe hold"],
    stance: ["stance"],
    takedown: ["takedown"],
    cage: ["cage"],
    ground: ["ground", "position"],
  },
  es: {
    guardia: ["guard"],
    pase: ["pass"],
    estrangulación: ["choke"],
    sumisión: ["submission"],
    proyección: ["throw", "takedown"],
    barrida: ["sweep"],
    escape: ["escape"],
    defensa: ["defense"],
    lucha: ["wrestling"],
    golpe: ["punch", "kick"],
    puño: ["punch"],
    patada: ["kick"],
    rodilla: ["knee"],
    codo: ["elbow"],
    derribo: ["takedown"],
  },
  de: {
    guard: ["guard"],
    passage: ["pass"],
    würgegriff: ["choke"],
    unterwerfung: ["submission"],
    wurf: ["throw"],
    sweep: ["sweep"],
    flucht: ["escape"],
    verteidigung: ["defense"],
    ringen: ["wrestling"],
    schlag: ["punch"],
    tritt: ["kick"],
    knie: ["knee"],
    ellbogen: ["elbow"],
    takedown: ["takedown"],
  },
  ru: {
    гард: ["guard"],
    проход: ["pass"],
    удушение: ["choke"],
    сабмишн: ["submission"],
    бросок: ["throw", "takedown"],
    свип: ["sweep"],
    защита: ["defense"],
    борьба: ["wrestling"],
    удар: ["punch", "kick"],
    колено: ["knee"],
    локоть: ["elbow"],
    тейкдаун: ["takedown"],
  },
  ja: {
    ガード: ["guard"],
    パス: ["pass"],
    絞め: ["choke"],
    サブミッション: ["submission"],
    投げ: ["throw"],
    スイープ: ["sweep"],
    エスケープ: ["escape"],
    ディフェンス: ["defense"],
    レスリング: ["wrestling"],
    パンチ: ["punch"],
    キック: ["kick"],
    タックル: ["takedown"],
  },
};

/** Returns the extra English catalog keywords implied by aliases found in the (already-lowercased) query. */
export function expandQueryKeywords(query: string, locale: Locale): string[] {
  const aliases = CATEGORY_ALIASES[locale] ?? CATEGORY_ALIASES.en;
  const lower = query.toLocaleLowerCase();
  const keywords = new Set<string>();
  for (const [phrase, mapped] of Object.entries(aliases)) {
    if (lower.includes(phrase.toLocaleLowerCase())) {
      for (const kw of mapped) keywords.add(kw);
    }
  }
  return Array.from(keywords);
}

/** Video-intent detector: "sprawl vidéo" → technique "sprawl" + show YouTube results inline. Strips the keyword and reports whether it fired. */
const VIDEO_KEYWORDS: Record<Locale, RegExp> = {
  fr: /\bvid[ée]os?\b/gi,
  en: /\bvideos?\b/gi,
  es: /\bv[ií]deos?\b/gi,
  de: /\bvideos?\b/gi,
  ru: /\bвидео\b/gi,
  ja: /動画/g,
};

export function extractVideoIntent(query: string, locale: Locale): { remainder: string; hasVideoIntent: boolean } {
  const pattern = VIDEO_KEYWORDS[locale] ?? VIDEO_KEYWORDS.en;
  if (!pattern.test(query)) return { remainder: query, hasVideoIntent: false };
  const remainder = query.replace(pattern, "").replace(/\s+/g, " ").trim();
  return { remainder: remainder || query, hasVideoIntent: true };
}

/** Classic DP edit distance, capped — only ever called on short technique-name-sized strings. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prev = Array.from({ length: bl + 1 }, (_, i) => i);
  for (let i = 1; i <= al; i++) {
    const current = [i];
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = current;
  }
  return prev[bl];
}

export type ScorableSkill = { name: string; category: string | null };

/**
 * Deterministic relevance score for one skill against a query, 0 = no match.
 * Exact > prefix > substring > alias-expanded keyword > fuzzy typo tolerance.
 * Fuzzy only applies per-word against the skill name so "armdrag" still
 * finds "Arm Drag" without false-positiving on unrelated short words.
 */
export function scoreSkillMatch(skill: ScorableSkill, query: string, expandedKeywords: string[]): number {
  const name = skill.name.toLocaleLowerCase();
  const category = (skill.category ?? "").toLocaleLowerCase();
  const q = query.toLocaleLowerCase().trim();
  if (!q) return 0;

  if (name === q) return 100;
  if (name.startsWith(q)) return 85;
  if (name.includes(q)) return 70;
  if (category === q) return 55;
  if (category.includes(q)) return 45;

  for (const kw of expandedKeywords) {
    if (name.includes(kw) || category.includes(kw)) return 40;
  }

  const qCompact = q.replace(/\s+/g, "");
  const nameCompact = name.replace(/\s+/g, "");
  const maxDistance = qCompact.length <= 4 ? 1 : qCompact.length <= 8 ? 2 : 3;
  const distance = levenshtein(qCompact, nameCompact);
  if (distance <= maxDistance) return 30 - distance;

  return 0;
}
