# A — Dossier d'analyse consolidée : besoins, existant, écarts

**Référence:** SRC-AN-0.1 · **Nature:** descriptive / AS-IS + gap analysis · **Statut:** proposition à relire · **Date:** 2026-11-06.

**Discipline documentaire:** ce document contient les observations `OBS`, la motivation métier et les lacunes; **aucune phrase ne signifie qu'une fonctionnalité cible est déjà développée**. Les prescriptions normatives sont dans `02-SPECIFICATION-CIBLE.md`.

## A1. Mission et périmètre

Le radar soutient la gouvernance d'ensembles cohérents de standards pour l'interopérabilité opérationnelle dans un écosystème numérique. Les parties prenantes ne se limitent pas au producteur du graphique: consortiums (ASD SSG et groupes spécialisés), entreprises participant aux travaux externes, experts de normalisation, responsables de programmes, architectes d'entreprise, responsables de déploiement et lecteurs de publications.

Le besoin couvre **deux directions simultanées**: (1) expression externe d'un consensus sur les standards à suivre, développer ou adopter; (2) appréciation de leur applicabilité, puis preuve d'application réelle à l'intérieur des organisations et dans les collaborations. Ces deux niveaux ne doivent pas être confondus.

Le document de référence GIFAS du 1 avril 2026 pose la nécessité de passer d'un radar bureautique difficile à maintenir à une publication interactive et à une connexion avec la cartographie d'entreprise. Il décrit le cycle « Access & Ingest Open Data → Build Interactive Radar → Publish & Interact → Integrate into Enterprise Cartography ». Il s'agit d'une vision métier, pas de preuve d'une réalisation complète.

## A2. Acteurs et services recherchés (besoins, non fonctionnalités constatées)

| Acteur | Situation/problème | Service attendu |
|---|---|---|
| Consortium / ASD SSG | Harmoniser et publier un consensus, plusieurs domaines | Produire radars de référence, arbitrer, versionner, publier, comparer |
| Entreprise membre | Aligner l'interne sur recommandations externes sans confondre consensus et adoption | Importer/comparer positions, qualifier applicabilité, suivre déploiement |
| Expert de normalisation | Explorer nombreux standards et éditions | Recherche ISO/ICS, filtres, sélection multiple, qualification contextualisée |
| Gouvernance / comité | Conserver décisions et provenance | Justification, décision, statut, historique et auditabilité |
| Architecte d'entreprise | Relier standards aux capacités et interfaces | Liens externes vers référentiels EA, impact et preuves |
| Programme / chaîne collaborative | Vérifier application effective | Évaluer écarts entre recommandations et mise en œuvre |
| Lecteur public | Comprendre les choix | Radar interactif et infographie autonome avec contexte et légendes |

## A3. Sources de preuve et niveau de confiance

