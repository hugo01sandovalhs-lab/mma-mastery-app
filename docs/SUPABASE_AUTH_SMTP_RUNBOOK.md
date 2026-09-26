# P0 — Débloquer les inscriptions Supabase Auth

## Diagnostic confirmé

- Projet Supabase : `pncrtzwtojlsovpbondp`
- Confirmation e-mail : activée (`mailer_autoconfirm: false`)
- Inscription par e-mail : activée
- Reproduction le 24 septembre 2026 : `POST /auth/v1/signup` renvoie HTTP `429`, code `over_email_send_rate_limit`, message `email rate limit exceeded`, avant création de l’utilisateur.
- Aucun SMTP externe ni secret SMTP n’est configuré dans le dépôt.
- Le SMTP intégré Supabase est limité à 2 e-mails par heure et n’est pas destiné à la production. La configuration distante n’a pas pu être lue dans cette session, car le tableau de bord Supabase demande une connexion et aucun jeton Supabase Management n’est disponible. Le 429 observé correspond exactement à la limite du service intégré ; vérifier l’état du bouton « Custom SMTP » pendant l’étape ci-dessous.

## Action manuelle requise — Resend recommandé

### 1. Préparer Resend

1. Dans Resend, ouvrir **Domains** puis **Add Domain**.
2. Utiliser un sous-domaine dédié, par exemple `auth.votre-domaine.fr`.
3. Ajouter chez le fournisseur DNS tous les enregistrements SPF et DKIM fournis par Resend.
4. Ajouter un enregistrement DMARC pour le domaine d’envoi.
5. Attendre que le domaine affiche **Verified** dans Resend.
6. Ouvrir **API Keys** puis créer une clé nommée `MMA Mastery Supabase Auth`, limitée à l’envoi depuis ce domaine si l’option est proposée.
7. Copier la clé une seule fois. Ne jamais la mettre dans Git, `.env.local` ou le code de l’application.
8. Désactiver le suivi des liens pour ce flux Auth afin de ne pas réécrire les liens de confirmation Supabase.

### 2. Configurer Supabase Auth

Dans le projet `pncrtzwtojlsovpbondp`, ouvrir **Authentication → Emails → SMTP Settings**, activer **Custom SMTP**, puis saisir :

| Champ | Valeur |
|---|---|
| Sender name | `MMA Mastery` |
| Sender email | `no-reply@auth.votre-domaine.fr` (doit appartenir au domaine vérifié dans Resend) |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | la clé API Resend `re_…` |

Enregistrer. Ne pas activer l’auto-confirmation : la confirmation e-mail doit rester obligatoire.

Si le tableau de bord indique déjà que **Custom SMTP** est activé, ne pas écraser les identifiants : relever le fournisseur, vérifier ses journaux d’envoi, son quota et les erreurs de remise, puis seulement corriger la configuration concernée.

### 3. Régler les limites Auth

Ouvrir **Authentication → Rate Limits** et saisir :

| Limite | Valeur |
|---|---:|
| Emails sent | `200` par heure |
| Signup confirmation request / délai minimal de renvoi | `60` secondes |
| Password reset request / délai minimal de renvoi | `60` secondes |
| OTP ou magic link / délai minimal de renvoi | `60` secondes |

`200/h` convient au test public demandé et reste dans la plage 100–300/h. Ne l’utiliser que si le quota Resend du compte l’autorise. Conserver 60 secondes empêche les renvois rapprochés sans bloquer inutilement les utilisateurs.

### 4. Vérifier avant reprise

1. Envoyer un e-mail de test depuis les réglages SMTP si le bouton est disponible.
2. Vérifier dans Resend que le message est **Delivered** et qu’aucune erreur SPF/DKIM/DMARC n’apparaît.
3. Effectuer au moins 5 inscriptions successives avec 5 adresses contrôlées différentes.
4. Pour chacune : vérifier la réponse signup, la réception du message, le lien de confirmation et la connexion après confirmation.
5. Vérifier dans **Authentication → Logs** qu’aucune entrée `over_email_send_rate_limit` ou `email rate limit exceeded` n’apparaît.
6. Tester un deuxième clic immédiat sur **Créer mon compte** : le bouton doit rester désactivé et afficher `Création…` pendant la requête. Ce comportement existe déjà dans `app/signup/page.tsx` via `disabled={isPending}`.
7. Tester un renvoi avant 60 secondes : il doit être refusé sans nouvel e-mail ; après 60 secondes, un seul e-mail doit partir.

## Critère de résolution

Le P0 est résolu uniquement après 5 inscriptions successives réussies, 5 e-mails de confirmation remis, aucune erreur de quota dans les logs Supabase et aucune double requête issue d’un double-clic.
