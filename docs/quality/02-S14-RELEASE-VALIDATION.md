# S14 — Consolidation des tests avant publication

## Périmètre

Release GitHub Pages avec catalogue ISO distribué,
fenêtrage IndexedDB, navigation ICS/TC-SC et
compatibilité avec le radar historique.

## Contrôles

- Reproduction de la distribution depuis l'index Git.
- Préservation du fichier ICS.csv historique.
- Contrôle des scripts classiques et des ressources Pages.
- Suite complète de tests Node.
- Vérification de la distribution statique.

## Réconciliation des tests

Les simulations Node ont été actualisées pour les API
navigateur utilisées par l'application.

Les assertions historiques ont été adaptées aux contrats
S14 : taille de fenêtre configurable, schéma IndexedDB v3,
hiérarchie ICS et libellés localisés.

La navigation du workspace est vérifiée par l'identifiant
métier de révision plutôt que par la profondeur des nœuds.

Le panneau ISO fournit une indication explicite lorsqu'aucun
comité TC/SC n'est disponible.

## Limites

Les tests Node et les contrôles statiques ne remplacent pas
la validation fonctionnelle dans un navigateur.

Le déploiement GitHub Actions et le site publié doivent être
vérifiés après le push.
