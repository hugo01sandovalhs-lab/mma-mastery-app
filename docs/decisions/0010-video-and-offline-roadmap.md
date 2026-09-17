# 0010 — Vidéos coach et mode offline

## Livré

- Les recommandations du coach ouvrent une recherche YouTube ciblée sans clé ni coût API.
- La PWA met en cache uniquement le shell et les médias publics, avec une page hors connexion.
- Les données d’athlète, les réponses API et les photos privées ne sont jamais placées dans le cache partagé du service worker.

## Activation d’une sélection automatique de vidéos

Pour afficher des vidéos choisies directement dans l’application, il reste à fournir une clé serveur `YOUTUBE_API_KEY`, implémenter un provider de recherche YouTube Data API, puis ajouter un cache de résultats avec quota. Le provider doit recevoir uniquement le nom de la technique et la difficulté, jamais des données personnelles brutes.

## Offline complet

La consultation et l’écriture de données métier hors connexion nécessitent encore une file locale IndexedDB, des mutations idempotentes, une synchronisation différée et une règle explicite de résolution des conflits. Le service worker actuel reste volontairement limité afin d’éviter toute fuite ou écrasement de données.
