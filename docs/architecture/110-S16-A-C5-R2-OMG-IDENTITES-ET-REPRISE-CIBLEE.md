# 110 — S16-A-C5-R2 : identités OMG et reprise ciblée

## Contexte

La collecte C5-R1 a parcouru 270 familles OMG et identifié 493 éditions formelles, 19 versions en préparation et 10 familles non résolues (collecte du 17 novembre 2026). Ces chiffres ne signifient pas que les 10 familles sont dépourvues de versions anciennes.

## Contrat documentaire

- Les URL officielles `/spec/FAMILLE/VERSION/BetaN` et `/spec/FAMILLE/VERSION/AlphaN` sont traitées comme identités documentaires distinctes. `Alpha0` est autorisé ; `Beta0` et les variantes arbitraires demeurent interdites.
- Un libellé `1.0 beta 2` correspond uniquement à l'identité canonique `1.0/Beta2` ; l'ordinal ne peut être omis que pour la variante 1. Le libellé et l'URL doivent concorder.
- Les versions alpha et bêta portent `documentStatus: in-process`, jamais `formal`.
- Les anciennes éditions formelles restent indépendantes ; ni la consultation ni la collecte ne les substituent.
- UTP2 contient des liens historiques vers UTP 1.x. Ce rapprochement entre familles n'est pas accepté automatiquement : les lignes sont expliquées individuellement, la famille demeure non résolue jusqu'à revue du lien de filiation.
- Une erreur HTTP 525 est classée indisponibilité d'acquisition réessayable, pas absence d'histoire.

## Reprise et conservation des audits

`tools/retry-omg-unresolved.mjs` lit le catalogue vérifié et la couverture C5-R1 achevée, sélectionne uniquement les familles précédemment non résolues et produit un **nouveau** répertoire de reprise. Les 14 lots, les instantanés initiaux et les checkpoints sont préservés intacts. Aucune fusion n'est effectuée sans qualification des nouvelles références.

Les fichiers produits restent `private-only`. Les références publiques minimales seront examinées et validées séparément avant intégration à GitHub Pages.

## Qualification

Exécuter les tests C5, C5-R1 et C5-R2, puis tous les tests Node. Recette ciblée sur DPROD (Beta2), TOIF (Alpha0), SDMN (erreur réseau transitoire) et UTP2 (filiation UTP). Le radar ne détermine pas l'applicabilité opérationnelle d'une édition à un produit ; il conserve la référence précise indispensable à cette décision externe.
