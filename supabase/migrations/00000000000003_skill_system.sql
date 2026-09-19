-- Skill System (Phase 3): skill catalog, skill relation graph, per-user
-- multidimensional skill progress, and linking training data to skills.
-- Additive-only per docs/architecture.md. See docs/decisions/0004.

-- === skills (catalogue global, lecture publique, ecriture service role) ===

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  discipline_id uuid not null references disciplines(id),
  name text not null,
  slug text not null,
  description text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (discipline_id, slug)
);

create index skills_discipline_id_idx on skills (discipline_id);

create trigger skills_set_updated_at
  before update on skills
  for each row
  execute function set_updated_at();

alter table skills enable row level security;

create policy "skills_select_all"
  on skills for select
  to authenticated
  using (true);

-- No insert/update/delete policy for regular users: catalog is
-- service-role-managed only (see lib/infra/db/supabase-service.ts).

-- === skill_relations (graph N-N auto-referencee, typee) ===

create type skill_relation_type as enum (
  'prerequisite',
  'counter',
  'variation',
  'follow_up',
  'transition',
  'related'
);

create table if not exists skill_relations (
  id uuid primary key default gen_random_uuid(),
  from_skill_id uuid not null references skills(id) on delete cascade,
  to_skill_id uuid not null references skills(id) on delete cascade,
  relation_type skill_relation_type not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint skill_relations_no_self_relation check (from_skill_id <> to_skill_id),
  unique (from_skill_id, to_skill_id, relation_type)
);

create index skill_relations_from_skill_id_idx on skill_relations (from_skill_id);
create index skill_relations_to_skill_id_idx on skill_relations (to_skill_id);

alter table skill_relations enable row level security;

create policy "skill_relations_select_all"
  on skill_relations for select
  to authenticated
  using (true);

-- === skill_progress (owner-only) ===

create table if not exists skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  knowledge_level smallint not null default 0 check (knowledge_level between 0 and 5),
  drilling_reps integer not null default 0 check (drilling_reps >= 0),
  live_application_count integer not null default 0 check (live_application_count >= 0),
  sparring_attempt_count integer not null default 0 check (sparring_attempt_count >= 0),
  sparring_success_count integer not null default 0 check (sparring_success_count >= 0),
  consistency_score double precision check (consistency_score is null or (consistency_score between 0 and 1)),
  pressure_performance_level smallint check (pressure_performance_level is null or (pressure_performance_level between 0 and 5)),
  confidence_level smallint check (confidence_level is null or (confidence_level between 0 and 5)),
  evidence_count integer not null default 0 check (evidence_count >= 0),
  last_practiced_at timestamptz,
  mastery_stage_cache text,
  mastery_stage_computed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill_id)
);

create index skill_progress_user_id_idx on skill_progress (user_id);

create trigger skill_progress_set_updated_at
  before update on skill_progress
  for each row
  execute function set_updated_at();

alter table skill_progress enable row level security;

create policy "skill_progress_select_own"
  on skill_progress for select
  using (auth.uid() = user_id);

create policy "skill_progress_insert_own"
  on skill_progress for insert
  with check (auth.uid() = user_id);

create policy "skill_progress_update_own"
  on skill_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "skill_progress_delete_own"
  on skill_progress for delete
  using (auth.uid() = user_id);

-- === link training data to skills (nullable, backward compatible) ===
-- Phase 2 free-text techniques keep working: technique_name stays NOT NULL,
-- skill_id is an additive optional link (docs/decisions/0003, 0004).

alter table session_techniques add column if not exists skill_id uuid references skills(id);
create index if not exists session_techniques_skill_id_idx on session_techniques (skill_id);

