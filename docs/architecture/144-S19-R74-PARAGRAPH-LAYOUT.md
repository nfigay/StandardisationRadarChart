# Architecture 144 — S19-R74/R75 R16 : alignement et retraits

## Objet

L'éditeur de dossier doit disposer d'un menu W2UI **Paragraphe**. Sous-menu **Alignement** : gauche (défaut), centré, droite, justifié. Commandes **Augmenter le retrait**, **Diminuer le retrait** et **Supprimer le retrait**.

## Modèle

Les nœuds Tiptap `paragraph` et `heading` conservent `attrs.textAlign` (null / center / right / justify) et `attrs.s19Indent` (entier 0 à 6). `null` représente l'alignement naturel à gauche. Un palier = 24px. Aucune migration destructive : les dossiers précédents reçoivent les valeurs par défaut.

## Implémentation

L'extension `s19ParagraphLayout` partage la même instance Tiptap que le module R13, sans nouvelle dépendance. Les commandes agissent sur tous les paragraphes et titres de la sélection et sont accessibles dans les sous-menus W2UI. Avant l'exécution, la sélection enregistrée dans Tiptap est restaurée si la barre a pris le focus.

La prévisualisation et le HTML exporté génèrent uniquement des propriétés CSS issues d'une liste blanche : alignements `center`, `right`, `justify` et retrait maximal de 144px. Aucun style libre provenant du JSON n'est injecté.

## Vérification

Tests Node.js : topologie des menus, commandes, attrs persistants, rendu HTML et rejet des valeurs malformées. Recette navigateur requise pour vérifier sélection, multi-paragraphe, annulation, sauvegarde/réouverture, aperçu et export.

## Périmètre

Aucun changement de géométrie radar, de création des dossiers, ni de source/références associées. Pas de commit ni de publication automatique.
