# Nightly MMA checkpoint

## Commits
- `5224fe6` — localized auth errors + confirmation resend
- `1afcd82` — explicit club sharing consent, RLS, roster detail and team facts
- `2cf0c17` — deterministic My Game + larger dashboard session CTA

## Migrations
- `00000000000018_club_progress_sharing.sql` — additive, not applied; all six sharing categories default to private.

## Tests
- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 287/287 pass
- `npm run build` — pass, 36 routes
- RLS policy regression test — pass (static migration contract; live Supabase policy test unavailable locally)
- Browser — `/login` and `/resend-confirmation` render cleanly on desktop

## Actions manuelles demain
- Apply migration 18, then test member/coach accounts across two clubs: consent on/off, refused category, former member/coach, and coach A denied club B.
- Test several real signups, confirmation delivery, resend, login, logout and password reset through the configured Gmail SMTP.
- With authenticated member + coach fixtures, test club roster/detail/team synthesis, My Game, CTA → new session, and consent withdrawal.
- Run authenticated visual QA at 360/390/430 px on dashboard, training/new, sparring, skills, coach, YouTube and club routes.

## Risques connus
- No authenticated browser fixture or local Supabase instance: live RLS/E2E and authenticated visual checks were not run.
- Pre-existing abandoned V2 working-tree changes and user assets were preserved and excluded from the commits.
