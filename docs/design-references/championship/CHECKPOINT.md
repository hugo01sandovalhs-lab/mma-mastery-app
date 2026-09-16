# Direction artistique — finalisation du 16 septembre 2026

La passe Championship est terminée. Le mapping photo existant a été conservé après
contrôle des recadrages, espacements et comportements responsive.

## Travail enregistré

- Les dix pages principales ont le cadre Championship commun, une photographie dédiée et des compositions adaptées. Le dashboard validé reste la base ; sa composition n'a pas été refaite.
- Mapping exécutable : `lib/design/photography.ts` (sources, descriptions, positions). Dix photos principales distinctes. Variantes historiques du dashboard conservées.
- Primitives : `components/championship/page-header.tsx`, sidebar, composants Card/Badge/Button existants ; styles de production dans `app/dashboard/championship.css` et `editorial.css`.
- Navigation mobile : accès aux rubriques existantes par un menu natif. Sidebar active selon le chemin. Aucune modification des usecases, de la DB ou de l'authentification.
- Images des en-têtes, du dashboard et de la sidebar optimisées par Next Image. Recadrages Coach, Compétition, Objectifs et Profil corrigés après inspection.
- Correction d'accessibilité du Button partagé : les rendus Next Link/anchor gardent leur rôle de lien et ne déclenchent plus l'erreur Base UI `nativeButton`. Deux petits tests ajoutés (mapping et sémantique des liens).

## Audit photo effectué, rapport détaillé restant

42 fichiers inspectés visuellement dans la galerie préexistante `/design/photos`, dimensions relevées. Six fichiers sont des maquettes (01/02/03/04/06 et montage Caldwell) et ne doivent pas servir de photographies produit.
La référence demandée n'existe pas à `docs/design-references/02_championship.png` ; sa copie dans `public/mma-mastery-photos/02_championship.png` a été inspectée.

Sélection : Accueil `4398347` (garde/cage sombre), Entraînement `6296018` (deux athlètes aux paos), Compétences `5485525` (contrôle au sol), Coach `4761782` (silhouette N&B), Étude `38674580` (distance/striking), Objectifs `1608099` (portrait en garde), Compétition `29015506` (projection en cage), Club `6295766` (plusieurs binômes), Recherche `4761780` (vue du ring), Profil `38758889` (athlète assise).

Alternatives observées : Bruno `5424557` grappling vertical / `5521149` individuel au tapis horizontal ; Duren `14796246` grappling horizontal (panneau prochaine séance) / `14796332` et `14796334` striking en binôme ; Gera `38758867` et `38758994` grappling vertical ; Franco `13808107` et `13808109` kicks verticaux cadrés serré ; Pavel `6295755` binôme vertical (vignette club), `6296015` kick vertical (activité dashboard) ; Cottonbro `4761341` shadow boxing horizontal (focus), `4761779` silhouette verticale, `4761790` portrait sombre (variante dashboard) ; Mariano `38571271` gant levé vertical ; MJLO `28550403` dos derrière grillage (progression dashboard) ; Roodzn `35029365` grappling vertical serré ; Cristian `8810145` boxeur seul sur ring ; Coco `598665` confrontation au ring chargée ; Shkraba `4398382` boxeur en garde horizontal. Fichiers à noms longs : `-37Dp...` travail au sac horizontal, `5zY...` paos horizontal, `NEw...` grappling en gym horizontal, `vV0...` portrait carré en garde, `Weo...` striking aux paos horizontal.

## Vérifications réalisées avant l'arrêt

- Au checkpoint : typecheck passé et les deux tests ciblés `button.test.ts` / `photography.test.ts` passent. Lint passé à un stade intermédiaire ; lint final, suite complète et build restent à lancer.
- Rendu React isolé des dix vraies pages en états vides : passé. Fichiers temporaires de rendu retirés au checkpoint.
- Captures desktop 1440 px des dix compositions ; mobile 390 px des six pages prioritaires/Étude ; contrôle de débordement 320 px et tablette 820 px des dix compositions isolées : aucun débordement détecté.
- Puis session authentifiée devenue disponible : QA réelle desktop Entraînement, Compétences (28 entrées réelles), Coach et Compétition. Filtre Compétences → MMA vérifié : 5 résultats réels. Menu déroulant clair et lisible. Erreurs Base UI des liens corrigées et rôle de lien revérifié.
- Aucune donnée créée pour la QA ; aucun formulaire métier soumis.

## Vérifications finales

- QA authentifiée des onze pages principales en desktop, tablette 820 px et mobile 390 px : aucun débordement, bloc photo nul ou image cassée.
- Dashboard, profil et calendrier inspectés visuellement avec données réelles ; menu mobile et compositions photo cohérents.
- Suite complète : 18 fichiers / 146 tests passés.
- Typecheck, lint et build de production passés.

## État local à préserver

Les fichiers non suivis déjà présents au début sont laissés intacts : `.agents/`, galerie `app/design/photos/`, références Caldwell/README et photos non utilisées. Ces éléments préexistants ne constituent pas des modifications inachevées de cette passe.

Aucun serveur de développement ne reste lancé. Aucun déploiement ni push effectué. Aucun blocker connu.
