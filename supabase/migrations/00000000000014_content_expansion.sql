-- Content coverage expansion (Phase 5, priority 2): the skill catalog seeded
-- in 00000000000003_skill_system.sql was explicitly "a small usable dataset,
-- not an exhaustive taxonomy" (28 skills across 3 disciplines). This adds
-- Judo, Sambo and Wrestling as first-class disciplines, and fills known gaps
-- in the existing Grappling/Striking/MMA catalogs: guard variants, positional
-- escapes, submission defenses, underhook/chain wrestling, and striking-to-
-- takedown combinations. Additive only — `on conflict do nothing` throughout,
-- no existing row is altered, no user data touched.

insert into disciplines (code, name) values
  ('judo', 'Judo'),
  ('sambo', 'Sambo'),
  ('wrestling', 'Wrestling')
on conflict (code) do nothing;

with disc as (
  select id, code from disciplines
  where code in ('grappling', 'striking_muay_thai', 'mma', 'judo', 'sambo', 'wrestling')
),
grappling_additions(name, slug, category) as (
  values
    -- guard variants
    ('Half Guard', 'half-guard', 'guard'),
    ('Butterfly Guard', 'butterfly-guard', 'guard'),
    ('De La Riva Guard', 'de-la-riva-guard', 'guard'),
    ('Spider Guard', 'spider-guard', 'guard'),
    ('X Guard', 'x-guard', 'guard'),
    ('Rubber Guard', 'rubber-guard', 'guard'),
    ('Deep Half Guard', 'deep-half-guard', 'guard'),
    ('Knee Shield Guard', 'knee-shield-guard', 'guard'),
    -- positional escapes
    ('Mount Escape (Upa)', 'mount-escape-upa', 'escape'),
    ('Mount Escape (Elbow-Knee)', 'mount-escape-elbow-knee', 'escape'),
    ('Side Control Escape', 'side-control-escape', 'escape'),
    ('Back Escape', 'back-escape', 'escape'),
    ('Turtle Recovery', 'turtle-recovery', 'escape'),
    -- submission defenses
    ('Armbar Defense', 'armbar-defense', 'defense'),
    ('Triangle Defense', 'triangle-defense', 'defense'),
    ('Kimura Defense', 'kimura-defense', 'defense'),
    ('Rear Naked Choke Defense', 'rear-naked-choke-defense', 'defense'),
    ('Guillotine Defense', 'guillotine-defense', 'defense'),
    -- submissions
    ('Triangle Choke', 'triangle-choke', 'submission'),
    ('Kimura', 'kimura', 'submission'),
    ('Guillotine Choke', 'guillotine-choke', 'submission'),
    ('Americana', 'americana', 'submission'),
    ('Omoplata', 'omoplata', 'submission'),
    ('Darce Choke', 'darce-choke', 'submission'),
    ('Anaconda Choke', 'anaconda-choke', 'submission'),
    ('Heel Hook', 'heel-hook', 'submission'),
    ('Kneebar', 'kneebar', 'submission'),
    ('Toe Hold', 'toe-hold', 'submission'),
    ('Ezekiel Choke', 'ezekiel-choke', 'submission'),
    ('Bow and Arrow Choke', 'bow-and-arrow-choke', 'submission')
),
striking_additions(name, slug, category) as (
  values
    ('Uppercut', 'uppercut', 'punch'),
    ('Overhand Right', 'overhand-right', 'punch'),
    ('Superman Punch', 'superman-punch', 'punch'),
    ('Spinning Back Kick', 'spinning-back-kick', 'kick'),
    ('Calf Kick', 'calf-kick', 'kick'),
    ('Body Kick', 'body-kick', 'kick'),
    ('Push Kick', 'push-kick', 'kick'),
    ('Knee Strike', 'knee-strike', 'knee'),
    ('Elbow Strike', 'elbow-strike', 'elbow'),
    ('Check Hook', 'check-hook', 'punch'),
    ('Head Movement (Roll)', 'head-movement-roll', 'defense'),
    ('Clinch Entry', 'clinch-entry', 'clinch'),
    ('Combination: Jab-Cross-Hook', 'combination-jab-cross-hook', 'combination'),
    ('Feint', 'feint', 'combination'),
    ('Counter Striking', 'counter-striking', 'combination')
),
mma_additions(name, slug, category) as (
  values
    ('Underhook Takedown (Cage)', 'underhook-takedown-cage', 'cage'),
    ('Dirty Boxing (Cage)', 'dirty-boxing-cage', 'cage'),
    ('Fence Escape', 'fence-escape', 'cage'),
    ('Guard Retention vs Ground and Pound', 'guard-retention-vs-ground-and-pound', 'defense'),
    ('Elbows From Top', 'elbows-from-top', 'ground-and-pound'),
    ('Posture Break', 'posture-break', 'ground-and-pound'),
    ('Combination to Takedown', 'combination-to-takedown', 'combination'),
    ('Level Change Off Combination', 'level-change-off-combination', 'combination')
),
judo_skills(name, slug, category) as (
  values
    ('Kumi Kata', 'kumi-kata', 'grip'),
    ('O Soto Gari', 'o-soto-gari', 'throw'),
    ('O Uchi Gari', 'o-uchi-gari', 'throw'),
    ('Ko Uchi Gari', 'ko-uchi-gari', 'throw'),
    ('Ko Soto Gari', 'ko-soto-gari', 'throw'),
    ('De Ashi Barai', 'de-ashi-barai', 'sweep'),
    ('Okuri Ashi Barai', 'okuri-ashi-barai', 'sweep'),
    ('Seoi Nage', 'seoi-nage', 'throw'),
    ('Ippon Seoi Nage', 'ippon-seoi-nage', 'throw'),
    ('Tai Otoshi', 'tai-otoshi', 'throw'),
    ('Uchi Mata', 'uchi-mata', 'throw'),
    ('Harai Goshi', 'harai-goshi', 'throw'),
    ('Tomoe Nage', 'tomoe-nage', 'throw'),
    ('Sumi Gaeshi', 'sumi-gaeshi', 'throw'),
    ('Kouchi Makikomi', 'kouchi-makikomi', 'throw'),
    ('Osaekomi Waza', 'osaekomi-waza', 'control'),
    ('Kesa Gatame', 'kesa-gatame', 'control'),
    ('Kami Shiho Gatame', 'kami-shiho-gatame', 'control'),
    ('Juji Gatame', 'juji-gatame', 'submission'),
    ('Okuri Eri Jime', 'okuri-eri-jime', 'submission')
),
sambo_skills(name, slug, category) as (
  values
    ('Sambo Grip Fighting', 'sambo-grip-fighting', 'grip'),
    ('Sambo Hip Throw', 'sambo-hip-throw', 'throw'),
    ('Sambo Leg Takedown', 'sambo-leg-takedown', 'takedown'),
    ('Rolling Kneebar', 'rolling-kneebar', 'leglock'),
    ('Straight Ankle Lock', 'straight-ankle-lock', 'leglock'),
    ('Achilles Lock', 'achilles-lock', 'leglock'),
    ('Sambo Cross Ankle Lock', 'sambo-cross-ankle-lock', 'leglock'),
    ('Sambo Standing Leg Lock Entry', 'sambo-standing-leg-lock-entry', 'leglock'),
    ('Sambo Guard Passing', 'sambo-guard-passing', 'pass'),
    ('Sambo Ground Control', 'sambo-ground-control', 'control'),
    ('Sambo Throw Defense', 'sambo-throw-defense', 'defense'),
    ('Sambo Leg Lock Defense', 'sambo-leg-lock-defense', 'defense')
),
wrestling_skills(name, slug, category) as (
  values
    ('Wrestling Stance', 'wrestling-stance', 'stance'),
    ('Tie-Up', 'tie-up', 'tie-up'),
    ('Collar Tie', 'collar-tie', 'tie-up'),
    ('Underhook', 'underhook', 'control'),
    ('Overhook', 'overhook', 'control'),
    ('Arm Drag', 'arm-drag', 'takedown'),
    ('Snap Down', 'snap-down', 'takedown'),
    ('Duck Under', 'duck-under', 'takedown'),
    ('Blast Double', 'blast-double', 'takedown'),
    ('Fireman''s Carry', 'firemans-carry', 'takedown'),
    ('Ankle Pick', 'ankle-pick', 'takedown'),
    ('High Crotch', 'high-crotch', 'takedown'),
    ('Low Single', 'low-single', 'takedown'),
    ('Head Outside Single', 'head-outside-single', 'takedown'),
    ('Whizzer', 'whizzer', 'defense'),
    ('Cradle', 'cradle', 'control'),
    ('Chain Wrestling', 'chain-wrestling', 'takedown'),
    ('Leg Ride', 'leg-ride', 'control'),
    ('Standing Switch', 'standing-switch', 'escape'),
    ('Cage Clinch Takedown', 'cage-clinch-takedown', 'cage')
)
insert into skills (discipline_id, name, slug, category)
select (select id from disc where code = 'grappling'), name, slug, category from grappling_additions
union all
select (select id from disc where code = 'striking_muay_thai'), name, slug, category from striking_additions
union all
select (select id from disc where code = 'mma'), name, slug, category from mma_additions
union all
select (select id from disc where code = 'judo'), name, slug, category from judo_skills
union all
select (select id from disc where code = 'sambo'), name, slug, category from sambo_skills
union all
select (select id from disc where code = 'wrestling'), name, slug, category from wrestling_skills
on conflict (discipline_id, slug) do nothing;
