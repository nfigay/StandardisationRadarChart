# S19 R31 — Fidélité de prévisualisation du dossier stratégique

## Constat de recette

La prévisualisation DOM inerte R30-R1 supprimait l'iframe, mais reconstruisait les éléments sans leurs styles CSS, classes de mise en forme ni attributs `colspan`/`rowspan`. Une règle supplémentaire imposait `width:100%;table-layout:fixed` à tous les tableaux. Les captures de T019 montrent la perte de couleurs, fonds et dimensions des cellules.

## Décision

Conserver l'approche DOM inerte (pas d'iframe ni `srcdoc`) et rétablir la fidélité visuelle à deux niveaux :

1. Reprendre les **déclarations inline autorisées** depuis le HTML produit par le moteur de rendu partagé. Filtrer propriétés, valeurs et attributs de table : aucune URL CSS, script, positionnement arbitraire, `on*`, ni gestionnaire actif.
2. Parser les feuilles `<style>` du document avec l'API CSSOM, filtrer les déclarations et **préfixer les sélecteurs** avec `.s19-preview-document`. Les règles non prises en charge, notamment at-rules, sont abandonnées. Aucune feuille globale non filtrée.

Conserver les `colgroup`, `col`, `caption`, `tfoot`, et dimensions de tableaux ; retirer `table-layout:fixed;width:100%` imposés par R30. Les éléments de navigation des références restent explicitement filtrés. L'export autonome, l'édition Tiptap, le verrouillage de sélection et la persistance restent inchangés.

## Limites et recette

Les styles non autorisés sont délibérément exclus. Les règles CSS complexes avec at-rules ne sont pas retranscrites dans le Workspace ; l'export HTML autonome reste la représentation publiée. Vérifier sur T019 le fond gris des en-têtes de tableau, les couleurs jaune/bleu, les largeurs/hauteurs, les listes et la disposition des sections, puis vérifier T023 et le verrou d'édition.
