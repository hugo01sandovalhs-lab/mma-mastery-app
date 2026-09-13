\---



name: token-efficiency

description: Réduit la consommation de contexte et de tokens pendant les sessions Claude Code longues ou autonomes. À utiliser pour toute tâche de développement, maintenance, audit ou reprise de projet.

\----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



\# Token Efficiency



\## Principe



Le filesystem du projet est la mémoire persistante.

La conversation n'est pas la mémoire du projet.



Objectif : accomplir la tâche avec le minimum de contexte, de lectures, de répétitions et de travail inutile, sans réduire la qualité.



\## Au démarrage d'une session



1\. Vérifier le répertoire courant avec `pwd`.

2\. Lire uniquement les fichiers d'état pertinents.

3\. Identifier la tâche ACTIVE avant d'explorer le code.

4\. Ne jamais relire l'historique de conversation pour reconstruire l'état du projet.

5\. Ne jamais scanner tout le repository sans raison.



Priorité typique :



\* état partagé / README court

\* queue de travail

\* décisions

\* dernier rapport pertinent

\* fichiers directement concernés



\## Lecture ciblée



Avant de lire un fichier, déterminer s'il est nécessaire à la tâche actuelle.



Préférer :



\* recherche ciblée (`rg`, `grep`, `find`)

\* lecture d'une portion pertinente

\* inspection d'un petit nombre de fichiers

\* réutilisation des scripts/tests existants



Éviter :



\* lecture massive du repository

\* répétition d'une analyse déjà effectuée

\* lecture de rapports historiques sans lien direct

\* ouverture de fichiers uniquement "pour être sûr"



Si plusieurs lectures sont indépendantes, les effectuer en parallèle lorsque cela est sûr.



\## Travail



Choisir l'approche simple qui satisfait réellement les exigences.



Ne pas :



\* créer d'abstraction prématurée

\* ajouter de dépendance inutile

\* refactorer du code non concerné

\* ajouter des fonctionnalités non demandées

\* créer des fichiers temporaires permanents sans nécessité

\* résoudre des problèmes hypothétiques



Ne pas sacrifier la correction pour économiser des tokens.



\## Tests et validation



Utiliser les tests, audits et scripts existants avant d'en créer de nouveaux.



Après une modification importante :



1\. tester ;

2\. vérifier le résultat réel ;

3\. corriger si nécessaire ;

4\. enregistrer la preuve utile.



Ne jamais considérer une tâche terminée uniquement parce que le code compile ou qu'une commande retourne `0`.



\## Mémoire inter-session



Si la tâche est longue ou si une nouvelle session devra reprendre le travail, enregistrer un état compact dans les fichiers persistants du projet.



L'état doit contenir seulement :



\* tâche actuelle

\* dernier résultat

\* blocage éventuel

\* prochaine action

\* décisions importantes

\* fichiers utiles



Ne pas copier de longues explications dans l'état.



\## Changement de contexte



Lorsque la tâche est suffisamment avancée pour être reprise dans une nouvelle session :



1\. sauvegarder l'état ;

2\. sauvegarder les preuves nécessaires ;

3\. commit/checkpoint si le workflow du projet le prévoit ;

4\. laisser une prochaine action explicite.



Ne pas tenter de préserver toute la conversation.



\## Autonomie



Si une décision d'implémentation locale est évidente, la prendre.



Si une décision modifie l'architecture, les spécifications, les données, la sécurité ou un contrat important :



\* documenter le problème ;

\* utiliser le mécanisme de décision du projet ;

\* ne pas inventer une nouvelle règle.



\## Subagents



Utiliser un subagent uniquement si :



\* le travail est réellement indépendant ;

\* le contexte doit être isolé ;

\* ou plusieurs branches peuvent progresser en parallèle.



Pour une modification simple, une recherche ciblée ou une tâche nécessitant le contexte courant : travailler directement.



\## Réponses



Les réponses utilisateur doivent être courtes.



Après une tâche :



\* résultat ;

\* tests/preuves ;

\* prochaine action si nécessaire.



Ne pas produire de long résumé de ce qui est déjà enregistré dans les fichiers.



\## Fin de tâche



Avant de déclarer terminé :



\* vérifier les changements ;

\* exécuter les tests pertinents ;

\* enregistrer l'état ;

\* mettre à jour la queue si elle existe ;

\* supprimer les fichiers temporaires inutiles.



Puis poursuivre automatiquement avec la prochaine tâche ACTIVE compatible avec le rôle de la session.



\## Règle fondamentale



Faire moins de lectures, mais de meilleures lectures.

Faire moins de changements, mais des changements complets.

Faire moins de texte, mais conserver toute l'information nécessaire dans le filesystem.



