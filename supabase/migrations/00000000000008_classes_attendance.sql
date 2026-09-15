-- V3 P3.2 lot: Classes / Attendance / QR check-in (docs/decisions/0007, P2).
-- Additive only. Classes/sessions scoped to a club, optionally to one group.
-- Reuses is_club_member() from 00000000000007_club_groups.sql for all RLS.

-- === classes: a recurring or one-off class definition. Weekly schedule
-- fields are metadata only (display + prefill), never an automated
-- scheduler -- concrete occurrences are explicit `class_sessions` rows a
-- coach creates. ===

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  name text not null,
  day_of_week smallint check (day_of_week is null or day_of_week between 0 and 6),
  start_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_club_id_idx on classes (club_id);
create index classes_group_id_idx on classes (group_id);

create trigger classes_set_updated_at
  before update on classes
  for each row
  execute function set_updated_at();

alter table classes enable row level security;

create policy "classes_select_member" on classes for select using (is_club_member(club_id, 'MEMBER'));
create policy "classes_insert_coach" on classes for insert with check (is_club_member(club_id, 'COACH'));
create policy "classes_update_coach" on classes for update using (is_club_member(club_id, 'COACH')) with check (is_club_member(club_id, 'COACH'));
create policy "classes_delete_coach" on classes for delete using (is_club_member(club_id, 'COACH'));

-- === class_sessions: one concrete occurrence of a class. Carries the
-- short-lived QR check-in token: `checkin_code` + `checkin_code_expires_at`
-- are null until a coach explicitly generates one (rotate_checkin_code
-- below), and a fresh generation always invalidates the previous code. ===

create table if not exists class_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  checkin_code text,
  checkin_code_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index class_sessions_class_id_idx on class_sessions (class_id);
create index class_sessions_starts_at_idx on class_sessions (starts_at);
create unique index class_sessions_checkin_code_idx on class_sessions (checkin_code) where checkin_code is not null;

create trigger class_sessions_set_updated_at
  before update on class_sessions
  for each row
  execute function set_updated_at();

alter table class_sessions enable row level security;

create policy "class_sessions_select_member" on class_sessions for select using (
  exists (select 1 from classes c where c.id = class_id and is_club_member(c.club_id, 'MEMBER'))
);

create policy "class_sessions_insert_coach" on class_sessions for insert with check (
  exists (select 1 from classes c where c.id = class_id and is_club_member(c.club_id, 'COACH'))
);

create policy "class_sessions_update_coach" on class_sessions for update using (
  exists (select 1 from classes c where c.id = class_id and is_club_member(c.club_id, 'COACH'))
) with check (
  exists (select 1 from classes c where c.id = class_id and is_club_member(c.club_id, 'COACH'))
);

create policy "class_sessions_delete_coach" on class_sessions for delete using (
  exists (select 1 from classes c where c.id = class_id and is_club_member(c.club_id, 'COACH'))
);

-- === attendance: one row per (session, member). Self check-in only ever
-- happens through checkin_to_class_session() below; the insert/update
-- policies here cover coach manual marking. ===

create type attendance_status as enum ('present', 'absent');

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  class_session_id uuid not null references class_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status attendance_status not null default 'present',
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_session_id, user_id)
);

create index attendance_class_session_id_idx on attendance (class_session_id);
create index attendance_user_id_idx on attendance (user_id);

create trigger attendance_set_updated_at
  before update on attendance
  for each row
  execute function set_updated_at();

alter table attendance enable row level security;

create policy "attendance_select_self_or_coach" on attendance for select using (
  user_id = auth.uid()
  or exists (
    select 1 from class_sessions cs
    join classes c on c.id = cs.class_id
    where cs.id = class_session_id and is_club_member(c.club_id, 'COACH')
  )
);

create policy "attendance_insert_coach" on attendance for insert with check (
  exists (
    select 1 from class_sessions cs
    join classes c on c.id = cs.class_id
    where cs.id = class_session_id and is_club_member(c.club_id, 'COACH')
  )
);

create policy "attendance_update_coach" on attendance for update using (
  exists (
    select 1 from class_sessions cs
    join classes c on c.id = cs.class_id
    where cs.id = class_session_id and is_club_member(c.club_id, 'COACH')
  )
) with check (
  exists (
    select 1 from class_sessions cs
    join classes c on c.id = cs.class_id
    where cs.id = class_session_id and is_club_member(c.club_id, 'COACH')
  )
);

create policy "attendance_delete_coach" on attendance for delete using (
  exists (
    select 1 from class_sessions cs
    join classes c on c.id = cs.class_id
    where cs.id = class_session_id and is_club_member(c.club_id, 'COACH')
  )
);

-- === rotate_checkin_code: coach-only. Generates a fresh short token valid
-- for 20 minutes, replacing any previous code for that session. ===

create or replace function rotate_checkin_code(p_class_session_id uuid)
returns class_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club_id uuid;
  v_code text;
  v_result class_sessions;
begin
  select c.club_id into v_club_id
  from class_sessions cs
  join classes c on c.id = cs.class_id
  where cs.id = p_class_session_id;

  if v_club_id is null then
    raise exception 'Session not found';
  end if;

  if not is_club_member(v_club_id, 'COACH') then
    raise exception 'Not authorized';
  end if;

  v_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  update class_sessions
  set checkin_code = v_code, checkin_code_expires_at = now() + interval '20 minutes'
  where id = p_class_session_id
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function rotate_checkin_code(uuid) from public;
grant execute on function rotate_checkin_code(uuid) to authenticated;

-- === get_checkin_session_info: public (anon-readable) lookup by code.
-- Returns only non-sensitive display info, and only while the code is
-- still valid -- never exposes club/session data outside that window. ===

create or replace function get_checkin_session_info(p_code text)
returns table (class_name text, club_name text, starts_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select c.name, cl.name, cs.starts_at
  from class_sessions cs
  join classes c on c.id = cs.class_id
  join clubs cl on cl.id = c.club_id
  where cs.checkin_code = p_code
    and cs.checkin_code_expires_at is not null
    and cs.checkin_code_expires_at > now()
  limit 1;
$$;

revoke all on function get_checkin_session_info(text) from public;
grant execute on function get_checkin_session_info(text) to anon, authenticated;

-- === checkin_to_class_session: authenticated self check-in by code. Marks
-- the caller present; requires an active club membership and a code that
-- is still within its validity window. ===

create or replace function checkin_to_class_session(p_code text)
returns attendance
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_club_id uuid;
  v_result attendance;
begin
  select cs.id, c.club_id into v_session_id, v_club_id
  from class_sessions cs
  join classes c on c.id = cs.class_id
  where cs.checkin_code = p_code
    and cs.checkin_code_expires_at is not null
    and cs.checkin_code_expires_at > now();

  if v_session_id is null then
    raise exception 'Invalid or expired check-in code';
  end if;

  if not is_club_member(v_club_id, 'MEMBER') then
    raise exception 'Not a member of this club';
  end if;

  insert into attendance (class_session_id, user_id, status, checked_in_at)
  values (v_session_id, auth.uid(), 'present', now())
  on conflict (class_session_id, user_id) do update set status = 'present', checked_in_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function checkin_to_class_session(text) from public;
grant execute on function checkin_to_class_session(text) to authenticated;
