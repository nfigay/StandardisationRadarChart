# S14.3-A4-R2 — Rendu du Client et export Auteur

## Constat

Le Client initial normalisait les coordonnées des blips
à partir de leur boîte englobante.

Cela ne respectait pas les positions fixées par le Créateur.

Le Créateur utilise un espace 800 × 800, un centre 400/400,
des anneaux de rayons 150, 250 et 350.

## Correction de fidélité

Le Client adopte l'espace géométrique du Créateur.

Les coordonnées des blips ne sont plus transformées.

Les anneaux et les axes sont dessinés dans ce même repère.

Les légendes des anneaux et quadrants sont reproduites
dans une présentation Client.

## Export intégré

Nouvelle action dans « Outils du radar » :
« Exporter la roadmap publiée pour le Client ».

L'action :
1. Identifie la révision active.
2. Vérifie son statut published.
3. Vérifie qu'elle appartient au catalogue du Créateur.
4. Lit le catalogue via la persistance métier existante.
5. Projette la seule révision sélectionnée.
6. Télécharge explicitement roadmap-client.json.

Le JSON du catalogue complet reste dans le processus
du Créateur ; le fichier Client ne contient que les
références ISO et évaluations réellement utilisées.

Aucun accès au serveur ISO n'est ajouté au Client.

## Limites

La géométrie historique est conservée, mais les styles
Cytoscape, le contenu context/extensions, les options
de thèmes et les configurations personnalisées doivent
encore être étudiés.

Le format v2 est expérimental : ce correctif ne le
déclare pas définitivement stabilisé.

La publication d'une révision et l'export vers le Client
restent deux actions distinctes.

L'export ne prouve pas l'authenticité cryptographique
du catalogue importé ; cette responsabilité reste celle
de l'import et de la vérification de l'artefact existants.

## Vérification

Tests de fidélité des coordonnées, intégration au menu,
refus des drafts, isolation du catalogue ISO.

Tests complets, builds Client et GitHub Pages.
Recette navigateur obligatoire.