alter table session_observations add column if not exists related_skill_id uuid references skills(id);
create index if not exists session_observations_related_skill_id_idx on session_observations (related_skill_id);

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

  insert into session_techniques (session_id, technique_name, skill_id, category, notes)
  select v_session_id, t ->> 'technique_name', (t ->> 'skill_id')::uuid, t ->> 'category', t ->> 'notes'
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
  insert into session_techniques (session_id, technique_name, skill_id, category, notes)
  select p_session_id, t ->> 'technique_name', (t ->> 'skill_id')::uuid, t ->> 'category', t ->> 'notes'
  from jsonb_array_elements(p_techniques) t;

  delete from session_observations where session_id = p_session_id;
  insert into session_observations (session_id, type, content, related_skill_id)
  select p_session_id, (o ->> 'type')::observation_type, o ->> 'content', (o ->> 'related_skill_id')::uuid
  from jsonb_array_elements(p_observations) o;
end;
$$;

-- === Seed data: small usable dataset, not an exhaustive taxonomy ===

with disc as (
  select id, code from disciplines where code in ('grappling', 'striking_muay_thai', 'mma')
),
grappling_skills(name, slug, category) as (
  values
    ('Stance', 'stance', 'position'),
    ('Level Change', 'level-change', 'takedown'),
    ('Double Leg', 'double-leg', 'takedown'),
    ('Single Leg', 'single-leg', 'takedown'),
    ('Sprawl', 'sprawl', 'defense'),
    ('Closed Guard', 'closed-guard', 'guard'),
    ('Open Guard', 'open-guard', 'guard'),
    ('Guard Pass', 'guard-pass', 'pass'),
    ('Side Control', 'side-control', 'position'),
    ('Mount', 'mount', 'position'),
    ('Back Control', 'back-control', 'position'),
    ('Rear Naked Choke', 'rear-naked-choke', 'submission'),
    ('Armbar', 'armbar', 'submission')
),
striking_skills(name, slug, category) as (
  values
    ('Stance', 'stance', 'stance'),
    ('Footwork', 'footwork', 'footwork'),
    ('Jab', 'jab', 'punch'),
    ('Cross', 'cross', 'punch'),
    ('Hook', 'hook', 'punch'),
    ('Low Kick', 'low-kick', 'kick'),
    ('Teep', 'teep', 'kick'),
    ('Check', 'check', 'defense'),
    ('Slip', 'slip', 'defense')
),
mma_skills(name, slug, category) as (
  values
    ('Cage Control', 'cage-control', 'cage'),
    ('Cage Takedown', 'cage-takedown', 'takedown'),
    ('Wall Walk', 'wall-walk', 'defense'),
    ('Ground and Pound', 'ground-and-pound', 'ground-and-pound'),
    ('Takedown Defense', 'takedown-defense', 'defense')
)
insert into skills (discipline_id, name, slug, category)
select (select id from disc where code = 'grappling'), name, slug, category from grappling_skills
union all
select (select id from disc where code = 'striking_muay_thai'), name, slug, category from striking_skills
union all
select (select id from disc where code = 'mma'), name, slug, category from mma_skills
on conflict (discipline_id, slug) do nothing;

-- Seed relations (grappling): a small illustrative slice of the graph.
with s as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'grappling'
)
insert into skill_relations (from_skill_id, to_skill_id, relation_type)
select (select id from s where slug = 'double-leg'), (select id from s where slug = 'level-change'), 'prerequisite'::skill_relation_type
union all
select (select id from s where slug = 'double-leg'), (select id from s where slug = 'side-control'), 'follow_up'::skill_relation_type
union all
select (select id from s where slug = 'double-leg'), (select id from s where slug = 'sprawl'), 'counter'::skill_relation_type
union all
select (select id from s where slug = 'side-control'), (select id from s where slug = 'mount'), 'transition'::skill_relation_type
union all
select (select id from s where slug = 'mount'), (select id from s where slug = 'back-control'), 'transition'::skill_relation_type
union all
select (select id from s where slug = 'back-control'), (select id from s where slug = 'rear-naked-choke'), 'follow_up'::skill_relation_type
union all
select (select id from s where slug = 'closed-guard'), (select id from s where slug = 'armbar'), 'follow_up'::skill_relation_type
union all
select (select id from s where slug = 'open-guard'), (select id from s where slug = 'closed-guard'), 'related'::skill_relation_type
on conflict (from_skill_id, to_skill_id, relation_type) do nothing;
