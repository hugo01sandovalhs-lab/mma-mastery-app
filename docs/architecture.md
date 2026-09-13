# MMA Mastery App — Architecture

Source de vérité Phase 0. Statut: validé, passe corrective appliquée (voir `decisions/`).

## Stack

- Frontend: Next.js 14 (App Router), React, TypeScript strict, Tailwind, shadcn/ui
- Animation: Framer Motion, Lucide Icons
- DB: PostgreSQL (Supabase), extension pgvector
- Auth: Supabase Auth + Row Level Security
- IA locale: Ollama (LLM + embeddings) — interchangeable, voir `AIProvider`
- IA cloud (fallback): Claude API
- Charts: Recharts
- Vidéo (future, Phase 9): FFmpeg, OpenCV, modèles à choisir en phase

## Couches

```
UI (app/, components/)
  ↓
Use cases (lib/usecases) — logique applicative, transactions, invariants
  ↓
Domain (lib/domain) — types, règles pures, validation Zod, calculs dérivés (ex: mastery_stage)
  ↓
Infrastructure (lib/infra) — repositories DB, adapters IA, VectorStore
```

Règle: aucun accès DB ni appel IA direct depuis un composant UI. Toute logique de calcul dérivé (ex: `mastery_stage`) vit dans `lib/domain`, testable indépendamment de la DB.

## Arborescence

```
/app                    routes (dashboard, training, skills, goals, analytics, search, profile)
/components             UI partagés
/lib
  /domain               types, règles métier pures, calculs dérivés
  /usecases             orchestration (createTrainingSession, recomputeSkillProgress, ...)
  /infra
    /db                 repositories Supabase/Postgres
    /ai                 adapters (Ollama, Claude, embeddings)
    /vectorstore        abstraction + impl pgvector
/supabase/migrations    schéma SQL versionné, additif uniquement
/docs
  architecture.md
  data-model.md
  /decisions            ADRs courts
/tests
```

## Couche IA — abstractions

Aucune implémentation n'est architecturalement irréversible. `Ollama` et un éventuel fournisseur cloud sont des adapters interchangeables derrière ces interfaces (définies dans `lib/domain`, implémentées dans `lib/infra/ai`):

```typescript
interface AIProvider {
  complete(prompt: string, opts?: CompletionOptions): Promise<{ text: string; usage: Usage }>
  chat(messages: ChatMessage[], opts?: CompletionOptions): Promise<{ text: string; usage: Usage }>
}

interface EmbeddingProvider {
  readonly modelVersion: string
  embed(texts: string[]): Promise<number[][]>
}

interface VectorStore {
  upsert(documentId: string, vector: number[], metadata: Record<string, unknown>): Promise<void>
  search(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<SearchResult[]>
  delete(documentId: string): Promise<void>
}
```

- `AIProvider`: implémentations `OllamaAIProvider` (défaut, coût zéro, confidentialité), `ClaudeAIProvider` (fallback qualité). Sélection par config/env, jamais par un `import` direct hors `lib/infra/ai`.
- `EmbeddingProvider`: `OllamaEmbeddingProvider` par défaut. `modelVersion` propagé jusqu'à `Embedding.model_version` (voir data-model.md) pour permettre le ré-embedding sans perdre l'historique.
- `VectorStore`: `PgVectorStore` (Postgres/pgvector) au MVP. Migration Qdrant possible sans changer le reste de l'app — seul l'adapter change.

## Provenance des sources IA — règle produit

Toute réponse générée par RAG doit citer sa source quand elle existe. Le pipeline:

```
Requête utilisateur
  ↓
VectorStore.search (Embedding → SearchDocument → Resource)
  ↓
AIProvider.chat (contexte + citations obligatoires)
  ↓
Message.citations = [{ resource_id, title, author, url, published_at?, source_locator? }]
```

Invariant appliqué en use case (pas en DB): si le contexte fourni au LLM contient au moins un `SearchDocument`, la réponse persistée doit avoir `citations` non vide. Une réponse sans contexte récupéré doit être marquée comme non sourcée (`citations: []`) plutôt que de simuler une source. Détail des champs de citation: voir `data-model.md` (Resource, SearchDocument).

## RLS — principe

- Tables user-owned (données personnelles): RLS `user_id = auth.uid()`, directe ou via la table parente (ex: `SessionObservation` via `TrainingSession.user_id`).
- Tables catalogue partagé (Discipline, Skill, SkillRelation, Achievement, Resource, SearchDocument, Embedding): lecture publique, écriture réservée au rôle service (pas d'écriture utilisateur direct).

## Stratégie d'évolution du schéma

- Migrations additives uniquement (nouvelle colonne nullable, nouvelle table) — pas de migration destructive sans ADR dédié.
- `SkillRelation.relation_type` et les dimensions de `SkillProgress`: extensibles par ajout de valeur d'enum / colonne nullable, jamais par restructuration.
- `Embedding` versionné par `model_version`: changer de modèle d'embedding n'écrase pas l'historique.

## Différé (non construit, schéma non créé)

Club, ClubMember, messagerie de club: prévu conceptuellement (Phase 8), aucune table créée avant cette phase.
Computer Vision (Video, VideoAnnotation): Phase 9, aucune table créée avant cette phase.

## Décisions nécessitant validation

Voir `docs/decisions/`.
