# S14.2-B2 — Catalogue principal illustré

## Contexte

La recette B1 du commit 0569391 a montré que la fenêtre
principale « Catalogue de normalisation » est construite
dans `js/radar-s14-z-sources.js`.

Le guide créé auparavant dans `radar-iso-toolbar.js`
n'était pas intégré au parcours réellement utilisé.

## Décision

Ajouter une couche pédagogique au composant principal
sans remplacer ses commandes ni leur logique métier.

## Interface

Un panneau illustré apparaît dès l'ouverture et explique
la vérification des mises à jour ISO.

Le survol et le focus clavier des opérations avancées
affichent les explications correspondantes.

Un volet repliable « Comprendre les données » distingue :
- les sources ;
- les datasets ;
- les distributions publiées ;
- les datastores ;
- le stockage IndexedDB du navigateur ;
- les données métier propres aux radars.

## Illustrations

Chaque opération est représentée par un diagramme SVG
à trois étapes : origine, traitement, destination.

Les schémas disposent d'une alternative textuelle.
Ils ne déclenchent aucune action métier.

## Invariants

Les gestionnaires des boutons, la synchronisation
distribuée, les imports et le journal des opérations
restent inchangés.

Aucune modification IndexedDB, migration de catalogue,
suppression de données ou nouvelle persistance.

## Validation

Tests des contenus bilingues et des points d'intégration,
suite complète et build GitHub Pages.

Recette visuelle obligatoire, notamment pour la disposition,
la lisibilité, le focus clavier et le défilement.
