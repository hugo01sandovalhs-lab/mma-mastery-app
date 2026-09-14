-- Skill progress sync: skill_progress was never written by any user action
-- (no UI, no use case calls updateSkillProgress) — Mastery Map and the
-- dashboard progression summary always showed unknown/0 regardless of real
-- training. This closes that gap using only data already captured by the
-- training loop (session_techniques.skill_id), without fabricating anything
-- that requires subjective input (sparring success, knowledge, confidence
-- stay unmeasured — see docs/decisions/0006).
--
-- Recompute-on-mutation (not increment) so repeated edits of the same
-- session never double-count, and direct deletes (cascade from
-- training_sessions) stay consistent automatically.

create or replace function sync_skill_progress_for_skill(p_skill_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_count integer;
  v_last timestamptz;
begin
  if p_skill_id is null or v_user_id is null then
    return;
  end if;

  select count(*), max(ts.date)
  into v_count, v_last
  from session_techniques st
  join training_sessions ts on ts.id = st.session_id
  where st.skill_id = p_skill_id and ts.user_id = v_user_id;

  insert into skill_progress (user_id, skill_id, drilling_reps, evidence_count, last_practiced_at)
  values (v_user_id, p_skill_id, v_count, v_count, v_last)
  on conflict (user_id, skill_id) do update set
    drilling_reps = excluded.drilling_reps,
    evidence_count = excluded.evidence_count,
    last_practiced_at = excluded.last_practiced_at;
end;
$$;

create or replace function session_techniques_sync_skill_progress()
returns trigger
language plpgsql
security invoker
as $$
begin
  if tg_op = 'DELETE' then
    perform sync_skill_progress_for_skill(old.skill_id);
    return old;
  end if;

  perform sync_skill_progress_for_skill(new.skill_id);
  if tg_op = 'UPDATE' and old.skill_id is distinct from new.skill_id then
    perform sync_skill_progress_for_skill(old.skill_id);
  end if;
  return new;
end;
$$;

drop trigger if exists session_techniques_sync_skill_progress on session_techniques;
create trigger session_techniques_sync_skill_progress
  after insert or update or delete on session_techniques
  for each row
  execute function session_techniques_sync_skill_progress();
