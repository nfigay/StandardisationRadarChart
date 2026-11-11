# S14-L5-C — Frontière producteur / distributeur / client

## Architecture retenue

- Producteur (administrateur) : acquiert les jeux autorisés depuis ISO et publie une release immuable avec `tools/publish-catalog.mjs`.
- Préparation : `tools/deploy-catalog-static.mjs` lit uniquement `catalog-distribution/`, vérifie SHA-256/taille des contenus gzip et décompressés, puis produit un dossier statique indépendant.
- Distributeur : HTTPS/CDN ou serveur statique. Les fichiers de release sont immuables, `manifest.json` est actualisable et annonce la dernière release.
- Client : application Vite construite puis hébergée indépendamment ; URL de catalogue configurable dans la commande de synchronisation existante ; réception vers IndexedDB après contrôle d'intégrité. La source ISO n'est pas interrogée par chaque navigateur.
- Hors ligne : import manuel conservé.

## Contrat actuel v1

`manifest.json` pointeur -> `releases/<release>/manifest.json` -> `deliverables.jsonl.gz`, `committees.jsonl.gz`. Le jeu ICS reste une dépendance historique séparée : son intégration exige une évolution compatible du schéma et de l'import atomique. Ne pas annoncer sa distribution dans cette version.

## Sécurité et portabilité

La publication est refusée si le dossier de sortie existe déjà. Aucun fichier de l'application n'est remplacé. La copie n'a lieu qu'après vérification des deux représentations gzip et brute. Configurer `Content-Type: application/gzip` **sans** `Content-Encoding: gzip` lorsque l'hébergeur le permet ; le client S14-L5-B sait valider le contenu déjà décompressé. Configurer les autorisations CORS sur l'hôte de distribution. Le fichier `_headers` fournit un exemple pour certains hébergeurs, pas une règle universelle.

Le script `deploy-catalog-static.mjs` est indépendant du code serveur Vite et n'impose aucune plateforme cloud. Son exécution reste à valider sur les 81 768 enregistrements de l'opérateur.

## Décisions encore ouvertes

Choix du domaine/hébergeur, politique d'authentification éventuelle, publication et licence des flux RSS, mise à jour des classifications ICS dans un paquet v2, delta releases, politique de rétention. DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 restent OPEN.
