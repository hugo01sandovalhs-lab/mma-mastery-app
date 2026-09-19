-- Fix taxonomy bug: 00000000000003_skill_system.sql seeded 'Sprawl' twice,
-- once under `grappling` (correct) and once under `striking_muay_thai`
-- (wrong — sprawl is a wrestling/grappling takedown defense, not a Muay Thai
-- technique). This repoints any user data attached to the incorrect row onto
-- the correct `grappling` row, deduplicating where a user already has data
-- on both, then removes the incorrect row.

do $$
declare
  wrong_id uuid;
  correct_id uuid;
begin
  select sk.id into wrong_id
  from skills sk join disciplines d on d.id = sk.discipline_id
  where d.code = 'striking_muay_thai' and sk.slug = 'sprawl';

  select sk.id into correct_id
  from skills sk join disciplines d on d.id = sk.discipline_id
  where d.code = 'grappling' and sk.slug = 'sprawl';

  if wrong_id is not null and correct_id is not null then
    update skill_progress set skill_id = correct_id
      where skill_id = wrong_id
      and not exists (
        select 1 from skill_progress existing
        where existing.user_id = skill_progress.user_id and existing.skill_id = correct_id
      );
    delete from skill_progress where skill_id = wrong_id;

    update session_techniques set skill_id = correct_id where skill_id = wrong_id;
    update session_observations set related_skill_id = correct_id where related_skill_id = wrong_id;
    update goals set skill_id = correct_id where skill_id = wrong_id;
    update resources set skill_id = correct_id where skill_id = wrong_id;

    update study_queue_items sqi set skill_id = correct_id
      where skill_id = wrong_id
      and not exists (
        select 1 from study_queue_items existing
        where existing.user_id = sqi.user_id and existing.skill_id = correct_id
      );
    delete from study_queue_items where skill_id = wrong_id;

    update skill_notes set skill_id = correct_id where skill_id = wrong_id;

    update sequence_skills ss set skill_id = correct_id
      where skill_id = wrong_id
      and not exists (
        select 1 from sequence_skills existing
        where existing.sequence_id = ss.sequence_id and existing.skill_id = correct_id
      );
    delete from sequence_skills where skill_id = wrong_id;

    delete from skill_relations where from_skill_id = wrong_id or to_skill_id = wrong_id;

    delete from skills where id = wrong_id;
  end if;
end $$;
