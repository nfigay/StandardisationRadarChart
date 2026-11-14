# Preuve 05 — Qualification native A8.4 (14 novembre 2026)

## Provenance

- Source A8.3 qualifiée localement : `94aef3e0c73b866dcceb5844044a1a93e106e299`.
- Candidat : `94aef3e0c73b866dcceb5844044a1a93e106e299+A8.4-working-tree`.
- Rapport d'installation 09:46:51 CET : empreintes post-installation conformes, 568 tests réussis (16 A8.4), readiness Pages stricte sans erreur ni warning, applications autonomes et deux projections d'exemple vérifiées.
- Rapports utilisateur Chrome : A84-CREATOR-PROJECTION à 08:48:56Z et A84-VIEWER-VALIDATION à 08:50:59Z, 14 novembre 2026.

## Creator

Définition `publication-demo-internal` version 1. Révisions `rev-1`, `rev-3` ;
2 radars, 1 organisation, 1 portefeuille, 2 standards, 2 blips, 0 évaluation,
0 instantané ISO. Politique `native-v1-positive-allowlist`.
Digest source `4c1b21e491dda510649d79dfbdc33faa47bce001770cd312a0531b7f4f5944e0`.
Digest canonique projection `ed66843ed4b575fc27cd25048b14967cc5708a07ea56a0907da9ce1b6054b942`.
Fichier téléchargé `radar-publication-ed66843ed4b5.json`. Six contrôles true :
sélection attendue, statuts publiés, absence métadonnées auteur, absence
évaluations, digest identique préparation/téléchargement, aucune livraison créée.

## Viewer

Catalogue chargé, 2 groupes `CATALOG_REVISION_0/1` ; groupe 1 actif, nœud
`demo-blip-3`, standard `demo-std-2`, radar `demo-radar-2`, révision `rev-3`.
Profil viewer, capacités catalog.open/radar.navigate/radar.consult.
Refus de `publicationState()` : `Application capability denied: publication.create`.
Deux ressources standalone : ICS.csv et lib/dataset.json. Quatre contrôles true.
Le rapport n'observe pas chaque navigation ni les deux graphes simultanément.

## Conclusion et limites

A8.4 est qualifiée sur la chaîne native effectivement réalisée. Pas de fiche
ISO dans l'exemple manuel ; pas de qualification des relations génériques,
du contexte libre, de la composition physique des modules, de l'HTML avec
données embarquées ni du contrôle des octets de livraison. CPV-06/12 partiels.
La publication publique reste A8.2. Les candidats suivants doivent conserver
ces distinctions et vérifier les nouveaux parcours.
