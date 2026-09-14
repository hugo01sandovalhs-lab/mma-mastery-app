-- Core Training (Phase 2): disciplines catalog, training sessions, techniques,
-- observations. Additive-only per docs/architecture.md.
-- Scope decisions: docs/decisions/0003-phase2-core-training-scope.md

-- === Catalogue: disciplines (lecture publique, ecriture service role) ===

create table if not exists disciplines (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

alter table disciplines enable row level security;

create policy "disciplines_select_all"
  on disciplines for select
  using (true);

insert into disciplines (code, name) values
  ('grappling', 'Grappling'),
  ('striking_muay_thai', 'Striking / Muay Thai'),
  ('mma', 'MMA')
on conflict (code) do nothing;

-- === training_sessions (owner-only) ===

create type session_type as enum ('class', 'drilling', 'sparring', 'competition');

create table if not exists training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  discipline_id uuid not null references disciplines(id),
  session_type session_type not null,
  title text,
  duration_minutes smallint check (duration_minutes is null or duration_minutes > 0),
  rpe smallint check (rpe is null or (rpe between 1 and 10)),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index training_sessions_user_id_date_idx on training_sessions (user_id, date desc);

create trigger training_sessions_set_updated_at
  before update on training_sessions
  for each row
  execute function set_updated_at();

alter table training_sessions enable row level security;

create policy "training_sessions_select_own"
  on training_sessions for select
  using (auth.uid() = user_id);

create policy "training_sessions_insert_own"
  on training_sessions for insert
  with check (auth.uid() = user_id);

create policy "training_sessions_update_own"
  on training_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "training_sessions_delete_own"
  on training_sessions for delete
  using (auth.uid() = user_id);

-- === session_techniques (owner-only via parent session) ===
-- technique_name in free text for Phase 2; skill_id will be added additively
-- once the Skill catalog exists (Phase 3). See ADR 0003.

create table if not exists session_techniques (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  technique_name text not null,
  category text,
  notes text,
  created_at timestamptz not null default now()
);

create index session_techniques_session_id_idx on session_techniques (session_id);

alter table session_techniques enable row level security;

create policy "session_techniques_select_own"
  on session_techniques for select
  using (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "session_techniques_insert_own"
  on session_techniques for insert
  with check (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "session_techniques_update_own"
  on session_techniques for update
  using (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "session_techniques_delete_own"
  on session_techniques for delete
  using (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- === session_observations (owner-only via parent session) ===

create type observation_type as enum ('difficulty', 'question', 'insight', 'success');

create table if not exists session_observations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references training_sessions(id) on delete cascade,
  type observation_type not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index session_observations_session_id_idx on session_observations (session_id);

alter table session_observations enable row level security;

create policy "session_observations_select_own"
  on session_observations for select
  using (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "session_observations_insert_own"
  on session_observations for insert
  with check (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "session_observations_update_own"
  on session_observations for update
  using (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "session_observations_delete_own"
  on session_observations for delete
  using (
    exists (
      select 1 from training_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

-- === Transactional use-case functions ===
-- security invoker (default): runs as the calling user, RLS applies normally.
-- Enforces the product invariant (>=1 difficulty|question observation) atomically,
-- since it cannot be expressed as a cross-table check constraint.

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

  insert into session_techniques (session_id, technique_name, category, notes)
  select v_session_id, t ->> 'technique_name', t ->> 'category', t ->> 'notes'
  from jsonb_array_elements(p_techniques) t;

  insert into session_observations (session_id, type, content)
  select v_session_id, (o ->> 'type')::observation_type, o ->> 'content'
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
  insert into session_techniques (session_id, technique_name, category, notes)
  select p_session_id, t ->> 'technique_name', t ->> 'category', t ->> 'notes'
  from jsonb_array_elements(p_techniques) t;

  delete from session_observations where session_id = p_session_id;
  insert into session_observations (session_id, type, content)
  select p_session_id, (o ->> 'type')::observation_type, o ->> 'content'
  from jsonb_array_elements(p_observations) o;
end;
$$;
