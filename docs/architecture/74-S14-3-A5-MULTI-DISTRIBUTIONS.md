# S14.3-A5 — Distributions multi-produits

## Objectif

Livrer deux produits distincts, issus du même dépôt :

- Author : Créateur de roadmaps, accès au catalogue ISO.
- Client : consultation des données d'une seule roadmap.

## Assemblage R1

Entrées :
- `.radarchart-build/pages/` : Créateur ;
- `.radarchart-build/client/` : Client isolé.

Sorties :
- `.radarchart-build/products/author/`
- `.radarchart-build/products/client/`
- `.radarchart-build/products/release-manifest.json`

Le manifeste contient le commit source et les empreintes
SHA-256 de tous les fichiers des deux produits.

Aucun catalogue global ne doit apparaître dans Client.

## Garantie d'isolation

Le Client est contrôlé par son vérificateur spécifique.

Il ne contient ni radar.html ni distribution ISO complète.

Les données publiées pour une roadmap restent un
troisième artefact, indépendant de l'application Client.

## Préservation

Aucun écrasement de distribution existante.

L'assemblage n'altère pas les builds sources.

Les répertoires ISO locaux, IndexedDB, les sauvegardes
et l'historique éditorial ne sont pas modifiés.

## GitHub Pages

R1 prépare un artefact multi-produits.

Le workflow GitHub Pages existant et l'adresse historique
radar.html restent inchangés.

L'adaptation du workflow sera réalisée dans un lot
ultérieur après recette de l'assemblage.

## Packagings à venir

Deux produits avec trois formes possibles :
- standalone véritable ;
- serveur HTTP ;
- modules.

Le standalone doit être utilisable hors ligne et ne
peut pas être considéré opérationnel simplement parce
que les ressources HTML utilisent des chemins relatifs.

Le packaging modules devra exposer une API documentée.

Ces modes ne sont pas artificiellement déclarés validés
par le présent assemblage.

## Points restant à valider

- parcours Créateur → export → Client dans Chrome ;
- fidélité graphique sur une roadmap réelle ;
- champs context et extensions utiles au Client ;
- publication des deux produits sur GitHub Pages ;
- résilience hors ligne et packaging modulaire.
