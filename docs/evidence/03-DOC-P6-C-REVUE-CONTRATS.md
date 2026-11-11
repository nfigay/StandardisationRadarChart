# DOC-P6 — Revue de cohérence documentaire et des contrats applicatifs

**Référence :** DOC-P6-C · **Date :** 2026-11-06 · **Statut :** rapport candidat à installer avec DOC-P7, non installé · **Mode :** lecture seule · **Révision Git observée :** `6f20f28` (`main`, arborescence de travail modifiée).

## 1. Portée et qualité des preuves

Sources : rapports DOC-P6-A (inventaire / 49 exigences), DOC-P6-B (déclarations et occurrences) et DOC-P6-C (extraits de fonctions). Les sources sont celles de l'arborescence locale de travail, **pas nécessairement de HEAD**. Aucun code, test ni parcours UI n'a été exécuté durant ces audits. Les numéros de ligne ci-dessous correspondent aux captures du 6 novembre et sont susceptibles de changer.

- **DOC-P6-A :** 49 références d'exigences uniques dans `02-SPECIFICATION-CIBLE.md`, 49 lignes CSV, aucune différence d'identifiant détectée ; 38 fichiers parcourus par le scan. Cette vérification utilise un parseur CSV simplifié, et ne démontre pas une validation sémantique exhaustive.
- **DOC-P6-B :** fonctions et données de six modules métier observées ; huit fichiers `*.test.mjs` recensés sans exécution. Les nombres d'occurrences ne mesurent pas la couverture fonctionnelle.
- **DOC-P6-C :** extraits pertinents des contrôles de schéma, projection, export, intégrité et imports ISO ; pas d'inspection complète de tous les flux applicatifs.

## 2. Matrice des constats AS-IS

