# MMA Mastery App — Modèle de données

Convention: tous les PK sont `uuid default gen_random_uuid()`. Tous les `created_at` sont `timestamptz default now()`. `updated_at` présent uniquement sur tables mutables, maintenu par trigger `set_updated_at`. RLS = Row Level Security Postgres. "Owner" = filtre RLS appliqué.

Ce document décrit uniquement les tables **réellement créées** (voir `supabase/migrations/`). Les sections `Goal` et `Resource` ci-dessous reflètent leur forme réelle (docs/decisions/0008), différente de ce qui avait été esquissé initialement. Tout ce qui n'a pas de migration correspondante est listé dans "Différé" en bas de page — ne pas s'y fier comme si c'était construit.

## Identité

### User
Géré par `auth.users` (Supabase). Pas de table applicative dédiée.

### Profile
1:1 avec User.
- `user_id` PK/FK → `auth.users.id`
- `display_name` text
- `created_at`, `updated_at`
- RLS: owner (`user_id = auth.uid()`)

## Catalogue partagé (lecture publique, écriture service role)

### Discipline
- `id` PK
- `code` text UNIQUE (ex: `grappling`, `striking`, `mma`)
- `name` text
- Extensible: ajout de ligne, pas de migration.

### Skill
- `id` PK
- `discipline_id` FK → Discipline, NOT NULL, index
- `name` text NOT NULL
- `slug` text NOT NULL, UNIQUE(`discipline_id`, `slug`)
- `description` text nullable
- `category` text nullable (namespace libre par discipline, ex: `takedown`, `guard`, `punch`)
- `created_at`, `updated_at`
- Index: (`discipline_id`)

Pas de `parent_id`: la hiérarchie ("Double Leg dépend de Level Change") est un cas particulier de `SkillRelation` (`relation_type = prerequisite`), pas une colonne séparée. Voir `docs/decisions/0004`.

