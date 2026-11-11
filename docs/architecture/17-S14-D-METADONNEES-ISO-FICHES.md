# S14-D — Fiches ISO enrichies et rapprochement des comités

## Constat
Le lot S14-A écartait les champs multilingues, les relations `replaces`/`replacedBy` et d'autres propriétés des enregistrements JSONLines. Le lot S14-C affichait seulement les 1 800 premières normes dans l'arborescence de comités ; des TC/SC pourtant présents pouvaient paraître vides.

## Correction
- Le cache de référence continue à utiliser `id` ISO comme clé d'enregistrement, tout en conservant les champs métier normalisés et la structure brute `sourceData`. Cela n'altère pas les identités du registre local ni les blips.
- Les titres et descriptions de toutes les langues disponibles sont conservés. Le texte de description respecte les séparations de paragraphes. Les données brutes sont montrées **en lecture seule** dans une fiche accessible depuis la grille.
- Les relations de remplacement restent des références vers des identifiants de livrables. Une résolution par référence est proposée si l'identifiant est présent dans le cache ; sinon l'indisponibilité est explicite. Aucune relation n'est inventée.
- Un nouvel onglet « Normes ISO » présente la référence, titres, ICS, comité producteur et stade, avec bouton « Détails ».
- Les vues ICS et TC/SC affichent également le bouton « Détails » sur les lignes normatives.
- Le regroupement TC/SC équilibre une projection bornée entre comités, plutôt que de tronquer les normes globalement avant association. Il reste une vue **partielle** si plus de 1 800 occurrences : une recherche affine alors les résultats.
- Le marqueur de synchronisation `iso-local:s14d:<sha256>` provoque une **réimportation locale unique** depuis les JSONLines déjà sur le Mac, obligatoire pour retrouver les champs précédemment supprimés.

## Limitations et risques
- Le jeu `iso_deliverables_metadata` est centré sur les livrables publiés ou en développement. Une édition retirée historiquement peut ne pas y figurer : `replaces`/`replacedBy` ne crée pas une fiche inexistante.
- Les grilles w2ui utilisent des hauteurs de lignes fixes (`recordHeight`). Les descriptions longues sont lisibles intégralement dans la fiche, sans prétendre être affichées intégralement dans chaque cellule.
- Les données JSONLines et attributs ISO sont conservés localement dans IndexedDB. Les limitations d'espace navigateur persistent.
- Pour un grand catalogue, il faut à terme indexer les relations et paginer les résultats au lieu de charger toute la base en mémoire.
- S12-R1 reste ouvert pour le rapprochement avec le registre métier et la création sûre des blips.
- Les décisions DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 restent OPEN.

## Source et attribution
ISO Open Data, jeux `iso_deliverables_metadata` et `iso_technical_committees`, ODC-By 1.0. Les propriétés de remplacement, métadonnées multilingues et descriptions proviennent du schéma ISO officiel.
