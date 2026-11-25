# 157 — S19 R21-R3 : en-tête hors du viewport Radar

## Décision

`main-container` devient une colonne flex contenant deux enfants **frères** :

1. `#s19-radar-title-header` (hauteur naturelle, lignes FR/EN) ;
2. `#radar-container` (flexible, surface disponible restante).

`#svg-container`, `#cy-container` et `#cy2-container` restent intégralement superposés dans `#radar-container`. Leurs coordonnées de caméra ne changent pas. Un `requestAnimationFrame` appelle l'outil de synchronisation de viewport déjà en place pour recalculer leurs dimensions après mise en page W2UI.

### Erreur corrigée

R21-R2 plaçait l'en-tête dans `#svg-container`, au-dessus du SVG, alors que Cytoscape continuait à occuper toute la surface `#radar-container`. Les blips dessinaient donc sous le titre. La correction n'est ni un z-index ni une translation SVG.

### Compatibilité

Les labels SVG restent présents dans `#svgTitle` pour compatibilité et sont masqués uniquement dans la vue Workspace. Métadonnées, internationalisation, géométrie, coordonnées, persistance et export autonome restent inchangés.

### Recette

Vérifier avec plusieurs tailles de panneaux, français/anglais, géométrie classique/personnalisée, changement de révision et reconstruction SVG que l'en-tête ne recouvre jamais les blips, que la sélection Cytoscape est alignée avec le dessin, et que le radar reste visible sans déformation.