| ID | Constat démontré | Sources (lignes de l'audit DOC-P6-C) | Impact / statut de l'écart |
|---|---|---|---|
| OBS-P6-01 | Catalogue `schemaVersion=1.0.0`, tableaux `organizations`, `portfolios`, `standards`, `radarRevisions` obligatoires ; `assessments` facultatif à la validation ; `radarRevisions` non vide | `js/radar-catalog-ui.js:13-25` | Réutiliser le modèle existant ; aucune refonte implicite du schéma |
| OBS-P6-02 | Un blip porte `blipId`, `standardId`, `label`, `ring`, `quadrant`, `position{x,y}` ; `assessmentId` facultatif ; références contrôlées au niveau catalogue et identifiants de blips uniques dans chaque révision | `js/radar-catalog-ui.js:31-39`, `js/radar-catalog-adapter.js:22-29` | Contrat pivot standard–blip existant ; résolution normative (édition/partie) encore non démontrée |
| OBS-P6-03 | `project(group)` conserve les coordonnées et la référence `standardId`/`assessmentId` dans `data.radarchart`; retourne systématiquement `edges: []` | `js/radar-catalog-adapter.js:37-56` | Les relations graphiques ne font pas partie de la projection actuelle ; ne pas les inventer dans la spécification sans contrat |
| OBS-P6-04 | `toBlips` refuse tout snapshot avec arêtes, tout identifiant ou type incohérent et toute propriété Cytoscape non mappée ; conserve explicitement les métadonnées projetées | `js/radar-catalog-persistence.js:60-94` | Limite d'export assumée pour éviter la perte de données ; tests de refus à maintenir |
| OBS-P6-05 | `build()` ne permet l'export que d'un catalogue en mémoire ; compare le snapshot avec les blips d'origine ; modifie un `draft` dans le résultat ou crée un `draft` dérivé lorsqu'une révision non-draft diffère | `js/radar-catalog-persistence.js:95-125` | La gestion de plusieurs radars d'un catalogue ne signifie pas support multi-catalogue ; préservation publiée partielle à éprouver sur tous les parcours |
| OBS-P6-06 | L'action « créer/ouvrir draft » est idempotente sur `:draft:local` et exige un catalogue ; la filiation est `extensions.lineage.basedOnRevisionId` | `js/radar-catalog-ui.js:84-125`; `js/radar-catalog-persistence.js:34-47` | Préserver l'identité et les règles de filiation ; étudier les collisions et les transactions d'enregistrement |
| OBS-P6-07 | La création d'un catalogue de travail génère des identifiants UUID et un premier `draft` vide ; elle interdit la coexistence d'un catalogue déjà chargé et d'un workspace ASD présent | `js/radar-catalog-ui.js:129-168` | Scénario multi-contextes à définir sans contourner la protection historique |
| OBS-P6-08 | Le moteur de session conserve des snapshots nodes/edges par groupe ; `restore()` remplace les éléments et invoque `graph.fit()` | `js/radar-revision-session.js:14-43` | La synchronisation des caméras SVG/Cytoscape devra couvrir cette voie, en plus du W2UI resize |
| OBS-P6-09 | Les enveloppes JSON utilisent `artifact{manifest,data}` et `proof` avec SHA-256 et `sorted-json-v1`; les signatures ne sont pas prises en charge ; catalogues `1.0.0` nus acceptés en mode legacy | `js/radar-artifact-integrity.js:30-59` | Ne pas confondre empreinte d'intégrité et signature/authenticité ; compatibilité legacy requise |
| OBS-P6-10 | La classification ICS est chargée depuis une URL distante GitHub Pages par `Papa.parse(download:true)`, puis installée dans un `w2sidebar` | `radar.html:842-905` | Une solution offline-first doit prévoir un chemin local indépendant du réseau ; l'état réel du cache n'est pas établi |
| OBS-P6-11 | Le JSONL des comités ISO est projeté directement en nœuds Cytoscape ; `addEdge` commence par `return`, ce qui neutralise la création des relations ; plusieurs valeurs imbriquées sont aplaties en `clé.sous-clé` | `radar.html:1920-2045` | Prototype de visualisation, pas démonstration de conservation intégrale du référentiel ISO ; distinguer import brut et projection visuelle |
| OBS-P6-12 | La récupération de fiche ISO utilise une URL de norme fixe et un proxy CORS public de démonstration ; `extractIsoStandardInfo` extrait des champs de page HTML par sélecteurs | `js/radar.js:544-650` | Chemin expérimental fragile, dépendant d'un tiers ; ne pas en faire une dépendance obligatoire |

## 3. Écarts prioritaires entre existant et cible

| Priorité | Écart | Exigences / décisions concernées | Vérification nécessaire avant implémentation |
|---|---|---|---|
| P0 | Le lien vers un `standardId` existe, mais la référence normative versionnée « organisme / norme / partie / édition » n'est pas définie dans les extraits | `REQ-MOD-01`, `REQ-MOD-02`, `REQ-MOD-04`, `REQ-ISO-03`, `DEC-009`, `DEC-010` | Corpus ISO réel, identifiants sources, stratégie de conservation des anciennes éditions |
| P0 | Flux ISO réseau et projections graphiques expérimentales ; pas de contrat d'import normalisé unifié démontré | `REQ-ISO-01`, `REQ-ISO-05`, `REQ-BASE-01` | Audit des fichiers ISO/ICS disponibles, champs de source, erreurs, mode import local |
| P0 | L'export refuse les arêtes et champs Cytoscape non mappés ; les relations futures ne peuvent être ajoutées au graph sans contrat d'échange | `REQ-BASE-03`, `REQ-MOD-02` | Tests d'export/round-trip sur blips, relations et métadonnées |
| P0 | Des `fit()` sont invoqués hors du cycle resize, donc l'owner du viewport doit aussi couvrir chargement et restauration | `REQ-VP-01`, `REQ-VP-02`, `REQ-VP-03`, `DEC-005`, `DEC-006` | Prototype pur de géométrie puis tests de synchronisation UI, sans randomisation |
| P1 | Restrictions `imports.length === 1` et non-coexistence ASD/catalogue | `DEC-016`, `REQ-UI-01` | Cas d'usage et modèle de navigation multi-catalogue avant toute levée des protections |
| P1 | États `draft/published/archived` reconnus ; couverture exhaustive des mutations non établie | `REQ-UI-06`, `REQ-BLP-04`, `DEC-003` | Tests de verrouillage sur saisie, déplacement, import, export et publication |

**Attention à la priorisation :** « P0 » indique un point de spécification et de sécurité de données à résoudre tôt, pas l'autorisation de développer directement.

## 4. Corrections documentaires proposées (non appliquées)

1. Dans `01-ANALYSE-EXISTANT.md`, intégrer OBS-P6-01 à OBS-P6-12 avec le statut « constat statique confirmé » et limites de confiance.
2. Dans `02-SPECIFICATION-CIBLE.md`, marquer explicitement l'identité « édition/partie ISO » et la politique d'extensions/relations comme **contrats à arbitrer**, sans supposer qu'ils existent déjà.
3. Dans `01-DECISIONS.md`, laisser `DEC-009`, `DEC-010`, `DEC-016` **OPEN**. Ajouter une décision sur la séparation *import brut ISO / index normatif / projection UI* et sur la conservation des relations hors projection Cytoscape.
4. Dans `requirements.csv`, **ne pas** passer les exigences à `implemented/verified` sur simple preuve statique. Ajouter si nécessaire des colonnes séparées `as_is_evidence`, `gap_status`, `test_result`, sans perdre les identifiants existants.
5. Dans `00-START-HERE.md`, noter DOC-P5-R1 réussi (13/13, SHA-256 vérifiés), DOC-P6-A/B/C effectués, et la prochaine tâche : revue formelle des contrats ISO/édition et tests de round-trip.
6. Garder toutes les modifications documentaires en staging jusqu'à validation explicite ; ne pas modifier les sources du Viewer/Editor, ne pas committer.

## 5. Limites et prochaine revue

- DOC-P6-C ne contient pas les définitions complètes des données ISO JSONL ni les champs réels d'un corpus de standards/éditions.
- Les fonctions de validation ne constituent pas un schéma JSON Schema complet ; certaines cardinalités et invariants demandent des tests.
- L'existence des huit tests `node:test` a été établie, pas leur succès ; ils ne démontrent pas la conformité ISO ou édition.
- L'export refuse certains graphes pour éviter des pertes ; ne pas traiter les relations comme supportées.
- Les informations du catalogue et de la révision doivent rester indépendantes de la caméra d'affichage.

**Prochaine opération conseillée :** valider ce rapport en tant que preuve documentaire, puis préparer une révision contrôlée des fichiers de baseline, avec diff et SHA-256 avant une installation documentaire autorisée.
