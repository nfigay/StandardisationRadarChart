# 150 — S19-R19 — Workspace documentaire plein écran W2UI

## Contexte
Le plein écran historique ajoutait `.s19-fullscreen` au `#s19-shell`, qui restait hébergé dans le panneau `right` du layout principal. Les coordonnées CSS `position: fixed` entraient en conflit avec les zones Workspace et les onglets.

## Décision
Créer à la demande un **w2layout dédié à la racine du document** (`s19DocumentFullscreenLayout`), avec un panneau `top` (titre, sortie) et un panneau `main` (dossier). Son hôte est opaque, couvre la fenêtre et masque visuellement les autres panneaux. Ce n'est pas un agrandissement du panneau `right`.

Le `#s19-shell` existant est **déplacé** de `mainLayout.right` vers le panneau `main` plein écran. Onglets W2UI, barre d'outils et éditeur Tiptap restent les mêmes objets, sans sérialisation intermédiaire. À la fermeture, on remet d'abord le shell à sa place d'origine, ensuite on détruit le layout temporaire.

Le menu documentaire reste propre au dossier. Les onglets sont en haut du shell ; seul le document défile verticalement. Les tableaux conservent leur défilement horizontal. Les dimensions en pixels de R18 ne sont pas remplacées par un nouveau modèle.

## Garanties
- Aucun changement au schéma JSON et aucun second éditeur.
- Aucun changement aux coordonnées des blips ni à la révision.
- Pas de sauvegarde implicite pendant le changement de conteneur.
- Sortie via l'en-tête, le bouton de dossier ou Echap ; retour au Workspace original.
- Styles isolés dans `css/radar-rationale-fullscreen.css`, déclarés statiquement dans le HTML commun depuis R34-R10 et intégrés aux distributions autonomes.
- Échec de création du layout : retour du shell à son parent initial et nettoyage de l'hôte.

## Validation
Tests de structure de layout, séquence de restitution avant destroy, cycle de vie sur faux DOM, isolation CSS ; recette Chrome requise pour W2UI/Tiptap réel, taille d'écran, onglets, tableau large et formulaire Propriétés.
