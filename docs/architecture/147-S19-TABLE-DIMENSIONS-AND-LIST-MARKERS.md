# S19-R17 — Dimensions des tableaux et marqueurs de listes

- W2UI Tableau → Lignes → Hauteur de ligne… / Hauteur automatique ; Colonnes → Largeur de colonne… .
- Valeurs numériques validées, largeur 45–2000 px (`tableCell` / `tableHeader` `colwidth`) et hauteur de ligne minimale 24–800 px (`tableRow.s19MinHeight`). Les lignes peuvent grandir avec leur contenu.
- Le réglage de largeur est propagé à chaque cellule de la colonne logique sélectionnée, pour une table rectangulaire. Les fusions complexes et `rowspan` nécessitent recette Chrome supplémentaire.
- W2UI Listes → Symboles / Type de numérotation (puces `disc`, `circle`, `square` ; numéros décimaux, lettres et romains).
- Le retrait est enregistré sur le nœud `bulletList`/`orderedList` afin que le marqueur se déplace avec le texte, sans affecter les tâches (`taskList`).
- Le renderer HTML n'accepte que des styles et des dimensions dans des listes blanches ; aucun HTML arbitraire ni script.
- Les alignements restent enregistrés sur les paragraphes, y compris à l'intérieur de `tableCell`/`tableHeader`.
- Limites : saisie numérique par boîte de dialogue du navigateur (pas de poignées de ligne dans ce lot). Validation fonctionnelle Chrome requise avant publication.
