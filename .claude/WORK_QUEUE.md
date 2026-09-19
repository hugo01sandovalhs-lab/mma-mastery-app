# I18N + product features — work queue

Source mission: SESSION 2 brief (full-site i18n FR/EN/ES/DE/RU/JA + P0/P1 product features).
This file is the checkpoint for continuing across sessions per the repo's session-rotation policy. Read this before re-auditing from scratch.

## Done (session 2, commit after this file)

- `lib/i18n.ts`: 6 locales (fr/en/es/de/ru/ja), ~140 keys per locale, `formatT()` for `{var}` interpolation.
- `components/i18n-provider.tsx`: `t(key, fallback, vars)` now interpolates; added `<T k="..." fallback="..." vars={...}/>` — a client fragment usable **inside server components** to translate a single string without converting the whole page to a client component. Use this to keep migrating server pages.
- Language selector confirmed already present on every authenticated page (via `DashboardShell` → all of `app/(app)/*`, including `/profile`). Added it to: landing (`/`), `/login`, `/signup`, `/forgot-password`, `/reset-password` (all via `AuthShell`).
- Translated: nav (sidebar/mobile nav — was already wired to `t()`, just needed the dictionary filled), all `page.*.title` headers, landing page, all 4 auth pages + `AuthShell`, `/not-found`, profile's `TrainingPartners` (friend code copy+feedback, partner list, empty state), `/search` page chrome (kept `QUICK_PROMPTS` and `normalizeSearchQuery` French — see Known gaps).
- New feature — **search history** (`components/search/search-history.tsx`): client-side, `localStorage` only (`mma-mastery-search-history`), no schema/RLS needed. Records queries ≥2 chars, shows last 8, clearable.
- New feature — **persistent quick actions bar** (`components/quick-actions-bar.tsx`): floating bottom-right bar, desktop only (`≥768px`, hidden on mobile so it doesn't collide with `MobileNav`), links New session / Timer (`/training#timer`) / Coach / YouTube. Wired into `DashboardShell` so it's on every app page.
- Automated i18n check: `tests/design/i18n.test.ts` — key-parity across all 6 locales, no-blank-values, and a script-heuristic that fails if a `ru`/`ja` string is still pure Latin (catches untranslated fallthrough). Run: `npx vitest run tests/design/i18n.test.ts`.
- Verified clean: `npx tsc --noEmit`, `npx eslint .`, `npx vitest run` (170 tests), `npm run build`.

## Already existed before this session (verified, do NOT rebuild)

- **Max 3 priorities**: `lib/domain/training-intelligence.ts` `MAX_RECOMMENDATIONS = 3`.
- **Next session plan**: `buildTrainingPlanSuggestion()` in the same file.
- **Review this week / question backlog**: `lib/domain/review.ts` `buildReviewQueue()`.
- **Favorite video**: `lib/usecases/youtube-favorites-actions.ts`.
- **Favorite technique / resume technique**: `isBookmarked("skill", id)` + `SkillActionsBar` on `/skills/[id]` (`lib/usecases/knowledge-actions.ts`) — confirm this actually covers "favorite" semantics the mission wants (it's a bookmark/study-queue flag); if the product wants a separate lightweight favorites list distinct from the study bookmark, that's still open.
- **Copy friend code + feedback**: `components/profile/training-partners.tsx` (now i18n'd).
- **"Last practiced X days ago"**: already computed per-skill on `/skills/[id]` (`relativeDays()`); not yet surfaced as a dashboard-level widget across all recent skills.

## Known gaps — not done, needs a fresh session

### I18n (still hardcoded French, not yet migrated)
Everything below `PageHeader` (titles only were done) on these pages is still French: `/training` (incl. session forms, delete dialog, photo gallery), `/skills` catalogue + skill detail body (stage descriptions, metric labels, relation group titles), `/coach`, `/study`, `/goals`, `/competition`, `/club` (+ all its subpages: admin, announcements, classes, events, members), `/calendar`, `/youtube` body copy, gallery, timer widget internals (`round-timer.tsx`), all toasts/validation errors in `lib/usecases/*-actions.ts` (server action error strings — these need a locale passed from the client into the action, or a server-side locale cookie, since server actions can't read the `I18nProvider` context).
Approach for next session: use the new `<T k="…" fallback="…"/>` primitive for server components, `useI18n().t()` for client ones. Do NOT re-invent the wiring pattern — nav/page-titles already show the pattern that works.

### Search / query normalization
`lib/usecases/search-actions.ts` `normalizeSearchQuery()` strips French question phrasing (`"comment faire"`, `"qu'est-ce que"`, etc.) via regex. `QUICK_PROMPTS` in `app/(app)/search/page.tsx` were deliberately left in French because translating them would silently break that regex and degrade search quality in other locales. Fixing this properly needs locale-aware prompt sets + normalization, or dropping the French-specific stripping in favor of a language-agnostic approach.

### Server action error/toast strings
Auth errors, form validation messages, etc. returned from server actions (`lib/usecases/*.ts`) are plain French strings. Localizing these requires deciding how locale reaches the server action (cookie is the simplest: mirror `mma-mastery-locale` from `localStorage` into a cookie on `setLocale`, read it in the action).

### P0 items not yet verified/built
- "Sessions count this week/month" and "Last practiced X days ago" as a **dashboard-level** widget (data plumbing likely exists via `training_sessions` table — check `lib/usecases/training-*-actions.ts` before building anything new).
- "60-second session review" — distinct from `review.ts`'s backlog queue; likely a post-session reflection prompt. Not found in the codebase under that name — confirm it doesn't exist before building, then decide UI placement (probably `/training/[id]` after logging a session).
- "Add to goals" — check whether goal-linking already exists from a skill/session context before adding.
- Confirm "favorite technique" bookmark semantics match product intent (see above).

### P1 items not started
- Export session as text (`/training/[id]` — deterministic serialization of an existing session record, no new schema).
- Weekly summary (deterministic aggregation over existing `training_sessions`/`skill_progress`, no new schema).

### Visual / layout QA not done
No manual/browser check yet that Russian (longer strings) and Japanese (CJK) don't break the `w-40` fixed-width sidebar (`components/championship/sidebar.tsx`) or mobile nav labels. No `truncate` class is present so text should wrap rather than clip, but this needs an actual browser check with `locale=ru`/`ja` selected.

## Explicit non-goals kept from this session
Photography/layout/art direction and `/youtube` page design were not touched, per mission instruction to preserve commit `d99282a`.
