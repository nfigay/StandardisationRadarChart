# S19-R26 — Rendu du formulaire W2UI, focus et restauration des onglets

## Symptômes Chrome après R25-R2

- `w2form.setFocus`: lecture de `offsetParent` sur `undefined` après `form.render`, notamment lorsque le panneau Propriétés est masqué par la visualisation du dossier.
- `w2tabs.click`: lecture de `target` sur `undefined` depuis `s19RestorePropertiesTab`, car un clic synthétique ne constitue pas une restauration d’état sûre dans cette intégration.

## Décision

La fonction `s19RestorePropertiesTab` ne génère plus de clic : elle positionne `form.tabs.active` avant le rendu. Le panneau fixe `form.focus=-1` avant `form.render` pour empêcher W2UI d’essayer de focaliser un champ non disponible. On conserve les contrôles de sauvegarde, le mode Visualisation, les listeners Cytoscape, et le cycle de vie introduit en R25-R2.

## Contrôle

Tests statiques et comportementaux Node des changements ciblés, puis recette Chrome impérative avec dossier Visualisation et onglets Context/Extra. L'avertissement `about:srcdoc` est indépendant et non traité par ce correctif.
