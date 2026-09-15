-- V3 lot 1: honest sparring signal, goals, and a minimal owner-scoped
-- knowledge base (resources, bookmarks, study queue, skill notes).
-- Additive-only per docs/architecture.md. See docs/decisions/0008.

-- === session_techniques: additive sparring-only columns ===
-- Reuses the existing technique log instead of a parallel "sparring_rounds"
-- table: a technique logged in a `sparring` session already *is* a round.
-- outcome stays optional/nullable everywhere else so class/drilling/
-- competition rows are unaffected (docs/decisions/0006 concern: never derive
-- a success ratio from rows that never recorded a result).

create type session_technique_outcome as enum ('success', 'failure');

alter table session_techniques add column if not exists outcome session_technique_outcome;
alter table session_techniques add column if not exists partner_name text;
alter table session_techniques add column if not exists pressure_level smallint check (pressure_level is null or (pressure_level between 1 and 5));
alter table session_techniques add column if not exists problem text;

-- === Replace transactional use-case functions to persist the new fields ===

create or replace function create_training_session(
  p_date date,
  p_discipline_id uuid,
  p_session_type session_type,
  p_title text,
  p_duration_minutes smallint,
  p_rpe smallint,
  p_notes text,
  p_techniques jsonb,
  p_observations jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_session_id uuid;
  v_has_required_observation boolean;
begin
  select exists (
    select 1 from jsonb_array_elements(p_observations) o
    where o ->> 'type' in ('difficulty', 'question')
  ) into v_has_required_observation;

  if not v_has_required_observation then
    raise exception 'A training session requires at least one difficulty or question observation'
      using errcode = '23514';
  end if;

  insert into training_sessions (
    user_id, date, discipline_id, session_type, title, duration_minutes, rpe, notes
  ) values (
    auth.uid(), p_date, p_discipline_id, p_session_type, p_title, p_duration_minutes, p_rpe, p_notes
  )
  returning id into v_session_id;

  insert into session_techniques (
    session_id, technique_name, skill_id, category, notes, outcome, partner_name, pressure_level, problem
  )
  select
    v_session_id,
    t ->> 'technique_name',
    (t ->> 'skill_id')::uuid,
    t ->> 'category',
    t ->> 'notes',
    (t ->> 'outcome')::session_technique_outcome,
    t ->> 'partner_name',
    (t ->> 'pressure_level')::smallint,
    t ->> 'problem'
  from jsonb_array_elements(p_techniques) t;

  insert into session_observations (session_id, type, content, related_skill_id)
  select v_session_id, (o ->> 'type')::observation_type, o ->> 'content', (o ->> 'related_skill_id')::uuid
  from jsonb_array_elements(p_observations) o;

  return v_session_id;
end;
$$;

create or replace function update_training_session(
  p_session_id uuid,
  p_date date,
  p_discipline_id uuid,
  p_session_type session_type,
  p_title text,
  p_duration_minutes smallint,
  p_rpe smallint,
  p_notes text,
  p_techniques jsonb,
  p_observations jsonb
)
returns void
language plpgsql
security invoker
as $$
declare
  v_has_required_observation boolean;
begin
  if not exists (
    select 1 from training_sessions where id = p_session_id and user_id = auth.uid()
  ) then
    raise exception 'Training session not found' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from jsonb_array_elements(p_observations) o
    where o ->> 'type' in ('difficulty', 'question')
  ) into v_has_required_observation;

  if not v_has_required_observation then
    raise exception 'A training session requires at least one difficulty or question observation'
      using errcode = '23514';
  end if;

  update training_sessions set
    date = p_date,
    discipline_id = p_discipline_id,
    session_type = p_session_type,
    title = p_title,
    duration_minutes = p_duration_minutes,
    rpe = p_rpe,
    notes = p_notes
  where id = p_session_id;

  delete from session_techniques where session_id = p_session_id;
  insert into session_techniques (
    session_id, technique_name, skill_id, category, notes, outcome, partner_name, pressure_level, problem
  )
  select
    p_session_id,
    t ->> 'technique_name',
    (t ->> 'skill_id')::uuid,
    t ->> 'category',
    t ->> 'notes',
    (t ->> 'outcome')::session_technique_outcome,
    t ->> 'partner_name',
    (t ->> 'pressure_level')::smallint,
    t ->> 'problem'
  from jsonb_array_elements(p_techniques) t;

  delete from session_observations where session_id = p_session_id;
  insert into session_observations (session_id, type, content, related_skill_id)
  select p_session_id, (o ->> 'type')::observation_type, o ->> 'content', (o ->> 'related_skill_id')::uuid
  from jsonb_array_elements(p_observations) o;
end;
$$;

-- === skill_progress sync: session-type-aware, honest dimensions ===
-- Previously every logged technique counted as a "drilling rep" regardless
-- of session type, and live_application_count/sparring_* were never written
-- (docs/decisions/0006). Now each session_type feeds the dimension it
-- actually represents:
--   class/drilling  -> drilling_reps
--   competition     -> live_application_count (real-stakes application)
--   sparring        -> sparring_attempt_count / sparring_success_count,
--                      counted only from rows with a recorded `outcome`
--                      (an un-scored sparring rep proves nothing either way).

