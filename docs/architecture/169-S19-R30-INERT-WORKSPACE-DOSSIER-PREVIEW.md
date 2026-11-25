# S19 — R30 : prévisualisation DOM inerte du dossier stratégique

## Constat

L'application W2UI n'expose pas visuellement d'iframe. Pourtant, `renderSection()` de R29 créait un `iframe.s19-preview-frame` et chargeait via `srcdoc` la sortie complète de `__radarRationaleRenderer.renderDocument`. Les warnings `about:srcdoc` peuvent notamment résulter d'une tentative d'injection de script dans ce document (l'origine exacte n'est pas déterminée). Le sandbox interdisait les scripts : protection à conserver, et non à contourner via `allow-scripts`.

## Décision

La prévisualisation **interne Workspace** utilise un arbre DOM reconstruit depuis la sortie du moteur HTML partagé. `DOMParser` fournit un document de travail sans exécuter son contenu. `s19SafePreviewNode` construit **de nouveaux nœuds** depuis une liste blanche de balises, copie seulement les textes, les liens externes `http/https` validés et les attributs strictement nécessaires aux boutons de navigation contrôlés. Aucune insertion `innerHTML` ou `srcdoc`. Les styles Workspace sont strictement préfixés `.s19-preview-document`.

Le moteur documentaire, l'export HTML autonome et les éditions Tiptap sont **inchangés**. Ce rendu s'applique à la seule visualisation W2UI. La navigation des références est déléguée au conteneur DOM, sans communication inter-frame. Les liens externes ont `noopener noreferrer`.

## Invariants de sécurité

- Aucun `script`, `iframe`, `svg`, gestionnaire `on*`, style arbitraire, `javascript:` ni `data:` ne doit être transféré au DOM vivant.
- Un fragment rejeté ne doit pas produire de HTML non filtré en secours.
- Aucun ajout de `allow-scripts` ; aucune modification des exportations/publications.
- Préserver la sélection Cytoscape, le verrouillage en Édition, la visualisation, les références et les données du dossier.

## Validation

Tests Node ciblés sur la reconstruction des nœuds et les liens, puis recette Chrome requise (navigation T019 ↔ T023 ; références ; éditeur ; console). Une extension Chrome peut encore produire des avertissements indépendants : l'absence d'iframe `srcdoc` **dans le panneau S19** supprime ce mécanisme particulier, pas tous les messages possibles du navigateur.
