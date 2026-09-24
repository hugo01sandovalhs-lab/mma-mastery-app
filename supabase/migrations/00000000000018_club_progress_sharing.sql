-- Explicit, revocable member consent for sharing private progress with club staff.
-- Every category defaults to false. Owners keep full ownership of their rows.

create table if not exists club_sharing_preferences (
  club_id uuid not null references clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_skills boolean not null default false,
  share_training boolean not null default false,
  share_sparring boolean not null default false,
  share_difficulties boolean not null default false,
  share_goals boolean not null default false,
  share_youtube boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create trigger club_sharing_preferences_set_updated_at
  before update on club_sharing_preferences
  for each row execute function set_updated_at();

alter table club_sharing_preferences enable row level security;

create policy "club_sharing_select_self_or_staff" on club_sharing_preferences for select using (
  user_id = auth.uid() or is_club_member(club_id, 'COACH')
);
create policy "club_sharing_insert_self" on club_sharing_preferences for insert with check (
  user_id = auth.uid() and is_club_member(club_id, 'MEMBER')
);
create policy "club_sharing_update_self" on club_sharing_preferences for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and is_club_member(club_id, 'MEMBER'));
create policy "club_sharing_delete_self" on club_sharing_preferences for delete using (user_id = auth.uid());

-- SECURITY DEFINER avoids recursive RLS while returning only a boolean. A
-- caller must be active staff in the same club and the member must opt in.
create or replace function can_club_staff_view(p_user_id uuid, p_category text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from club_sharing_preferences p
    join club_members staff on staff.club_id = p.club_id
    join club_members member on member.club_id = p.club_id and member.user_id = p.user_id
    where p.user_id = p_user_id
      and staff.user_id = auth.uid()
      and staff.status = 'active'
      and staff.role >= 'COACH'
      and member.status = 'active'
      and case p_category
        when 'skills' then p.share_skills
        when 'training' then p.share_training
        when 'sparring' then p.share_sparring
        when 'difficulties' then p.share_difficulties
        when 'goals' then p.share_goals
        when 'youtube' then p.share_youtube
        else false
      end
  );
$$;

revoke all on function can_club_staff_view(uuid, text) from public;
grant execute on function can_club_staff_view(uuid, text) to authenticated;

create policy "skill_progress_select_consented_staff" on skill_progress for select using (
  can_club_staff_view(user_id, 'skills')
);

create policy "training_sessions_select_consented_staff" on training_sessions for select using (
  case when session_type = 'sparring'
    then can_club_staff_view(user_id, 'sparring')
    else can_club_staff_view(user_id, 'training')
  end
);

create policy "session_techniques_select_consented_staff" on session_techniques for select using (
  exists (
    select 1 from training_sessions s
    where s.id = session_id
      and case when s.session_type = 'sparring'
        then can_club_staff_view(s.user_id, 'sparring')
        else can_club_staff_view(s.user_id, 'training')
      end
  )
);

create policy "session_observations_select_consented_staff" on session_observations for select using (
  exists (
    select 1 from training_sessions s
    where s.id = session_id and can_club_staff_view(s.user_id, 'difficulties')
  )
);

create policy "goals_select_consented_staff" on goals for select using (
  can_club_staff_view(user_id, 'goals')
);

create policy "resources_select_consented_staff" on resources for select using (
  can_club_staff_view(user_id, 'youtube')
);