- **Source snapshot** `RadarChart-Audit-20261105-143446.zip`, daté du 2026-11-05 : preuve statique des fichiers inclus, pas garantie du HEAD Git actuel.
- **Audits DevTools** du 2026-11-06 : B1.3-C (extraits D3 et `getZone`), B1.3-D (avant/après resize), B1.4-P0 (scan d'origines), B1.4-P1 (blocs et dépendances), B1.4-P2 (capabilities Cytoscape). Ils décrivent des sessions runtime potentiellement différentes (26 vs 8 nœuds).
- **Présentation GIFAS** `ASD SSG Radar Chart presentation to GIFAS 20260401.pptx`: contexte stratégique et roadmap métier, non un contrat de fonctionnalités.
- **Source ISO**: volumétrie annoncée précédemment ~81 768 livrables, ~810 comités, ~1 381 entrées ICS; **non revalidée dans le snapshot fourni** et non utilisable comme garantie de disponibilité/runtime.

Pour les chemins et limites, voir le registre de preuves.

## A4. Architecture applicative existante (OBS)

**OBS-01** — `radar.html` crée `mainLayout` W2UI avec panneaux top/left/main/right/bottom; left contient `#workspace-explorer` et un `#toolbar-container` caché; main contient `#main-container`, `#radar-container`, `#svg-container`, `#cy-container`, `#cy2-container` et `#sidebar`; right est destiné aux formulaires. Source snapshot `radar.html` vers lignes 1604–1648.

**OBS-02** — `#radar-container` a largeur/hauteur nominales 800 px, margin-left 40 px, margin-top 5 px et `transform: scale(0.75)`; `#svg-container` et `#cy-container` sont superposés en `absolute` à 100 %. En flex, le radar peut rétrécir et `#sidebar` interne utilise `calc(100% - 800px)`. Source `radar.html` lignes 65–101, 1616–1627; B1.4-P0.

**OBS-03** — `drawSVG()` dans `js/radar.js` définit des anneaux de rayons 150/250/350, centre SVG (0,0), un `viewBox` dépendant du conteneur, des axes, des titres de ring et quatre libellés de quadrants via `foreignObject`. L'intitulé du radar et les libellés ne sont pas encore présentés comme artefact d'export autonome vérifié. Source B1.3-C.

**OBS-04** — `plotData()` attribue des rayons/angles aléatoires à des données legacy, les déplace autour du centre logique (400,400), crée les éléments dans Cytoscape puis appelle `cy.fit()`. `drawSelectedWorkgroup()` charge aussi des révisions catalogues et appelle `cy.fit()`. Source `js/radar.js` lignes 11–25 et 397–450; B1.4-P1.

**OBS-05** — W2UI `myLayout.on('resize')` ne met à jour que `width` et `height` du SVG après `setTimeout(...,100)`; aucun contrat partagé de caméra n'est explicite dans les fichiers inspectés. Source `radar.html` lignes 1866–1875.

**OBS-06** — Cytoscape.js est initialisé avec `layout.name='preset'`, `fit:false`, `zoomingEnabled:false`, `panningEnabled:false`, `userZoomingEnabled:false`, `userPanningEnabled:false`. `cy2-container` existe, mais sa hauteur observée est 0 et son rôle non établi. Source `radar.html` 2071–2091; B1.4-P0/P2.

**OBS-07** — Vite est présent dans `package.json` avec scripts `dev`, `build`, `build:pages`, `verify:*`; les modules ES ont été introduits progressivement (ex. `src/domain/radar-zone.mjs`, bootstrap) tout en conservant des scripts legacy globaux. Le comportement de packaging/browser standalone exact demande validation du build. Snapshot `package.json` et `src`.

## A5. Données, catalogues et révisions (OBS)

**OBS-08** — Le schéma catalogue actuellement accepté est `schemaVersion:'1.0.0'`, avec tableaux `organizations`, `standards`, `portfolios`, `radarRevisions` et `assessments` optionnel. Chaque révision a `revisionId`, `radarId`, `ownerOrganizationId`, `portfolioId`, `status` `draft|published|archived`, `blips[]`. Chaque blip exige `blipId`, `standardId`, `label`, `ring`, `quadrant`, `position(x,y)`, avec `assessmentId` optionnel. Source `js/radar-catalog-ui.js`, `js/radar-catalog-adapter.js`.

**OBS-09** — L'adaptateur conserve `standardId`, `assessmentId` et le contexte sous `node.data.radarchart` lors de la projection vers Cytoscape. Il existe donc **déjà une relation structurée catalogue→blip**, mais pas encore une intégration complète au panel ISO de recherche. Source `js/radar-catalog-adapter.js`.

**OBS-10** — L'UI catalogue empêche l'édition des révisions publiées/archivées; le module de persistance utilise une nouvelle révision `draft` dérivée si une révision immuable change, et requiert actuellement exactement **un catalogue importé** pour certaines opérations d'export. Les catalogues sans manifest reçoivent une identité au premier import. Source `js/radar-catalog-ui.js`, `js/radar-catalog-persistence.js`.

**OBS-11** — L'intégrité est calculée avec WebCrypto SHA-256 sur une sérialisation « sorted-json-v1 » portant sur manifest+données; ce n'est ni RFC 8785, ni une signature/attestation d'auteur. Source `js/radar-artifact-integrity.js`.

**OBS-12** — `js/radar-revision-session.js` conserve des snapshots de session et appelle `graph.fit()` lors de restaurations; la logique `plotData()` n'est invoquée qu'à l'initialisation des groupes legacy. Source B1.4-P1 et snapshot.

## A6. Résultats instrumentés du rendu (OBS)

**OBS-13** — B1.3-D: lors du changement de disposition, panneau principal 1352→510 px; largeur visuelle du radar 582.25→352.50 px; séparation centre SVG/Cytoscape 9.13→123.75 px; différence de rayon -0.11→-102.69 px; 26 nœuds avant/après, 0 déplacement de coordonnées modèle, 0 changement de sélection. Le viewport navigateur a aussi changé: effet de layout **global**, pas isolement d'un événement W2UI unique.

**OBS-14** — B1.4-P2: Cytoscape 3.30.2, 8 nœuds dans cette session, zoom 1 pan(0,0); dimensions internes 765×800 identiques aux dimensions CSS du conteneur avant transform parent; `zoomingEnabled/panningEnabled` false; `screenCTM` SVG ~0.74513 contre transform CSS 0.75. Ne prouve pas encore les setters à l'exécution.

## A7. Analyse des écarts — diagnostic vs besoin

| Gap | Constat démontré | Impact | Priorité | Exigences futures |
|---|---|---|---|---|
| GAP-01 | SVG et Cytoscape divergent après réduction du layout | Lecture erronée des zones | Critique | REQ-VP-* |
| GAP-02 | CSS 800×800 / scale fixe / flex / sidebar | Sous-utilisation, débordement | Haute | REQ-UI-*, REQ-VP-* |
| GAP-03 | Le workspace ne propose pas encore une recherche ISO intégrée établie | Recherche et sélection difficiles | Haute | REQ-ISO-* |
| GAP-04 | ISO↔catalogue↔blip non contractualisé de bout en bout | Perte d'identité / provenance | Critique | REQ-MOD-*, REQ-BLP-* |
| GAP-05 | Multiplicité de chemins `fit()` et legacy random | Instabilité/risque de régression | Haute | REQ-VP-*, REQ-MIG-* |
| GAP-06 | Fiches contextuelles multi-objets non établies | Confusion entre standard, décision et blip | Haute | REQ-CTX-* |
| GAP-07 | Comparaison et analytics non qualifiées par cas métier | Faible assistance à la gouvernance | Moyenne | REQ-ANA-* |
| GAP-08 | Composition export infographique non vérifiée | Publication peu portable | Haute | REQ-EXP-* |
| GAP-09 | Source ISO, formats, mise à jour, index performance non audités intégralement | Risque de spécification implicite | Haute | REQ-ISO-*, VER-ISO-* |
| GAP-10 | Liens EA non contractualisés | Adoption effective non démontrable | Moyenne | REQ-EA-* |

## A8. Risques et zones d'incertitude

1. **Version source:** snapshot du 5 novembre ≠ HEAD Git actuel. Relecture source nécessaire avant tout patch.
2. **ISO:** schémas, licence, mise à jour, index, liens édition/remplacement, unicité d'identifiants à confirmer.
3. **Données historiques:** `id` parfois dérivé du label dans `plotData()`; migration sans rapprochement automatique ambigu.
4. **Révisions:** toute mise à jour d'un lien ISO ou assessment doit être traçable et ne pas muter `published`/`archived`.
5. **Camera:** conserver verrouillage utilisateur tout en autorisant caméra programmatique; essais runtime contrôlés séparément.
6. **Performance:** requêtes sur dizaines de milliers d'éléments requièrent indexation et limitation de rendu; budgets à mesurer.
7. **Exports:** éléments `foreignObject` et couche Cytoscape ne garantissent pas un SVG autonome sans composition spécifique.

## A9. Conclusion de l'analyse

Les fondations utiles existent déjà (W2UI, SVG, Cytoscape, catalogue versionné, protections d'intégrité et Vite). La cible n'est pas une réécriture: il faut stabiliser le viewport, améliorer le workspace, puis raccorder le référentiel ISO à des références stables, des évaluations contextualisées et des blips gouvernés. Voir la spécification pour exigences et critères d'acceptation.


## A10. DOC-P6 — Confrontation avec les sources locales du 6 novembre 2026

**Statut : constats statiques documentés, pas validation fonctionnelle.** La capture DOC-P6-A examine 38 fichiers du checkout local (HEAD observé `6f20f28`, arborescence modifiée). DOC-P6-B répertorie les déclarations et chemins des modules ; DOC-P6-C extrait les fonctions exactes. Voir [le rapport de preuves](../evidence/03-DOC-P6-C-REVUE-CONTRATS.md).

| Identifiant | Observation confirmée dans les extraits | Incidence sur le dossier d'analyse |
|---|---|---|
| OBS-P6-01 | `prepare` exige `organizations`, `portfolios`, `standards`, `radarRevisions` et une révision au moins ; `assessments` optionnel | Le schéma `1.0.0` existant est la référence de compatibilité |
| OBS-P6-02 | `standardId` obligatoire, `assessmentId` optionnel ; références résolues au catalogue, identifiants blips uniques dans la révision | Lien métier déjà existant, sans résolution d'édition ISO démontrée |
| OBS-P6-03 | `project(group)` conserve `radarchart.standardId`, `assessmentId`, les coordonnées et retourne `edges: []` | Ne pas assimiler projection graphique et référentiel de relations |
| OBS-P6-04 | `toBlips` refuse les arêtes et propriétés Cytoscape non mappées | Protection explicite contre les exports avec perte silencieuse |
| OBS-P6-05 | `build` exige un catalogue ; crée une révision `draft` dérivée si un non-draft diverge | Limite multi-catalogue et préservation des publiés à tester de bout en bout |
| OBS-P6-06 | `createOrOpenDraft` réutilise `:draft:local` et documente `basedOnRevisionId` | Filiation existante, collisions/transactionnalité à vérifier |
| OBS-P6-07 | Création de catalogue vide avec UUID et première révision `draft`, coexistence ASD/catalogue interdite dans ce parcours | Restriction actuelle à ne pas lever sans décision métier |
| OBS-P6-08 | La session restaure des snapshots et invoque `graph.fit()` | Le viewport doit couvrir sélection et restauration, pas seulement resize |
| OBS-P6-09 | Enveloppe `artifact` + `proof`, SHA-256 et `sorted-json-v1`, signatures rejetées | Intégrité ≠ authenticité ; préserver le legacy `1.0.0` |
| OBS-P6-10 | ICS téléchargé depuis GitHub Pages dans `w2sidebar` | L'indépendance réseau du parcours ISO n'est pas démontrée |
| OBS-P6-11 | JSONL TC projeté dans Cytoscape et `addEdge` court-circuité par `return` | Relations non construites dans ce chemin ; conservation source à vérifier |
| OBS-P6-12 | `fetchRemote` lit une URL ISO fixe via proxy CORS public | Prototype expérimental, non une source offline fiable |

**Synthèse des risques confirmés :** granularité norme/partie/édition non contractualisée ; import ISO et représentation visuelle confondus dans certains parcours ; limites d'export sans arêtes ; propriétaire du viewport non unifié ; restriction à un catalogue ; invariants `published` à éprouver sur chaque mutation.

**Réserve :** ces observations n'attestent pas l'exécution ni le résultat des huit fichiers de tests `node:test` identifiés. Aucun statut « vérifié » n'est attribué aux exigences à partir de DOC-P6 seul.
