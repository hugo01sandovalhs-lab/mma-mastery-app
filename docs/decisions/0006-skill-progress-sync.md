# 0006 — skill_progress synchronisé par trigger, pas par UI de saisie manuelle

## Statut
Accepté.

## Contexte
Audit final (2026-09): `skill_progress` n'était jamais écrit en usage réel. `updateSkillProgress` (lib/usecases/skill-actions.ts) n'avait aucun appelant, aucune UI ne le déclenchait. Conséquence: `getSkillsProgressSummary` retournait toujours `totalTracked: 0`, la Mastery Map affichait "unknown" pour toute compétence quel que soit l'entraînement réel, et les triggers V2 de Training Intelligence basés sur `drilling_reps`/`live_application_count` ne se déclenchaient jamais.

## Décision
Un trigger Postgres (`session_techniques_sync_skill_progress`, migration `00000000000004`) recalcule `skill_progress.drilling_reps`, `evidence_count` et `last_practiced_at` à chaque insert/update/delete sur `session_techniques`, à partir du comptage réel des techniques loggées par compétence (`skill_id`) pour l'utilisateur. Recalcul complet (pas incrément) pour rester idempotent face aux éditions répétées d'une même séance.

Volontairement **non couvert** par ce trigger: `sparring_attempt_count`, `sparring_success_count`, `knowledge_level`, `confidence_level`, `pressure_performance_level`. Ces dimensions nécessitent une évaluation subjective (réussite/échec en sparring, auto-évaluation) qu'on ne peut pas dériver sans risquer de fabriquer un signal faux — dériver `sparring_attempt_count` sans jamais incrémenter `sparring_success_count` ferait lire à tort "0% de réussite" à Training Intelligence, alors que la réalité est "non mesuré". Elles restent à 0/null tant qu'aucune UI de saisie ne les alimente honnêtement (hors périmètre de cet audit).

## Conséquences
- Mastery Map et le résumé de progression du dashboard reflètent maintenant le volume réel de technique loggées par compétence.
- Aucune UI nouvelle, aucune dépendance ajoutée: le trigger réutilise uniquement une donnée déjà capturée (`session_techniques.skill_id`).
- `mastery_stage_cache` reste non lu par l'UI (`computeMasteryStage()` est toujours recalculé côté domaine, docs/decisions/0001) — le trigger ne le touche pas.
- Le stage `mastered`/`consistent`/`applying` restera hors d'atteinte tant qu'aucun flux de saisie sparring n'existe — comportement honnête, pas un bug.
