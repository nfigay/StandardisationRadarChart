# 172 — S19 R32 — Dossier Workspace fluide, dont plein écran

## Incident
Après R31, le renderer HTML réintroduit `main{max-width:880px;margin:auto}` de l'export, créant une colonne centrée étroite dans la prévisualisation Workspace. La CSS historique de plein écran appliquait également `padding:14px clamp(18px,5vw,72px)` au panneau, malgré une décision antérieure d'exploiter la largeur disponible.

## Décision
Conserver le renderer partagé et son CSS autonome inchangés. Dans le seul Workspace, installer des sélecteurs spécifiques : `#s19-shell .s19-preview-document main` neutralise la limite de 880px, les marges automatiques et conserve la largeur 100 %. En plein écran, `#s19-document-fullscreen-root #s19-shell #s19-body-rationale` remplace les larges gouttières par 16px. Les styles de largeur sont appliqués aussi pour le parcours Édition grâce à `s19PreviewStyle()` avant le fullscreen.

## Invariants
- Les tableaux Tiptap conservent leur largeur en pixels, avec défilement horizontal si nécessaire.
- Aucune modification au renderer d'export, Tiptap, aux données du dossier, au verrouillage de la sélection, ou au modèle HTML sécurisé.
- Pas d'iframe ni de permission d'exécuter des scripts.
- Validation navigateur indispensable : non-plein-écran, plein-écran Édition et Visualisation, tableaux larges.
