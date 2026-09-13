# 0002 — SessionObservation générique remplace Difficulty

## Statut
Accepté.

## Contexte
`Difficulty` proposée en Phase 0 comme table à finalité unique (une difficulté = une ligne). Ne capturait pas naturellement "question" ou "incertitude" sans dupliquer la structure, et n'était pas conçue pour plusieurs entrées par session.

## Décision
Table `SessionObservation(session_id, type, content, related_skill_id?)` avec `type` enum (`difficulty | question | insight | success`), en relation 1-N native avec `TrainingSession` dès la création. Aucune restructuration nécessaire pour accueillir plusieurs observations ou de nouveaux types plus tard (ajout de valeur d'enum).

Invariant produit — chaque session doit produire ≥1 observation de type `difficulty` ou `question` — appliqué dans le use case `createTrainingSession` (transaction applicative), pas en contrainte SQL cross-table.

## Conséquences
- Pas de table séparée par type d'observation.
- Extensible à "point fort", "insight tactique", etc. sans migration structurelle.