### SkillRelation
Many-to-many auto-référencée sur Skill, typée — le Skill System est un graphe, pas un arbre.
- `id` PK
- `from_skill_id` FK → Skill, NOT NULL, index
- `to_skill_id` FK → Skill, NOT NULL, index
- `relation_type` enum: `prerequisite | counter | variation | follow_up | transition | related`
- `metadata` jsonb nullable — attributs additionnels non structurés (ex: contexte d'usage)
- CHECK(`from_skill_id` <> `to_skill_id`)
- UNIQUE(`from_skill_id`, `to_skill_id`, `relation_type`)
- Extensible: nouvelles valeurs d'enum sans migration structurelle.

## Base de connaissance (owner-only — docs/decisions/0008)

Contrairement à `Skill`/`Discipline`, ces tables ne sont **pas** un catalogue
partagé: chaque utilisateur possède ses propres lignes (RLS `user_id =
auth.uid()`), sans étape de modération/service-role.

### Resource
Lien externe curaté par l'utilisateur (vidéo, article, chaîne, cours). Jamais
de vidéo réhébergée — uniquement URL + timestamp optionnel vers la source.
- `id` PK
- `user_id` FK → auth.users, NOT NULL, index
- `type` enum: `video | article | channel | course`
- `title` text NOT NULL
- `author` text nullable
- `url` text NOT NULL
- `skill_id` FK → Skill, nullable, index
- `timestamp_seconds` int nullable (>= 0)
- `notes` text nullable
- `created_at`, `updated_at`

### UserBookmark
Cible polymorphe (comme `XPEvent.source_id` plus bas), pas de FK stricte sur `target_id`.
- `id` PK
- `user_id` FK, NOT NULL, index
- `target_type` enum: `skill | resource`
- `target_id` uuid NOT NULL
- `created_at`
- UNIQUE(`user_id`, `target_type`, `target_id`)

### StudyQueueItem
- `id` PK
- `user_id` FK, NOT NULL, index
- `skill_id` FK → Skill, NOT NULL
- `status` enum: `queued | studying | studied`
- `notes` text nullable
- `studied_at` timestamptz nullable — posé quand `status` passe à `studied`
- `created_at`, `updated_at`
- UNIQUE(`user_id`, `skill_id`)

### SkillNote
Notes personnelles libres sur une compétence, hors séance (distinct de `SessionObservation`).
- `id` PK
- `user_id` FK, NOT NULL, index
- `skill_id` FK → Skill, NOT NULL, index
- `content` text NOT NULL
- `created_at`, `updated_at`

## Entraînement (owner-only, RLS user_id = auth.uid())

### TrainingSession
- `id` PK
- `user_id` FK → auth.users, NOT NULL, index
- `date` date NOT NULL
- `discipline_id` FK → Discipline, NOT NULL
- `session_type` text (libre ou enum léger: `class | drilling | sparring | competition`)
- `rpe` smallint nullable (perception de l'effort, 1-10)
- `notes` text nullable
- `created_at`, `updated_at`
- Index: (`user_id`, `date` desc)

### SessionTechnique
Many-to-many Session ↔ Skill, avec attributs. Une ligne dont la séance parente
a `session_type = 'sparring'` **est** un round de sparring — pas de table
`SparringRound` séparée (docs/decisions/0008).
- `id` PK
- `session_id` FK → TrainingSession, NOT NULL, index
- `technique_name` text NOT NULL — texte libre saisi par l'utilisateur (Phase 2, conservé)
- `skill_id` FK → Skill, nullable, index — lien vers le catalogue quand une correspondance existe (Phase 3, `docs/decisions/0003` et `0004`)
- `category` text nullable
- `notes` text nullable
- `outcome` enum `success | failure`, nullable — sparring uniquement; non renseigné ailleurs
- `partner_name` text nullable — sparring uniquement
- `pressure_level` smallint (1-5) nullable — sparring uniquement
- `problem` text nullable — sparring uniquement
- `created_at`
- Cardinalité: 1 Session → N SessionTechnique, 1 Skill → N SessionTechnique (many-to-many via cette table)
- Alimente `SkillProgress` par trigger DB (`sync_skill_progress_for_skill`, docs/decisions/0006/0008), pas en use case — uniquement pour les lignes avec `skill_id` renseigné

### SessionObservation
Remplace l'entité `Difficulty` initialement prévue. Généralisée pour rester extensible (plusieurs observations par session, plusieurs types) sans être une table à finalité unique.
- `id` PK
- `session_id` FK → TrainingSession, NOT NULL, index
- `type` enum: `difficulty | question | insight | success`
- `content` text NOT NULL
- `related_skill_id` FK → Skill, nullable
- `created_at`
- Invariant produit: chaque `TrainingSession` doit avoir ≥1 `SessionObservation` de type `difficulty` ou `question`, vérifié dans le use case `createTrainingSession`/`updateTrainingSession` (transaction), pas en contrainte DB (impossible à exprimer proprement en check constraint cross-table).
- Cardinalité: 1 Session → N SessionObservation (dès le départ, pas de migration nécessaire pour "plusieurs observations futures").

## Progression des compétences

### SkillProgress
Remplace l'enum rigide à 6 stages. Modèle multidimensionnel, source de vérité = dimensions brutes; `mastery_stage` est une donnée **dérivée**, jamais la seule persistée.
- `id` PK
- `user_id` FK → auth.users, NOT NULL, index
- `skill_id` FK → Skill, NOT NULL, index
- UNIQUE(`user_id`, `skill_id`)
- `knowledge_level` smallint (0-5) — compréhension théorique, saisie manuelle
- `drilling_reps` int default 0 — compteur cumulé depuis `SessionTechnique` où la séance est `class`/`drilling`
- `live_application_count` int default 0 — depuis `SessionTechnique` où la séance est `competition`
- `sparring_attempt_count` int default 0 — depuis `SessionTechnique` où la séance est `sparring` ET `outcome` renseigné
- `sparring_success_count` int default 0 — sous-ensemble ci-dessus avec `outcome = 'success'`
- `consistency_score` float nullable — calculé (ex: fréquence de pratique sur fenêtre glissante), recalculé par use case
- `pressure_performance_level` smallint (0-5) nullable
- `confidence_level` smallint (0-5) nullable — auto-évalué par l'utilisateur
- `evidence_count` int default 0 — nombre de `SessionTechnique` liées, dénormalisé pour perf dashboard
- `last_practiced_at` timestamptz nullable — dénormalisé, recalculé depuis `SessionTechnique`
- `mastery_stage_cache` text nullable — **cache** de la valeur dérivée, recalculé à chaque écriture par une fonction pure `computeMasteryStage(progress)` dans `lib/domain`
- `mastery_stage_computed_at` timestamptz nullable
- `created_at`, `updated_at`
- Index: (`user_id`, `skill_id`) via l'UNIQUE, + (`user_id`) pour requêtes dashboard

Extensibilité: nouvelle dimension = `ALTER TABLE ADD COLUMN` nullable, aucune migration des relations existantes, aucun impact sur `SessionTechnique`/`Skill`. La fonction `computeMasteryStage` est le seul endroit à modifier pour faire évoluer les critères de maîtrise.

## Objectifs (owner-only — docs/decisions/0008)

### Goal
- `id` PK
- `user_id` FK, NOT NULL, index
- `horizon` enum: `short | medium | long`
- `title` text NOT NULL
- `description` text nullable
- `skill_id` FK → Skill, nullable — pas de `discipline_id` séparé, le lien vers un skill porte déjà la discipline
- `status` enum: `active | done | abandoned`
- `due_date` date nullable
- `created_at`, `updated_at`
- Index: (`user_id`, `status`)
- `getUpcomingGoals()` (échéance ≤14 jours ou dépassée, statut `active`) alimente le Dashboard et l'AI Coach

## Récapitulatif RLS

| Table | RLS |
|---|---|
| Profile, TrainingSession, SessionTechnique*, SessionObservation*, SkillProgress, Goal, Resource, UserBookmark, StudyQueueItem, SkillNote | owner via `user_id = auth.uid()` (*via parent FK) |
| Discipline, Skill, SkillRelation | lecture publique, écriture service role |

## Différé — non créé à ce stade

- `Achievement`, `UserAchievement`, `XPEvent`, `Metric`: gamification/métriques physiques envisagées initialement, aucune table créée — pas de moteur de gamification dans l'app réelle.
- `Conversation`, `Message`, `SearchDocument`, `Embedding`: RAG/historique de conversation IA envisagés initialement, jamais construits (docs/architecture.md — pas de pgvector, pas de provider cloud). Le Coach actuel (docs/decisions/0005) est sans état, pas de table de conversation.
- `Sequence`, `SequenceTag`, `SequenceSkill`, `Match`/`Event`, `Athlete`: modèle "séquence issue d'un combat" documenté dans `docs/decisions/0007` (P1), pas construit — deuxième système à part entière, hors scope du lot 0008.
- `Club`, `ClubMember`, groupes, messagerie de club, `Class`, `ClassSession`, `Attendance`, QR check-in, `CoachFeedback`/`AthleteGoal` côté club, compétition (gameplan/post-fight review), `Video`, `VideoAnnotation`, paiements: architecture cible documentée dans `docs/decisions/0007`, aucune table créée.
