# 0011 — Phase 4: Sparring Log

## Statut
Accepté.

## Contexte
`docs/decisions/0008` avait déjà posé les fondations honnêtes du sparring
(quatre colonnes additives sur `session_techniques`, dérivation de
`sparring_attempt_count`/`sparring_success_count` dans
`sync_skill_progress_for_skill`) mais aucune UI dédiée n'existait: les
champs `outcome`/`partner_name`/`pressure_level`/`problem` n'étaient
capturables que via `TrainingForm` en mode générique, et jamais affichés
nulle part (ni `/training/[id]`, ni le dashboard) — seul l'export texte de
séance les lisait. Cette session construit la Phase 4 "Sparring Log" en
étendant ce qui existe déjà plutôt qu'en le remplaçant.

## Décisions

### Toujours pas de table `sparring_rounds`
Confirme 0008: un round reste une ligne `session_techniques` sous une
séance `session_type = 'sparring'`. Migration additive
(`00000000000013_sparring_log.sql`): trois nouvelles colonnes nullable,
même régime que les quatre précédentes — `position` (situation/position
rencontrée), `round_seconds` (durée du round, distincte de
`training_sessions.duration_minutes` qui reste la durée globale de la
séance), `ruleset` (texte libre: no-gi, points, soumission uniquement...).
`create_training_session`/`update_training_session` sont recréées
(`create or replace`, même signature) pour les persister.

Aucun changement à `sync_skill_progress_for_skill`: ces trois champs sont
du contexte qualitatif, pas une nouvelle dimension de progression. Le
trigger `session_techniques_sync_skill_progress` recalcule déjà à chaque
mutation (pas d'incrément) — la Sparring Log réutilise le même chemin
d'écriture (`create_training_session`/`update_training_session`) que le
formulaire générique, donc la protection anti-double-comptage est héritée
sans code neuf.

### Entrée rapide: réutilise `TrainingForm`, pas un formulaire parallèle
`TrainingForm` gagne une prop `initialSessionType` et affiche les trois
nouveaux champs dans son bloc conditionnel `isSparring` existant (à côté de
`outcome`/`partner_name`/`pressure_level`/`problem`). `/training/new`
accepte `?type=sparring` et préremplit le sélecteur — c'est la "saisie
rapide mobile" demandée: même formulaire déjà mobile-first et testé, pas
de composant dupliqué à maintenir.

### `lib/domain/sparring.ts`: fonctions pures, pas d'I/O
`summarizeSparringRounds(rounds)` calcule attempts/successes/successRate
(rate `null` tant qu'aucun round n'a de résultat noté — même garantie
"jamais fabriquer un ratio" que 0006) et regroupe les `problem` récurrents
(normalisation casse, seuil configurable, limite top-N). Réutilisée à la
fois pour le résumé global de `/sparring` (agrégée sur toutes les séances)
et le résumé par séance de `/sparring/[id]` — pas de requête dupliquée.

### UI: `/sparring` (historique + bilan) et `/sparring/[id]` (détail)
Nouvelles pages seulement — aucune n'a de table/RPC propre.
`lib/usecases/sparring-actions.ts` ajoute `getSparringSessions()` (liste
filtrée `session_type = 'sparring'`, RLS héritée sans filtre applicatif
redondant) et `getSparringSession(id)` (enveloppe `getTrainingSession`,
garde `session_type === 'sparring'`). L'édition/suppression réutilisent
directement les routes et actions `/training/[id]/edit` et
`deleteTrainingSession` existantes — aucun doublon.

Le design système existant est réutilisé tel quel (`Card`/`Badge`/`Button`,
mêmes layouts que `/training` et `/training/[id]`). Pas de `PageHeader`
photographique: ce composant est couplé au catalogue `PAGE_PHOTOS`
(`lib/design/photography.ts`) qui n'a pas d'entrée "sparring" — en ajouter
une aurait exigé un choix de direction artistique/photo hors scope de ce
lot, donc `/sparring` utilise le même header simple que `/training/[id]`.

### i18n
Les 6 dictionnaires (`lib/i18n.ts`) reçoivent les mêmes clés
`sparring*`/`nav.sparring`/`form.position*`/`form.roundSeconds*`/
`form.ruleset*`, cohérent avec le reste de l'app (`docs/decisions`
n'a jamais fait d'exception i18n pour une nouvelle page).

## Différé
Aucun changement de RLS (les policies `session_techniques_*` couvrent déjà
les nouvelles colonnes, additive-only). Pas d'agrégation de partenaires
réels (`training_partners`) dans le Sparring Log: `partner_name` reste du
texte libre optionnel, cohérent avec "métadonnées sans données
personnelles superflues" — lier un partner réel au sparring log serait une
fonctionnalité distincte, non demandée ici.
