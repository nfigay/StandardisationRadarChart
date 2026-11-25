# S18-A1 — Géométrie du radar paramétrable

## Objectif

Séparer les catégories métier (zone radiale et quartier angulaire) de la géométrie, et préserver le radar ASD SSG historique lorsqu'aucun profil n'est activé.

## Modèle

`js/radar-geometry.js` fournit `legacy`, `uniform`, `verify`, `sector`, `point`, `locate`, `position`, `setActive`, `activeConfig`, `reset` et `drawSVG`. Les identifiants de zones et de quartiers sont stables, les bornes radiales et angulaires explicites et continues. La convention angulaire est celle de `d3.pointRadial` : zéro au nord, angles croissants dans le sens horaire.

Le profil `ASD_SSG_4X3` contient les trois catégories historiques Adopted, Candidate, Track et les quatre catégories Available, Monitored, Participated, Developed ; rayons 150, 250 et 350.

## Intégration au Creator

`radar.html` charge le module avant `js/radar.js`. Sans profil activé, `drawSVG()` et `plotData()` utilisent strictement leurs anciennes branches. Avec profil actif, `drawSVG()` délègue à D3 et `plotData()` utilise les catégories et le placement déterministe fournis par le module, puis transmet les positions à Cytoscape. Aucune modification des catalogues persistés à ce stade.

## Essai en console — uniquement sur un radar de test

Dans le Creator local (avec un brouillon de test et après chargement initial), appeler :

```javascript
const g = window.__radarGeometry;
g.setActive(g.uniform({quarters: 5, zones: 4}));
drawSVG();
plotData(Array.from({length:20},(_,i)=>({id:'test-'+i,label:'test-'+i,ring:'zone-'+(i%4+1),quadrant:'quarter-'+(i%5+1)})));
```

Recharger la page sans enregistrer pour retrouver le profil historique. Pour réinitialiser sans recharger : `window.__radarGeometry.reset(); drawSVG();` puis recharger le radar historique depuis l'interface. **Ne pas enregistrer ce radar de test dans un catalogue de production.**

## Limites explicites de A1

Ce lot introduit le moteur et une prévisualisation expérimentale, pas encore un éditeur graphique de géométrie, ni la migration persistante des catégories, ni la gestion de collisions D3, ni le repositionnement lors du drag, ni une légende SVG, ni les styles et infobulles configurables. Les secteurs très étroits pourront nécessiter une adaptation des étiquettes. Les rendus SVG et Cytoscape restent deux couches distinctes, comme dans l'application actuelle.

## Tests

Tests de géométries 4×3, 5×4, 6×5 ; frontières radiales ; continuité angulaire ; identifiants ; reproductibilité des positions ; non-mutation du profil ; maintien du mode ASD historique. Tests globaux du dépôt à effectuer sur Mac à l'installation.

## S18-A2 — Configuration du radar par révision de travail

- La commande « Configurer la géométrie du radar » est disponible dans « Outils du radar », pour le Creator uniquement.
- La prévisualisation SVG reste distincte du graphe Cytoscape : aucune mutation avant « Appliquer ».
- Les catégories conservent leur identifiant si leur cardinalité reste stable ; leurs noms et descriptions peuvent changer.
- Si la nouvelle géométrie ne reconnaît plus les catégories des blips, l'application est bloquée. La migration explicite des catégories relève d'un lot ultérieur.
- Une application valide persiste la configuration dans `radarRevisions[].extensions.radarGeometry` de la révision `draft`, ainsi que les nouvelles positions des blips, via le propriétaire du catalogue et son adaptateur.
- Les révisions `published` et `archived` ne sont pas modifiables ; le Viewer demeure en lecture seule.
- À la sélection d'une révision de catalogue, le dessin D3 reprend sa configuration stockée, ou rétablit le profil ASD SSG historique si aucune configuration n'est présente.
- Aucun stockage parallèle, auto-save ou modification de la définition des standards.
- Exporter explicitement le catalogue JSON pour conserver les changements hors session.
- Limitation S18-A2 : remapping des blips déjà présents et optimisation de collision ne sont pas encore implémentés ; leur absence n'est pas masquée par une conversion automatique.

## S18-A3 — Synchronisation des interactions et commandes SDO

- La classification d'un blip déplacé est déterminée avec `__radarGeometry.locate(x,y)` lorsque la configuration paramétrable est active. Les identifiants de catégories (`ring`, `quadrant`) restent des données métier ; les libellés configurables ne les remplacent pas.
- Le mode historique ASD SSG conserve `getZone` et ses correspondances antérieures.
- Les sélecteurs du formulaire des blips s'alimentent depuis `activeConfig().zones` et `activeConfig().quarters` afin d'afficher les libellés personnalisés tout en conservant les identifiants enregistrés.
- La commande « Ajouter au catalogue » est exposée pour les normes ISO sélectionnées et les documents W3C. Pour une série W3C sans édition datée sélectionnée, la commande ouvre d'abord le choix des publications plutôt que d'importer un objet imprécis.
- Les contrôles métier de permissions et d'unicité du catalogue restent sous la responsabilité de `radar-catalog-persistence` ; les révisions publiées restent non modifiables.
- La recette S18-A3 doit inclure un changement de secteur autorisé et interdit, l'export/réimport du catalogue de travail, ainsi qu'un test ISO et W3C sur leurs modes documentaires.

## S18-B1 — Placement contraint D3

La commande explicite « Optimiser le placement des blips (D3) » utilise
`forceSimulation`, `forceCollide`, `forceX` et `forceY` pour les brouillons
à géométrie personnalisée. Les positions sont projetées dans leur secteur ;
les collisions résiduelles bloquent l'enregistrement. Aucun déplacement
n'est effectué automatiquement au chargement. Le Viewer demeure en lecture seule.
