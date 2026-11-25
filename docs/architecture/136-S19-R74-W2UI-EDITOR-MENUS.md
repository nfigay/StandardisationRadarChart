# Architecture 136 — Barre d'édition documentaire W2UI (R12)

## Décision

L'éditeur Tiptap demeure le moteur des commandes et de la persistance ProseMirror. Le panneau `radar-rationale-panel.js` utilise une barre `w2toolbar` W2UI, comme le panneau des sources ISO, plutôt qu'une liste de boutons à plat. W2UI gère l'interface, sans remplacer le document métier.

## Menus

- Styles : paragraphe, titres 1 à 4, citation, bloc de code.
- Formatage : gras, italique ; sous-menu « Texte » pour soulignement, barré, code **en ligne**, surlignage existant, effacer le format.
- Listes : puces, numérotation, tâches.
- Tableau : insertion, sous-menus lignes et colonnes, suppression.
- Insérer : URL, retrait d'URL, séparateur, saut de ligne (Maj+Entrée reste préférable).
- Historique : annuler, rétablir.

La commande `<>` n'est plus utilisée comme un libellé ambigu. Le bloc de code figure sous « Styles », le code en ligne sous « Texte ».

## Sélection et cycle de vie

Les actions passent par la fonction unique `s19RunEditorAction`; les commandes utilisent `editor.chain().focus()`. Le composant W2UI est détruit avant remontage de la zone ou changement de langue. Un menu natif de secours est disponible si `w2toolbar` est absent. La vérification du comportement du curseur dans Chrome reste obligatoire.

## Limites explicites

**Cette étape R12 ne fournit PAS les couleurs ni les fonds de paragraphe.** Pour les ajouter de façon durable, il faut modifier le bundle Tiptap 3.34.0 afin d'installer des extensions dédiées (`TextStyle`, `Color`, `Highlight multicolor` et fond de paragraphe), mettre à jour le renderer sécurisé, puis tester les sauvegardes/réimports. On ne doit pas exposer des boutons de couleurs qui ne persisteraient pas.

## Sécurité et non-régression

Le modèle des dossiers, leur création, les références associées, le renderer, la géométrie, le mode de déplacement et la publication ne changent pas en R12. Vérification des empreintes R9 (panneau) et R11 (CSS), sauvegarde des deux sources et restauration en cas d'échec. Aucun commit/push automatique.

## Recette manuelle

Tester les sous-menus et commandes dans Chrome, deux langues, sélection de texte, changement de rubrique, édition d'un dossier existant, visualisation et plein écran. Les menus doivent rester accessibles sans occulter la saisie. Les tests Node ne remplacent pas cette recette.
