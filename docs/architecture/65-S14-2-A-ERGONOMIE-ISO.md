# S14.2-A — Ergonomie du catalogue ISO

## Référence
S14.1-B2, commit 41c838b, validé sur GitHub Pages.

## Interface
La navigation et la recherche restent visibles.
Le tri et les filtres ICS et TC/SC sont regroupés dans
un volet « Filtres et tri », repliable sans perdre les
valeurs sélectionnées.

## Recherche avancée
Le moteur booléen dispose des opérations immuables
addSiblingCondition, moveUp et moveDown.

Les déplacements sont limités aux frères d'un même
groupe ; les opérateurs ET/OU/NON restent inchangés.
L'éditeur désactive les déplacements hors limites et
la suppression du dernier enfant d'un groupe.

Les critères vides sont autorisés pendant l'édition mais
refusés par validate() lors de l'application.

## Sources
Le gestionnaire affiche l'état du démarrage ISO et le
nombre de notices connues, séparément des messages
d'opérations manuelles.

## Invariants
- Installation automatique ISO conservée.
- RSS et journaux facultatifs inchangés.
- Navigation fenêtrée et IndexedDB inchangés.
- Aucune purge, migration ou nouvelle persistance.
- Radars, groupes, révisions et blips non modifiés.

## Validation
Tests unitaires des déplacements et ajouts itératifs,
contrôles structurels de l'interface, suite complète,
build Pages et recette visuelle avant publication.
