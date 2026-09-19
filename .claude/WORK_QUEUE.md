# I18N + product features — work queue

Source mission: SESSION 2/3 brief (full-site i18n FR/EN/ES/DE/RU/JA + P0 product features).
This file is the checkpoint for continuing across sessions per the repo's session-rotation policy. Read this before re-auditing from scratch.

Checkpoint before this session: `089410e` (session 2) + a visual-correction commit. This session's commits (in order): `82f5cdc` (features + server-action i18n infra), `2a99dea` (training area i18n), `8f446f1` (skills catalogue i18n).

## Done (session 3, this session)

### P0 product features — all 5 implemented
- **60-second session review**: `components/training/session-review.tsx`, rendered on `/training/[id]`. Deterministic summary computed from the already-loaded session (technique/difficulty/success counts, first difficulty as "focus next time", first success as "keep doing"). No schema change.
- **Dashboard session counts (week/month)**: `lib/domain/training.ts` `computeSessionStats()` (pure, tested via existing session list — no new query). Wired into `/dashboard` hero footer and a new `WeeklySummaryCard` (`components/training/weekly-summary.tsx`) on `/training`.
- **Add to goals wiring**: `quickAddGoalFromSkill()` in `lib/usecases/goals-actions.ts`, called from a new third button in `SkillActionsBar` (`components/skills/skill-actions-bar.tsx`) on `/skills/[id]`. Creates a `short`-horizon active goal linked to the skill; button flips to "Added" and stays disabled once a matching active goal exists.
- **Export session as text**: button in `SessionReviewCard`, client-side `Blob`/`<a download>`, no server round-trip.
- **Weekly summary**: `WeeklySummaryCard` on `/training` — session count, total minutes, technique count, disciplines worked, all from `computeSessionStats()`.

