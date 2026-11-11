# S14-Z-R2 — Distribution GitHub Pages

## Architecture conservée

- Vite prépare les assets statiques.
- Les scripts classiques restent chargés dans leur ordre historique.
- Le catalogue ISO peut être distribué avec l'application.
- La configuration utilise un endpoint relatif.
- Le catalogue ICS historique reste une dépendance distincte.

## Conditions de publication

1. Les tests S14-Z doivent réussir.
2. Le build Pages doit être validé.
3. Le catalogue ISO doit être accessible.
4. La source ICS historique doit être préservée ou remplacée
   par une solution explicitement validée.
5. Les ressources publiées doivent être suivies par Git.
6. Aucun déploiement ne doit être déclenché avant validation.

## Décision

Ne pas récupérer ni redistribuer automatiquement ICS.csv
sans validation de sa provenance et des droits associés.

Le contrôleur strict conserve ce point comme condition
bloquante tant que la distribution ICS n'est pas assurée.
