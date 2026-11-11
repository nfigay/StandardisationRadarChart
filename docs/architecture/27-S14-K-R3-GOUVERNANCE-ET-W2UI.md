# S14-K-R3 — Gouvernance administrative des radars et dialogues w2ui

## Périmètre

- Le **radarId** et le **revisionId** sont les identités stables ; ils ne sont jamais renommés.
- Le nom du radar et le libellé de révision sont des **métadonnées administratives** indépendantes des instantanés publiés.
- `catalog.extensions.administration.radarNames[radarId]` porte le nom courant.
- `catalog.extensions.administration.revisionLabels[revisionId]` porte le libellé courant d'une révision.
- `catalog.extensions.administration.nameHistory[]` conserve les transitions et leurs dates (horloge locale, preuve d'audit non cryptographique).
- Les noms historiques inclus dans les révisions restent inchangés ; la projection visuelle préfère les noms administratifs courants.
- Les catalogues antérieurs dépourvus d'`extensions.administration` gardent leur fonctionnement et utilisent leurs anciens titres en valeur de repli.
- Aucun changement automatique des blips, positions, statuts ou versions n'est autorisé.

## Interfaces

- `w2popup` héberge `w2form` ; montage après `onOpen` via `event.onComplete`, autofocus désactivé (`focus:-1`).
- La fenêtre de choix de révision élimine la répétition `r1 — r1` et les identifiants longs.
- Actions distinctes « Renommer le radar » et « Nommer la révision », disponibles même si la révision active est publiée ou archivée.
- Libellés et actions FR/EN proviennent de la langue `i18next` active.

## Persistance et périmètre de garantie

La métadonnée est intégrée à la source du catalogue en mémoire, puis incluse par `build()` et `buildArtifact()` à l'export explicite ; **aucune sauvegarde automatique**. Le fichier exporté doit être conservé pour rendre le renommage durable hors de la session du navigateur.

Cette extension reste candidate tant que les décisions DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018 sont OPEN. Les règles avancées de renommage, les autorisations multi-utilisateurs et le versionnement sémantique ne sont pas modifiés.

## Validation

Tests ciblés, installation `--check` non destructive, installation `--apply` avec sauvegardes et vérification Chrome attendue. Les tests statiques ne prouvent pas la compatibilité de tous les fichiers historiques, ni toutes les implémentations de w2ui.
