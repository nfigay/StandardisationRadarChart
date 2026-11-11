# S14.2-B — Aide visuelle du catalogue ISO

## Contexte

S14.2-A, commit a538c9c, est validé sur GitHub Pages.
Le besoin utilisateur porte sur la compréhension des boutons,
des datasets, des distributions et des datastores.

## Conception

La fenêtre Catalogue présente :
- six opérations métier inchangées ;
- une illustration contextuelle pour chaque opération ;
- une section repliable « Comprendre les données » ;
- un journal d'activité et un état du catalogue distincts.

L'aide est déclenchée par survol, focus ou bouton « ? ».
Seuls les boutons métier déclenchent une commande.

## Illustrations

Diagrammes SVG intégrés, sans dépendance réseau.
Chaque illustration représente origine, traitement,
destination et conséquence de l'action.
Les diagrammes disposent d'un nom accessible.

Une grille adaptative présente commandes et aide côte à
côte lorsque la largeur est suffisante, puis les empile.

## Modèle des données expliqué

Source : origine de l'information.
Dataset : ensemble cohérent de données.
Distribution : fichiers publiés transportant un dataset.
Datastore : lieu de conservation des données.
IndexedDB : stockage local du navigateur pour le catalogue ISO.
Radar : données métier distinctes (blips, groupes, révisions).

## Invariants

- Conservation des six commandes et de leurs gestionnaires.
- Conservation du suivi d'activité et des états.
- Aucun changement du moteur ISO, des fenêtres ou d'IndexedDB.
- Aucun nettoyage des générations ni des données des radars.
- Aucune nouvelle persistance.

## Validation

Tests de compatibilité et d'aide visuelle, suite complète
et build Pages. La validation visuelle et clavier sur le
navigateur publié reste obligatoire avant clôture.
