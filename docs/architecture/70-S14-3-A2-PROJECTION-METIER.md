# S14.3-A2 — Projection métier d'une révision publiée

## Constat

Le modèle métier existant repose sur
`catalog.radarRevisions[].blips[]`.

Le contrat A1 est une première expérimentation fondée
sur un graphe Cytoscape. Il n'est pas encore un format
Client stabilisé.

## Décision

Projeter une révision de statut `published` uniquement.

Exclure :
- autres révisions et brouillons ;
- normes non référencées ;
- évaluations non référencées ;
- métadonnées privées et attributs non déclarés.

Conserver :
- identité et version de la révision ;
- organisation et portfolio concernés ;
- blips, positions, anneaux et quadrants ;
- références minimales aux normes et évaluations.

## Format

Format expérimental `standardisation-roadmap`, version 2.

Il ne remplace pas encore le contrat A1 version 1.

Les champs `context` et `extensions` sont volontairement
non publiés dans A2-R1. Leur signification doit être
vérifiée avant de garantir la fidélité totale d'affichage.

## Propriétés

Projection pure, sans navigateur, Cytoscape, réseau
ou IndexedDB.

Une lecture du paquet vérifie ses références et
n'accorde aucun droit d'édition.

## Travaux suivants

- confronter les données de projection aux fixtures
  réelles et aux exigences du rendu ;
- décider quels champs contextuels sont nécessaires ;
- consolider un format Client unique ;
- exposer la publication depuis le Créateur ;
- construire le Client en lecture seule ;
- décliner standalone, serveur et modules.
