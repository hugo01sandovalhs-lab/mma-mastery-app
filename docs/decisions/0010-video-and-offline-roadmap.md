# 0010 — Vidéos coach et mode offline

## Livré

- Les recommandations du coach ouvrent une recherche YouTube ciblée sans clé et affichent, avec une clé gratuite, jusqu’à trois vidéos techniques réelles.
- Le provider YouTube Data API v3 reste côté serveur, limite chaque recherche à trois résultats et garde les réponses 24 h en mémoire (100 requêtes distinctes maximum par instance).
- La PWA met en cache uniquement le shell et les médias publics, avec une page hors connexion.
- Les données d’athlète, les réponses API et les photos privées ne sont jamais placées dans le cache partagé du service worker.

## Activation de la sélection automatique de vidéos

Créer une clé YouTube Data API v3 dans un projet Google sans facturation obligatoire, puis renseigner `YOUTUBE_API_KEY` dans `.env.local`. Sans clé, quota disponible ou réseau, le coach conserve son lien de recherche manuel et aucune fonctionnalité n’est bloquée. Le provider reçoit uniquement la recommandation technique, son niveau et la discipline, jamais les données personnelles brutes.

## Offline complet

La consultation et l’écriture de données métier hors connexion nécessitent encore une file locale IndexedDB, des mutations idempotentes, une synchronisation différée et une règle explicite de résolution des conflits. Le service worker actuel reste volontairement limité afin d’éviter toute fuite ou écrasement de données.
