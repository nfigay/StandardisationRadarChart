# 104 — S16-A-C3-R2 : navigation ISO directement dans la fiche

Statut : candidat local non publié ; construit au-dessus de C3-R1, dernier bilan 711/711 tests Node et recette AP242 partielle 4/7.

## Périmètre

La consultation des **éditions et documents liés** est une fonction documentaire de lecture, distincte des recommandations et du modèle du catalogue métier. Le Scope ISO déjà acquis et affiché n'est pas modifié.

## Diagnostic corrigé

C3 n'affichait le bouton que pour une notice ISO documentaire (`!record.nativeReference`). Une copie documentaire ISO conservée dans les références du catalogue pouvait ainsi afficher la fiche et les relations en identifiants ISO sans présenter la navigation. C3-R2 propose la commande dès qu'une référence ISO de la forme `ISO <numéro>-<partie>:<année>` est reconnue, que la fiche provienne du corpus documentaire ou d'une copie ISO native ; jamais pour une référence métier dépourvue de notice ISO.

La nouvelle vue regroupe distinctement les **éditions**, **rectificatifs**, **amendements** et **projets** effectivement retrouvés, puis présente les relations explicites **Remplace** et **Remplacée par**. Une relation dont l'identifiant n'est pas résolu dans le cache conserve son identifiant technique, l'indication **référence non résolue dans le cache** et un lien vers ISO explicitement **non vérifié**. Aucun lien bibliographique, statut ou édition n'est inventé.

## Acquisition / preuve / lecture seule

Le résolveur utilise les données déjà accessibles via `__radarIsoWindowed.get` et au plus cinq fenêtres de 100 via `__radarIsoWindowed.page`. Il n'effectue pas de requête HTTP et ne modifie ni le cache ni les publications, ni le catalogue métier. Une liste incomplète est explicitement présentée comme telle. Il ne publie ni ne redistribue les corpus ISO/OMG. Les fiches Viewer restent en lecture seule.

## Contrats et qualification

Les tests C3-R1 sont adaptés uniquement lorsque le contrat a réellement changé (visibilité de la commande sur les copies ISO). L'absence du résolveur dans le montage isolé A8.2 reste vérifiée. Des tests supplémentaires vérifient la visibilité, le regroupement, la conservation des références non résolues et l'absence de mutation/acquisition automatique. Le test fonctionnel AP242 demeure indispensable : la présence des éditions 2014, 2022 ou 2025 dépend du cache réellement disponible.

## Recette

1. Ouvrir la fiche ISO 10303-242:2020 dans le Creator local, tant depuis la source ISO que depuis une copie ISO du catalogue métier ; voir la commande Éditions et documents liés.
2. Ouvrir la vue, contrôler la séparation des catégories et la lisibilité des relations `57620`, `72059`, `84667` quand leurs notices sont absentes.
3. Consulter la notice d'une autre édition **uniquement si elle est présente** dans le cache ; vérifier la conservation du Scope d'origine.
4. Vérifier l'absence de modification du catalogue ; contrôler le Viewer.
5. Après validation locale, reconstruire et tester la distribution Pages ; aucune publication automatique.
