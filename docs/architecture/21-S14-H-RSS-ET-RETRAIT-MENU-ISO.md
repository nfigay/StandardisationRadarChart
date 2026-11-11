# S14-H — Retrait du menu ISO historique et événements RSS

## Périmètre livré

- Retrait du menu ISO de la barre supérieure (`Technical Committees` et `Fetch Standard(RSS)`), ainsi que de son gestionnaire de commandes factice.
- Maintien des tableaux ICS, TC/SC, normes ISO et références locales dans `w2grid` inférieur.
- Ajout d'un onglet « Actualités RSS » avec recherche, liens sources et recharge depuis cache local.
- Téléchargement de flux RSS ISO **explicitement abonnés** par une commande Node.js depuis le Mac, sans proxy CORS public ni désactivation de CORS.
- Conversion XML RSS/Atom par `DOMParser`, déduplication par identifiant, conservation IndexedDB séparée des références ISO officielles.

## Accès aux flux

L'adresse RSS est **par norme** sur ISO.org (`.../contents/data/standard/XX/YY/NNNNN.detail.rss`). Il n'est pas établi qu'un flux global couvrant l'ensemble du catalogue existe.

Le synchroniseur refuse toutes les adresses sauf les URLs HTTPS exactes `www.iso.org` et ce format RSS. Aucun téléchargement de HTML ni exécution de XML n'est effectué. Chaque fichier est plafonné à 2 Mo, 50 abonnements maximum, timeout 20 s, sans suivi des redirections. Les données sont publiques, sous réserve des règles ISO.org.

`node tools/sync-iso-rss.mjs --repo . --add 'https://www.iso.org/...detail.rss'` ajoute un abonnement et synchronise immédiatement. La synchronisation ultérieure s'effectue avec `node tools/sync-iso-rss.mjs --repo .`.

La synchronisation met à jour `iso-rss-cache/manifest.json` et les fichiers XML. Lors du chargement de l'application, le navigateur les conserve dans IndexedDB pour une consultation hors ligne. Une défaillance de flux ne remplace pas les anciens fichiers téléchargés ; elle remonte une erreur dans le rapport.

## Limites et points ouverts

- Le RSS est une chronologie d'événements, et **ne modifie pas automatiquement** les identités, éditions, stades ou blips ISO du registre métier.
- Cette version ne propose pas encore d'abonnement directement depuis la fiche `w2form` et ne lance pas le synchroniseur Node en arrière-plan.
- Une future interface d'abonnement pourra passer par un service local explicite et sécurisé, sans CORS public.
- La portée des droits ISO.org devra rester vérifiée avant la généralisation des abonnements.
- DEC-009/010/016/017/018 restent OPEN. S12-R1 non clos.
