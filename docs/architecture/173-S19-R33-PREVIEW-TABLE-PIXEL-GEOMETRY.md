# S19-R33 — Invariant de géométrie des tableaux dans le Workspace

## Régression avérée
R30/R31 ont remplacé l’iframe du dossier par une prévisualisation DOM inerte. R31 a recopié le CSS du moteur de publication, y compris `table { width:100%; table-layout:fixed }`. R32 a supprimé la largeur de page limitée, sans restaurer l’invariant de dimensionnement des tableaux. Les tests R31 vérifiaient même à tort la conservation de ce CSS pour les tableaux.

## Invariant de référence
Si le document HTML issu de l’éditeur Tiptap définit des colonnes en pixels via `colgroup > col`, la prévisualisation affiche chaque colonne à cette même largeur et la table conserve la somme de ces largeurs, indépendamment de la largeur du panneau W2UI. Un tableau plus large que le panneau défile horizontalement. L’éditeur, le moteur d’export et les données ne sont pas modifiés.

## Solution limitée à l’aperçu
1. Conserver les déclarations autorisées, couleurs et bordures du moteur HTML, mais retirer `width`, `min-width`, `max-width`, `table-layout` de ses règles ciblant l’élément table directement.
2. Une fois l’arbre HTML assaini, mesurer les largeurs déclarées sur les `<col>` de chaque `colgroup`. Si **toutes** sont exprimées en pixels, fixer `width`, `min-width` à leur somme en pixels et `table-layout:fixed` sur la table. Ne pas inventer de largeur lorsque les colonnes n’en spécifient pas.
3. Maintenir le défilement horizontal du conteneur et la pleine largeur du Workspace ; ne pas redimensionner les tableaux pour les faire entrer dans la fenêtre.
4. Adapter l’ancien test R31 qui validait par erreur le retour de `table{width:100%;table-layout:fixed}`.

## Limites de validation
Les tests Node garantissent le filtrage CSS et le contrat de colonne en pixels. Le contrôle Chromium est optionnel (`S19_RUN_CHROMIUM=1`) car l'exécutable n'a pas démarré dans le conteneur de préparation. La recette Chrome sur T019 doit vérifier les dimensions réellement calculées et l'absence d'autres changements visuels.
