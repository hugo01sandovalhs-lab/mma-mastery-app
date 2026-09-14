# 0003 — Portée Phase 2 : techniques en texte libre, invariant via RPC transactionnel

## Statut
Accepté.

## Contexte
`data-model.md` prévoit `SessionTechnique.skill_id` (FK → `Skill`) et `SessionObservation.related_skill_id`, tous deux dépendants du catalogue `Skill` (Phase 3, Skill Graph). Construire ce catalogue maintenant serait prématuré (hors périmètre Phase 2) et bloquerait l'utilisateur: il ne pourrait logger une technique qu'après création préalable d'une entrée `Skill` par un rôle service.

`TrainingSession` gagne aussi deux champs non listés dans `data-model.md`: `title` (résumé court affiché dans l'historique) et `duration_minutes` (nullable). Ajout additif, cohérent avec la stratégie d'évolution du schéma (`architecture.md`).

## Décision
- `session_techniques`: `technique_name` (text, NOT NULL) remplace `skill_id` pour cette phase. `skill_id uuid nullable` sera ajouté par `ALTER TABLE` additif quand le catalogue `Skill` existera (Phase 3), sans migration destructive.
- `session_observations`: pas de colonne `related_skill_id` pour l'instant (même raison), ajoutée plus tard de la même façon.
- Invariant "≥1 observation `difficulty` ou `question` par séance" appliqué via une fonction Postgres `security invoker` (`create_training_session`, `update_training_session`) qui insère session + techniques + observations dans une seule transaction et lève une exception si l'invariant n'est pas respecté. Complété côté client par une validation pure (`lib/domain/training.ts`), testable sans Supabase, pour un retour immédiat dans le formulaire.
- `disciplines` créé comme catalogue minimal (id, code, name), lecture publique / écriture service role, seedé avec `grappling`, `striking_muay_thai`, `mma` dans la migration (ajout de ligne, pas de restructuration future nécessaire).

## Conséquences
- Un utilisateur peut logger "armbar depuis closed guard" sans dépendance au Skill Graph.
- Migration future (Phase 3) additive uniquement: `ALTER TABLE session_techniques ADD COLUMN skill_id uuid REFERENCES skills(id)`, backfill optionnel, aucune perte de données.
- L'intégrité de l'invariant métier ne dépend pas uniquement de l'UI: la fonction RPC la garantit même en cas d'appel direct à l'API.
