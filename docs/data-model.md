# MMA Mastery App — Modèle de données (Phases 1-7)

Convention: tous les PK sont `uuid default gen_random_uuid()`. Tous les `created_at` sont `timestamptz default now()`. `updated_at` présent uniquement sur tables mutables, maintenu par trigger `set_updated_at`. RLS = Row Level Security Postgres. "Owner" = filtre RLS appliqué.

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

### Achievement
- `id` PK
- `code` text UNIQUE
- `title`, `description` text
- `criteria` jsonb — condition de déblocage, interprétée par le moteur gamification (pas de logique SQL)

### Resource
Base de connaissance externe (vidéos, articles, chaînes).
- `id` PK
- `type` enum: `video | article | channel | course`
- `title` text NOT NULL
- `author` text nullable — nom auteur/chaîne
- `url` text NOT NULL
- `published_at` date nullable
- `discipline_id` FK → Discipline nullable
- `created_at`
- Index: (`discipline_id`), (`type`)

## Provenance / RAG

### SearchDocument
Chunk de contenu indexable, lié ou non à une Resource.
- `id` PK
- `resource_id` FK → Resource, nullable (contenu interne possible sans source externe)
- `content` text NOT NULL
- `chunk_index` int default 0
- `source_locator` jsonb nullable — ex `{ "timestamp_seconds": 142 }` pour vidéo, `{ "page": 3 }` pour article
- `metadata` jsonb — champs additionnels de citation non structurés
- `created_at`
- Index: (`resource_id`)
- Cardinalité: 1 Resource → N SearchDocument

### Embedding
- `id` PK
- `document_id` FK → SearchDocument, NOT NULL, index
- `model_version` text NOT NULL
- `vector` vector(N) — pgvector, N selon modèle
- `created_at`
- UNIQUE(`document_id`, `model_version`) — permet ré-embedding sans perdre historique
- Index: HNSW ou ivfflat sur `vector` (créé en migration dédiée selon volume)

Citation complète reconstruite par jointure `Embedding → SearchDocument → Resource`: type, titre, auteur, URL, date, `source_locator` (timestamp/page). Aucun champ de citation n'est dupliqué ailleurs — source unique de vérité.

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
Many-to-many Session ↔ Skill, avec attributs.
- `id` PK
- `session_id` FK → TrainingSession, NOT NULL, index
- `technique_name` text NOT NULL — texte libre saisi par l'utilisateur (Phase 2, conservé)
- `skill_id` FK → Skill, nullable, index — lien vers le catalogue quand une correspondance existe (Phase 3, `docs/decisions/0003` et `0004`)
- `category` text nullable
- `notes` text nullable
- `created_at`
- Cardinalité: 1 Session → N SessionTechnique, 1 Skill → N SessionTechnique (many-to-many via cette table)
- Alimente `SkillProgress.evidence_count` et `last_practiced_at` (recalcul en use case, pas trigger SQL) — uniquement pour les lignes avec `skill_id` renseigné

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
- `drilling_reps` int default 0 — compteur cumulé
- `live_application_count` int default 0
- `sparring_attempt_count` int default 0
- `sparring_success_count` int default 0
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

## Objectifs et gamification (owner-only sauf catalogue)

### Goal
- `id` PK
- `user_id` FK, NOT NULL, index
- `horizon` enum: `short | medium | long`
- `title` text NOT NULL
- `description` text nullable
- `discipline_id` FK nullable
- `skill_id` FK nullable
- `target_metric` text nullable (référence libre à un type de Metric)
- `status` enum: `active | done | abandoned`
- `due_date` date nullable
- `created_at`, `updated_at`

### UserAchievement
Many-to-many User ↔ Achievement.
- `id` PK
- `user_id` FK, NOT NULL, index
- `achievement_id` FK → Achievement, NOT NULL, index
- `unlocked_at` timestamptz NOT NULL
- UNIQUE(`user_id`, `achievement_id`)

### XPEvent
Journal append-only, jamais de update.
- `id` PK
- `user_id` FK, NOT NULL, index
- `amount` int NOT NULL
- `source_type` enum: `session | goal | achievement | streak`
- `source_id` uuid nullable — référence polymorphe (pas de FK stricte, documentée)
- `created_at`
- Index: (`user_id`, `created_at` desc) — agrégation niveau/XP total

### Metric
Extensible pour cardio/physique futur, type ouvert dès le départ.
- `id` PK
- `user_id` FK, NOT NULL, index
- `type` text (namespace libre, ex: `cardio.hr_avg`, `bodyweight`)
- `value` numeric NOT NULL
- `unit` text nullable
- `recorded_at` timestamptz NOT NULL
- `created_at`
- Index: (`user_id`, `type`, `recorded_at`)

## Coaching IA (owner-only)

### Conversation
- `id` PK
- `user_id` FK, NOT NULL, index
- `title` text nullable
- `created_at`, `updated_at`

### Message
- `id` PK
- `conversation_id` FK → Conversation, NOT NULL, index
- `role` enum: `user | assistant | system`
- `content` text NOT NULL
- `citations` jsonb nullable — `[{ resource_id, title, author, url, published_at?, source_locator? }]`, obligatoire non-vide si contexte RAG utilisé (invariant en use case, voir architecture.md)
- `created_at`
- Index: (`conversation_id`, `created_at`)

## Récapitulatif RLS

| Table | RLS |
|---|---|
| Profile, TrainingSession, SessionTechnique*, SessionObservation*, SkillProgress, Goal, UserAchievement, XPEvent, Metric, Conversation, Message* | owner via `user_id = auth.uid()` (*via parent FK) |
| Discipline, Skill, SkillRelation, Achievement, Resource, SearchDocument, Embedding | lecture publique, écriture service role |

## Différé — non créé à ce stade

`Club`, `ClubMember`, table de messagerie de club, `Video`, `VideoAnnotation`: conceptuellement prévus (Phases 8-9), aucune table créée avant la phase correspondante.
