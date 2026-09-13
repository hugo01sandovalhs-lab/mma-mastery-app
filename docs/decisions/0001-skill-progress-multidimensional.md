# 0001 — SkillProgress multidimensionnel, pas un enum de stage

## Statut
Accepté.

## Contexte
Proposition initiale Phase 0: `UserSkillProgress.stage` en enum unique (`known|drilled|live|sparring_success|consistent|pressure`). Rejetée: perd l'information fine (un utilisateur peut avoir bon niveau théorique et mauvaise performance sous pression simultanément — l'enum ne peut représenter qu'un seul état à la fois).

## Décision
`SkillProgress` stocke des dimensions indépendantes (`knowledge_level`, `drilling_reps`, `live_application_count`, `sparring_attempt_count`, `sparring_success_count`, `consistency_score`, `pressure_performance_level`, `confidence_level`, `evidence_count`, `last_practiced_at`). `mastery_stage_cache` est une valeur dérivée, recalculée par une fonction pure `computeMasteryStage()` dans `lib/domain`, jamais saisie ni source de vérité.

## Conséquences
- Faire évoluer les critères de maîtrise = modifier une fonction pure, pas une migration.
- Ajouter une dimension = colonne nullable additive, sans casser l'existant.
- Le dashboard lit `mastery_stage_cache` pour la performance, mais tout recalcul repart des dimensions brutes.
