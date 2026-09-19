# I18N + product features — work queue

Source mission: SESSION 2/3 brief (full-site i18n FR/EN/ES/DE/RU/JA + P0 product features).
This file is the checkpoint for continuing across sessions per the repo's session-rotation policy. Read this before re-auditing from scratch.

**Correction from session 3's checkpoint**: session 3 claimed `/training` (list) and `/training/[id]` (detail) were "fully migrated" to i18n. That was **inaccurate** — verified in session 4 that both pages are still 100% hardcoded French (including `formatDate` using `"fr-FR"` and every visible string). Only `training-form.tsx`, `round-timer.tsx`, `photo-gallery.tsx`, `delete-session-dialog.tsx`, `session-review.tsx`, and `weekly-summary.tsx` (the components) were actually done. Treat prior-session "done" claims as unverified until you check the file yourself.

Checkpoint before session 4: `21e6784`. Session 4 commit: see current HEAD.

## Session 4 summary (this session)

Ran 5 parallel forks (competition, coach/study/goals, club+subpages, youtube+search, domain-enum-labels+skill-detail). Hit an account-wide rate limit mid-run; resumed all 5 after reset; user then stopped the remaining 3 (coach/study/goals, club, domain-labels/skill-detail) for token economy and had the main thread reconcile by hand. **Net result: 2 of 5 areas fully completed, 3 partially completed** — see below. All reconciliation work (fixing broken imports, duplicate dict keys, missing dict keys) was done directly, not delegated further.

### Fully done (verified: typecheck, lint, vitest 185/185, `next build` all pass)
- **`/competition` + `/competition/[id]`**: fully i18n'd, all 6 locales, including `matchResult.*`, `competition.errors.*` (zod validation), locale-formatted dates. `lib/usecases/competition-actions.ts` server-action errors translated via `tServer()`.
- **`/youtube` body + search normalization**: `/youtube/page.tsx`, `youtube-video-card.tsx` fully i18n'd. `normalizeSearchQuery()` in `search-actions.ts` is now locale-aware (6 locales' question-phrasing regexes); `QUICK_PROMPTS` moved to `SEARCH_QUICK_PROMPTS` (per-locale) in `lib/i18n.ts`. `tests/usecases/search-actions.test.ts` extended with per-locale coverage.

### Partially done — dictionary keys exist, but page bodies were NOT converted
- **Coach/study/goals**: the fork added ~80 new dict keys (`coach.*`, `study.*`, `goals.*`, `goalHorizon.*`, `goalStatus.*`, `factKind.*`) to all 6 locale dictionaries in `lib/i18n.ts` — these are correctly translated and ready to use — **but it never got to editing `/coach`, `/study`, `/goals`, `GoalForm`, `GoalRow`**. Those pages are still 100% hardcoded French. This is the next session's fastest win: the hard translation work is already done, only the wiring (swap hardcoded French JSX for `<T k=.../>` / `dict[...]` lookups) remains.
- **Club + 8 subpages**: the fork edited all the page/component files (added `<T k="club.*">` usage, `dict["club.*"]` lookups, `getServerLocale()` plumbing) but was interrupted before it added the corresponding keys to `lib/i18n.ts`, and some of its own dict-key naming had duplicates/races with the competition fork's concurrent edits to the same file. This session's reconciliation pass **added all ~45 missing keys** (`club.*`, `clubRole.*`, `eventType.*`, `attendanceStatus.*`, `weekday.*`) across all 6 locales by reading each usage site's original French fallback text and translating it properly. Typecheck/build/lint/tests all pass. **Not yet spot-checked in a browser** — the fork's own page edits were never visually verified, so treat this as "should work" rather than "confirmed working" until someone loads `/club` and its subpages in each locale.
- **Skill detail (`/skills/[id]`) body**: this remains the **largest open gap**, unchanged from session 3's assessment — `WhatIKnowSection`'s generated fact sentences, `STAGE_DESCRIPTIONS`, `ProgressionSection`, `RelationsSection`, `NextActionSection`, `NotesAndResourcesSection`, `HistorySection`, and the Hero's "Pratiqué"/"Jamais pratiqué" are all still hardcoded French. The fork assigned to this never reached it (it was stopped after redoing the domain enum-label exports). This session only fixed the **compile break** it left behind (see below) — no new translation happened on this page.

