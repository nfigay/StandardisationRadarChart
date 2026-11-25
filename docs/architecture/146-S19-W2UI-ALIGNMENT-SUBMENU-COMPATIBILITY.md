# 146 — S19 / W2UI : sous-menu Alignement (R16-R2)

## Anomalie

R16-R1 a défini les quatre éléments du sous-menu `Paragraphe → Alignement` avec `text: ''`. Dans le navigateur, W2UI affiche un sous-menu vide : « No items found ». Les commandes de retrait s'affichent normalement.

## Décision

Conserver `icon` comme mécanisme W2UI, les icônes SVG statiques de R16-R1 et les identifiants des commandes Tiptap, mais attribuer aux quatre entrées un `text` court et non vide (FR/EN). Le sous-menu affiche désormais icônes **et** libellés, plutôt que tenter un menu uniquement iconographique non fonctionnel dans le W2UI embarqué.

## Périmètre

Seul `js/radar-rationale-panel.js` change ; aucun changement des extensions, de la persistance, du renderer, du CSS ni de la géométrie du radar. Installer par empreinte et sauvegarde préalable.

## Validation

Les tests vérifient : quatre libellés bilingues non vides, quatre icônes W2UI, structure du sous-menu, dispatch inchangé, conservation des icônes et des opérations de retrait. La recette Chrome doit confirmer l'ouverture, les icônes et l'exécution des quatre commandes.
