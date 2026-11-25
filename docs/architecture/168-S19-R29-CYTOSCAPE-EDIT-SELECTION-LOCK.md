# S19 R29 — Verrouillage de la sélection Cytoscape en mode Édition

## Observation
Le test R28 ne couvrait que l'appel direct de `showNode` et non la sélection native du graphe. En situation réelle, Cytoscape peut modifier `:selected` lors du clic avant que le panneau n'ait l'occasion de refuser l'événement.

## Décision
Au passage explicite en Édition, rendre non sélectionnables les autres nœuds du graphe (`unselectify`), sans supprimer les événements `tap`. Ne modifier ni les positions ni le statut de sélection des nœuds dont la sélection était déjà interdite.

Au passage explicite en Visualisation, restaurer `selectify` uniquement sur les nœuds précédemment rendus non sélectionnables par S19. Le garde-fou `showNode()` demeure actif pour les appels programmatiques et les clics en double. Le verrou est synchronisé lors du rendu du panneau, et libéré lorsqu'on change de graphe.

## Règles
- L'édition est un état exclusif sur le dossier du blip courant.
- Le clic sur un autre blip n'autorise ni changement de dossier ni changement de sélection.
- Le retour volontaire en Visualisation rétablit la sélection.
- Les blips qui étaient initialement non sélectionnables le restent.
- Pas d'ajout de `allow-scripts` à l'iframe : les messages `about:srcdoc` ne sont pas un motif pour affaiblir le sandbox.

## Validation
Tests Node.js de verrouillage/sortie, idempotence, état initial, changement de graphe et conservation du garde-fou documentaire. À compléter par la recette Chrome avec T019/T023 en Édition et Visualisation.
