# 0004 — Skill System: graphe typé, catalogue global, compatibilité technique libre

## Statut
Accepté.

## Contexte
Phase 3 introduit le catalogue `Skill`. Trois questions structurantes: (1) faut-il une hiérarchie `parent_id` en plus de `SkillRelation` ? (2) qui peut écrire dans le catalogue partagé ? (3) comment lier `session_techniques`/`session_observations` (texte libre, Phase 2) à `Skill` sans casser les données existantes ?

## Décision
1. **Graphe, pas arbre.** `Skill` n'a pas de `parent_id`. Toute relation (hiérarchie incluse) passe par `skill_relations`, typée par `relation_type` (`prerequisite | counter | variation | follow_up | transition | related`). Une compétence peut avoir plusieurs prérequis, plusieurs contres, etc. — un arbre à parent unique ne peut pas représenter ça.
2. **Catalogue global, écriture service-role uniquement.** `skills` et `skill_relations` sont en lecture seule pour les utilisateurs authentifiés (RLS `select` uniquement). Aucune policy `insert`/`update`/`delete` pour le rôle `authenticated` — les mutations passent par `lib/infra/db/supabase-service.ts` (clé service role), jamais par le client utilisateur. Évite une prolifération de catalogues personnels divergents.
3. **Compatibilité technique libre → skill.** `session_techniques.skill_id` et `session_observations.related_skill_id` sont des `ALTER TABLE ... ADD COLUMN` nullables (conforme au plan annoncé dans `docs/decisions/0003`). `technique_name` reste NOT NULL et continue de fonctionner seul. L'UI résout `skill_id` par correspondance de nom (datalist) quand une compétence du catalogue correspond, sans bloquer la saisie libre.
4. `mastery_stage` reste dérivé (`docs/decisions/0001`): `skill_progress` stocke les dimensions brutes, `computeMasteryStage()` (pure, `lib/domain/skill.ts`) calcule le stage à partir des seules dimensions réellement mesurées (compteurs, pas d'estimation de sparring/confiance non saisie).

## Conséquences
- Ajouter un nouveau type de relation = valeur d'enum Postgres additionnelle, pas de restructuration.
- Aucune perte de données Phase 2: les séances existantes gardent `technique_name` sans `skill_id`.
- Administrer le catalogue (créer/modifier une `Skill` ou une relation) nécessite un accès service-role — pas de UI d'édition du catalogue en Phase 3 (hors périmètre), seulement les use cases `createSkill`/`updateSkill`/`createSkillRelation`.
