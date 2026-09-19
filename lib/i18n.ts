export const LOCALES = ["fr", "en", "es", "de"] as const;
export type Locale = (typeof LOCALES)[number];

const fr = {
  "nav.dashboard": "Accueil", "nav.training": "Entraînement", "nav.skills": "Compétences",
  "nav.coach": "Coach", "nav.study": "Étude", "nav.goals": "Objectifs",
  "nav.competition": "Compétition", "nav.club": "Club", "nav.search": "Recherche",
  "nav.profile": "Profil", "nav.calendar": "Calendrier", "nav.youtube": "YouTube", "nav.menu": "Menu",
  "nav.all": "Toutes les rubriques", "language.label": "Langue",
  "page.training.title": "Entraînement", "page.skills.title": "Compétences", "page.coach.title": "Coach",
  "page.study.title": "Étude", "page.goals.title": "Objectifs", "page.competition.title": "Compétition",
  "page.club.title": "Club", "page.search.title": "Recherche", "page.profile.title": "Profil",
  "page.youtube.title": "YouTube",
} as const;

type TranslationKey = keyof typeof fr;
type Dictionary = Record<TranslationKey, string>;

export const DICTIONARIES: Record<Locale, Dictionary> = {
  fr,
  en: {
    "nav.dashboard": "Home", "nav.training": "Training", "nav.skills": "Skills", "nav.coach": "Coach",
    "nav.study": "Study", "nav.goals": "Goals", "nav.competition": "Competition", "nav.club": "Club",
    "nav.search": "Search", "nav.profile": "Profile", "nav.calendar": "Calendar", "nav.youtube": "YouTube", "nav.menu": "Menu",
    "nav.all": "All sections", "language.label": "Language", "page.training.title": "Training",
    "page.skills.title": "Skills", "page.coach.title": "Coach", "page.study.title": "Study",
    "page.goals.title": "Goals", "page.competition.title": "Competition", "page.club.title": "Club",
    "page.search.title": "Search", "page.profile.title": "Profile", "page.youtube.title": "YouTube",
  },
  es: {
    "nav.dashboard": "Inicio", "nav.training": "Entrenamiento", "nav.skills": "Habilidades", "nav.coach": "Coach",
    "nav.study": "Estudio", "nav.goals": "Objetivos", "nav.competition": "Competición", "nav.club": "Club",
    "nav.search": "Buscar", "nav.profile": "Perfil", "nav.calendar": "Calendario", "nav.youtube": "YouTube", "nav.menu": "Menú",
    "nav.all": "Todas las secciones", "language.label": "Idioma", "page.training.title": "Entrenamiento",
    "page.skills.title": "Habilidades", "page.coach.title": "Coach", "page.study.title": "Estudio",
    "page.goals.title": "Objetivos", "page.competition.title": "Competición", "page.club.title": "Club",
    "page.search.title": "Buscar", "page.profile.title": "Perfil", "page.youtube.title": "YouTube",
  },
  de: {
    "nav.dashboard": "Start", "nav.training": "Training", "nav.skills": "Fähigkeiten", "nav.coach": "Coach",
    "nav.study": "Lernen", "nav.goals": "Ziele", "nav.competition": "Wettkampf", "nav.club": "Verein",
    "nav.search": "Suche", "nav.profile": "Profil", "nav.calendar": "Kalender", "nav.youtube": "YouTube", "nav.menu": "Menü",
    "nav.all": "Alle Bereiche", "language.label": "Sprache", "page.training.title": "Training",
    "page.skills.title": "Fähigkeiten", "page.coach.title": "Coach", "page.study.title": "Lernen",
    "page.goals.title": "Ziele", "page.competition.title": "Wettkampf", "page.club.title": "Verein",
    "page.search.title": "Suche", "page.profile.title": "Profil", "page.youtube.title": "YouTube",
  },
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}
