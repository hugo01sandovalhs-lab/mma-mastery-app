# MMA Mastery App

Suivi d'entraînement et de progression MMA. Voir `docs/architecture.md` et `docs/data-model.md` pour le modèle source de vérité.

## Setup

1. `npm install`
2. Copier `.env.example` vers `.env.local`, remplir avec les clés d'un projet Supabase (URL, anon key, service role key — service role jamais exposée côté client).
3. Appliquer les migrations sur le projet Supabase: `npx supabase db push` (ou coller le contenu de `supabase/migrations/*.sql` dans l'éditeur SQL Supabase).
4. `npm run dev` — app sur http://localhost:3000

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build production
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript (strict, aucune émission)
- `npm run test` — tests unitaires (Vitest)

## Structure

```
/app                    routes Next.js (App Router)
/components             UI partagée (shadcn/ui + app shell)
/lib
  /domain               types, règles pures, validation Zod
  /usecases             orchestration (server actions, transactions)
  /infra
    /db                 clients Supabase (browser, server, middleware, service role)
    /ai                 adapters IA (Phase 2+)
    /vectorstore         abstraction VectorStore (Phase 2+)
/supabase/migrations    schéma SQL versionné, additif uniquement
/tests                  tests unitaires
```

## Auth

Supabase Auth (email/mot de passe). RLS activé sur `profiles`, owner-only via `auth.uid()`. Un trigger `handle_new_user` crée automatiquement la ligne `profiles` à l'inscription.
