# 0007 — V3 scope: documenté, pas construit

## Contexte

La demande V3 couvre deux plateformes complètes: Personal Training
(Knowledge Base, Study, Train, Apply, Spar, Analyze, Progress) et Club
Management (Coach, Athlete, Groups, Classes, Attendance, Communication,
Events, Admin), plus paiements, IA étendue, PWA/offline, QR check-in.

Chacun de ces blocs est à lui seul un produit multi-semaines (nouveau
modèle de données, RLS multi-tenant, UI dédiée, tests). Le construire à
moitié dans une seule session produirait des tables inutilisées, du code
mort ou des flux non testés — contraire à la priorité fixée: **produit
fonctionnel + public avant tout**.

Décision: cette session livre uniquement le Design Lab (`/design`, voir
ci-dessous) et documente ici l'architecture cible pour chaque bloc V3, à
implémenter lot par lot dans des sessions dédiées, en réutilisant le
Skill Graph et l'AI Coach existants plutôt qu'en dupliquant un système
parallèle.

## Ce qui a été livré cette session

- `/design` — Design Lab reconstruit: 6 directions artistiques
  réellement distinctes (Fight Operations, Championship / Fight Camp,
  Athlete Editorial, Fight Academy, Fight Science, Fight Journal),
  conformes à `docs/design-references/`. Chaque direction est un
  composant de layout séparé (`app/design/directions/*.tsx` — nav,
  hero, densité, typographie propres) consommant le **même** jeu de
  données démo (`lib/design/lab-data.ts`) et les mêmes primitives
  shadcn — pas de duplication de page métier. Palette/tokens par
  direction: `lib/design/themes.ts` (`data-fight-theme` scoping).
  Switch client (`design-lab-client.tsx`) persistant en
  `localStorage`, responsive. Aucune direction n'a été choisie
  définitivement — décision visuelle à prendre séparément.

## P1 — Knowledge / Sequence model (à construire ensuite)

Étendre le Skill Graph existant (`skills`, `skill_relations`,
`skill_progress` — voir `docs/data-model.md`), ne pas créer de second
système de techniques.

Nouvelles tables additives proposées:
- `athletes` (nom, fédération/discipline — catalogue partagé, lecture
  publique comme `skills`)
- `matches` / `events` (métadonnées: athlètes, date, discipline, lien
  externe)
- `sequences` (position de départ, technique(s) liée(s) via table de
  jonction, concept, tags, `match_id` nullable, `athlete_id[]`,
  `source_url`, `timestamp_start`, `timestamp_end` — **jamais** de
  vidéo réhébergée, uniquement lien + timestamp)
- `sequence_tags`, `sequence_skills` (jonctions)
- `user_bookmarks` (user_id, sequence_id — RLS `user_id = auth.uid()`)
- `study_queue_items` (user_id, sequence_id ou skill_id, statut
  `queued|studying|studied`, notes personnelles)

Recherche: filtre structuré (technique, position, concept, tag,
athlète) + `ILIKE` texte libre sur `sequences`/`skills`. Pas de
pgvector/RAG tant qu'une recherche structurée suffit (cohérent avec
`architecture.md` — RAG resté hors scope).

## P1 — Personal Study workflow

Découle directement du modèle ci-dessus:
- `/study` — Study Queue (liste `study_queue_items`, marquer étudié)
- Lien technique → séquences réelles (`sequence_skills`) → drill →
  objectif d'entraînement (déjà modélisé par `skill_progress`)
- Training Intelligence (`lib/usecases`, existant) peut pointer vers
  une `sequence_id` quand une correspondance skill existe — pas
  d'invention de contenu si aucune séquence réelle n'est liée.

## P1 — Club foundation / Admin

Nouvelles tables, RLS stricte par club (jamais cross-club):
- `clubs` (owner_id, nom, settings)
- `club_members` (club_id, user_id, role — `OWNER|ADMIN|COACH|
  ASSISTANT_COACH|MEMBER`, statut invitation)
- `groups` (club_id, nom, niveau)
- `group_members` (group_id, user_id)

RLS: toute lecture/écriture passe par une fonction `is_club_member(club_id, min_role)`
en `security invoker`, jamais `security definer` sur des tables
utilisateur (cohérent avec le principe RLS existant documenté dans
`architecture.md`). Tests RLS obligatoires à la création de ces
tables (cross-user + cross-club), comme déjà pratiqué pour
`skill_progress`.

Route `/club` (dashboard, membres, groupes) construite après le
modèle de données, jamais avant.

## P2 — Classes / Calendrier / Attendance

- `classes` (club_id, group_id nullable, horaire récurrent ou
  ponctuel, capacité)
- `class_sessions` (occurrence concrète d'une classe)
- `attendance` (class_session_id, user_id, statut `present|absent|
  waitlist`)
- QR check-in: `class_sessions.checkin_code` (token court, rotation),
  page `/checkin/[code]` publique en lecture mais écriture limitée à
  un membre authentifié du club.

## P2 — Coach/Athlete dashboards, curriculum, feedback, goals

- `athlete_goals` (user_id, club_id nullable, texte, statut)
- `coach_feedback` (coach_id, athlete_id, session_id nullable, texte)
- Réutilise `skill_progress` + Training Intelligence pour répondre à
  "que dois-je travailler avec cet athlète" côté coach et "que
  dois-je travailler maintenant" côté athlète — pas de nouveau moteur
  de recommandation.

## P3 — Communication / Calendrier partagé

Modèle de données d'abord (annonces, messages ciblés par groupe),
UX simple (liste + statut lu/non lu). Pas de nouvelle infra temps réel
(pas de websocket dédié) tant que le polling/SSR suffit.

## P3 — Payments / Administration

`membership_periods`, `fee_status` en lecture seule/texte libre pour
l'instant (pas de calcul automatisé). **Pas de Stripe** cette session
ni la prochaine sans demande explicite — architecture prête (colonnes
nullables), intégration réelle différée.

## P3 — AI Coach V3

Étendre `CoachContext.facts[]` avec de nouvelles sources `OBSERVED`
(historique d'étude, séquences sauvegardées, feedback coach,
curriculum club) au fur et à mesure qu'elles existent en base — jamais
avant que la table source existe. Contrat `AIProvider` inchangé.

## P4 — PWA / offline / QR / automation

Manifest déjà présent (`architecture.md`). Icônes 192/512 PNG:
décision de design à prendre après `/design`. Mode offline (logging
hors-ligne + sync) différé — nécessite une vraie justification produit
avant d'ajouter un service worker de cache applicatif.

## Règle pour la suite

Chaque bloc ci-dessus se construit comme une tranche verticale
complète (schéma + RLS + tests + UI minimale fonctionnelle), jamais
une moitié inutilisable. Un bloc trop gros pour une session livre son
schéma + RLS + une seule route fonctionnelle plutôt qu'un ensemble de
tables vides.
