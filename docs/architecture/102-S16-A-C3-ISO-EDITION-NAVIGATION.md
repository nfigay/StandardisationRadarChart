# 102 — S16-A-C3 : navigation entre éditions ISO

Statut : candidat local **NON PUBLIÉ**, en prolongement de S16-A-C2-R1 (705/705 Node, historique OMG sur Pages confirmé visuellement). Le périmètre reste une consultation documentaire **en lecture seule**, distincte des recommandations du radar et de la qualification d'un écosystème opérationnel.

## Constat et cause

Dans le formulaire de référence ISO, `resolveRelations()` résolvait uniquement les relations via `isoDeliverables`, tableau volontairement vide lorsque la distribution ISO est ouverte en mode IndexedDB fenêtré. Les identifiants ISO de `replaces`/`replacedBy` restent conservés dans la notice, mais leur affichage est `reference missing from cache`. Cette situation **ne prouve pas l'absence** d'une édition du corpus officiel. Le compteur global de notices ne vaut pas couverture historique exhaustive.

## Livraison C3

Un bouton **Éditions et documents liés** est ajouté dans la fiche ISO consultative (pas dans les références natives). Son action volontaire recherche, dans le cache local déjà chargé, les notices d'une même famille (ISO 10303-242 dans le cas AP242) et résout d'abord les relations explicites par identifiant via `__radarIsoWindowed.get()`. Elle exploite ensuite `page(search, limit)` en au plus cinq fenêtres de cent notices. Elle classe les résultats selon leur désignation source : édition, rectificatif, amendement, projet. Le classement ne constitue ni une déduction de validité ni une chaîne inférée de remplacement. Les relations `replaces` et `replacedBy` sont restituées **seulement lorsqu'elles sont explicitement présentes** dans la notice. Une absence affiche l'identifiant brut et un lien ISO calculé, expressément indiqué *non vérifié* ; elle ne crée aucune notice ni métadonnée.

La navigation entre fiches d'une même famille est possible si la notice est réellement présente en cache. Une limite de cinq fenêtres est signalée, sans prétendre à l'exhaustivité. Aucune acquisition réseau automatique n'est effectuée, aucune donnée ISO/OMG ou native n'est modifiée, aucun droit d'édition ne change. Le Viewer reste consultatif.

## Exemple de vérification documentaire : ISO 10303-242

Les pages ISO consultées le 17 novembre 2026 indiquent :

| Publication | Nature | Lien ISO |
|---|---|---|
| ISO 10303-242:2014 | Édition 1 | https://www.iso.org/standard/57620.html |
| ISO 10303-242:2014/Cor 1:2016 | Rectificatif | https://www.iso.org/standard/72059.html |
| ISO 10303-242:2020 | Édition 2 | https://www.iso.org/standard/66654.html |
| ISO 10303-242:2022 | Édition 3 | https://www.iso.org/standard/84667.html |
| ISO 10303-242:2025 | Édition 4 | https://www.iso.org/standard/84300.html |
| ISO/CD 10303-242 | Projet d'édition 5, non publié comme édition 5 | https://www.iso.org/standard/93277.html |

Ces références sont des **preuves documentaires de qualification**, pas un inventaire injecté dans le cache. En particulier, si une ancienne édition n'est pas présente dans le jeu ISO distribué, C3 ne la fabrique pas : l'utilisateur est renvoyé vers ISO pour recherche/confirmation.

## Recette et suite

1. Ouvrir la distribution locale Pages sur le même port 5189 et la fiche `ISO 10303-242:2020` ; cliquer sur **Éditions et documents liés**.
2. Constater la résolution des identifiants présents, le signalement de ceux qui manquent et la distinction du rectificatif. L'absence d'anciennes éditions dans le cache doit rester visible et honnête.
3. Vérifier qu'une notice retrouvée peut être ouverte sans modifier le catalogue métier ; vérifier Viewer.
4. Poursuivre ultérieurement par une **acquisition explicite des métadonnées de publications absentes** auprès d'ISO, sur une base technique et des conditions de réutilisation contrôlées ; ce travail n'est pas prétendu réalisé par C3.

Aucun commit, push, tag ou déploiement avant autorisation explicite.
