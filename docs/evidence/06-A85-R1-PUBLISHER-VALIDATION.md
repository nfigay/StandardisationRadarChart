# Preuve 06 — A8.5-R1 Publisher et Viewer préchargé

Date : 14 novembre 2026. Base A8.4 : `8e84351bf931165732af146cccf597c6bd17dacd`.

## Qualification locale

- 585/585 tests Node sur le dépôt Mac, dont 17 Publisher ; intégrité et Pages strict réussis ; avertissements historiques Vite/CommonJS non bloquants.
- Viewer préchargé R1 : 8 024 975 octets, SHA-256 `57d2cb665bfc2d437fc8dbd440b60de8327e8a9d4fa8976bc4440c3bdd487d8a` (exemple construit par installateur).
- Projection : `c866884873a79a06ec4e48f7a3f04e63b4c7c867bf7442c9fa2c123c2a8aa31c`.
- Rapport `A85-R1-STARTUP` : attendu/effectif rev-1, session et explorateur groupe 0, blip demo-blip-1, startup.ok=true. Explorateur : groupes 0 et 1 ; session : groupe 0 seulement, initialisation différée.

## Recette utilisateur déclarée

`A85-R1-PUBLISHER-FUNCTIONAL-RECIPE`, startupValidated=true, ok=true, observations=ras, remaining=[] :

1. Charger le catalogue A8.5.
2. Ouvrir Publications.
3. Choisir Publication interne.
4. Vérifier la projection.
5. Prévisualiser.
6. Télécharger le Viewer HTML.
7. Ouvrir le fichier généré.
8. Consulter la référence ISO.
9. Contrôler le Creator.

## Portée et limites

La recette confirme le parcours de consultation et de génération depuis l'interface. La notice ISO est synthétique. Elle ne constitue pas une vérification physique hors connexion, une comparaison pixel à pixel, une preuve d'intégrité du fichier téléchargé par l'utilisateur, une recette exhaustive de création/édition/rechargement des définitions, ni une qualification des modes Web. A8.5-R1 qualifiée pour ce parcours ; A8.6 enregistrement de livraisons et contrôle des octets ; A9 composition sélective. A8.2 demeure publique.
