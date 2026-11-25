# S19 R74/R75 — Édition documentaire et références internes

## Décisions
Le stockage reste `radarRevisions[].extensions.radarRationales` (format R7). Les rubriques restent des documents Tiptap JSON. Aucun changement de modèle de catalogue, de persistance, de projection ou de géométrie S18. Le bundle local est reconstruit à partir des dépendances 3.34.0 déjà installées ; aucun CDN.

Le nœud inline atomique `radarReference` contient `blipId`, `standardId`, `label`. Le libellé sert uniquement à l'affichage. La résolution exige une correspondance unique des deux identifiants dans la révision active, puis vérifie le groupe, la révision et le standard du nœud Cytoscape affiché. Aucune recherche approximative, aucune bascule implicite entre révisions. Une cible absente ou masquée est signalée sans mutation. Le marqueur temporaire est un élément DOM extérieur au graphe, suit sa position rendue et disparaît sous 2,4 secondes. Les données, positions, sélection, styles Cytoscape et caméra ne sont pas modifiés.

Le renderer indépendant de Tiptap échappe les valeurs, valide les liens HTTP(S) et les spans de tableaux, traite les éléments inconnus comme du contenu non exécutable. La prévisualisation utilise une iframe sans permission de script, avec CSP restrictive. `allow-same-origin` permet au parent de traiter les clics de référence ; aucun script n'est introduit dans le document. Les références dans un HTML autonome sans hôte restent visibles mais ne naviguent pas. Le Viewer publié n'est pas raccordé par ce lot si sa chaîne existante ne l'est pas déjà.

## Recette cible
1. Ouvrir un catalogue contenant deux blips distincts et une révision brouillon. Créer ou sélectionner un dossier ; vérifier les rubriques existantes et l'absence de perte de texte.
2. Éditer titres, gras, italique, souligné, barré, surlignage, listes à puces/numérotées/tâches, citations, code, lien HTTP(S), tableau ; modifier lignes/colonnes, annuler/rétablir.
3. Insérer une référence vers le second blip. Passer en visualisation, cliquer la référence. Vérifier le marqueur, sa disparition et l'absence de changement de sélection/position. Répéter en pleine page.
4. Vérifier une référence devenue orpheline ; aucun autre blip ne doit être mis en évidence. Changer de langue en édition ; aucune re-création de l'éditeur.
5. Exporter le catalogue, réimporter ; vérifier les contenus enrichis et les références. Vérifier qu'une révision publiée n'autorise pas l'édition. Contrôler les autres extensions et la géométrie S18.
6. Exécuter la suite `npm test` et la compilation habituelle du dépôt ; vérifier Creator/Viewer et distribution hors ligne avant commit/publication.

## Limites
Le paquet ne fournit pas de bundle précompilé : celui-ci est généré sur la machine cible avec les versions exactes déjà préparées. Les tests Node couvrent le renderer et les contrats existants ; la recette navigateur est indispensable pour valider les extensions Tiptap et le cycle d'édition réel. Pas de référence inter-radar ou inter-révision dans ce lot.
