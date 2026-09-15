# 0008 — V3 lot 1: sparring honnête, objectifs, base de connaissance minimale

## Statut
Accepté.

## Contexte
`docs/decisions/0007` documentait le scope V3 complet sans le construire. Cette
session livre la première tranche verticale complète (schéma + RLS + use
cases + UI fonctionnelle minimale), en réutilisant l'architecture existante
plutôt qu'en dupliquant un système parallèle, conformément à la règle posée
dans 0007.

## Décisions

### Sparring: pas de nouvelle table `sparring_rounds`
Un round de sparring où une technique est tentée est déjà représenté par une
ligne `session_techniques` dont la séance parente a `session_type = 'sparring'`.
Plutôt que dupliquer ce concept dans une table séparée, `session_techniques`
gagne quatre colonnes additives, actives seulement en contexte sparring:
`outcome` (`success|failure`, nullable), `partner_name`, `pressure_level`
(1-5), `problem`. L'UI (`TrainingForm`) n'affiche ces champs que lorsque le
type de séance sélectionné est `sparring`.

`sync_skill_progress_for_skill()` (docs/decisions/0006) est étendue pour
dériver honnêtement les trois dimensions jusqu'ici jamais écrites:
- `class`/`drilling` → `drilling_reps`
- `competition` → `live_application_count`
- `sparring` avec `outcome` renseigné → `sparring_attempt_count` /
  `sparring_success_count` (un round sans résultat noté ne compte ni comme
  tentative ni comme échec — cohérent avec la préoccupation de 0006 de ne
  jamais fabriquer un ratio de réussite à partir de données non mesurées).

Conséquence: les stades `applying`/`consistent`/`mastered` de
`computeMasteryStage` (docs/decisions/0001) deviennent enfin atteignables via
un usage réel de l'app, sans changer la fonction elle-même.

### Base de connaissance: ressources/favoris/file d'étude/notes, owner-only
`docs/decisions/0007` envisageait `Resource` comme un catalogue partagé
(lecture publique, écriture service role), sur le modèle de `Skill`. Cette
session choisit un modèle plus simple et immédiatement utilisable: `resources`
appartient à l'utilisateur (RLS owner), sans étape d'administration/modération
nécessaire avant qu'un utilisateur puisse ajouter un lien. Jamais de vidéo
réhébergée — uniquement URL + timestamp optionnel vers la source.

`user_bookmarks` (cible polymorphe `skill|resource`, comme `XPEvent.source_id`
documenté dans `data-model.md`), `study_queue_items` (statut
`queued|studying|studied` par compétence) et `skill_notes` (notes libres hors
séance) complètent la boucle LEARN → REVIEW.

Le modèle `sequences`/`matches`/`athletes` décrit dans 0007 (P1) reste non
construit: c'est un second système à part entière (métadonnées de combat,
liens vidéo horodatés multi-techniques) qui mérite sa propre tranche dédiée
plutôt qu'une implémentation partielle dans ce lot.

### Learning loop: type de review additionnel `never_applied`
`buildReviewQueue` (docs/decisions non numérotée, `lib/domain/review.ts`)
gagne un type `never_applied`: une compétence avec un volume de drilling
significatif (seuil partagé avec Training Intelligence,
`MIN_DRILLING_REPS_FOR_TRANSFER_SIGNAL`) mais toujours aucune application live
ni tentative de sparring. Répond directement au besoin produit "techniques
jamais appliquées".

### Objectifs (Goal)
Table `goals` owner-only: horizon (`short|medium|long`), titre, description,
`skill_id` optionnel, statut, échéance. Pas de `discipline_id`: le lien vers
une compétence porte déjà la discipline, un second champ de portée aurait été
une flexibilité non utilisée par l'UI. `getUpcomingGoals()` (échéance ≤14
jours ou dépassée) alimente le Dashboard et l'AI Coach — jamais une nouvelle
requête ad hoc.

### Recherche globale
`lib/usecases/search-actions.ts`: `ILIKE` structuré sur `skills` (catalogue),
et sur les données propres de l'utilisateur (`resources`, `training_sessions`,
`session_observations`, `goals`). Toujours pas de pgvector/RAG — cohérent avec
`architecture.md`. Le filtre sur `session_observations` s'appuie uniquement
sur la RLS existante (`session_observations_select_own`), pas sur un filtre
applicatif redondant.

### AI Coach
`buildCoachContext()` ajoute des faits `OBSERVED` pour les objectifs proches
de leur échéance et le nombre de compétences en file d'étude non terminées.
Aucun nouveau type de fait, aucune inférence ajoutée — mêmes garanties que
`docs/decisions/0005`.

## Différé (toujours non construit après ce lot)
Club/ClubMember/groupes, Classes/Attendance/QR check-in, Coach Dashboard,
Compétition (gameplan/post-fight review), Sequence/Match/Athlete model,
paiements. Voir `docs/decisions/0007` pour l'architecture cible de chacun —
inchangée par ce lot.
