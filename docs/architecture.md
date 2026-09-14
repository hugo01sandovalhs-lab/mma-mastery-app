# MMA Mastery App — Architecture

Reflète l'état réel du code (dernière mise à jour: lot AI Coach + PWA). Voir `decisions/` pour le détail des choix et leurs justifications.

## Stack (réelle)

- Frontend: Next.js 15 (App Router), React 19, TypeScript strict, Tailwind v4, shadcn/ui (`@base-ui/react`), Lucide Icons
- DB: PostgreSQL (Supabase)
- Auth: Supabase Auth + Row Level Security
- Validation: Zod
- Tests: Vitest
- IA: fondation déterministe (`DeterministicCoachProvider`), provider Ollama local optionnel via `fetch` brut — aucune dépendance IA npm, aucune clé cloud. Voir `decisions/0005`.

Pas de Framer Motion, pas de Recharts, pas d'intégration Claude/API cloud, pas de pgvector/VectorStore: ces éléments figuraient dans le plan Phase 0 initial mais n'ont jamais été construits. Ne pas s'y fier — cette section documente ce qui existe réellement.

## Couches

```
UI (app/, components/)
  ↓
Use cases (lib/usecases) — logique applicative, transactions, invariants
  ↓
Domain (lib/domain) — types, règles pures, validation Zod, calculs dérivés (ex: mastery_stage)
  ↓
Infrastructure (lib/infra) — repositories DB (Supabase), adapters IA
```

Règle: aucun accès DB ni appel IA direct depuis un composant UI. Toute logique de calcul dérivé (ex: `mastery_stage`) vit dans `lib/domain`, testable indépendamment de la DB.

## Arborescence (réelle)

```
/app
  /dashboard            "que travailler aujourd'hui" (Training Intelligence V2)
  /coach                AI Coach — réponse + faits sources + question libre
  /training             historique, /new (saisie séance), /[id] (+ /edit), /review (learning review loop)
  /skills               liste, /map (skill graph), /[id] (détail + progression)
  /profile, /login, /signup
/components
  /ui                   primitives shadcn (button, card, badge, dialog, ...)
  /training, /coach      composants métier par domaine
/lib
  /domain               types, règles métier pures, calculs dérivés — zéro dépendance DB/réseau
  /usecases             orchestration server-only ("use server" pour les actions appelées du client)
  /infra
    /db                 clients Supabase (server, service role)
    /ai                 DeterministicCoachProvider (défaut), OllamaCoachProvider (optionnel)
    /vectorstore         vide — jamais implémenté, RAG hors scope actuel
/supabase/migrations    schéma SQL versionné, additif uniquement
/docs
  architecture.md
  data-model.md
  /decisions            ADRs courts
/tests
  /domain               un fichier par module lib/domain
  /usecases, /infra      couverture ciblée des points critiques (ex: fallback AI Coach)
```

## AI Coach — architecture réelle

Contrat `AIProvider` (`lib/domain/ai-coach.ts`): `generateCoachResponse(context, question?)`. Toute implémentation s'y conforme, aucune dépendance réseau dans le domaine.

- `CoachContext.facts[]` distingue `OBSERVED` (lu tel quel), `INFERRED` (dérivé par Training Intelligence/Review, déjà validés ailleurs dans l'app), `HYPOTHESIS` (jamais mélangée aux deux premières).
- `buildCoachContext()` (`lib/usecases/ai-coach-actions.ts`) n'invente rien: assemblé uniquement depuis `getTrainingIntelligenceBundle()` et `getReviewQueue()`.
- `DeterministicCoachProvider`: aucun appel réseau, réorganise les faits reçus. Provider par défaut, toujours disponible.
- `OllamaCoachProvider` (optionnel, `lib/infra/ai/ollama-provider.ts`): activé seulement si `OLLAMA_BASE_URL`/`OLLAMA_MODEL` sont définies (variables serveur uniquement). Réponse du modèle renvoyée en `summary` uniquement, jamais en `recommendations` (une recommandation générée ne peut pas être vérifiée contre un fait réel).
- `getCoachResponse()` retombe sur le provider déterministe au moindre échec du provider configuré — un Ollama absent, injoignable, ou en erreur ne casse jamais le coach.
- UI `/coach`: affiche la réponse, le provider actif, les faits sources (dépliables), et un formulaire de question libre.

## RLS — principe (vérifié dans les migrations)

- Tables user-owned (`profiles`, `training_sessions`, `session_techniques`, `session_observations`, `skill_progress`): RLS `user_id = auth.uid()`, directe ou via la table parente.
- Tables catalogue partagé (`disciplines`, `skills`, `skill_relations`): lecture publique, pas d'écriture utilisateur direct.
- Fonctions RPC (`create_training_session`, `update_training_session`): `security invoker`, scoping `auth.uid()` explicite — jamais `security definer` pour du code touchant des données utilisateur.

## Stratégie d'évolution du schéma

- Migrations additives uniquement (nouvelle colonne nullable, nouvelle table) — pas de migration destructive sans ADR dédié.
- `SkillRelation.relation_type` et les dimensions de `SkillProgress`: extensibles par ajout de valeur d'enum / colonne nullable, jamais par restructuration.

## Différé (non construit, schéma non créé)

- VectorStore / RAG / citations sourcées: envisagé au Phase 0 initial, jamais implémenté. Si un besoin réel de recherche sémantique apparaît, le réévaluer avec une vraie justification produit plutôt que ressusciter le plan initial tel quel.
- Provider IA cloud (Claude API ou autre): volontairement hors scope (docs/decisions/0005) — pas de coût récurrent, pas de clé à gérer.
- Club, ClubMember, messagerie de club, Computer Vision (Video, VideoAnnotation), Knowledge/Sequence model, Study workflow, paiements: scope complet documenté (pas construit) dans `docs/decisions/0007-v3-scope-roadmap.md`.
- PWA: manifest + viewport ajoutés; pas d'icône d'app dédiée (192/512 PNG) — nécessite une décision de design, pas fabriquée ici. Pas de mode offline.
- Recherche globale (command center type Raycast): non implémentée — évaluer le besoin réel avant d'ajouter une dépendance.

## Design Lab

`/design` — 6 directions graphiques V3 (Fight Lab, Fitness Pro, Linear Fight, Performance Data, Championship, Technical Academy) rejouées sur les mêmes composants shadcn via des tokens CSS scopés (`data-fight-theme`, registre `lib/design/themes.ts`). Switch persistant en `localStorage`, aucun thème choisi définitivement. Ne remplace pas le thème global de l'app.

## Décisions nécessitant validation

Voir `docs/decisions/`.
