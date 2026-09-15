-- V3 P3.5 lot: Club events / competitions (docs/decisions/0007, P3).
-- Additive only. Reuses is_club_member() from 00000000000007_club_groups.sql
-- for all RLS. Results/reporting reuse the existing personal competition
-- tracking (lib/domain/competition.ts, matches.event_name) rather than a
-- parallel results model -- an event here is a scheduling/registration
-- record, not a match log.

-- === club_events: a club-organized event (interclub, competition trip,
-- seminar, or generic gathering). Scoped to a club like classes. ===

create table if not exists club_events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  event_type text not null default 'event' check (event_type in ('interclub', 'competition', 'seminar', 'event')),
  starts_at timestamptz not null,
  location text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index club_events_club_id_idx on club_events (club_id);
create index club_events_starts_at_idx on club_events (starts_at);

create trigger club_events_set_updated_at
  before update on club_events
  for each row
  execute function set_updated_at();

alter table club_events enable row level security;

create policy "club_events_select_member" on club_events for select using (is_club_member(club_id, 'MEMBER'));
create policy "club_events_insert_coach" on club_events for insert with check (is_club_member(club_id, 'COACH'));
create policy "club_events_update_coach" on club_events for update using (is_club_member(club_id, 'COACH')) with check (is_club_member(club_id, 'COACH'));
create policy "club_events_delete_coach" on club_events for delete using (is_club_member(club_id, 'COACH'));

-- === event_registrations: one row per (event, member). Members register
-- and cancel their own row; coaches can manage any registration for
-- attendance/participant tracking. ===

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references club_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index event_registrations_event_id_idx on event_registrations (event_id);
create index event_registrations_user_id_idx on event_registrations (user_id);

create trigger event_registrations_set_updated_at
  before update on event_registrations
  for each row
  execute function set_updated_at();

alter table event_registrations enable row level security;

create policy "event_registrations_select_self_or_coach" on event_registrations for select using (
  user_id = auth.uid()
  or exists (select 1 from club_events e where e.id = event_id and is_club_member(e.club_id, 'COACH'))
);

create policy "event_registrations_insert_self_or_coach" on event_registrations for insert with check (
  (user_id = auth.uid() and exists (select 1 from club_events e where e.id = event_id and is_club_member(e.club_id, 'MEMBER')))
  or exists (select 1 from club_events e where e.id = event_id and is_club_member(e.club_id, 'COACH'))
);

create policy "event_registrations_update_self_or_coach" on event_registrations for update using (
  user_id = auth.uid()
  or exists (select 1 from club_events e where e.id = event_id and is_club_member(e.club_id, 'COACH'))
) with check (
  user_id = auth.uid()
  or exists (select 1 from club_events e where e.id = event_id and is_club_member(e.club_id, 'COACH'))
);

create policy "event_registrations_delete_self_or_coach" on event_registrations for delete using (
  user_id = auth.uid()
  or exists (select 1 from club_events e where e.id = event_id and is_club_member(e.club_id, 'COACH'))
);