### Server-action i18n infra (unblocks translating error/toast strings)
- `components/i18n-provider.tsx`: `setLocale` now also mirrors the locale into a `mma-mastery-locale` cookie (in addition to `localStorage`), so server actions can read it.
- `lib/i18n-server.ts` (new): `getServerLocale()` reads that cookie via `next/headers`; `tServer(key, fallback, vars?)` is the server-action equivalent of the client `t()`.
- Applied to the actual ad-hoc validation/error/toast strings in: `auth-actions.ts`, `training-actions.ts`, `training-photo-actions.ts`, `goals-actions.ts`, `class-actions.ts`. (`"Not authenticated"` invariant throws in various `*-actions.ts` files were deliberately left alone — they're defensive guards that should never surface in normal UX, not user-facing copy.)

### I18n — fully migrated pages/components (all 6 locales, verified via `tests/design/i18n.test.ts`)
- `/training` (list + weekly summary + timer), `/training/new`, `/training/[id]/edit`, `/training/[id]` (+ new review card), `/training/photos`, `/training/review`.
- `components/training/*`: `training-form.tsx`, `round-timer.tsx` (all timer internals), `photo-gallery.tsx`, `delete-session-dialog.tsx`, `session-review.tsx`, `weekly-summary.tsx`.
- `/skills` catalogue page (search, filter, empty states, per-card "practiced N days ago").
- `components/skills/skill-actions-bar.tsx` (favorite/study-queue/goal buttons).
- New shared keys `common.today` / `common.yesterday` / `common.daysAgo` for relative-day formatting — reuse these instead of inventing new ones when translating dashboard's and skill-detail's own `relativeDays()` helpers.

## Already existed before this session (verified, do NOT rebuild)
- **Max 3 priorities**: `lib/domain/training-intelligence.ts` `MAX_RECOMMENDATIONS = 3`.
- **Next session plan**: `buildTrainingPlanSuggestion()` in the same file.
- **Review this week / question backlog**: `lib/domain/review.ts` `buildReviewQueue()`, surfaced at `/training/review` (now i18n'd chrome; item detail text itself is still French — see gaps).
- **Favorite video**: `lib/usecases/youtube-favorites-actions.ts`.
- **Favorite technique / resume technique / add to goals**: `SkillActionsBar` on `/skills/[id]` now covers bookmark, study-queue, and goal-linking as three distinct actions.
- **Copy friend code + feedback**: `components/profile/training-partners.tsx` (i18n'd in session 2).
- **"Last practiced X days ago"**: now available as a reusable pattern (`common.daysAgo` etc.) — see gaps for where it's still hardcoded French.

## Known gaps — not done, needs a fresh session

### I18n — pages/components still hardcoded French
Below `PageHeader` (titles only were done in session 2) or entirely untouched:
- `/skills/[id]` (skill detail) — **largest remaining single file (~500 lines)**. `SkillActionsBar` at the top is done; everything below (`WhatIKnowSection`'s generated fact sentences ("Connaissance théorique X/5", "X répétitions en drilling", etc.), `STAGE_DESCRIPTIONS` record, `ProgressionSection`, `RelationsSection`, `NextActionSection`, `NotesAndResourcesSection`, `HistorySection`, and the Hero's "Pratiqué"/"Jamais pratiqué"/"Nouvelle séance") is still French. Use the same `getServerLocale()` + `DICTIONARIES[locale]` pattern used in `/skills/page.tsx` (this page is also an async server component) rather than converting it to a client component.
- `/coach`, `/study`, `/goals` (body — `GoalForm`/`GoalRow` including `GOAL_HORIZON_LABELS`/`GOAL_STATUS_LABELS`), `/competition` (+ `[id]`), `/club` and all 8 subpages (`admin`, `announcements` incl. `[announcementId]`, `classes` incl. `[classId]`, `events` incl. `[eventId]`, `members/[memberId]`) — **not started**, `/club` alone is ~960 lines across components + pages.
- `/calendar` — not started.
- `/youtube` — page title/nav done; body copy, gallery, and `components/youtube/*` not started.
- `dashboard/page.tsx`'s own inline `relativeDays()` (French only) — swap for the new `common.today`/`common.yesterday`/`common.daysAgo` keys instead of duplicating logic.

### Domain enum-label maps — deliberately left alone (cross-cutting, not one-file fixes)
These `Record<Enum, string>` constants are French-only and used across many pages (dashboard, training list/detail, skill list/detail, review queue): `SESSION_TYPE_LABELS`, `OBSERVATION_TYPE_LABELS`, `SESSION_TECHNIQUE_OUTCOME_LABELS` (`lib/domain/training.ts`), `MASTERY_STAGE_LABELS` (`lib/domain/skill.ts`), `REVIEW_ITEM_TYPE_LABELS` (`lib/domain/review.ts`). Translating these requires either (a) turning each into a function of `locale`/`dict` and updating every call site, or (b) moving the labels into `lib/i18n.ts` dictionaries and looking them up by a stable key (e.g. `sessionType.${code}`) at each call site. Option (b) fits the existing architecture better. Do this as its own focused pass — don't half-convert one file's usage without the others, or the same enum will show mixed languages depending on which screen you're on.

### Review-queue generated detail text
`lib/domain/review.ts` `buildReviewQueue()` returns `item.detail` as a fully-formed French sentence per item (not a template key). Needs the same "return key+vars, translate at render" refactor as `training-intelligence.ts`'s recommendations, or an equivalent `tServer`/`dict` pass at the call site (`/training/review`).

### Search / query normalization (from session 2, still open)
`lib/usecases/search-actions.ts` `normalizeSearchQuery()` strips French question phrasing via regex; `QUICK_PROMPTS` in `app/(app)/search/page.tsx` are deliberately still French because translating them would silently break that regex. Needs locale-aware prompt sets + normalization, or a language-agnostic normalization approach.

### Visual / layout QA not done
No manual/browser check yet that Russian (longer strings) and Japanese (CJK) don't break the `w-40` fixed-width sidebar (`components/championship/sidebar.tsx`) or mobile nav labels.

## Explicit non-goals kept
Photography/layout/art direction untouched. No schema/RLS changes made this session (all 5 features reuse existing tables/columns).
