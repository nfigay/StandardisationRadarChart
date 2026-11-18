# S17-R3 — Hauteur automatique des champs multilignes

## Objectif

Dans toutes les fiches et tous les formulaires Creator et Viewer, un `textarea` visible doit prendre la hauteur nécessaire à sa valeur, sous une limite de huit lignes. Le texte long peut défiler dans le champ. Les champs à une ligne restent inchangés. La valeur, la lecture seule et la validation métier restent inchangées.

## Intégration

Un module classique `js/radar-form-autoheight.js`, chargé dans `radar.html` avant le panneau des standards, surveille l'apparition des champs et réagit aux entrées utilisateur et aux changements d'onglet. L'algorithme ne déclenche aucune acquisition réseau ni mutation du catalogue. L'attribut `data-radar-autoheight="off"` permet une exception explicite. L'intégration est globale et ne crée aucun nouveau gestionnaire dans chaque `w2form`.

## Qualification

Tests unitaires autonomes de dimensionnement, tests Node du dépôt, puis recette navigateur sur un formulaire ISO, OMG, RFC/IETF, W3C, révisions et blips. Vérifier en particulier les onglets masqués et les descriptions longues.

## Limite délibérée du lot

Cette intervention ne migre **pas encore** la fenêtre `<dialog>` ISO vers `w2popup`. Elle est volontairement séparée : la migration de conteneur implique également les parcours éditions/relations et les tests historiques qui référencent directement la fenêtre native. La traiter à part rend une éventuelle régression isolable.
