-- Minimal private training-partner graph. Profiles stay owner-only; the RPCs
-- expose only a display name and never an email or athlete profile fields.
alter table profiles
  add column if not exists friend_code text not null
  default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) unique;

create table if not exists training_partners (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a <> user_b),
  unique (user_a, user_b)
);

alter table training_partners enable row level security;
create policy "training_partners_participants_select" on training_partners for select
  using (auth.uid() = user_a or auth.uid() = user_b);
create policy "training_partners_participants_delete" on training_partners for delete
  using (auth.uid() = user_a or auth.uid() = user_b);

create or replace function add_training_partner(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_me uuid := auth.uid();
  v_partner uuid;
  v_id uuid;
begin
  if v_me is null then raise exception 'Authentication required'; end if;

  select user_id into v_partner from profiles where friend_code = upper(p_code);
  if v_partner is null then raise exception 'Friend code not found'; end if;
  if v_partner = v_me then raise exception 'Cannot add yourself'; end if;

  insert into training_partners (user_a, user_b)
  values (
    case when v_me::text < v_partner::text then v_me else v_partner end,
    case when v_me::text < v_partner::text then v_partner else v_me end
  )
  on conflict (user_a, user_b) do update set user_a = excluded.user_a
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function list_training_partners()
returns table (relationship_id uuid, partner_user_id uuid, display_name text)
language sql
security definer
set search_path = public
stable
as $$
  select tp.id,
    case when tp.user_a = auth.uid() then tp.user_b else tp.user_a end,
    coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.display_name, 'Partenaire')
  from training_partners tp
  join profiles p on p.user_id = case when tp.user_a = auth.uid() then tp.user_b else tp.user_a end
  where auth.uid() = tp.user_a or auth.uid() = tp.user_b
  order by 3;
$$;

create or replace function remove_training_partner(p_relationship_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from training_partners
  where id = p_relationship_id and (auth.uid() = user_a or auth.uid() = user_b);
  if not found then raise exception 'Partner relationship not found'; end if;
end;
$$;

revoke all on function add_training_partner(text) from public;
revoke all on function list_training_partners() from public;
revoke all on function remove_training_partner(uuid) from public;
grant execute on function add_training_partner(text) to authenticated;
grant execute on function list_training_partners() to authenticated;
grant execute on function remove_training_partner(uuid) to authenticated;
