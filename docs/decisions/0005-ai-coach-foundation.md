# 0005 — AI Coach: fondation déterministe, pas d'intégration cloud

## Statut
Accepté (fondation seulement — voir "Reste à faire").

## Contexte
Le produit a désormais deux moteurs déterministes (Training Intelligence V1/V2,
Learning Review Loop). L'étape suivante envisagée est un "AI Coach" capable de
répondre à des questions libres. On veut préparer l'architecture sans (1)
payer pour une intégration cloud, (2) faire croire à l'utilisateur qu'un
modèle "sait" quelque chose qui n'est pas dans ses données.

## Décision
1. **Contrat `AIProvider` dans `lib/domain/ai-coach.ts`.** Interface pure
   (`generateCoachResponse(context, question?)`), aucune dépendance réseau.
   Toute implémentation (locale, hébergée, ou de secours) doit s'y conformer.
2. **Séparation stricte des faits.** `CoachFact.kind` distingue `OBSERVED`
   (lu tel quel dans les données), `INFERRED` (dérivé par un moteur
   déterministe existant, ex. Training Intelligence) et `HYPOTHESIS` (une
   supposition du provider, jamais mélangée aux deux premières sans étiquette).
3. **`buildCoachContext()` (`lib/usecases/ai-coach-actions.ts`) n'invente
   rien.** Il assemble le contexte uniquement à partir de sources déjà
   validées ailleurs dans l'app: `getTrainingIntelligenceBundle()` (V1
   recommandations + V2 plan) et `getReviewQueue()`. Aucune nouvelle requête
   Supabase, aucun nouveau champ dérivé.
4. **`DeterministicCoachProvider` (`lib/infra/ai/deterministic-provider.ts`)
   est le provider par défaut.** Il ne fait aucun appel réseau: il réorganise
   les faits `OBSERVED`/`INFERRED` reçus en résumé + recommandations, sans
   ajouter de contenu. C'est le comportement "AI Coach" tant qu'aucun vrai
   modèle n'est branché — honnête, jamais vide de sens, jamais inventé.
5. **Aucun secret côté client.** Rien dans `lib/infra/ai/` ne s'exécute côté
   navigateur; toute future clé d'API resterait dans une action serveur.

## Conséquences
- Un futur provider (Ollama local, ou une API hébergée) s'ajoute en
  implémentant `AIProvider` dans `lib/infra/ai/`, sans toucher aux use cases
  déterministes existants ni à `buildCoachContext()`.
- Pas de nouvelle table, pas de nouvelle dépendance npm.

## Reste à faire (hors scope de cette fondation)
- Aucune UI n'expose encore le coach: tant que le seul provider est le
  fallback déterministe, une page dédiée n'apporterait rien de plus que les
  pages Training Intelligence / Review existantes.
- Pas de gestion de question libre en langage naturel: `question` est accepté
  par l'interface mais ignoré par `DeterministicCoachProvider` (aucune
  capacité de compréhension sans modèle réel).
- Si un provider réel est ajouté plus tard: décider du stockage de la clé
  d'API (variable d'environnement serveur uniquement), du budget/rate-limit,
  et de la politique de repli vers `DeterministicCoachProvider` en cas
  d'erreur ou d'absence de configuration.
