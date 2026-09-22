# design-championship-v2 — checkpoint

Branch: `design-championship-v2`, diverged from `master` at `52c1647`.
Source brief: full V2 UX/UI pass (15 numbered improvement areas — Fight HQ
dashboard, hierarchy, quick log, training log friction, coach, skills/
progression, sparring, YouTube analysis, study, goals, calendar timeline,
competition, club, search, mobile). Local-only, no deploy, no migrations
without explicit request, no deleted features, no architecture rewrite.

## Done this session (commits, newest last)
1. `24914dc` — Sparring insights: `summarizePositionBreakdown` (weak/strong
   positions), `summarizeTechniqueBreakdown` (most attempted / least
   successful), `computeRecentTrend` (lib/domain/sparring.ts), wired into
   `/sparring`'s new `InsightsCard`. Covers brief item 7.
2. `24914dc` — Global Quick Log: `components/quick-log/quick-log-button.tsx`,
   a floating action button (any page) opening the existing `TrainingForm`
   in a dialog, defaulting session vs sparring type. Zero new backend —
   reuses `createTrainingSession`. Covers brief item 3.
3. `4439878` — Command palette: Ctrl/Cmd+K global search overlay
   (`components/search/command-palette.tsx`), thin Server Action wrapper
   (`lib/usecases/quick-search-actions.ts`) around the existing `search()`
   usecase. `/search` page untouched, still the full-page destination.
   Covers brief item 14.
4. `ffd9aba` — YouTube analysis mode: new `/youtube/[videoId]` route,
   embeds the YouTube IFrame Player API, timestamped/typed notes (detail/
   timing/error/to-test), click-to-seek, optional skill link, "add to next
   training" (prefills `/training/new` via new `initialTechniqueName`/
   `initialObservationContent` TrainingForm props). **Reuses the existing
   `resources` table as-is** (url/title/author/skill_id/timestamp_seconds/
   notes) — no migration; note kind is a `[kind]` prefix inside the
   existing `notes` text column, decoded losslessly
   (`lib/domain/video-notes.ts`). Covers brief item 8.
5. `9db1437` — Dashboard "Voir les preuves": focus recommendation cards now
   expose every `SkillRecommendation.reason`, not just the first, via a
   native `<details>` disclosure. Covers the evidence-button half of
   brief item 5.

All 5 commits verified: `tsc --noEmit`, `eslint --max-warnings=0` (touched
files), `vitest run` (282/282, up from 276 at session start), `next build`
(all routes incl. new `/youtube/[videoId]`).

## Audited, found already sufficient — not touched this session
- **Item 1 (Fight HQ dashboard)**: already has a large hero photo, "Focus
  actuel", "Prochaine séance", progression ring, recent activity, club
  card, and a very visible "Nouvelle séance" CTA (`app/(app)/dashboard/
  page.tsx`, built across sessions 9-13 per `.claude/WORK_QUEUE.md`).
  Stats already carry qualitative framing (focus/next-session panels), not
  just raw counts.
- **Item 2 (hierarchy)**: `components/app-nav.tsx` already splits 5
  primary mobile-bottom-bar links from secondary sidebar-only links;
  mobile-first nav (`MobileNav`/`MobileSectionNav`) predates this session.
- **Item 4 (training log friction)**: 60-second session review and
  weekly summary already exist (session 3 per WORK_QUEUE); Quick Log
  (above) adds the fast global entry point on top of the existing form.
- **Item 6 (skills/progression stages)**: `MASTERY_STAGES` visualization
  (Compris/Drillé/Appliqué/Réussi/Sous pression) already rendered on
  dashboard's `ProgressionCompactCard`/`ProgressionSection` and on
  `/skills/[id]`.
- **Item 9 (study)**: `/study` already has a review queue, favorites, and
  linked resources (session 5+).
- **Item 10 (goals)**: goals already reference measurable data (drills/
  sessions) per WORK_QUEUE's "already existed" notes.
- **Item 13 (club)**: duplicate create-club CTA already fixed on this
  branch (`52c1647`, the branch's divergence point).
- **Item 12 (competition)**: already has `PageHeader` hero +
  `ChampionshipPhotoMosaic` + match history. Brief explicitly says not to
  build a full Fight Camp yet — left as-is.

## Not done — genuinely open for a future session
- **Item 5 (coach)**: the ≤3-recommendation cap, "next action", and
  reasons already exist (`ai-coach-actions.ts`, `MAX_RECOMMENDATIONS`);
  this session added the evidence disclosure to the **dashboard's** focus
  cards. The `/coach` page's own single `CoachAnswerView` (the
  `buildCoachContext` fact-based summary, distinct from the dashboard's
  per-skill recommendation cards) does **not yet** have an equivalent
  evidence toggle — smaller follow-up if wanted.
- **Item 11 (calendar timeline)**: `/calendar` is i18n'd (session 5) but
  still a plain month grid — not yet reworked toward the "Training
  Timeline" (volume/content/discipline emphasis) the brief describes.
- **Item 15 (mobile touch targets)**: spot-checked, not audited. The new
  Quick Log FAB is 56px (good). Existing header icon buttons
  (`LanguageSwitcher`, `UserMenu`, new `CommandPalette` trigger) use the
  pre-existing `icon-sm` (28px) button size — left consistent with
  existing header sizing rather than changed in isolation. A real pass
  would need to check every primary CTA across the app, not just this
  session's additions.
- **Item 2 (hierarchy) deeper pass**: only spot-checked; no visual
  QA in a browser this session (no seeded test user in this environment —
  same longstanding blocker noted throughout `.claude/WORK_QUEUE.md`).

## Manual QA still needed before comparing V1/V2
1. Log in as a real user and try Quick Log (FAB, bottom-right) for both
   session and sparring types.
2. Try Ctrl/Cmd+K from any page; confirm results navigate correctly and
   video results open in a new tab.
3. Open `/youtube`, click "Analyser" on a video result, confirm the
   player loads, add a note of each kind, click its timestamp to confirm
   seeking works, and try "Ajouter au prochain entraînement".
4. Visit `/sparring` with a few logged sparring sessions that have
   `position` values set, confirm the new insights card shows sensible
   weak/strong positions and a trend once there are 4+ sessions.
5. Dashboard: expand "Voir les preuves" on a focus card with more than
   one reason.
