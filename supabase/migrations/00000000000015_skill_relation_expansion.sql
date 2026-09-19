-- Skill graph completion (Phase 5, priority 2 follow-up): migration 14 added
-- 105 new skills (Judo, Sambo, Wrestling disciplines + Grappling/Striking/MMA
-- gap-fill) but no `skill_relations` rows for any of them — the graph only
-- covered migration 3's original 28-skill illustrative slice. This adds a
-- deliberately curated (not exhaustive) set of prerequisite/follow_up/
-- counter/variation/related/transition edges: guard-variant relationships,
-- submission/defense pairs, position→submission chains, wrestling tie-up
-- progressions, judo throw families, and cross-discipline links where the
-- techniques are genuinely the same or directly analogous move (e.g. Judo's
-- Juji Gatame = grappling's Armbar). Additive only — `on conflict do
-- nothing`, no existing relation altered.

with g as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'grappling'
),
grappling_relations(from_slug, to_slug, relation_type) as (
  values
    -- guard variants (relative to the two base guards from migration 3)
    ('half-guard', 'open-guard', 'variation'),
    ('butterfly-guard', 'open-guard', 'variation'),
    ('de-la-riva-guard', 'open-guard', 'variation'),
    ('spider-guard', 'open-guard', 'variation'),
    ('x-guard', 'butterfly-guard', 'variation'),
    ('rubber-guard', 'closed-guard', 'variation'),
    ('deep-half-guard', 'half-guard', 'variation'),
    ('knee-shield-guard', 'half-guard', 'variation'),
    -- positional escapes counter the position they escape from
    ('mount-escape-upa', 'mount', 'counter'),
    ('mount-escape-elbow-knee', 'mount', 'counter'),
    ('side-control-escape', 'side-control', 'counter'),
    ('back-escape', 'back-control', 'counter'),
    ('turtle-recovery', 'back-control', 'counter'),
    -- submission defenses counter their matching submission
    ('armbar-defense', 'armbar', 'counter'),
    ('triangle-defense', 'triangle-choke', 'counter'),
    ('kimura-defense', 'kimura', 'counter'),
    ('rear-naked-choke-defense', 'rear-naked-choke', 'counter'),
    ('guillotine-defense', 'guillotine-choke', 'counter'),
    -- submissions as follow-ups from the position that sets them up
    ('triangle-choke', 'closed-guard', 'follow_up'),
    ('omoplata', 'closed-guard', 'follow_up'),
    ('kimura', 'side-control', 'follow_up'),
    ('americana', 'side-control', 'follow_up'),
    ('guillotine-choke', 'sprawl', 'follow_up'),
    ('ezekiel-choke', 'mount', 'follow_up'),
    ('bow-and-arrow-choke', 'back-control', 'follow_up'),
    -- submission family variations
    ('americana', 'kimura', 'related'),
    ('omoplata', 'triangle-choke', 'related'),
    ('anaconda-choke', 'guillotine-choke', 'related'),
    ('darce-choke', 'anaconda-choke', 'variation'),
    ('kneebar', 'heel-hook', 'variation'),
    ('toe-hold', 'heel-hook', 'variation'),
    ('x-guard', 'heel-hook', 'follow_up')
),
s as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'striking_muay_thai'
),
striking_relations(from_slug, to_slug, relation_type) as (
  values
    ('uppercut', 'hook', 'related'),
    ('overhand-right', 'cross', 'variation'),
    ('spinning-back-kick', 'teep', 'related'),
    ('calf-kick', 'low-kick', 'variation'),
    ('body-kick', 'low-kick', 'related'),
    ('push-kick', 'teep', 'variation'),
    ('knee-strike', 'clinch-entry', 'follow_up'),
    ('elbow-strike', 'clinch-entry', 'follow_up'),
    ('check-hook', 'cross', 'counter'),
    ('head-movement-roll', 'slip', 'variation'),
    ('combination-jab-cross-hook', 'jab', 'follow_up'),
    ('feint', 'superman-punch', 'follow_up'),
    ('counter-striking', 'slip', 'follow_up')
),
m as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'mma'
),
mma_relations(from_slug, to_slug, relation_type) as (
  values
    ('underhook-takedown-cage', 'cage-control', 'follow_up'),
    ('dirty-boxing-cage', 'cage-control', 'follow_up'),
    ('fence-escape', 'wall-walk', 'variation'),
    ('guard-retention-vs-ground-and-pound', 'ground-and-pound', 'counter'),
    ('elbows-from-top', 'ground-and-pound', 'variation'),
    ('posture-break', 'elbows-from-top', 'prerequisite'),
    ('combination-to-takedown', 'cage-takedown', 'variation'),
    ('level-change-off-combination', 'combination-to-takedown', 'prerequisite')
),
j as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'judo'
),
judo_relations(from_slug, to_slug, relation_type) as (
  values
    ('kumi-kata', 'o-soto-gari', 'prerequisite'),
    ('kumi-kata', 'seoi-nage', 'prerequisite'),
    ('kumi-kata', 'uchi-mata', 'prerequisite'),
    ('o-uchi-gari', 'o-soto-gari', 'related'),
    ('ko-uchi-gari', 'o-uchi-gari', 'variation'),
    ('ko-soto-gari', 'o-soto-gari', 'variation'),
    ('de-ashi-barai', 'okuri-ashi-barai', 'related'),
    ('seoi-nage', 'ippon-seoi-nage', 'variation'),
    ('tai-otoshi', 'seoi-nage', 'related'),
    ('uchi-mata', 'harai-goshi', 'related'),
    ('tomoe-nage', 'sumi-gaeshi', 'variation'),
    ('kouchi-makikomi', 'ko-uchi-gari', 'follow_up'),
    ('osaekomi-waza', 'seoi-nage', 'follow_up'),
    ('kesa-gatame', 'osaekomi-waza', 'variation'),
    ('kami-shiho-gatame', 'osaekomi-waza', 'variation'),
    ('juji-gatame', 'kesa-gatame', 'follow_up')
),
sb as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'sambo'
),
sambo_relations(from_slug, to_slug, relation_type) as (
  values
    ('sambo-grip-fighting', 'sambo-hip-throw', 'prerequisite'),
    ('sambo-grip-fighting', 'sambo-leg-takedown', 'prerequisite'),
    ('sambo-standing-leg-lock-entry', 'rolling-kneebar', 'prerequisite'),
    ('sambo-standing-leg-lock-entry', 'straight-ankle-lock', 'prerequisite'),
    ('achilles-lock', 'straight-ankle-lock', 'variation'),
    ('sambo-cross-ankle-lock', 'straight-ankle-lock', 'variation'),
    ('sambo-guard-passing', 'sambo-ground-control', 'follow_up'),
    ('sambo-throw-defense', 'sambo-hip-throw', 'counter'),
    ('sambo-leg-lock-defense', 'rolling-kneebar', 'counter'),
    ('sambo-leg-lock-defense', 'straight-ankle-lock', 'counter')
),
w as (
  select sk.id, sk.slug from skills sk
  join disciplines d on d.id = sk.discipline_id
  where d.code = 'wrestling'
),
wrestling_relations(from_slug, to_slug, relation_type) as (
  values
    ('wrestling-stance', 'tie-up', 'prerequisite'),
    ('tie-up', 'underhook', 'prerequisite'),
    ('tie-up', 'overhook', 'prerequisite'),
    ('tie-up', 'collar-tie', 'prerequisite'),
    ('collar-tie', 'snap-down', 'prerequisite'),
    ('whizzer', 'underhook', 'counter'),
    ('overhook', 'arm-drag', 'prerequisite'),
    ('duck-under', 'underhook', 'counter'),
    ('snap-down', 'ankle-pick', 'follow_up'),
    ('high-crotch', 'low-single', 'variation'),
    ('head-outside-single', 'low-single', 'variation'),
    ('cradle', 'leg-ride', 'follow_up'),
    ('blast-double', 'leg-ride', 'follow_up'),
    ('standing-switch', 'underhook', 'counter'),
    ('chain-wrestling', 'arm-drag', 'follow_up')
),
-- cross-discipline links: same or directly analogous move in a different discipline's vocabulary
cross_relations(from_code, from_slug, to_code, to_slug, relation_type) as (
  values
    ('judo', 'juji-gatame', 'grappling', 'armbar', 'variation'),
    ('judo', 'okuri-eri-jime', 'grappling', 'rear-naked-choke', 'related'),
    ('grappling', 'level-change', 'wrestling', 'blast-double', 'prerequisite'),
    ('wrestling', 'firemans-carry', 'judo', 'seoi-nage', 'related'),
    ('sambo', 'sambo-hip-throw', 'judo', 'seoi-nage', 'related'),
    ('sambo', 'sambo-leg-takedown', 'wrestling', 'blast-double', 'related'),
    ('wrestling', 'cage-clinch-takedown', 'mma', 'cage-takedown', 'related'),
    ('sambo', 'rolling-kneebar', 'grappling', 'kneebar', 'variation')
)
insert into skill_relations (from_skill_id, to_skill_id, relation_type)
select (select id from g where slug = r.from_slug), (select id from g where slug = r.to_slug), r.relation_type::skill_relation_type
from grappling_relations r
union all
select (select id from s where slug = r.from_slug), (select id from s where slug = r.to_slug), r.relation_type::skill_relation_type
from striking_relations r
union all
select (select id from m where slug = r.from_slug), (select id from m where slug = r.to_slug), r.relation_type::skill_relation_type
from mma_relations r
union all
select (select id from j where slug = r.from_slug), (select id from j where slug = r.to_slug), r.relation_type::skill_relation_type
from judo_relations r
union all
select (select id from sb where slug = r.from_slug), (select id from sb where slug = r.to_slug), r.relation_type::skill_relation_type
from sambo_relations r
union all
select (select id from w where slug = r.from_slug), (select id from w where slug = r.to_slug), r.relation_type::skill_relation_type
from wrestling_relations r
union all
select
  (select sk.id from skills sk join disciplines d on d.id = sk.discipline_id where d.code = r.from_code and sk.slug = r.from_slug),
  (select sk.id from skills sk join disciplines d on d.id = sk.discipline_id where d.code = r.to_code and sk.slug = r.to_slug),
  r.relation_type::skill_relation_type
from cross_relations r
on conflict (from_skill_id, to_skill_id, relation_type) do nothing;
