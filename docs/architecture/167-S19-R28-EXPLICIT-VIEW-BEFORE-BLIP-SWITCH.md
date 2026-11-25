# Architecture 167 — S19 R28 : verrou explicite du dossier en édition

## Règle métier

Un dossier en mode **Édition** constitue une session sur un blip précis.
Un clic sur un autre blip ne sauvegarde pas, ne détruit pas l'éditeur et ne change
pas de dossier, même si Cytoscape émet successivement `select` et `tap`.
Le nouveau blip est désélectionné et le précédent est resélectionné. Un message
invite l'utilisateur à revenir volontairement au mode **Visualisation**.

En mode **Visualisation**, les clics changent immédiatement le dossier actif.
Si aucun dossier n'existe pour le blip, le panneau affiche l'état de création
préexistant. Les propriétés ne sont rendues que dans leur onglet visible (R27).

## Prévisualisation / sécurité

L'iframe `srcdoc` reste sandboxée sans `allow-scripts`. Le HTML généré est
rejeté si des balises `<script>` explicites sont présentes. Les avertissements
Chromium `about:srcdoc` doivent être évalués séparément (notamment extensions
qui injectent du JavaScript) : aucun assouplissement de sandbox n'est justifié.

## Vérification fonctionnelle

1. Ouvrir le dossier de T019 en édition, modifier le texte, cliquer T023.
2. Vérifier que le blip et le document actifs restent T019 et que le texte reste en édition.
3. Cliquer **Visualisation** puis cliquer T023.
4. Vérifier que T023 est sélectionné et que son dossier (ou état de création) s'affiche.
5. Revenir sur T019 : son dossier doit être prévisualisé sans altération.

Aucune publication GitHub/GitHub Pages avant recette.
