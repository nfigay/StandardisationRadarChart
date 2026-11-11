# S14-X-R1 — Compatibilité du chargement des filtres d'arborescence

## Défaut observé

Après S14-X, `radar-standards-panel.js` est chargé par `radar.html` comme script classique (`<script src="...">`). La nouvelle expression `import(treeFilterModuleUrl)` utilisait un spécificateur dynamique. La transformation de cette ressource par Vite peut ajouter des instructions ESM dans la réponse servie, provoquant `Cannot use import statement outside a module` dès la première ligne et empêchant l'initialisation du panneau.

## Correction

Conserver le contrat de script classique du panneau et du module de filtrage. Le panneau charge `radar-iso-tree-filter.js` au premier besoin par insertion d'un élément `<script>` asynchrone, mutualise la promesse, attend la publication de `window.__radarIsoTreeFilter` et remet le chargeur à zéro en cas d'erreur. Aucun changement d'IndexedDB, d'index ou du protocole de recherche.

## Règles d'intégration

- Ne pas convertir isolément le panneau en `type="module"` : les autres fichiers du radar dépendent de l'initialisation et des globals historiques.
- Ne pas introduire de `import(variable)` dans un script classique servi par Vite, sans tester la réponse transformée.
- Conserver la protection des recherches obsolètes par `treeSearchToken`.
- Tester le chemin « recherche ICS/TC-SC → chargement du filtre → arborescence réduite → restauration après effacement » dans le navigateur.

## Vérification

Tests Node : syntaxe du panneau en script classique, contrat du module IIFE, gestion asynchrone du chargeur. La vérification Chrome du comportement est encore nécessaire.

## Documents à réconcilier

Cette correction complète `ARCHITECTURE-CATALOGUE-ETAT-COURANT.md` et `CONCEPTION-CONSULTATION-ISO.md` : leurs contrats fonctionnels S14-X restent valides. La consolidation des documents de référence demeure ouverte.
