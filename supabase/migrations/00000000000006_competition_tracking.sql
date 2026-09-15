-- V3 P2 lot: competition tracking (athletes, matches, sequences).
-- Reuses existing training_sessions (session_type = 'competition', already
-- feeding skill_progress.live_application_count since 0008) and the Skill
-- catalog instead of duplicating either. See docs/decisions/0009.

-- === athletes: owner-scoped roster (opponents/training partners), not a
-- shared moderated catalog like `skills` — same reasoning as `resources` in
-- 0008: no admin/service-role tooling exists to curate a shared roster. ===

create table if not exists athletes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  federation text,
  discipline_id uuid references disciplines(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index athletes_user_id_name_idx on athletes (user_id, lower(name));
create index athletes_user_id_idx on athletes (user_id);

create trigger athletes_set_updated_at
  before update on athletes
  for each row
  execute function set_updated_at();

alter table athletes enable row level security;

create policy "athletes_select_own" on athletes for select using (auth.uid() = user_id);
create policy "athletes_insert_own" on athletes for insert with check (auth.uid() = user_id);
create policy "athletes_update_own" on athletes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "athletes_delete_own" on athletes for delete using (auth.uid() = user_id);

-- === matches: a competition entry (owner-only). Optionally links the
-- `training_sessions` row (session_type = 'competition') that logged the
-- techniques applied there, without duplicating that log. ===

create type match_result as enum ('win', 'loss', 'draw', 'no_contest');

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discipline_id uuid not null references disciplines(id),
  athlete_id uuid references athletes(id) on delete set null,
  training_session_id uuid references training_sessions(id) on delete set null,
  event_name text,
  date date not null,
  result match_result,
  method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index matches_user_id_date_idx on matches (user_id, date desc);
create index matches_athlete_id_idx on matches (athlete_id);

create trigger matches_set_updated_at
  before update on matches
  for each row
  execute function set_updated_at();

alter table matches enable row level security;

create policy "matches_select_own" on matches for select using (auth.uid() = user_id);
create policy "matches_insert_own" on matches for insert with check (auth.uid() = user_id);
create policy "matches_update_own" on matches for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "matches_delete_own" on matches for delete using (auth.uid() = user_id);

-- === sequences: video breakdown (owner-only). `match_id` nullable so a
-- sequence can document a standalone clip, not only footage from a logged
-- match. Never a re-hosted video, only a URL + optional timestamp range into
-- the source (same rule as `resources`, 0008). Kept extensible for future
-- multi-skill tagging via `sequence_skills`, search and AI — none of that is
-- built in this lot. ===

create table if not exists sequences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid references matches(id) on delete set null,
  title text not null,
  source_url text,
  timestamp_start integer check (timestamp_start is null or timestamp_start >= 0),
  timestamp_end integer check (timestamp_end is null or timestamp_end >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sequences_timestamp_order check (
    timestamp_start is null or timestamp_end is null or timestamp_end >= timestamp_start
  )
);

create index sequences_user_id_idx on sequences (user_id);
create index sequences_match_id_idx on sequences (match_id);

create trigger sequences_set_updated_at
  before update on sequences
  for each row
  execute function set_updated_at();

alter table sequences enable row level security;

create policy "sequences_select_own" on sequences for select using (auth.uid() = user_id);
create policy "sequences_insert_own" on sequences for insert with check (auth.uid() = user_id);
create policy "sequences_update_own" on sequences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sequences_delete_own" on sequences for delete using (auth.uid() = user_id);

-- === sequence_skills: junction to the Skill catalog (owner-only via parent
-- sequence, same pattern as session_techniques/session_observations). ===

create table if not exists sequence_skills (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references sequences(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (sequence_id, skill_id)
);

create index sequence_skills_sequence_id_idx on sequence_skills (sequence_id);
create index sequence_skills_skill_id_idx on sequence_skills (skill_id);

alter table sequence_skills enable row level security;

create policy "sequence_skills_select_own"
  on sequence_skills for select
  using (
    exists (
      select 1 from sequences s
      where s.id = sequence_id and s.user_id = auth.uid()
    )
  );

create policy "sequence_skills_insert_own"
  on sequence_skills for insert
  with check (
    exists (
      select 1 from sequences s
      where s.id = sequence_id and s.user_id = auth.uid()
    )
  );

create policy "sequence_skills_delete_own"
  on sequence_skills for delete
  using (
    exists (
      select 1 from sequences s
      where s.id = sequence_id and s.user_id = auth.uid()
    )
  );
