# 145 — S19-R74 : pictogrammes du menu Paragraphe (R16-R1)

## Motivation
Le menu W2UI « Paragraphe → Alignement » n'exposait que quatre libellés textuels. L'interface doit reprendre les pictogrammes usuels (alignement gauche, centré, droite, justifié), en préservant les commandes et le document Tiptap.

## Choix
Les items du menu W2UI utilisent sa propriété officielle `icon`. Les pictogrammes sont des classes `s19-w2ui-align-*` et `s19-w2ui-indent-*`, avec SVG statiques définis et installés par l'application une fois, sans dépendance externe ou police de caractères supplémentaire. Les quatre commandes d'alignement ont une présentation iconique et des `tooltip` FR/EN ; les retraits conservent aussi leur libellé. En l'absence de W2UI, le menu de repli conserve le texte accessible.

## Invariants
- Pas de changement des identifiants `alignLeft`, `alignCenter`, `alignRight`, `alignJustify`, `indentIncrease`, `indentDecrease`, `indentReset`.
- Les handlers `setS19Alignment` et `adjustS19Indent` restent inchangés.
- Aucun changement de stockage, projection, rendu HTML, coordonnées Cytoscape ou géométrie S18.
- Les SVG sont statiques et encodés localement ; pas de ressource réseau.
- Recette Chrome obligatoire pour confirmer l'affichage des icônes dans les sous-menus W2UI et l'application à la sélection Tiptap.
