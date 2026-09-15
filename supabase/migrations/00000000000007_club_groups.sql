-- V3 P3.1 lot: Club / ClubMember / Groups foundation (docs/decisions/0007).
-- Additive only. Reuses `profiles` for member display names via a new
-- scoped SELECT policy instead of a parallel member-profile model. Classes,
-- attendance, communication and payments stay out of scope (0007).

-- club_role is declared in ascending privilege order so plain `>=`
-- comparisons express "at least this role" (used by is_club_member below).
create type club_role as enum ('MEMBER', 'ASSISTANT_COACH', 'COACH', 'ADMIN', 'OWNER');
create type club_member_status as enum ('active', 'invited');

create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clubs_owner_id_idx on clubs (owner_id);

create trigger clubs_set_updated_at
  before update on clubs
  for each row
  execute function set_updated_at();

create table if not exists club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role club_role not null default 'MEMBER',
  status club_member_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create index club_members_club_id_idx on club_members (club_id);
create index club_members_user_id_idx on club_members (user_id);

create trigger club_members_set_updated_at
  before update on club_members
  for each row
  execute function set_updated_at();

-- === is_club_member: role-check helper used by every policy below.
-- SECURITY DEFINER is a deliberate, narrow deviation from the
-- security-invoker rule in architecture.md: it returns only a boolean
-- (never row data) and exists specifically to avoid the self-referencing
-- RLS recursion that a plain EXISTS-against-club_members policy would hit
-- (the standard Supabase pattern for membership tables). ===

create or replace function is_club_member(p_club_id uuid, p_min_role club_role default 'MEMBER')
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from club_members cm
    where cm.club_id = p_club_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and cm.role >= p_min_role
  );
$$;

revoke all on function is_club_member(uuid, club_role) from public;
grant execute on function is_club_member(uuid, club_role) to authenticated;

alter table clubs enable row level security;

create policy "clubs_select_member" on clubs for select using (is_club_member(id, 'MEMBER'));
create policy "clubs_insert_owner" on clubs for insert with check (owner_id = auth.uid());
create policy "clubs_update_admin" on clubs for update using (is_club_member(id, 'ADMIN')) with check (is_club_member(id, 'ADMIN'));
create policy "clubs_delete_owner" on clubs for delete using (is_club_member(id, 'OWNER'));

alter table club_members enable row level security;

create policy "club_members_select_fellow" on club_members for select using (is_club_member(club_id, 'MEMBER'));
create policy "club_members_insert_admin" on club_members for insert with check (is_club_member(club_id, 'ADMIN'));
create policy "club_members_update_admin" on club_members for update using (is_club_member(club_id, 'ADMIN')) with check (is_club_member(club_id, 'ADMIN'));
create policy "club_members_delete_admin_or_self" on club_members for delete using (
  is_club_member(club_id, 'ADMIN') or user_id = auth.uid()
);

-- Owner is auto-enrolled as an OWNER member on club creation (mirrors the
-- `handle_new_user` -> profiles trigger precedent in the foundation
-- migration: a SECURITY DEFINER trigger inserting a related row that the
-- inserting role could not otherwise write via plain RLS).
create or replace function handle_new_club()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.club_members (club_id, user_id, role, status)
  values (new.id, new.owner_id, 'OWNER', 'active');
  return new;
end;
$$;

create trigger on_club_created
  after insert on clubs
  for each row
  execute function handle_new_club();

-- === invite_club_member: adds an existing account to a club by email.
-- SECURITY DEFINER is required to look up auth.users (never exposed to
-- regular users), but the function re-validates the caller's authorization
-- itself before doing anything. No membership is created for an email with
-- no matching account -- no fake/pending member rows. ===

create or replace function invite_club_member(p_club_id uuid, p_email text, p_role club_role default 'MEMBER')
returns club_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_result club_members;
begin
  if p_role = 'OWNER' then
    raise exception 'Cannot invite as OWNER';
  end if;

  if not is_club_member(p_club_id, 'ADMIN') then
    raise exception 'Not authorized';
  end if;

  select id into v_user_id from auth.users where lower(email) = lower(p_email) limit 1;
  if v_user_id is null then
    raise exception 'No account found for this email';
  end if;

  insert into club_members (club_id, user_id, role, status)
  values (p_club_id, v_user_id, p_role, 'active')
  on conflict (club_id, user_id) do update set role = excluded.role
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function invite_club_member(uuid, text, club_role) from public;
grant execute on function invite_club_member(uuid, text, club_role) to authenticated;

-- Lets club members see each other's display_name (profiles otherwise
-- select-own-only, foundation migration). Scoped to shared-club pairs only,
-- never cross-club.
create policy "profiles_select_club_fellow" on profiles for select using (
  exists (
    select 1 from club_members cm
    where cm.user_id = profiles.user_id
      and is_club_member(cm.club_id, 'MEMBER')
  )
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  name text not null,
  level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index groups_club_id_idx on groups (club_id);

create trigger groups_set_updated_at
  before update on groups
  for each row
  execute function set_updated_at();

alter table groups enable row level security;

create policy "groups_select_member" on groups for select using (is_club_member(club_id, 'MEMBER'));
create policy "groups_insert_coach" on groups for insert with check (is_club_member(club_id, 'COACH'));
create policy "groups_update_coach" on groups for update using (is_club_member(club_id, 'COACH')) with check (is_club_member(club_id, 'COACH'));
create policy "groups_delete_coach" on groups for delete using (is_club_member(club_id, 'COACH'));

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index group_members_group_id_idx on group_members (group_id);
create index group_members_user_id_idx on group_members (user_id);

alter table group_members enable row level security;

create policy "group_members_select_fellow" on group_members for select using (
  exists (select 1 from groups g where g.id = group_id and is_club_member(g.club_id, 'MEMBER'))
);

create policy "group_members_insert_coach" on group_members for insert with check (
  exists (select 1 from groups g where g.id = group_id and is_club_member(g.club_id, 'COACH'))
);

create policy "group_members_delete_coach" on group_members for delete using (
  exists (select 1 from groups g where g.id = group_id and is_club_member(g.club_id, 'COACH'))
);
