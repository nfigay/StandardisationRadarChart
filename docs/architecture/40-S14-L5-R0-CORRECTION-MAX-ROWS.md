# S14-L5-R0 — Correction de la régression MAX_ROWS

## Constat

Après la suppression de la limite historique de 1 800 normes, deux branches de `refresh()` (RSS et journal des évolutions) utilisent encore la constante `MAX_ROWS`, qui n'est plus définie. Les exceptions interrompent également les flux asynchrones de chargement.

## Correction

Les deux projections sont confiées à la virtualisation native de `w2grid`, avec réinitialisation `clear(true)` puis mise en cohérence de `records`, `total` et `buffered`. Aucun plafond global n'est réintroduit. La recherche s'applique avant projection.

## Délimitations

Ce lot ne modifie ni les catalogues ISO, ni IndexedDB, ni les références métier, ni les révisions. Le changement ne constitue pas encore le contrat asynchrone de résultat des commandes prévu pour S14-L5. Validation visuelle dans Chrome encore requise.

## Vérification

Tests de correspondance exacte, idempotence, refus si le fichier a changé et absence de limite pour les événements. L'installateur prend une sauvegarde avant toute modification et refuse les structures de source divergentes.
