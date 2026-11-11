# S14-J — Journal des évolutions de catalogues SDO (premier adaptateur ISO)

**Statut** : implémentation initiale, validation de production ouverte. `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` restent `OPEN`.

## Découplage et frontières

- Les releases ISO Open Data publiées par l'opérateur demeurent immuables. Le collecteur et le producteur de catalogue sont indépendants des cibles Vite.
- Le comparateur Node `tools/compare-catalogs.mjs` lit deux releases ISO déjà publiées, vérifie l'intégrité de leurs deux jeux compressés (SHA-256 et nombre d'enregistrements), et publie `changes/<from>--<to>.json` avec un index `changes/index.json` et une empreinte du journal.
- Le client `js/radar-catalog-changes.js` utilise le même point de distribution HTTP(S) que le catalogue, contrôle l'empreinte et ne modifie jamais les standards métier, les blips ni les révisions.
- La grille `w2grid` du panneau inférieur propose une vue « Évolutions ISO », avec recherche par référence/champ et i18n FR/EN.
- Les données de changement sont des **différences observées** entre deux instantanés, non des événements de normalisation certifiés. Une référence absente du nouveau jeu ne doit **jamais** être interprétée automatiquement comme retirée, dépréciée ou remplacée.

## Schéma v1 et sémantique

- `schemaVersion: 1`, `catalogId: iso`, `from`, `to`, `generatedAt`, `counts`, `changes[]`.
- `added`: nouvel identifiant dans le jeu; `missing`: identifiant absent du nouvel instantané; `changed`: variation des champs ISO utiles au radar.
- Un changement conserve la référence et, pour les seuls champs modifiés, les valeurs `before` et `after`.
- On compare les deux jeux `deliverables` et `committees`. Le choix des champs observés est explicite et ne couvre pas tous les champs bruts ISO.
- Le comparateur calcule l'ensemble en mémoire ; à optimiser pour des catalogues plus volumineux ou des sources multiples.

## Mode opératoire

1. Collecter et publier une **nouvelle** release ISO. S14-I a déjà publié `2026-11-09`; le comparateur ne peut pas inventer de changements à partir d'une seule release.
2. `node tools/compare-catalogs.mjs --distribution catalog-distribution --from 2026-11-09 --to <nouvelle-release>`.
3. Distribuer le sous-dossier `changes/` avec les releases et manifestes existants. Dans l'interface, sélectionner `Évolutions ISO` puis `Charger les évolutions`.
4. La visualisation n'écrit ni dans le registre applicatif ni dans IndexedDB. La persistance des événements, les alertes liées aux blips et la synchronisation atomique des jeux ISO seront des évolutions distinctes et nécessaires avant un service de production.

## Limitations et sûreté

- En cas d'erreur d'intégrité, le journal est refusé. Pas de donnée factice ni de notification implicite.
- Version de comparaison immuable; index des journaux mis à jour par renommage atomique du fichier.
- L'affichage reprend la limite de lignes de la grille (`MAX_ROWS`). Pour un journal très volumineux, la pagination/virtualisation devra être améliorée.
- Identifiants de normes et de comités séparés du registre métier. Aucun rapprochement automatique avec les blips en S14-J.
- Licence et provenance ISO Open Data conservées dans les releases d'origine. Toute future redistribution RSS nécessite une vérification spécifique des droits.