create or replace function sync_skill_progress_for_skill(p_skill_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_drilling_reps integer;
  v_live_application_count integer;
  v_sparring_attempt_count integer;
  v_sparring_success_count integer;
  v_evidence_count integer;
  v_last timestamptz;
begin
  if p_skill_id is null or v_user_id is null then
    return;
  end if;

  select
    count(*) filter (where ts.session_type in ('class', 'drilling')),
    count(*) filter (where ts.session_type = 'competition'),
    count(*) filter (where ts.session_type = 'sparring' and st.outcome is not null),
    count(*) filter (where ts.session_type = 'sparring' and st.outcome = 'success'),
    count(*),
    max(ts.date)
  into
    v_drilling_reps,
    v_live_application_count,
    v_sparring_attempt_count,
    v_sparring_success_count,
    v_evidence_count,
    v_last
  from session_techniques st
  join training_sessions ts on ts.id = st.session_id
  where st.skill_id = p_skill_id and ts.user_id = v_user_id;

  insert into skill_progress (
    user_id, skill_id, drilling_reps, live_application_count,
    sparring_attempt_count, sparring_success_count, evidence_count, last_practiced_at
  )
  values (
    v_user_id, p_skill_id, v_drilling_reps, v_live_application_count,
    v_sparring_attempt_count, v_sparring_success_count, v_evidence_count, v_last
  )
  on conflict (user_id, skill_id) do update set
    drilling_reps = excluded.drilling_reps,
    live_application_count = excluded.live_application_count,
    sparring_attempt_count = excluded.sparring_attempt_count,
    sparring_success_count = excluded.sparring_success_count,
    evidence_count = excluded.evidence_count,
    last_practiced_at = excluded.last_practiced_at;
end;
$$;

-- === goals (owner-only) ===

create type goal_horizon as enum ('short', 'medium', 'long');
create type goal_status as enum ('active', 'done', 'abandoned');

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  horizon goal_horizon not null,
  title text not null,
  description text,
  skill_id uuid references skills(id),
  status goal_status not null default 'active',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_user_id_status_idx on goals (user_id, status);

create trigger goals_set_updated_at
  before update on goals
  for each row
  execute function set_updated_at();

alter table goals enable row level security;

create policy "goals_select_own" on goals for select using (auth.uid() = user_id);
create policy "goals_insert_own" on goals for insert with check (auth.uid() = user_id);
create policy "goals_update_own" on goals for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "goals_delete_own" on goals for delete using (auth.uid() = user_id);

-- === resources: owner-curated external links (video/article/channel/course) ===
-- Owner-scoped, not a shared moderated catalog like `skills`: there is no
-- admin/service-role tooling to review third-party links, so each user
-- curates their own (docs/decisions/0008). Never a re-hosted video, only a
-- URL + optional timestamp into the source.

create type resource_type as enum ('video', 'article', 'channel', 'course');

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type resource_type not null,
  title text not null,
  author text,
  url text not null,
  skill_id uuid references skills(id),
  timestamp_seconds integer check (timestamp_seconds is null or timestamp_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index resources_user_id_idx on resources (user_id);
create index resources_skill_id_idx on resources (skill_id);

create trigger resources_set_updated_at
  before update on resources
  for each row
  execute function set_updated_at();

alter table resources enable row level security;

create policy "resources_select_own" on resources for select using (auth.uid() = user_id);
create policy "resources_insert_own" on resources for insert with check (auth.uid() = user_id);
create policy "resources_update_own" on resources for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "resources_delete_own" on resources for delete using (auth.uid() = user_id);

-- === user_bookmarks (owner-only, polymorphic target like XPEvent.source_id) ===

create type bookmark_target_type as enum ('skill', 'resource');

create table if not exists user_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type bookmark_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index user_bookmarks_user_id_idx on user_bookmarks (user_id);

alter table user_bookmarks enable row level security;

create policy "user_bookmarks_select_own" on user_bookmarks for select using (auth.uid() = user_id);
create policy "user_bookmarks_insert_own" on user_bookmarks for insert with check (auth.uid() = user_id);
create policy "user_bookmarks_delete_own" on user_bookmarks for delete using (auth.uid() = user_id);

-- === study_queue_items (owner-only) ===

create type study_status as enum ('queued', 'studying', 'studied');

create table if not exists study_queue_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  status study_status not null default 'queued',
  notes text,
  studied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create index study_queue_items_user_id_status_idx on study_queue_items (user_id, status);

create trigger study_queue_items_set_updated_at
  before update on study_queue_items
  for each row
  execute function set_updated_at();

alter table study_queue_items enable row level security;

create policy "study_queue_items_select_own" on study_queue_items for select using (auth.uid() = user_id);
create policy "study_queue_items_insert_own" on study_queue_items for insert with check (auth.uid() = user_id);
create policy "study_queue_items_update_own" on study_queue_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study_queue_items_delete_own" on study_queue_items for delete using (auth.uid() = user_id);

-- === skill_notes (owner-only, freeform notes outside a training session) ===

create table if not exists skill_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index skill_notes_user_id_skill_id_idx on skill_notes (user_id, skill_id);

create trigger skill_notes_set_updated_at
  before update on skill_notes
  for each row
  execute function set_updated_at();

alter table skill_notes enable row level security;

create policy "skill_notes_select_own" on skill_notes for select using (auth.uid() = user_id);
create policy "skill_notes_insert_own" on skill_notes for insert with check (auth.uid() = user_id);
create policy "skill_notes_update_own" on skill_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "skill_notes_delete_own" on skill_notes for delete using (auth.uid() = user_id);
