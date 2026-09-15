# 0009 — Compétition: sequences/matches/athletes (P2)

## Statut
Accepté.

## Contexte
`docs/decisions/0007` documentait le modèle `sequences`/`matches`/`athletes`
comme un catalogue partagé (`athletes` en lecture publique, écriture service
role, sur le modèle de `Skill`). Cette session livre la tranche verticale
correspondante et révise ce choix pour rester cohérent avec la décision déjà
prise dans `docs/decisions/0008` pour `Resource`.

## Décisions

### Athlete: owner-scoped, pas de catalogue partagé
Comme pour `Resource` (0008), il n'existe aucune tooling admin/service-role
pour modérer un roster partagé d'athlètes. `athletes` devient donc une table
owner-scoped (RLS `user_id = auth.uid()`) — chaque utilisateur construit son
propre roster d'adversaires/partenaires au fil de ses compétitions, sans
étape de validation. Unicité par utilisateur sur `lower(name)` pour éviter
les doublons lors de la saisie libre (`MatchForm` résout ou crée l'athlète à
la volée, même pattern que la résolution de compétence par nom dans
`GoalForm`).

### Match: réutilise `training_sessions`, ne duplique pas le log de techniques
`matches` (nouvelle table owner-scoped) porte les métadonnées propres à une
compétition (adversaire, discipline, date, résultat, méthode) et référence
optionnellement la `training_sessions` (`session_type = 'competition'`) qui a
loggé les techniques réellement appliquées ce jour-là — déjà alimentée dans
`skill_progress.live_application_count` depuis 0008. Aucun nouveau mécanisme
de dérivation de progression n'est ajouté: le lien est informatif, pas une
seconde source de vérité.

### Sequence: breakdown vidéo, jamais de vidéo réhébergée
`sequences` (owner-scoped, `match_id` nullable pour une séquence hors
compétition loggée) reprend la règle déjà posée pour `Resource`: uniquement
URL + timestamp optionnel (début/fin) vers la source, jamais de fichier
réhébergé. `sequence_skills` (jonction owner-only via la séquence parente,
même pattern RLS que `session_techniques`/`session_observations`) relie une
séquence à une ou plusieurs compétences du catalogue — l'UI de ce lot ne
permet d'en lier qu'une par séquence à la création, le modèle reste
many-to-many pour une évolution future sans migration structurelle.

### Hors scope de ce lot
Pas de recherche (`search-actions.ts` inchangé), pas de multi-skill picker,
pas d'IA/RAG sur les séquences — cohérent avec la règle de 0007: modèle
extensible, fonctionnalités futures non construites avant qu'un besoin réel
ne les justifie.

## Différé (toujours non construit après ce lot)
Coach Dashboard, gameplan/post-fight review côté club, `sequence_tags`,
recherche structurée sur `sequences`. Voir `docs/decisions/0007`.
