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

## Session 5 summary

Completed queue items 1 (coach/study/goals wiring) and 2 (skill detail body). Verified after each: typecheck, lint (touched files), vitest 185/185, `next build` all pass.

### Item 2: skill detail (`/skills/[id]`) body
- `app/(app)/skills/[id]/page.tsx` fully converted to `getServerLocale()`/`DICTIONARIES[locale]`: Hero, WhatIKnowSection, ProgressionSection, RelationsSection, NextActionSection, NotesAndResourcesSection, HistorySection all take a `dict` prop now. Replaced all hardcoded French (`STAGE_DESCRIPTIONS`, `LEVEL_LABEL`, `relativeDays`, "Pratiqué"/"Jamais pratiqué", section headings, relation-group titles, history date locale) with dict lookups. All `skillDetail.*` dictionary keys **already existed** (added by an earlier session's fork, never wired) — this pass was pure wiring, no new keys needed there.
- `components/skills/skill-notes-section.tsx` converted to `useI18n()`/`t()`. Its 4 keys (`skillNote.placeholder/submit/empty/deleteAria`) did **not** exist and were added to `lib/i18n.ts` for all 6 locales.
- `history.toLocaleDateString("fr-FR")` → `.toLocaleDateString(locale)` (uses the BCP-47 locale code directly, consistent with other session date formatting in the app).
- **Deliberately left French/untranslated** (out of scope, tracked as separate known gaps): `NextActionSection`'s `recommendation.reasons`/`recommendation.action` (AI-generated text from `training-intelligence.ts` — same gap as `ai-coach-actions.ts`), and `lib/domain/skill.ts`'s `MASTERY_STAGE_LABELS` (French-only, intentionally kept per its own doc comment for `training-intelligence.ts`'s internal use).

- `/coach`, `/study`, `/goals` pages now use `getServerLocale()`/`DICTIONARIES[locale]` for title/description/headings, same pattern as `/competition`.
- `components/coach/coach-answer.tsx` and `coach-question-form.tsx` converted to `useI18n()`/`t()` for all labels, buttons, fact-kind badges, suggested questions.
- `components/study/resource-form.tsx`, `resource-row.tsx`, `study-queue-item-row.tsx` and `components/goals/goal-form.tsx`, `goal-row.tsx` converted to `useI18n()`/`t()`.
- `lib/domain/knowledge.ts`: replaced hardcoded French `RESOURCE_TYPE_LABELS`/`STUDY_STATUS_LABELS`/`GOAL_HORIZON_LABELS`/`GOAL_STATUS_LABELS` records with `*_LABEL_KEYS` (dictionary-key) records, matching the existing `training.ts` pattern. All old-name call sites updated (verified via repo-wide grep, zero remaining).
- `lib/i18n.ts`: added `page.coach.description`, `page.study.description`, `page.goals.description` (×6 locales) — the only dict keys that were actually missing; everything else (`coach.*`, `study.*`, `goals.*`, `goalForm.*`, `goalRow.*`, `resourceForm.*`, `resourceRow.*`, `studyQueueItem.*`, `factKind.*`, `resourceType.*`, `studyStatus.*`, `goalHorizon.*`, `goalStatus.*`) already existed from session 4's fork and just needed wiring.
- **Not translated (explicitly out of scope for this pass)**: zod validation error messages in `lib/domain/knowledge.ts` (goal/resource form errors like "Titre requis", "Date invalide", "URL invalide") are still French-only, same as goals/resources server-action errors — analogous to what `competition-actions.ts` did with `tServer()`, but not part of "wire existing keys" scope. Coach's AI-generated fact/response text (`response.summary`, `rec.statement`) is still French — that's `ai-coach-actions.ts`, tracked separately as item 5 below (now renumbered item 4).

### Item 3: calendar body
- `app/(app)/calendar/page.tsx` and `components/calendar-view.tsx` fully i18n'd via `getServerLocale()`/`DICTIONARIES`/`useI18n()`. Month label and day-detail heading now use `.toLocaleDateString(locale, ...)` instead of hardcoded `"fr-FR"`. Weekday grid headers now derive localized short names from `Intl`/`toLocaleDateString` off a known Monday-first reference week instead of a hardcoded `["Lun", "Mar", ...]` array — this avoids needing 7×6 more dict keys and stays correct for any locale.
- `lib/domain/calendar.ts`: `CALENDAR_EVENT_TYPE_LABELS` → `CALENDAR_EVENT_TYPE_LABEL_KEYS` (new keys `calendarEventType.*`, added for all 6 locales — did not previously exist).
- `lib/usecases/calendar-actions.ts`: fixed the two gaps named in the prior checkpoint — `EVENT_TYPE_LABELS`/`MATCH_RESULT_LABELS` (French) and the hardcoded `"Compétition"` fallback are now `dict[EVENT_TYPE_LABEL_KEYS[...]]`/`dict[MATCH_RESULT_LABEL_KEYS[...]]`/`dict["calendarEventType.competition"]`.
- `lib/domain/competition.ts`: `MATCH_RESULT_LABELS` fully replaced by `MATCH_RESULT_LABEL_KEYS` (safe — grep confirmed no other caller depended on the old value export; `match-form.tsx`/`match-row.tsx` already used `t(\`matchResult.${r}\`)` directly).
- `lib/domain/club-event.ts`: added `EVENT_TYPE_LABEL_KEYS` **alongside** the existing French-only `EVENT_TYPE_LABELS` (kept, same pattern as `skill.ts`'s `MASTERY_STAGE_LABELS`) because 3 other call sites (`club/[id]/events/[eventId]/page.tsx`, `components/club/event-row.tsx`, `components/club/event-form.tsx`) still depend on it and weren't touched — those are part of the still-open club-pages gap, not this item's scope.
- Added `page.calendar.description`, `calendar.today`, `calendar.noEvents` to `lib/i18n.ts` for all 6 locales (didn't exist before).

### Item 4: training list/detail body
- `app/(app)/training/page.tsx` and `app/(app)/training/[id]/page.tsx` fully converted to `getServerLocale()`/`DICTIONARIES[locale]`. `formatDate()` in both now takes `locale` instead of hardcoded `"fr-FR"`.
- Added new keys (none existed before): `page.training.tagline`, `trainingList.*` (sessionCount, gallery, toReview, timerTitle, sessionsTitle, noSessionsTitle, noSessionsDesc, observationCount), `trainingDetail.*` (editButton, skillsWorkedTitle, noTechniques, noObservations, skillFallback) — all 6 locales. Reused existing `training.observationsTitle` and `form.notes` where wording already matched exactly (avoided duplicate keys).
- `ChampionshipSectionPhoto`'s `alt`/`label` props on the round-timer photo were left French (same established pattern as every other page — `labelKey` prop drives the actual translation, `label`/`alt` are dev-facing fallbacks).

### Item 5: ai-coach-actions.ts user-facing fact statements
- `lib/usecases/ai-coach-actions.ts`'s `buildCoachContext()`: every generated `CoachFact.statement` (focus recommendation, per-skill recommendation, review-item detail, goal reminder, study-queue count) now built via `formatT(dict["coach.fact.*"], vars)` with `dict = DICTIONARIES[await getServerLocale()]`, instead of hardcoded French template strings / `DICTIONARIES.fr[...]`.
- `lib/domain/ai-coach.ts`'s `AIProvider.generateCoachResponse` now takes an optional third `locale: Locale` param (defaults `"fr"` in both implementations, so existing callers/tests that omit it are unaffected).
- `lib/infra/ai/deterministic-provider.ts`: `summary`/`reason` strings now built from `dict["coach.summaryJoined"/"coach.observedCount"/"coach.inferredCount"/"coach.summaryDefault"/"coach.insufficientDataReason"]` for the given locale (added `coach.insufficientDataReason` + `coach.localModelEmpty`, didn't exist before, all 6 locales).
- `lib/infra/ai/ollama-provider.ts`: the model prompt itself is an instruction the model must follow, so its 6 lines (intro, no-invent warning, "respond in X", facts/question labels, default ask) are now fully translated per locale via a `PROMPT_STRINGS` map — not just the language name — so a self-hosted Ollama model is actually told to answer in the UI's language rather than always French.
- `getCoachResponse()`/`getCoachResponse` caller in `ai-coach-actions.ts` resolves `getServerLocale()` once and passes it through to whichever provider runs.
- **Test fix**: `tests/usecases/ai-coach-actions.test.ts` now mocks `@/lib/i18n-server`'s `getServerLocale` (it wasn't mocked before because the code path never called it) — calling `cookies()` outside a Next.js request scope throws in vitest. `tests/infra/ollama-provider.test.ts` and `tests/domain/ai-coach.test.ts` needed no changes (they already omitted the new optional 3rd arg, which defaults to `"fr"`).
- **Deliberately left French** (separate tracked gap, unchanged): `training-intelligence.ts`'s own `SkillRecommendation.reasons`/`.action`/`evidence` text — these flow into the fact statements as opaque substrings (e.g. `rec.action` inside `coach.fact.recommendation`'s `{action}` var) but originate from `training-intelligence.ts`, not `ai-coach-actions.ts`.

## Session 6 summary

Closed queue items 1–3 (all fully done, not partial). Verified after each: typecheck, lint (0 warnings), vitest 185/185, `next build` all pass. Main agent only, sequential edits, no subagents/forks/worktrees per this session's directive.

### Item 1: `training-intelligence.ts` i18n — done
- `lib/domain/training-intelligence.ts`: `Trigger`, `SkillRecommendation`, `TrainingPlanSuggestion` all converted from hardcoded French strings to "key + vars" (new exported `LocalizedText = { key, vars }` type), same pattern `review.ts` already used for `ReviewItem.detailKey`/`detailVars`. Six trigger kinds (`difficulty`, `question`, `liveTransfer`, `sparringLow`, `stale`, `developing`) each got `trainingIntel.<kind>.reason/action/evidence` dict keys. `TRAINING_PLAN_ACTION_COPY` converted from inline French strings to `{drillHintKey, liveWatchForKey, postObserveKey}` pointing at new `trainingPlanCopy.<ACTION_TYPE>.*` keys (33 new key groups × 6 locales added to `lib/i18n.ts`).
- Consumers updated to translate at render/use time: `lib/usecases/ai-coach-actions.ts` (`buildCoachContext`, including `stage` var re-translation via `MASTERY_STAGE_LABEL_KEYS` same as it already does for review items), `app/(app)/skills/[id]/page.tsx`'s `NextActionSection` (was the last deliberately-left-French gap from session 5's item 2), `app/(app)/dashboard/page.tsx` (via existing `<T k=... vars=.../>` pattern, already used there for other fields), `app/(app)/training/new/page.tsx`'s `FocusCallout`.
- `lib/domain/training-intelligence.ts` no longer imports `MASTERY_STAGE_LABELS` (unused now — stage translation happens at the dict layer, not in the domain).
- Test fixes: `tests/domain/training-intelligence.test.ts` assertions changed from string-content checks (`r.includes("Difficulté")`) to key checks (`r.key === "trainingIntel.difficulty.reason"`) or `r.vars.content` checks. `tests/usecases/ai-coach-actions.test.ts`'s mock of `getTrainingIntelligenceBundle` updated to the new plan shape (`objectiveKey`/`objectiveVars`, `reasons`/`evidence` as `{key, vars}[]`).

### Item 2: goal/resource Zod user-facing errors — done
- `lib/usecases/knowledge-actions.ts`: added a `firstFieldError()` helper (same shape as `competition-actions.ts`'s) mapping the first failing Zod field to a translation key via `tServer()`, for both `createResource` (`resource.errors.titleRequired`/`urlInvalid`) and `createSkillNote` (`skillNote.errors.contentRequired`). Previously both returned the raw Zod default message, which is always French regardless of locale.
- `lib/usecases/goals-actions.ts`: same fix for `createGoal` — added `firstFieldError()` mapping `title`→`goal.errors.titleRequired`, `due_date`→`goal.errors.dateInvalid`. The old code had a `?? tServer(...)` fallback that was unreachable (Zod's `.issues[0]?.message` is never undefined), so it silently always returned French; now genuinely locale-aware.
- `lib/domain/knowledge.ts` itself untouched — its Zod schema messages stay as-is (French fallback text only), same as `competition.ts`'s pattern: the usecase layer maps by field name via `tServer()`, ignoring Zod's own `.message`.
- New dict keys added to `lib/i18n.ts` (×6 locales): `resource.errors.titleRequired/urlInvalid`, `skillNote.errors.contentRequired`, `goal.errors.titleRequired/dateInvalid`.

### Item 3: stray French in club pages — done
- `components/club/event-row.tsx`: converted to `useI18n()`/`t()`. `EVENT_TYPE_LABELS[...]` → `t(EVENT_TYPE_LABEL_KEYS[...])`; hardcoded `"Inscrit"` → `club.registered`; hardcoded `aria-label="Supprimer l'événement"` → `club.deleteEvent`; `toLocaleString("fr-FR", ...)` → `toLocaleString(locale, ...)`.
- `components/club/event-form.tsx`: was **entirely unwired** (every label/button hardcoded French, not caught by session 4's club fork) — converted fully to `useI18n()`/`t()` (`club.eventName`, `club.eventTypeLabel`, `club.eventDateTime`, `club.locationOptional`, `club.createEventBtn`), event-type `<option>` list switched to `EVENT_TYPE_LABEL_KEYS`.
- `app/(app)/club/[id]/events/[eventId]/page.tsx`: simplified `dict[...] ?? EVENT_TYPE_LABELS[...]` fallback to a plain `dict[EVENT_TYPE_LABEL_KEYS[event.event_type]]` lookup (the fallback was dead code — the key always exists).
- `lib/domain/club-event.ts`: removed `EVENT_TYPE_LABELS` (French-only record) entirely now that all 3 call sites use `EVENT_TYPE_LABEL_KEYS` — unlike `skill.ts`'s `MASTERY_STAGE_LABELS`, this one had no legitimate internal-engine reason to keep a French-only fallback pool.
- `lib/domain/class.ts`: added `ATTENDANCE_STATUS_LABEL_KEYS` (didn't exist — only the French-only `ATTENDANCE_STATUS_LABELS` did), removed `ATTENDANCE_STATUS_LABELS`. Fixed its 2 call sites: `app/(app)/club/[id]/members/[memberId]/page.tsx` (simplified the same `dict[...] ?? LABELS[...]` dead-fallback pattern) and `components/club/session-card.tsx`.
- `components/club/session-card.tsx`: was **entirely unwired** (found via a repo-wide scan for accented characters outside `t()`/`<T>` calls in `components/club` and `app/(app)/club` — this and `event-form.tsx` were the only two files with real hits). Converted fully: `formatDateTime` now takes `locale` instead of hardcoded `"fr-FR"`; every visible string (delete-session aria-label, check-in code status, regenerate/generate-code button, roster empty state, "Membre" fallback, "Votre présence", attendance badges, "Non renseignée") now goes through `t()`.
- `components/club/class-session-form.tsx`: was also entirely unwired (`Début`/`Fin (optionnel)`/`Ajouter une séance`) — same fix pattern as `class-form.tsx`.
- Verification method: `grep -rnP '>[^<>{]*[À-ÿ][^<>{]*<|aria-label="[^"]*[À-ÿ]'` across `components/club` and `app/(app)/club`, excluding matches already inside `t(...)`/`<T k=...>` calls (those are legitimate translated-fallback text, not leaks). Confirmed zero remaining hits after the fixes above; `checkin-form.tsx`, `class-row.tsx`, `club-form.tsx`, `event-registration-button.tsx`, `group-form.tsx`, `invite-form.tsx`, and all `app/(app)/club/**/page.tsx` files were already fully wired (session 4) and needed no changes.
- **Not touched (out of scope, pre-existing and not a translation bug)**: `CLUB_ROLE_LABELS` (French-only record) is still used as the `fallback` argument to `t("clubRole.X", CLUB_ROLE_LABELS[x])` calls in several files — this is correct usage (fallback text, not a leak) since the `clubRole.*` dict keys always exist, matching the same intentional pattern as `skill.ts`'s `MASTERY_STAGE_LABELS`.

### Dictionary consistency
`tests/design/i18n.test.ts` passes: all 6 locales (fr/en/es/de/ru/ja) have identical key sets, no missing/extra keys, no leftover untranslated-Latin leaks in non-Latin locales.

### Browser QA — still blocked, same as session 5
No seeded test user, test credentials, or dev-only auth bypass exist anywhere in this repo (checked `.claude/`, `supabase/` for any seed/test-user infra — none found). Per this session's explicit instruction, did not alter production/auth code to manufacture one. All verification this session was therefore static: typecheck, lint, vitest, `next build`, and the accented-character grep sweep above. **Manual QA still required before shipping**: log in as a real user in each of the 6 locales and visually check — (a) `/club` and its 8 subpages, especially the just-rewired `EventForm`, `SessionCard`, `ClassSessionForm`; (b) `/dashboard`'s two `ImageMetricPanel`s and the `FocusCard` list (now rendering `trainingIntel.*` keys via `<T>`); (c) `/skills/[id]`'s `NextActionSection`; (d) `/training/new`'s `FocusCallout`; (e) the goal and resource creation forms' error states (submit with an empty title / invalid URL / invalid date, in each locale) to confirm the new `tServer()`-routed error messages actually render translated; (f) ru/ja long-string layout in the club sidebar/nav (`w-40` fixed width), unchanged concern carried over from session 3.

## Session 8 — Phase 4 Sparring Log

Built the Sparring Log feature (`docs/decisions/0011`) on top of the sparring
groundwork already laid by `docs/decisions/0008` (session prior to i18n
work). Verified: typecheck, lint, vitest 193/193, `next build` all pass.

- Migration `00000000000013_sparring_log.sql`: additive `position`,
  `round_seconds`, `ruleset` columns on `session_techniques`; recreated
  `create_training_session`/`update_training_session` to persist them. No
  trigger changes — `sync_skill_progress_for_skill` already recomputes
  from scratch on every mutation, so the new UI's writes inherit
  double-count protection for free.
- `lib/domain/sparring.ts` (new): `summarizeSparringRounds()` — pure,
  tested in `tests/domain/sparring.test.ts` (attempts/successes/null-rate,
  recurring-difficulty grouping incl. case-fold and min-recurrence/limit).
- `lib/domain/training.ts`: `sessionTechniqueInputSchema` extended with
  `position`/`round_seconds`/`ruleset` (same optional pattern as
  `problem`). Tested in `tests/domain/training.test.ts`.
- `lib/usecases/sparring-actions.ts` (new): `getSparringSessions()`,
  `getSparringSession(id)` — thin, reuse `getTrainingSession`.
  `training-actions.ts`'s `TrainingSessionDetail` type + select query
  extended with the 3 new fields.
- `components/training/training-form.tsx`: new `initialSessionType` prop;
  the existing `isSparring` conditional block gained position/round
  duration/ruleset inputs.
- `app/(app)/training/new/page.tsx`: reads `?type=` search param to
  preselect session type — this **is** the "fast mobile-first sparring
  entry" (reused, not duplicated).
- `app/(app)/sparring/page.tsx` + `app/(app)/sparring/[id]/page.tsx`
  (new): history list with aggregate summary card (attempts/successes/
  success rate/recurring difficulties), and per-session detail with the
  same summary scoped to one session plus full round list (outcome badge,
  intensity, round duration, position, ruleset, partner, problem) — none
  of which were rendered anywhere before this session despite being in
  the DB since 0008.
- `components/app-nav.tsx`: added `/sparring` to `SIDEBAR_ONLY_LINKS`
  (not the 5-item mobile bottom bar, to avoid crowding it).
- `lib/i18n.ts`: added matching `sparring*`/`nav.sparring`/`form.position*`/
  `form.roundSeconds*`/`form.ruleset*` keys to all 6 locales.
  `tests/design/i18n.test.ts`: added `sparringList.occurrences` to
  `ALLOWED_LATIN` (pure `×{count}` interpolation shell, same pattern as
  the other whitelisted keys).
- **Deliberately not built**: no `PageHeader`/photography for `/sparring`
  (no `PAGE_PHOTOS["sparring"]` entry exists; adding one is an art-direction
  decision out of this lot's scope — plain header like `/training/[id]`
  used instead). No new RLS policies (existing `session_techniques_*`
  policies already cover the new columns, additive-only). No linking of
  `partner_name` to the `training_partners` graph (stays free-text,
  matches "no unnecessary personal data").
- **Not verified**: no browser QA this session (same no-seeded-test-user
  blocker as prior sessions, see line above). `/sparring` and
  `/sparring/[id]` both build as dynamic routes.

## Explicit non-goals kept
Photography/layout/art direction untouched. No schema/RLS changes made this session.

## Session 9 — Phase 5 (Coaching/Intelligence) + content coverage

Ran from clean `master` after `25e67fc` (session 8's Sparring Log commit).
Verified continuously: typecheck, lint (0 warnings), vitest (202/202, up
from 193), `next build` all pass after each change. Main agent only,
sequential edits, no forks/subagents. Both commits pushed to `master`
(`1bf4350`, `33cb907`).

### Priority 1: coaching intelligence — closed 3 concrete gaps
Found that `skills.techniqueOfDay` / `skills.reviewThisWeek` /
`skills.lastResolved` dict keys existed in all 6 locales (added by an
earlier session) but were **never used anywhere in code** — confirmed via
grep, zero call sites. Wired all three into a real widget:
- `lib/domain/review.ts`: new pure functions `buildWeeklyReviewDigest()`
  (7-day count of distinct skills touched / questions / difficulties, from
  the same observation data `buildReviewQueue` already uses) and
  `findLastResolvedDifficulty()` (the most recent difficulty observation
  that has aged out of the active `RECENCY_WINDOW_DAYS` review window with
  no newer recurrence for that skill — never claims mastery, only reports
  that a flagged difficulty has gone quiet, which is directly derivable
  from existing dates, not invented). Both tested in
  `tests/domain/review.test.ts` (8 new tests).
- `lib/usecases/review-actions.ts`: `getWeeklyReviewDigest()` /
  `getLastResolvedDifficulty()`, reusing the existing
  `loadSkillIntelligenceInputs()` fetch (no new query).
- `lib/usecases/skill-actions.ts`: new `getTechniqueOfTheDay()` — a
  deterministic daily catalog spotlight (day-of-year index into the
  catalog sorted by id, so same day always yields the same pick; prefers
  untracked skills for discovery, falls back to the full catalog).
- `components/coach/coach-weekly-digest.tsx` (new) + wired into
  `app/(app)/coach/page.tsx` above the existing two-column layout: three
  cards (Technique of the Day / Review this week / Last resolved
  difficulty), fully localized, all 6 locales.
- `lib/domain/training-intelligence.ts`: added a **recurring difficulty**
  trigger (`trainingIntel.recurringDifficulty.*`, weight 2) — fires
  separately from the existing single-most-recent-difficulty trigger when
  a skill has 2+ difficulty observations inside the review window, so a
  genuinely recurring weakness now scores higher and surfaces its own
  reason line instead of being indistinguishable from a one-off. Tested in
  `tests/domain/training-intelligence.test.ts`.
- New dict keys (`coach.weeklyReview.*`, `coach.lastResolved.*`,
  `coach.techniqueOfDay.*`, `trainingIntel.recurringDifficulty.*`) added
  to all 6 locale blocks in `lib/i18n.ts`; `tests/design/i18n.test.ts`
  still passes (identical key sets, no untranslated-Latin leaks).
- **Not touched this session** (already existed and verified sufficient):
  max-3-priorities cap (`MAX_RECOMMENDATIONS`), next-session training plan
  (`buildTrainingPlanSuggestion`), 60-second session review, question/note
  for a real coach (`CoachQuestionForm`), AIProvider abstraction (still
  deterministic-first with optional Ollama, no paid API dependency added).

### Priority 2: content coverage — closed the biggest gap
Audited the actual catalog: migration `00000000000003_skill_system.sql`'s
own comment says "small usable dataset, not an exhaustive taxonomy" — only
**28 skills across 3 disciplines** (Grappling/Striking-Muay-Thai/MMA), zero
Judo, zero Sambo, zero dedicated Wrestling discipline. Added
`supabase/migrations/00000000000014_content_expansion.sql` (additive only,
`on conflict do nothing` throughout, verified no slug collisions with the
existing seed or within itself):
- **New disciplines**: Judo (20 skills — throws, sweeps, kumi kata,
  osaekomi/kesa/kami-shiho pins, juji gatame, okuri eri jime), Sambo (12 —
  leg-lock family, sambo-specific throws/takedowns/ground control, throw
  and leg-lock defense), Wrestling (20 — tie-ups, underhook/overhook
  control, arm drag/snap down/duck under/blast double/ankle pick/high
  crotch/low single family, chain wrestling, cage clinch takedown).
- **Grappling +30**: guard variants (half/butterfly/DLR/spider/X/rubber/
  deep half/knee shield), positional escapes (mount ×2/side/back/turtle),
  submission defenses (armbar/triangle/kimura/RNC/guillotine), and the
  submission set that was previously missing entirely (triangle, kimura,
  guillotine, americana, omoplata, darce, anaconda, heel hook, kneebar,
  toe hold, ezekiel, bow and arrow — only armbar and RNC existed before).
- **Striking +15**: uppercut/overhand/superman punch, spinning back kick/
  calf kick/body kick/push kick, knee/elbow strikes, clinch entry,
  combinations.
- **MMA +8**: cage-specific underhook takedowns, dirty boxing, fence
  escape, ground-and-pound offense/defense, combination-to-takedown.
- Catalog total: 28 → **133 skills across 6 disciplines**. No application
  code changes needed — the discipline filter on `/skills` reads from the
  `disciplines` table dynamically (`getDisciplines()`), and `category` is
  a free-text badge, not an enum — new disciplines/categories just appear.
- **Not run against a live database this session** — no Docker available
  in this environment, so the migration was verified statically only
  (structure matches the proven pattern in migration 3 exactly, slug
  uniqueness checked by grep, apostrophe escaping in `Fireman''s Carry`
  checked by hand). **Apply and spot-check row counts on a real Supabase
  instance before/at next deploy** — this is the one genuinely unverified
  piece of this session's work.
- **Not covered this session** (tracked as a smaller remaining gap, not
  urgent — catalog is now usably deep, not exhaustive): no new
  `skill_relations` rows were added for the new skills (the relation graph
  only covers the original 28 skills' small illustrative slice from
  migration 3), so the new guard variants / submissions / wrestling
  entries won't show prerequisite/follow-up edges on `/skills/map` yet.

### Priority 3 (product features) and Priority 4 (video) — audited, not touched
Verified via grep, not rebuilt (already correct, matches this file's
"already existed" notes from sessions 2–4): copy friend code
(`components/profile/training-partners.tsx`), video/technique favorites
(`lib/usecases/youtube-favorites-actions.ts`, `skill-actions-bar.tsx`),
search history (`components/search/search-history.tsx`), persistent quick
actions (`components/quick-actions-bar.tsx`), `/youtube` nav entry +
24h in-memory cache + server-only API key
(`lib/infra/video/youtube-video-search-provider.ts`, key never reaches the
client). No changes made — these are genuinely done, not just claimed
done; this session re-verified rather than trusting the prior checkpoint.

### Priority 5 (product gaps) — not audited this session
PWA infra (`public/manifest.json`, `public/sw.js`, `/offline` route) exists
and builds; not deep-audited for actual offline behavior. Public gallery
sharing, accessibility basics, and mobile nav consistency were **not
checked this session** — genuinely open for session 10, not "done".

## Phase 3 (Skill System) status — verified session 7
Already fully implemented and committed (`01d82e1 feat: add skill graph and progression system`), predating the i18n sessions above — the "Phase 3 not started" note in session 6 referred only to that session's own i18n scope, not the codebase. Verified this session, no code changes needed:
- Schema: `supabase/migrations/00000000000003_skill_system.sql` (skills catalog, `skill_relations` graph enum, owner-scoped `skill_progress` with all required dimensions, nullable `skill_id`/`related_skill_id` FKs on `session_techniques`/`session_observations`, seed data), `00000000000004_skill_progress_sync.sql` (trigger auto-syncs `drilling_reps`/`evidence_count`/`last_practiced_at` from logged techniques — docs/decisions/0006).
- RLS: catalog tables (`skills`, `skill_relations`) select-only for `authenticated`, writes service-role only; `skill_progress` owner-isolated (select/insert/update/delete all scoped to `auth.uid() = user_id`).
- Domain: `lib/domain/skill.ts` (`computeMasteryStage`, `summarizeSkillProgress`, dict-key label maps) — tested in `tests/domain/skill.test.ts`.
- Use cases: `lib/usecases/skill-actions.ts` (`getSkills`/`getSkillMap`/`getSkill`/`getSkillProgress`/`updateSkillProgress`/`getSkillsProgressSummary`/`createSkill`/`updateSkill`/`createSkillRelation`) — no dedicated test file, consistent with the rest of `lib/usecases/` (17 of 19 usecase files are untested; only `ai-coach-actions`/`search-actions` have unit tests, since these are thin Supabase I/O wrappers over the tested domain layer).
- UI: `/skills` (list/search/filter by discipline), `/skills/[id]` (detail: progress, relations, next action, history, notes), `/skills/map` (relation graph view) — all i18n'd (session 5).
- Training integration: `components/training/training-form.tsx` resolves technique/observation names against the skill catalog via a datalist and sets `skill_id`/`related_skill_id`; free-text `technique_name` stays required and functional with no skill match (docs/decisions/0004).
- Re-verified this session: typecheck clean, lint clean, vitest 185/185, `next build` succeeds (`/skills`, `/skills/[id]`, `/skills/map` all build as dynamic routes).

## Session 10 — release hardening (final pre-QA pass)

Ran from clean `master` after `cd92592` (session 9). Main agent only, sequential
edits, no forks/subagents touching shared files. Verified continuously:
typecheck, lint (0 warnings), vitest (211/211, up from 202), `next build` all
pass. Committed as `acfeedc`, pushed to `master`.

### Priority 1 — DB migration: done, verified against the real (linked) Supabase project
`supabase` CLI was already logged in and linked to project `pncrtzwtojlsovpbondp`.
Ran `supabase db push` — applied `00000000000013_sparring_log.sql` and
`00000000000014_content_expansion.sql` (both previously only existed locally).
Verified live via `supabase db query --linked`: 133 skills across 6 disciplines
(Grappling 43, Judo 20, MMA 13, Sambo 12, Striking/Muay Thai 25, Wrestling 20),
RLS still enabled on `skills`/`skill_relations`/`skill_progress`/
`session_techniques`. No reset, no data loss, additive-only as designed.

### Priority 2 — skill graph completion: done
Added `supabase/migrations/00000000000015_skill_relation_expansion.sql` — 102
new `skill_relations` edges (110 total incl. migration 3's original 8) covering
guard-variant relationships, positional-escape counters, submission/defense
pairs, position→submission follow-ups, judo throw families, sambo leg-lock
chains, wrestling tie-up progressions, and 8 deliberate cross-discipline links
(e.g. Judo's Juji Gatame ↔ grappling's Armbar, Sambo's hip throw ↔ Judo's Seoi
Nage). Applied and verified live: 110 relations, 0 orphans, 0 self-relations,
0 duplicates. Added `tests/design/skill-graph.test.ts` — a static parser over
the migration SQL (no DB needed in CI) asserting no self/duplicate/missing-
node edges and only valid enum relation types; passes.

### Priority 3 — product gap audit: fixed a real, larger-than-expected i18n gap
Audited PWA/offline, gallery/social, accessibility, and mobile nav per the
brief's checklist:
- **PWA/offline**: manifest had no real PNG icon (only `favicon.ico`, which
  didn't even exist as a `public/` file — Next serves `app/favicon.ico`
  automatically, so this worked by luck, not by manifest correctness).
  Extracted the 256×256 PNG already embedded inside the existing `.ico` (no
  new art asset invented) to `public/icon-256.png` / `app/icon.png`, added it
  to `manifest.json`. Offline page (`/offline`) was hardcoded French — wired
  to `useI18n()` (client component, works even with no server round-trip).
- **Gallery/social**: friend-code flow (`training_partners`) re-verified
  solid — owner-scoped RLS, security-definer RPCs never leak email, proper
  error/empty states with `role="alert"`/`role="status"`. **Public gallery
  sharing is not part of the current architecture** — `profiles.
  profile_visibility` (`private`/`public`) exists in schema+form but nothing
  reads it anywhere (no public profile route, no RLS policy keyed on it) —
  it's a **dead/vestigial toggle**, not a live privacy leak (default private,
  no public-read policy exists either way). Flagged below as a manual-review
  item rather than built out, since a real public-profile viewing feature is
  new scope, not a gap-to-finish.
- **Accessibility**: found and fixed a real, widespread gap — 17 of 17 form
  error messages across the app (`training-form`, `goal-form`, `match-form`,
  every `club/*-form`, etc.) rendered `state.error` as a plain `<p>` with no
  `role="alert"`, so screen readers never announced validation failures.
  Fixed all 17. Dialogs/menus already accessible for free (`@base-ui/react`
  primitives — focus trap, `aria-modal`, escape-to-close). Focus-visible
  rings and `prefers-reduced-motion` already present in `globals.css`.
- **Mobile nav**: re-verified `MobileSectionNav` (in `dashboard-shell.tsx`,
  wraps every `(app)` route) lists every route including `/sparring`,
  `/study`, `/goals`, `/calendar` — no unreachable core route.
- **i18n leak sweep** (`grep` for accented chars outside `t()`/`<T>`, same
  method session 6 used for club): found the dashboard page — the single
  most-viewed page in the app — was still **~80% hardcoded French** despite
  being marked "done" implicitly by omission from every prior checkpoint
  (only the `training-intelligence`-sourced recommendation text used `<T>`;
  the hero greeting/tagline/status, stat panels, focus cards, progression
  card, club card, and quick actions were all plain French strings/template
  literals). Rewired the whole page: added `getServerLocale()`/`dict` prop
  threading through `Hero`/`StatRow`/`ImageMetricPanel`/
  `ProgressionCompactCard`/`FocusSection`/`FocusCard`/`ProgressionSection`/
  `RecentActivity`/`ClubCard`/`QuickActions`; ~45 new dict keys × 6 locales;
  date formatting switched from hardcoded `"fr-FR"` to the real `locale`.
  Also fixed smaller leaks: `profile-form.tsx` (**entirely unwired** — every
  label hardcoded French, missed by every prior i18n session), `error.tsx`
  (global error boundary), `checkin/[code]/page.tsx` (public QR check-in
  page), `skills/map`'s empty state, `landing-hero`/`landing-content`'s two
  aria-labels. `tests/design/i18n.test.ts` still passes (643+ keys, identical
  sets across all 6 locales, no untranslated-Latin leaks) after every batch.

### Priority 4 — security/data-safety audit: no live issues found
Targeted checks, not a re-audit of already-verified sessions 1-9 work:
- All tables have RLS enabled (scripted check across every migration).
- `createServiceClient()` (bypasses RLS) is `server-only`-guarded and its
  only import site (`skill-actions.ts`'s `createSkill`/`updateSkill`/
  `createSkillRelation`) has **zero callers anywhere in the app** — dead
  code, not reachable from any route/action today. Not a live vulnerability,
  but flagged: if these are ever wired to a UI form, they need an
  admin/coach-role check added at that time (service-role client bypasses
  RLS entirely, so the function itself must gate access).
  supabase-service.ts).
- No `console.log`/`console.debug` in production code; no `process.env.*`
  secret reads in any client component (`pwa-register.tsx`'s `NODE_ENV`
  check is the only client-side env read, and it's not a secret).
  reads.
- `sync_skill_progress_for_skill()` (training/sparring progress) recomputes
  from a full `count(*)` every time — inherently idempotent, no double-count
  risk regardless of edit/re-save frequency (unchanged from session 8,
  re-verified).
- Checkin-code flow: 10 hex-char code (16^10 space), 20-minute expiry,
  coach-only rotation (`is_club_member(..., 'COACH')`), public lookup RPC
  returns only class/club name + time (no PII), self-checkin RPC requires
  active membership. Solid, no changes needed.
- **Known, pre-existing, NOT fixed this session** (widespread architectural
  pattern, not a new gap — fixing it is a ~19-file cross-cutting refactor
  that violates this session's "no unrelated refactors" constraint): most
  `lib/usecases/*.ts` files do `throw new Error(error.message)` /
  `return { error: error.message }`, surfacing raw Postgres/Supabase error
  text (constraint-violation messages, not stack traces or secrets) directly
  to the client. Low severity, consistent everywhere, worth a dedicated
  future pass (wrap in a generic user-facing message + server-side log) but
  out of scope for a hardening session that must stay additive/surgical.

### Priority 5 — legal/privacy pages: structure done, owner fields explicitly flagged
Added `/privacy` and `/terms`, both server components using
`getServerLocale()`, content in `lib/content/legal.ts` (structured content
module, same pattern as `lib/design/photography.ts`, not stuffed into the
flat `lib/i18n.ts` key-value dictionary). All 6 locales. Every
owner-identity-dependent field (legal entity name, registered address,
company/SIRET number, governing law/jurisdiction, contact email) is rendered
with a visible "to be completed by the publisher" badge instead of invented
placeholder-that-looks-real text — verified by
`tests/design/legal.test.ts`, which also greps for suspicious
fabricated-identity patterns (a SIRET-shaped 14-digit number, "SARL", etc.)
and fails if any slip in. Linked from the landing page footer
(`landing-footer-links`). No cookie-consent banner added: verified via grep
there is no analytics/tracking script anywhere in the codebase (only the
locale-preference cookie and Supabase's own auth cookies, both strictly
necessary), so one isn't required — documented as a checked, not skipped,
decision.

### Priority 6 — SEO/PWA/metadata: done
- Added `app/robots.ts` (allow `/`, `/privacy`, `/terms`, `/login`,
  `/signup`; disallow everything else — every authenticated app route is
  per-user training/club data and must never be indexed) and
  `app/sitemap.ts` (the 5 public routes only).
- `lib/site-url.ts`: resolves the absolute site origin from
  `NEXT_PUBLIC_SITE_URL` (not yet set — no production domain exists yet) →
  `VERCEL_URL` (works automatically once deployed to Vercel) →
  `localhost:3000` fallback. Used for `metadataBase`, robots' `sitemap:`
  field, and sitemap URLs. **No domain was invented.**
  `NEXT_PUBLIC_SITE_URL` should be set once a real domain exists.
- Root layout: added Open Graph + Twitter Card metadata, a title template
  (`%s | MMA Mastery`).
- **Deliberately reverted**: first attempt made the root layout read
  `getServerLocale()` (`cookies()`) to set `<html lang>` correctly per user —
  this forced Next to mark *every* route dynamic, including `/login`,
  `/signup`, `/forgot-password`, `/reset-password`, `/design`, which were
  previously statically prerendered. Reverted to static `lang="fr"` on the
  server shell; `components/i18n-provider.tsx` already sets
  `document.documentElement.lang` client-side on mount and on locale switch
  (pre-existing code, unchanged), so the correct `lang` still lands for real
  users without paying the static-rendering cost on every page load.

### Priority 7 — performance/UX polish: verified, one near-miss avoided
No dead nav links, no missing core routes, `next build` output shows the
expected static/dynamic split preserved (see Priority 6 note above — this
was actively protected, not just checked). `/offline` and `/_not-found`
exist and are wired. Did not do a full N+1/query audit beyond what session 9
already covered (`getTrainingIntelligenceBundle`, dashboard's
`Promise.all`-batched fetches) — no new query code was added this session
that would introduce one.

### Manual QA checklist for tomorrow
1. Log in as a real user in each of the 6 locales and check the dashboard
   hero, focus cards, club card, and quick actions — this session rewired
   ~45 strings there without browser verification (no seeded test user in
   this environment, same blocker as every prior session).
2. Visit `/privacy` and `/terms` in each locale — confirm the amber
   "to be completed by the publisher" badges render legibly in both the
   light and dark theme, then fill in the actual legal entity name, address,
   registration number, governing law, and contact email in
   `lib/content/legal.ts` before shipping publicly.
3. Set `NEXT_PUBLIC_SITE_URL` once a production domain is assigned (used by
   `metadataBase`/robots/sitemap — currently falls back to `VERCEL_URL` or
   `localhost:3000`).
4. Spot-check `/skills/map` in each locale — confirm the new
   `skill_relations` edges render sensibly for a few of the new Judo/Sambo/
   Wrestling skills (e.g. Juji Gatame, O Soto Gari, Blast Double).
5. RU/JA nav label wrapping in the desktop sidebar (`components/championship/
   sidebar.tsx`'s fixed `w-40`) is a known, small, carried-over-since-session-3
   cosmetic concern — not touched this session to avoid an unverified layout
   change; check visually and only adjust if it actually looks broken.
6. Decide whether `profiles.profile_visibility` (public/private toggle,
   currently inert — see Priority 3 notes) should become a real public-profile
   feature or be removed from the form; it currently does nothing either way,
   which is safe but potentially confusing to a user who sets it to "Public"
   expecting something to happen.

### Release readiness
STATUS: COMPLETE for everything implementable without a live browser session
or owner-supplied legal identity. DB migration applied and verified live.
Skill graph complete. No security issues found beyond one pre-existing,
low-severity, documented pattern. Legal page structure done, owner fields
clearly marked. SEO/PWA metadata complete. All automated gates green
(typecheck, lint, 211/211 tests, `next build`). Remaining work is human
browser QA, the 6 manual items above, and deployment — no further
autonomous implementation work identified.

## Session 11 — final pre-QA verification pass (no code changes)

Ran from clean `master` after `8317bb6` (session 10). Brief asked to verify
and finish every remaining functional gap across Phase 5 coaching, content
coverage, daily features, video, and product coherence. Classified every
item in the brief DONE / PARTIAL / MISSING via deterministic checks
(grep, live DB queries, full test/build run) instead of re-auditing from
scratch, per this file's own "do not re-audit" precedent.

**Result: everything in the brief classifies as DONE. Zero PARTIAL/MISSING
items found. No code changes made this session.**

- Phase 5 coaching: `coach-weekly-digest.tsx` (Technique of the Day, Review
  this week, Last resolved difficulty) wired into `/coach` since session 9;
  max-3-priorities, next-session plan, 60s review, coach question form,
  deterministic-first `AIProvider` all reachable in UI, re-confirmed via nav
  grep and build output (`/coach` builds, 7.91 kB).
- Content: live DB re-queried directly — **133 skills / 6 disciplines / 110
  skill_relations**, matches session 10's applied migrations exactly, no
  drift. Read migration `00000000000014_content_expansion.sql` in full:
  striking→takedown combinations, cage/underhook takedowns, guard variants,
  positional escapes, submission defenses are all genuinely present (not
  just claimed) — confirmed by reading the actual CTE values, not trusting
  the prior summary.
- **Difficulty/problem "catalog" (brief item 2's ~154 target)**: does not
  exist and is **not intended by the architecture** — confirmed by reading
  `00000000000005_v3_learning_and_progress.sql`: `session_techniques.problem`
  is a free-text column (`problem text`), not an enum or lookup table. There
  is no curated difficulty taxonomy anywhere in the schema or domain layer.
  Per the brief's own instruction ("fill missing coverage **if** the
  catalog exists/is intended"), building one from scratch would be inventing
  new architecture, not finishing existing scope — correctly left undone.
- Daily features: copy friend code, technique/video favorites, search
  history, session text export (`session-review.tsx`), weekly summary +
  week/month counters (`weekly-summary.tsx`, `dashboard/page.tsx`),
  last-practiced-X-days-ago (`review.ts`, `training-intelligence.ts`),
  quick actions bar — all re-confirmed present via targeted grep.
- Video/YouTube: nav entry, 24h cache, server-only key, favorites/search
  history integration — unchanged since session 9's audit, not re-touched.
- Product coherence: `next build` succeeded end-to-end, every route from
  dashboard→training→sparring→skills→goals→study→coach→youtube→club→
  profile compiles and is nav-reachable (`components/app-nav.tsx`'s
  `NAV_LINKS`/`SIDEBAR_ONLY_LINKS` cover all of them).
- i18n: `tests/design/i18n.test.ts` still green, part of the 211/211 suite.
- Final validation, all green: `tsc --noEmit` (0 errors), `eslint . --max-warnings=0`
  (0 warnings), `vitest run` (211/211, 26 files), `next build` (full route
  table above, no errors), `supabase migration list --linked` (all 15 local
  migrations applied remotely, no drift).

### STILL_MISSING
Nothing implementable without a live browser session or owner input. Same
6 manual items as session 10's checklist below — none require further
autonomous work.

### MANUAL_TOMORROW (unchanged from session 10, re-confirmed still accurate)
1. Log in as a real user in each of the 6 locales; check dashboard hero,
   focus cards, club card, quick actions (rewired session 10, never
   browser-verified).
2. Visit `/privacy` and `/terms` in each locale; confirm the "to be
   completed by the publisher" badges render, then fill in real legal
   entity name/address/registration number/governing law/contact email in
   `lib/content/legal.ts` before shipping publicly.
3. Set `NEXT_PUBLIC_SITE_URL` once a production domain exists.
4. Spot-check `/skills/map` in each locale for the new Judo/Sambo/Wrestling
   relation edges rendering sensibly.
5. RU/JA nav label wrapping in the desktop sidebar (`w-40` fixed width) —
   cosmetic, check visually, adjust only if actually broken.
6. Decide whether `profiles.profile_visibility` becomes a real
   public-profile feature or gets removed from the form — currently inert
   either way, not a live bug.

No git commit created this session — no files changed (verification-only
pass). Tree is already clean and pushed at `8317bb6`.

## Session 12 — reliability + perceived-performance pass

Targeted `/competition`, `/study`, `/youtube`, `/coach`, `/skills`, `/goals`
per a "final stability" brief. Verified: tsc, eslint (0 warnings), vitest
216/216 (up from 212 — new regression test added), `next build`. Pushed as
`f938f30`.

- **Root cause found**: all 6 routes (plus `/skills/[id]`) awaited
  secondary Supabase reads (filter dropdowns, favorites, `for you` video
  suggestions, weekly digest) unguarded inside `Promise.all`, and several
  usecases `throw new Error(...)` on any DB error — so a transient failure
  on non-essential data crashed the *entire* route to the generic error
  screen. Fixed by wrapping every secondary fetch with `.catch(() =>
  <safe default>)` at the page call site, leaving primary data (the thing
  the route is actually about) to surface through the existing
  `app/(app)/error.tsx` boundary, which was already generic/localized.
- **Two real raw-error leaks found and fixed**: `app/error.tsx` (root
  boundary) rendered `{error.message}` directly — now uses the same
  translated generic message as `app/(app)/error.tsx`. `createMatch`,
  `createSequence` (`competition-actions.ts`), `createGoal`
  (`goals-actions.ts`), `createResource`, `createSkillNote`
  (`knowledge-actions.ts`) all returned the raw Postgres error string as
  `state.error` on DB-insert failure (Zod validation errors were already
  translated via `firstFieldError()`/`tServer()` — only the *post-validation
  DB failure* path leaked). Added `error.saveFailed` dict key (6 locales)
  and routed all 5 sites through it, with `console.error(error)` kept for
  server-side observability. Regression test:
  `tests/usecases/save-error-fallback.test.ts` (4 cases, one per file).
  **Not touched**: the same `throw new Error(error.message)` /
  `return { error: error.message }` pattern still exists in `club-actions`,
  `training-actions`, `profile-actions`, etc. — same known gap session 10
  flagged as a ~19-file cross-cutting pattern, still out of scope (those
  routes weren't in this session's target list).
- **Progressive images**: `components/ui/progressive-image.tsx` was a
  no-op passthrough stub. Implemented a real fade-in (opacity transition
  gated on the image's `onLoad`, muted placeholder background painted
  immediately so the reserved box is never blank, respects the existing
  global `prefers-reduced-motion` rule in `globals.css` — no separate media
  query needed). Swapped the two remaining raw `next/image` hero usages
  onto it: `components/championship/page-header.tsx` (the per-route hero
  photo, `priority`) and the dashboard championship hero
  (`app/(app)/dashboard/page.tsx`). Also converted `landing-content.tsx`'s
  below-the-fold final-CTA photo. **Deliberately left as raw `next/image`**:
  `landing-hero.tsx`'s slide carousel and `auth-shell.tsx`'s login/signup
  cover carousel — both already implement their own opacity-based
  crossfade keyed on an `active` slide index; wrapping them in
  `ProgressiveImage` would fight that inline-style-driven opacity control
  (CSS specificity: inline `style.opacity` beats the component's
  `.progressive-image-loaded` class), so touching them risked a real
  regression for no visible gain. `championship/sidebar.tsx`'s 176px nav
  thumbnails and the dashboard's 44×44 club-avatar `<Image>` were left
  alone too — too small for pop-in to register, not a "major visual
  surface" per the brief's own list.
- **Navigation perf**: audited and found already done by a prior session's
  last 3 commits (`8cb0825`, `a229567`, `6c0a55b` — visible in this
  session's starting `git log`) — per-request `getUser()`/client dedup via
  `React.cache()` (`lib/infra/db/supabase-server.ts`), the skill/discipline
  catalog cached across navigations via `unstable_cache` (tags
  `disciplines`/`skills-catalog`, `revalidate: 3600`), and `/coach`'s
  YouTube video grid already streamed behind `Suspense`. No further
  navigation-latency work identified as high-confidence within this
  session's scope — did not add per-route `loading.tsx` files (the shared
  `app/(app)/loading.tsx` skeleton already renders immediately on
  navigation) since the brief warned against measuring without evidence
  and no profiling tooling was run this session to justify more.
- **Not done — genuinely out of scope for this pass**: did not re-audit
  image `sizes`/`fill` correctness across every photo card (spot-checked
  the ones touched, all were already using `fill`+`sizes` or explicit
  `width`/`height` correctly — no CLS-causing pattern found). No browser
  QA (same no-seeded-test-user blocker as every prior session, see session
  4 onward).

## Session 13 — /skills crash fix + navigation perceived-performance pass

Real-user QA reported two P0s: `/skills` still crashing to the generic error
screen, and every route navigation showing a big empty page-level skeleton
for ~1-2s. Verified: tsc, eslint (0 warnings), vitest 217/217 (up from 216),
`next build`. Same no-seeded-test-user blocker as every prior session —
no live browser QA possible; all verification static (types/lint/tests/build)
plus raw Supabase REST timing.

### /skills crash — root cause and fix
`lib/usecases/skill-actions.ts`'s `getSkills()` had `if (progressError) throw
new Error(progressError.message)` on the **secondary**, per-user
`skill_progress` enrichment query (skill-actions.ts:84, pre-fix). Every other
caller of `getSkills()` (`/study`, `/goals`) already wraps the whole call in
`.catch(() => [])`, silently masking that throw — but `/skills`'s own
`page.tsx` awaited it unguarded (it's the page's primary content, so a blank
`.catch(() => [])` would be wrong there too — it would silently hide a real
outage behind "empty catalog"). Any transient failure on that one per-user
query (not the catalog itself) took down the whole route.
- Fix: `getSkills()` now degrades the per-user progress query to `stage:
  "unknown"` for every skill on error (logs via `console.error`) instead of
  throwing — matches the already-established "secondary data degrades
  safely" pattern from session 12, and keeps `computeMasteryStage`'s
  existing null-safe arithmetic (legacy rows with null progress columns
  already resolved to `"unknown"` correctly, unaffected).
  the catalog fetch (`getSkillsCatalog`, the actual primary data) still
  throws on failure — `app/(app)/skills/page.tsx` now catches that specific
  case and renders a distinct, localized "catalogue could not load / retry"
  card (`skills.catalogueLoadError(Desc)`, reuses the existing
  `offline.cta` key) instead of either crashing or silently showing a false
  "no skills" empty state.
- New dict keys (×6 locales): `skills.catalogueLoadError`,
  `skills.catalogueLoadErrorDesc`.
- Regression test: `tests/usecases/skill-actions.test.ts` — mocks a
  `skill_progress` query failure and asserts the catalog still returns with
  `stage: "unknown"` instead of throwing.

### Navigation perceived-performance — root cause and fix
Every target route (`dashboard`, `coach`, `study`, `competition`, `youtube`)
awaited **all** its data — primary content and secondary/analytical
widgets alike — in one top-level `Promise.all` before returning any JSX.
Since none of these routes had their own `loading.tsx`, Next's shared
`app/(app)/loading.tsx` (one generic full-page skeleton, structurally
identical regardless of destination) stayed mounted for the full duration of
the *slowest* query in that batch — this is exactly the "1-2s giant empty
skeleton" reported. `/training` and `/calendar` were checked and found to
already do a single primary query each with nothing secondary to split —
no change needed there.
- Split each route into fast/critical data (awaited directly, returns JSX
  immediately) and secondary/analytical data (moved into small async
  Server Components wrapped in `<Suspense>` with a skeleton shaped like the
  real module, at the exact same DOM position — no layout shift):
  - `dashboard`: Hero (profile + sessions) and `RecentActivity` render
    immediately. `StatRow`/`ProgressionSection`/`FocusSection` (training
    intelligence + skill progress summary) and `ClubCard` (member club
    summary) now stream in independently. The hero's high-priority-count
    status line (needs the same intelligence bundle) streams in-place via
    its own tiny `Suspense`, starting with the same text a genuinely
    zero-priority user would see (a real state, not a placeholder) and
    upgrading once ready — so the hero never blocks on it.
  - `coach`: the 3-card weekly digest (technique of the day / review this
    week / last resolved difficulty) streams independently; the actual
    coach answer + question form (the page's core purpose) still render
    immediately.
  - `study`: the queue (core purpose) renders immediately; favorited
    skills and the resources list + form stream independently.
  - `competition`: match history (core purpose) renders immediately; the
    match-creation form's dropdown data (disciplines/athletes/session
    options) streams independently.
  - `youtube`: the search form/suggestions render immediately; the actual
    search-results grid and the "for you" grid (each its own external
    YouTube Data API call — previously **sequential**, `todayResults`
    awaited only after `results` resolved) now stream independently via
    separate `Suspense` boundaries, so they resolve in parallel instead of
    back-to-back.
  - Every newly-Suspended async section keeps the same `.catch(() =>
    <safe default>)` fallback the pre-existing code already had for that
    data (or adds one, matching the established pattern) — an error inside
    a streamed section can no longer bubble up and crash the whole route
    via `app/(app)/error.tsx`, which was the exact failure class just fixed
    for `/skills`.
- **Dedupe**: `dashboard`'s `StatRow`, `ProgressionSection`, and
  `FocusSection` need overlapping subsets of the training-intelligence
  bundle and skill-progress summary but live in 3 separate `Suspense`
  boundaries. Wrapped both usecase calls in React's `cache()` at the top of
  `dashboard/page.tsx` — same per-request dedup idiom the codebase already
  uses for `createClient()`'s `getUser()` in `supabase-server.ts` — so all
  3 boundaries share one real fetch each, not three.
- **Prefetch**: checked `components/app-nav.tsx` — no `<Link>` sets
  `prefetch={false}`, so Next's default (`true`) already applies; for these
  `force-dynamic` authenticated routes that means the shared layout +
  `loading.tsx` boundary prefetches on viewport/hover, which is already the
  maximum Next.js supports here without Partial Prerendering (not enabled
  in this project, and enabling it is an infra decision out of this pass's
  scope). No code change made — already correct.
- **Region**: no `vercel.json` exists (no `regions` override — Vercel
  Functions default to `iad1`). Queried the linked Supabase project
  (`pncrtzwtojlsovpbondp`) directly; response came back via a Cloudflare
  `CDG` (Paris) edge with `x-envoy-upstream-service-time: 163ms`, but this
  reflects *this sandbox's* network path to Supabase, not Vercel's actual
  function-to-database path — genuinely not measurable without dashboard/
  deployment access. Not changed blindly per the brief's own instruction;
  flagged for manual check.
- **Timings**: no seeded test user exists in this environment (same
  blocker every session has hit), so authenticated end-to-end page timings
  could not be measured before/after. What was measured: raw Supabase REST
  round-trips for the `/skills` catalog and disciplines queries from this
  sandbox, ~140-210ms each (see reasoning above re: not representative of
  Vercel's real path). The concrete, verifiable change is structural: before,
  `/youtube` awaited two *sequential* external YouTube Data API calls
  (`results` then `todayResults`, each independently reported elsewhere in
  this codebase as the slowest call type in the app) before any JSX
  returned; after, both run in parallel behind independent `Suspense`
  boundaries and no longer block the search form from appearing. The same
  before/after shape (single blocking `Promise.all` of primary+secondary →
  primary-only await + streamed secondary) applies to all 5 restructured
  routes.

### Manual retest checklist (added to the running list)
1. Load `/skills` in each locale with a real user — confirm the catalog
   renders normally (this session's fix is unverified in a live browser,
   same blocker as every prior session).
2. Click through `dashboard → coach → study → competition → youtube` and
   confirm the destination header/hero/primary content appears immediately
   on navigation, with only the secondary cards/grids showing a brief
   shaped skeleton before filling in (the actual "does this feel fast"
   check — not verifiable from this environment).
3. Set `vercel.json`'s `regions` (or confirm the project dashboard's
   function region) to match wherever the Supabase project
   `pncrtzwtojlsovpbondp` actually runs, if they differ — could not
   determine either side's real region from this environment.

## Session 14 — duplicate-fetch perf fix + Search/YouTube/Coach product pass

Real-user report: navigation still felt "~same speed or slower" after session
13's Suspense split. Investigated with dependency analysis (no seeded test
user in this environment either, same blocker as every prior session — no
live before/after timing was possible; the fix below is verified by reading
every query each usecase issues, not by a profiler).

### Performance root cause
`loadSkillIntelligenceInputs()` (`lib/usecases/training-intelligence-actions.ts`)
was **not** request-deduped — only its *callers'* bundled result
(`getTrainingIntelligenceBundle`) was cached locally on the dashboard page.
`/coach` calls it 4 separate times per render: once synchronously via
`getCoachResponseText → buildCoachContext → getTrainingIntelligenceBundle` +
`getReviewQueue` (2 of the 4 already in that one `Promise.all`), then again
via the Suspense-streamed weekly digest's `getWeeklyReviewDigest` and
`getLastResolvedDifficulty`. Each call re-ran the same 3-4 Supabase queries
(`skill_progress`, `session_techniques`, `session_observations`,
conditionally `skill_relations`) — up to ~16 queries serving one page. This
is exactly the "streamed component re-queries data another part of the page
already fetched" failure mode the brief warned about, introduced when the
weekly digest was split into its own Suspense boundary in session 13.
- Fix: wrapped `loadSkillIntelligenceInputs` itself in React's `cache()`
  (same per-request dedup idiom as `getUser()` in `supabase-server.ts` and
  the dashboard's local wrappers) so every caller — direct or through
  `getTrainingIntelligence`/`getTrainingPlan`/`getReviewQueue`/
  `getWeeklyReviewDigest`/`getLastResolvedDifficulty`/`getTechniqueOfTheDay`
  — shares one real fetch per request, regardless of which Suspense
  boundary it's called from. `/coach` goes from ~4x to 1x; the dashboard's
  existing local `cache()` wrappers still work unchanged (now just a no-op
  double-memoization, harmless).
- `getTechniqueOfTheDay` (previously its own `getSkills()` call, a *second*
  `skill_progress` query) was rewritten to reuse the same cached
  `loadSkillIntelligenceInputs` + `getSkillsCatalog` instead — removes that
  query path entirely rather than just caching around it.
- All 8 target routes (dashboard, training, skills, coach, youtube, study,
  goals, competition) were re-read for the same duplicate/secondary/external
  data-shape audit the brief asked for; only `/coach` had a real duplicate.
  The rest were already correct from session 13 (single primary query +
  streamed secondary, no overlap) — no changes made there.
- Region: still unverifiable from this environment (no Vercel/Supabase
  dashboard access, no `vercel.json` region override present). Not touched.

### Search — deterministic "app navigator" upgrade
`lib/usecases/search-actions.ts` rewritten around a new pure domain module
`lib/domain/search.ts` (no pgvector/RAG, no paid AI dependency, matches
docs/decisions/0008's existing "plain matching is enough" position):
- **Navigation intents**: curated per-locale phrase → destination map
  (`matchNavigationIntents`) surfaces `/training`, `/goals`, `/coach`,
  `/study`, `/youtube` directly for phrases like "mes séances", "my goals",
  "quoi travailler aujourd'hui" — shown first, ahead of data results.
- **Skill matching moved off the DB**: skills are now matched in-memory
  against the already-cached `getSkillsCatalog()` (shared with `/skills`,
  `unstable_cache`, 1h revalidate) instead of a live `ILIKE` query — one
  fewer DB round trip per search, and it's what makes fuzzy/alias matching
  affordable (`scoreSkillMatch`: exact > prefix > substring > alias-expanded
  keyword > small Levenshtein typo tolerance).
- **Alias expansion**: compact multilingual category/discipline keyword map
  (`CATEGORY_ALIASES`) so e.g. French "garde" finds English-named "Guard"
  skills — the catalog is seeded with English technical terms regardless of
  UI locale (`supabase/migrations/00000000000003`, `...00000000000014`).
  Extended `normalizeSearchQuery`'s prefix/article stripping (fr/en) so
  "je veux travailler ma garde" / "i want to work on my guard" reduce to
  "garde"/"guard" before matching.
- **Video intent**: a "vidéo"/"video" keyword (per locale) is detected and
  stripped (`extractVideoIntent`) — "sprawl vidéo" searches "Sprawl" and
  also renders inline YouTube results via the existing provider.
- Result ranking: navigation first, then skill matches by score, then
  resources/sessions/observations/goals each internally ranked by a small
  exact/prefix/substring `textScore` instead of raw insertion order.
- Skill results now carry `skillId`/`skillName`/`disciplineName` so
  `/search` can render "Watch videos" (deep link to `/youtube?q=…`) and
  Study/Add-to-goal quick actions inline, via a new shared
  `SkillQuickActions` component (`components/skills/skill-quick-actions.tsx`,
  generalized from what was originally coach-only) — no pre-check queries
  (idempotent upsert / local "done" state after click), consistent with the
  "no unnecessary new queries" perf goal.
- New tests: `tests/domain/search.test.ts` (navigation intents, video
  intent, alias expansion, scoring, Levenshtein).

### YouTube recommendations
`/youtube`'s "For you" section (existing `ForYouSection`, built in session
12) already covered the "contextual suggestions before manual search"
requirement — no change needed there. Added a second, narrower
recommendation surface: `/coach`'s Technique of the Day card now streams
1-2 matching videos below it (`TechniqueOfDayVideos`, its own nested
`Suspense`, same `searchTechniqueVideos`/in-memory-cached provider — no new
provider, no new cache).

### Coach — Technique of the Day evidence + discipline rotation
`getTechniqueOfTheDay()` rewritten from a pure "day-of-year index into
untouched skills" pick to reuse `evaluateSkill` (now exported from
`lib/domain/training-intelligence.ts`) — the exact same weighted triggers
Training Intelligence V1/V2 use, so a "why today" reason is never invented:
a skill only gets an evidence-based reason if it would also have surfaced as
a real recommendation. Adds:
- **Discipline rotation**: deterministic day-of-year index into the sorted
  list of catalog disciplines picks which discipline is eligible each day,
  so one discipline can't dominate every visit; falls back to the full
  catalog if the rotated discipline is empty.
- **Mastered exclusion**: a skill at `mastered` stage is never re-surfaced.
- **Exploratory fallback**: when no skill in the rotated discipline has
  evidence, falls back to an untouched (`stage: "unknown"`) skill and marks
  the pick `isExploratory: true` — the UI shows a "to discover" badge
  instead of pretending personalization exists.
- Card now shows the reason text, Study/Add-to-goal quick actions, and the
  streamed video slot (see above).
- New tests: `tests/usecases/technique-of-day.test.ts` (evidence pick,
  exploratory fallback, mastered exclusion) — `loadSkillIntelligenceInputs`
  mocked directly rather than the underlying Supabase queries.

### Coach — suggestion chips
Added 7 chips to the existing 3 (`components/coach/coach-question-form.tsx`):
"what should I work on today", "review this week", "show me a wrestling
technique", "show me a striking technique", "what am I struggling with",
"find videos for today's technique", "build my next session" — localized
×6. Also added `Wrestling`/`Boxing` to `inferVideoSearchQuery`'s discipline
detection list (`lib/domain/video-search.ts`) — they're first-class
disciplines in the catalog and already used in `/youtube`'s discipline
picker, but were missing from this list before.

### Validation
`tsc --noEmit` clean, `eslint .` clean (0 warnings), `vitest run` 234/234
(up from 217 — added `tests/domain/search.test.ts` and
`tests/usecases/technique-of-day.test.ts`, 1 pre-existing i18n test needed a
new `ALLOWED_LATIN` entry for `search.nav.youtube`), `next build` clean.

### Manual retest (added to the running list)
1. `/coach`: confirm the weekly digest still renders correctly and the page
   feels faster — the query-count fix isn't independently visible without a
   profiler/APM in a real deployment.
2. `/search`: try "mes séances", "my goals", "quoi travailler aujourd'hui",
   "arm drag", "garde" (fr), "sprwal" (typo), "sprawl vidéo" — confirm
   navigation/skill/video results and the Study/Add-goal/Watch-videos
   buttons all work end to end with a real signed-in user.
3. `/coach`: confirm Technique of the Day's reason text, quick actions, and
   video slot render for a user with real training history (evidence path)
   and for a near-empty account (exploratory path).
4. Same no-seeded-test-user blocker as every prior session — none of the
   above was verified in a live browser this session.

## Session 15 — P0 reliability + YouTube ranking + image-payload perf fix

Root-caused and fixed every item in the user's P0 brief (coach catalogue
loss, /search crash, YouTube channel preference, image lateness). No broad
audit, no redesign — targeted fixes only.

### A — Coach "catalogue vide" root cause
`getTechniqueOfTheDay` (`lib/usecases/skill-actions.ts`) awaited
`loadSkillIntelligenceInputs()` unguarded, *after* the real catalog check
(`catalog.length === 0`) had already passed. A transient intelligence-query
failure (not a catalog failure) threw past that point, was caught upstream
in `coach/page.tsx` by `.catch(() => null)`, and rendered as "Catalogue
vide." — lying about the catalog being empty when it had loaded fine.
Fix: `loadSkillIntelligenceInputs().catch(() => [])` inside
`getTechniqueOfTheDay`, degrading to the same exploratory pick already used
when there's no evidence, instead of losing the pick entirely.
Also found and fixed the same class of bug one level up: `buildCoachContext`
(`lib/usecases/ai-coach-actions.ts`) awaited `getTrainingIntelligenceBundle`,
`getReviewQueue`, `getUpcomingGoals`, `getStudyQueue` unguarded in one
`Promise.all` — any one of them throwing (e.g. `getStudyQueue`'s
`if (error) throw`) crashed the *entire* `/coach` route, not just a section.
Each now degrades independently (`.catch()` to an empty/insufficient-data
default) instead of taking the page down.

### B — /search crash root cause
Three independent bugs in `lib/usecases/search-actions.ts`, all now fixed:
1. `getSkillsCatalog()` was awaited unguarded — a catalog failure crashed
   the whole route instead of just dropping skill matches. Now
   `.catch(() => [])`.
2. The `.or()` filter string for resources/sessions/goals interpolated the
   raw (normalized) query directly: `` `title.ilike.${like},...` ``.
   PostgREST's `.or()` treats comma and parentheses as filter *syntax*
   (condition separator / grouping), not literal characters — a query like
   "stand-up (boxing)" broke the filter and PostgREST returned an error.
   Fixed by quoting the value per PostgREST's own escaping rules
   (backslash-escape `\`/`"`, wrap in `"..."`). The `.ilike()` builder call
   (session_observations) doesn't need this — it takes the value as a real
   param and encodes it itself — so it keeps the unquoted `likeRaw`.
3. `if (r.error) throw new Error(...)` on the 4 parallel DB blocks
   (resources/sessions/observations/goals) crashed the whole response on
   any one failing. Now logs and degrades to a partial result set — each
   block is independent by design (see the file's own top-of-file comment).
Regression tests added in `tests/usecases/search-actions.test.ts` covering
all 7 queries from the brief, the catalog-failure and DB-error-degrade
paths, and the comma/parenthesis PostgREST-escaping case.

### C — YouTube channel preference
`lib/infra/video/youtube-video-search-provider.ts`: added a deterministic,
light reorder (`boostPreferredChannel`) applied to the API's own
relevance-ordered results — never fetches extra results, never injects or
drops a video, only moves at most one already-relevant preferred-channel
result up into the #2 slot when the query's discipline matches (BJJ/
grappling/wrestling → Jordan Teaches Jiu-Jitsu/Bernardo Faria/BJJ Fanatics/
John Danaher/Gordon Ryan; MMA/Muay Thai/boxing/karate → MMA Shredded).
Matched against `channelTitle` only — no fabricated score. 4 new tests in
`tests/infra/youtube-video-search-provider.test.ts`.

### D/E — Performance / image lateness root cause
Region mismatch: unchanged from session 13's finding — still not
measurable from this environment (no Vercel/Supabase dashboard access, no
`vercel.json` override). Not re-investigated; nothing new to add.
Query/dedup structure: already fixed in session 14 (loadSkillIntelligenceInputs
`cache()`-wrapped); re-verified still correct, no new duplication found.

**New finding**: the actual, measurable, concrete cause of "photos still
appear later than desired" — every photo referenced by
`lib/design/photography.ts` and the hardcoded `ChampionshipSectionPhoto`/
`ProgressiveImage` call sites is a raw, full camera-resolution Unsplash/
Pexels original committed straight into `public/mma-mastery-photos/`,
several 6000px-wide and 4-12MB each. Next's Image Optimization API has to
fetch and decode the *full* origin file on every cache-miss variant it
generates — a 12MB decode is real, measurable server-side latency, on top
of just being a slow origin fetch. None of these are ever displayed above
~800px CSS width per their own `sizes` attributes, so the multi-thousand-
pixel originals were pure waste.
Fix: resized all 56 referenced photos in place with `sharp` (which the
project already depends on transitively) — capped to a 2400px long edge
(covers 3x-retina at the largest container width actually used) and
re-encoded at JPEG quality 85/mozjpeg. Total referenced-photo payload:
**159.8MB → 22.7MB** (51 of 56 files touched; 5 were already small enough
to skip). No code change needed — same file paths, same `next/image`
pipeline, same `sizes`/`priority` usage already set correctly by prior
sessions (`PageHeader`'s hero photo already had `priority`; verified, not
touched). This is a real, verifiable byte-count fix, not a speculative one.

### Validation
`tsc --noEmit` clean, `eslint .` clean (0 warnings, after fixing one
unused-arg lint issue in the new test), `vitest run` 257/257, `next build`
clean (34/34 routes).

### Manual retest (added to the running list)
1. `/coach` with a real user during a Supabase blip (or just re-verify
   normally): Technique of the Day should never show "Catalogue vide"
   unless the catalog itself is genuinely empty.
2. `/search`: try `"stand-up (boxing)"` or any query containing a comma or
   parenthesis — should return results/no-results, never a route error.
3. `/youtube` and `/coach`'s Technique-of-Day video slot for a BJJ/
   grappling and an MMA/striking query — confirm at most one preferred-
   channel video appears in the first 1-2 slots when relevant, and none
   when not.
4. Any page load — photos should visibly appear sooner; verify in a real
   browser/Network tab (not verifiable from this environment).
5. Same no-seeded-test-user blocker as every prior session.
