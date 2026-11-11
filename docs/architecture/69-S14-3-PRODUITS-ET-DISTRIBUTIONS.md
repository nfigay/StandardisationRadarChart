# S14.3 — Deux produits et plusieurs distributions

## Décision fonctionnelle

Le projet distingue deux produits.

### Créateur de roadmaps

Le Créateur dispose des fonctions de création, modification,
révision et publication ainsi que de l'accès au catalogue ISO.

### Client de roadmap

Le Client consulte une roadmap publiée et uniquement les
données nécessaires à celle-ci.

Le Client ne dépend pas du catalogue ISO complet, des caches
du Créateur ni de ses fonctions d'administration.

## Contrat de publication v1

Module : `src/domain/roadmap-publication.mjs`

Le paquet est indépendant de Cytoscape, d'IndexedDB et du
réseau. Il contient :

- identifiant et titre de roadmap ;
- identifiant de révision publiée ;
- graphe limité à la roadmap fournie ;
- instantanés limités aux références ISO utilisées ;
- version de catalogue à l'origine de ces instantanés.

Les données du catalogue non référencées sont exclues.

Le contenu du graphe et des notices est projeté sur une
liste explicite de champs. Les propriétés non prévues sont
exclues du paquet.

Les références externes non résolues sont refusées.

## Limite de ce premier lot

Le module ne détermine pas si une révision est publiée.
Le Créateur devra obtenir le graphe depuis la projection
métier d'une révision effectivement publiée.

Le module n'est pas encore raccordé au bouton d'export.
Le Client visuel n'est pas encore construit.

Les champs projetés doivent être confrontés à des fixtures
réelles de roadmaps avant de stabiliser le format v1.

## Cibles futures

Deux produits :
- Créateur ;
- Client.

Trois types de packaging à étudier pour chaque produit :
- standalone ;
- serveur HTTP ;
- modules.

Les distributions ISO demeurent indépendantes de ces
distributions applicatives.

## Sécurité des données et reproductibilité

Le Client ne reçoit pas les notices ISO sans référence
dans la roadmap.

Aucune installation de catalogue ISO n'est nécessaire
pour interpréter le paquet.

La publication devra produire un manifeste de version,
des empreintes SHA-256 et des tests de fonctionnement
hors catalogue global.

## Suites

S14.3-A2 :
- projection d'une révision publiée réelle ;
- étude des propriétés de graphe nécessaires au rendu ;
- publication d'un paquet déterministe.

S14.3-B :
- premier Client en lecture seule ;
- test sans catalogue global.

S14.3-C :
- packaging multi-cible ;
- validation des six distributions pertinentes ;
- publication et manifeste.