### Reconciliation fixes made directly (not part of either fork's original scope, but required to get back to a working build)
- `lib/domain/training.ts`, `lib/domain/skill.ts`, `lib/domain/review.ts`: the interrupted domain-labels fork had renamed `SESSION_TYPE_LABELS`/`OBSERVATION_TYPE_LABELS`/`SESSION_TECHNIQUE_OUTCOME_LABELS`/`MASTERY_STAGE_LABELS`/`SKILL_RELATION_TYPE_LABELS`/`REVIEW_ITEM_TYPE_LABELS` to `*_LABEL_KEYS` (dictionary-key records) and changed `ReviewItem.detail` (string) to `detailKey` + `detailVars`, but had only updated some call sites before being interrupted. Fixed the remaining broken imports/usages in: `app/(app)/skills/[id]/page.tsx`, `app/(app)/skills/map/page.tsx`, `app/(app)/training/[id]/page.tsx`, `app/(app)/training/page.tsx`, `app/(app)/training/review/page.tsx`, `lib/usecases/calendar-actions.ts`, `lib/usecases/ai-coach-actions.ts`.
  - **Caveat**: for pages that were already entirely French and not otherwise locale-threaded (`skills/[id]`, `skills/map`, `training/page.tsx`, `training/[id]/page.tsx`, `ai-coach-actions.ts`'s fact statements), the fix uses `DICTIONARIES.fr[...]` directly (preserving current French-only behavior) rather than wiring full `getServerLocale()` locale-awareness, since that page-level i18n work was out of scope for a compile-fix pass. `app/(app)/training/review/page.tsx` DID get proper `getServerLocale()`/`dict` wiring for the review-item type badges and the generated detail sentences (`review.detail.*` keys), since that page already had partial `<T>` usage.
- `lib/i18n.ts`: fixed 6× duplicate `matchResult.*` property literals (both the competition fork and an earlier pass had independently inserted the same keys into each locale block — kept the earlier, better-translated copy, removed the duplicate). Added the missing ~80 ru/ja keys that the coach/study/goals fork had only added to fr/en/es/de before being interrupted. Added the ~45 missing club/event/weekday/role keys described above. All 6 locale dictionaries now have exactly matching key sets (643 keys each), verified by script and by `tests/design/i18n.test.ts`.
- `tests/design/i18n.test.ts`: added `coach.fact.recommendation`, `coach.fact.reviewItem`, `coach.askPending`, `resourceForm.url`, `review.detail.quoted` to `ALLOWED_LATIN` — these are legitimately identical across locales (pure `{var}` interpolation shells, universal ellipsis, the "URL" acronym, guillemet-only quote wrapper), not untranslated leaks.

## Already existed before session 4 (verified, do NOT rebuild)
- 60-second session review, dashboard session counts, add-to-goals wiring, export session as text, weekly summary (all session 3).
- Max 3 priorities, next session plan, review queue, favorite video/technique/resume/goals wiring, copy friend code (session 2/3).
- Server-action i18n infra: `lib/i18n-server.ts` (`getServerLocale()`, `tServer()`), locale cookie mirroring in `components/i18n-provider.tsx`.

## Known gaps — still open, ranked by effort-to-value

1. **Coach/study/goals page wiring** (fastest win — translations already exist in `lib/i18n.ts`, just needs `/coach/page.tsx`, `/study/page.tsx`, `/goals/page.tsx`, `components/goals/goal-form.tsx`, `components/goals/goal-row.tsx` converted to use them instead of hardcoded French JSX).
2. **Skill detail (`/skills/[id]`) body** — largest single-file gap (~500 lines), unchanged since session 3.
3. **`/training` and `/training/[id]` full i18n** — turns out these were never actually done despite prior claims; only their sub-components were. `formatDate()` in both uses hardcoded `"fr-FR"`.
4. **`/calendar`** — not started. Note `lib/usecases/calendar-actions.ts` still has hardcoded `EVENT_TYPE_LABELS`/`MATCH_RESULT_LABELS` (French) and a hardcoded `"Compétition"` fallback string — only `SESSION_TYPE_LABEL_KEYS` was fixed there (compile-break fix only).
5. **`ai-coach-actions.ts`** — the coach's generated fact statements (`Focus recommandé: ...`, `Objectif "..."`, etc.) are entirely hardcoded French; only the review-item `.detail` reconstruction was fixed for compile correctness. Needs the same "template key + vars, translate at read time" treatment as `training-intelligence.ts`.
6. **Club pages — browser verification**: reconciled to compile/typecheck/pass tests, but never spot-checked visually. Do this before considering club "done".
7. **Visual QA for ru/ja** (long Cyrillic strings, CJK characters) against `w-40` fixed-width sidebar and mobile nav — still not done, carried over from session 3.

## Explicit non-goals kept
Photography/layout/art direction untouched. No schema/RLS changes made this session.
