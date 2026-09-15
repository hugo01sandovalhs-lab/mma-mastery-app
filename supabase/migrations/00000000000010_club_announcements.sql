-- V3 P4.2 lot: Club communication -- announcements (light, no chat/email/push).
-- Additive only. Reuses is_club_member() / groups / group_members from
-- 00000000000007_club_groups.sql for targeting and RLS.

-- === club_announcements: a coach-authored post, targeted at the whole
-- club (group_id null) or one group. No threads, no reactions, no
-- real-time delivery -- read via normal page load / revalidation. ===

create table if not exists club_announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references clubs(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  title text not null,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index club_announcements_club_id_idx on club_announcements (club_id);
create index club_announcements_group_id_idx on club_announcements (group_id);
create index club_announcements_created_at_idx on club_announcements (created_at desc);

create trigger club_announcements_set_updated_at
  before update on club_announcements
  for each row
  execute function set_updated_at();

alter table club_announcements enable row level security;

-- Members see club-wide posts (group_id null) and posts for a group they
-- belong to; coaches+ see everything in their club for management.
create policy "club_announcements_select_visible" on club_announcements for select using (
  is_club_member(club_id, 'COACH')
  or (
    is_club_member(club_id, 'MEMBER')
    and (
      group_id is null
      or exists (select 1 from group_members gm where gm.group_id = club_announcements.group_id and gm.user_id = auth.uid())
    )
  )
);

create policy "club_announcements_insert_coach" on club_announcements for insert with check (
  is_club_member(club_id, 'COACH')
  and (group_id is null or exists (select 1 from groups g where g.id = group_id and g.club_id = club_id))
);

create policy "club_announcements_update_coach" on club_announcements for update using (
  is_club_member(club_id, 'COACH')
) with check (
  is_club_member(club_id, 'COACH')
  and (group_id is null or exists (select 1 from groups g where g.id = group_id and g.club_id = club_id))
);

create policy "club_announcements_delete_coach" on club_announcements for delete using (
  is_club_member(club_id, 'COACH')
);

-- === Unread tracking: one timestamp per membership instead of a
-- per-announcement read table -- "unread" is simply created_at newer than
-- the member's last visit to the announcements page. ===

alter table club_members add column if not exists announcements_last_read_at timestamptz;

-- SECURITY DEFINER so a member can update their own read marker without a
-- general self-update policy on club_members (mirrors invite_club_member).
create or replace function mark_announcements_read(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update club_members
  set announcements_last_read_at = now()
  where club_id = p_club_id and user_id = auth.uid();
end;
$$;

revoke all on function mark_announcements_read(uuid) from public;
grant execute on function mark_announcements_read(uuid) to authenticated;
