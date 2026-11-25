# S19-R74 — R7 : rendu des blocs Tiptap

## Constat de recette

Les cases des listes de tâches s'affichent sur une ligne indépendante du paragraphe éditable ; les citations et blocs de code ne sont pas visuellement différenciés dans le panneau documentaire. Le modèle documentaire, la persistance et le moteur géométrique S18 ne sont pas concernés.

## Intervention

- Styles CSS exclusivement sous `#s19-content .s19-editor .tiptap` pour les listes de tâches (`ul[data-type="taskList"]`, `li[data-type="taskItem"]`), les citations, les blocs de code et le code en ligne.
- Alignement du `label` et du conteneur éditable de `taskItem` par Flexbox, maintien de l'input checkbox interactif.
- CSS statique équivalent dans le HTML de prévisualisation existant, sans script et sans changement de CSP/sandbox.
- Aucune mutation des nœuds Tiptap et aucun changement de la commande `toggleTaskList`.

## Vérifications

Tests Node du rendu CSS et de la génération du HTML, syntaxe JS, `git diff --check` et recette manuelle du curseur (saisie, Entrée, sauvegarde, réimport, visualisation).

## Limites

Les tests Node ne simulent pas la saisie réelle ni la composition du DOM par Tiptap dans Chrome. Ne pas déclarer la recette R74 réussie avant cette vérification. L'avertissement `about:srcdoc` doit être diagnostiqué séparément ; ne jamais ajouter `allow-scripts` pour le masquer.
