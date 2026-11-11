# S14-K-R2 — Sélecteur de révision et compatibilité des catalogues

## Diagnostic

Pile observée lors de l'import d'un ancien catalogue : `w2form.setFocus` → `w2form.render` → `radar-revision-dialogs.js:33` → `openRevisionPicker` → gestionnaire d'import. Le libellé « Catalog rejected » est trompeur : l'exception surgit pendant le rendu du sélecteur, et ne démontre aucune erreur dans le format JSON.

## Correction minimale

Configurer `focus: -1` sur le `w2form` du sélecteur afin de désactiver son autofocus avant l'affichage du `<dialog>`. Option documentée par https://w2ui.com/web/docs/2.0/w2form.focus.

## Garanties et limites

Aucune modification de la validation JSON, de la persistance métier, des identifiants, des droits draft/published/archived ou du catalogue ISO. Cette correction élimine le chemin `setFocus` identifié ; elle ne prouve pas l'absence de tout autre défaut de chargement d'anciens catalogues. Une séparation ultérieure des erreurs de validation et des exceptions d'affichage est recommandée.
