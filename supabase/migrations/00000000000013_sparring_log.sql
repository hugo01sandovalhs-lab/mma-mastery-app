-- Phase 4: Sparring Log. Still no separate `sparring_rounds` table — a round
-- is a `session_techniques` row under a `sparring`-type session
-- (docs/decisions/0008). Adds the three structured fields the dedicated
-- Sparring Log UI needs that a generic technique row didn't capture yet:
-- position/situation encountered, round duration, and ruleset. All nullable
-- and additive; meaningless (and left null) outside sparring context, same
-- pattern as outcome/partner_name/pressure_level/problem.

alter table session_techniques add column if not exists position text;
alter table session_techniques add column if not exists round_seconds smallint check (round_seconds is null or round_seconds > 0);
alter table session_techniques add column if not exists ruleset text;

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
    session_id, technique_name, skill_id, category, notes, outcome, partner_name, pressure_level, problem,
    position, round_seconds, ruleset
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
    t ->> 'problem',
    t ->> 'position',
    (t ->> 'round_seconds')::smallint,
    t ->> 'ruleset'
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
    session_id, technique_name, skill_id, category, notes, outcome, partner_name, pressure_level, problem,
    position, round_seconds, ruleset
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
    t ->> 'problem',
    t ->> 'position',
    (t ->> 'round_seconds')::smallint,
    t ->> 'ruleset'
  from jsonb_array_elements(p_techniques) t;

  delete from session_observations where session_id = p_session_id;
  insert into session_observations (session_id, type, content, related_skill_id)
  select p_session_id, (o ->> 'type')::observation_type, o ->> 'content', (o ->> 'related_skill_id')::uuid
  from jsonb_array_elements(p_observations) o;
end;
$$;
