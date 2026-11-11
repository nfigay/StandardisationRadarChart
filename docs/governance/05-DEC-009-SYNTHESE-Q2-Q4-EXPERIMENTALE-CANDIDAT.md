# DEC-009 — Synthèse Q2/Q4 expérimentale — CANDIDAT — NON ADOPTÉ

Statut : **CANDIDAT — NON ADOPTÉ**.
Décision : **DEC-009 OPEN**.
Périmètre : analyse Q2 (réconciliation entre sources), Q4 (alias et références conjointes), interactions avec DEC-010, DEC-016, DEC-017 et DEC-018.

## 1. Objet et portée

Ce document consolide les audits statiques A1, A2, A3 transmis dans la conversation et les expériences B1-R2 et B2 conservées dans Downloads.

Il ne définit ni une identité ISO canonique, ni une politique métier adoptée, ni une migration de `standardId`.

Les audits A1–A3 sont des observations issues de rapports transmis ; leurs empreintes de rapports ne sont pas attestées par le présent staging. Les scripts et rapports expérimentaux B1-R2/B2 sont vérifiés par SHA-256 et contrôles de résultats.

## 2. Observations applicatives — A1/A2/A3

- `radar.html` charge un fichier ICS CSV via PapaParse et utilise les champs `identifier`, `titleEn` et `parent` pour la navigation W2UI. Il ne s'agit pas d'une identité d'édition ISO démontrée.
- `js/ics.js` lit des entrées JSONL et prépare des éléments graphiques de type node/edge. L'usage de `entry.data` ne démontre pas une réconciliation normative.
- `js/radar.js` contient une extraction expérimentale de métadonnées ISO (référence, édition, statut, stade, comité, ICS). Dans le chemin inspecté, le résultat est affiché en console ; aucune correspondance contrôlée vers `standardId` n'est démontrée.
- `js/radar-catalog-adapter.js` projette `standardId` dans `node.data.radarchart` et retourne `edges: []`.
- `js/radar-catalog-persistence.js` réutilise `r.standardId` lors de `toBlips()`, y compris pour un blip existant.
- L'interface possède un contrôle de résolution de `standardId` au catalogue, mais celui-ci ne vaut pas preuve d'identité ISO.
- Dans l'inventaire limité des tests A3, aucun test spécifique de réaffectation de `standardId` n'a été identifié. Cette absence de résultat ne prouve pas l'absence de tout test hors périmètre.

Aucun mécanisme complet de confirmation d'identité entre plusieurs sources, ni de gestion contractuelle des alias, n'est démontré par ces audits.

## 3. Expérience B1-R2 — 6 tests réussis

| Cas | Observation |
|---|---|
| B1-01 | Export draft inchangé conservé |
| B1-02 | Changement visuel, `standardId` conservé |
| B1-03 | Réaffectation `standardId` acceptée dans l'export draft |
| B1-04 | Published original préservé ; draft dérivé avec réaffectation |
| B1-05 | `standardId` manquant rejeté |
| B1-06 | Snapshot comportant une arête rejeté |

La comparaison initiale B1-01 a été corrigée dans le seul banc d'essai R2 pour normaliser les objets issus du contexte Node.js `vm`. Le module applicatif n'a pas changé.

## 4. Expérience B2 — 6 tests de résistance réussis

| Cas | Observation |
|---|---|
| B2-01 | Identifiant absent de `catalog.standards` accepté par la persistance ; signalé par le contrôle indépendant |
| B2-02 | Réaffectation vers un standard existant acceptée ; divergence non déclarée signalée |
| B2-03 | Archived original inchangé ; draft dérivé réaffecté |
| B2-04 | `assessmentId` modifiable indépendamment de `standardId` |
| B2-05 | `referenceId` ajouté sous `radarchart` non promu en champ du blip exporté |
| B2-06 | Le contrôle indépendant distingue une réaffectation déclarée d'une réaffectation non déclarée |

Dans B2-05, l'absence de promotion en champ de blip ne prouve pas une perte universelle des métadonnées supplémentaires, notamment si elles sont présentes dans `context` ou `extensions`.

Le validateur indépendant B2 n'est ni une autorité ISO, ni une politique d'autorisation métier.

## 5. Distinctions à préserver

1. Résolution d'un identifiant dans un catalogue et confirmation d'une identité normative sont deux propriétés distinctes.
2. Réaffectation techniquement acceptée et réaffectation autorisée sont deux propriétés distinctes.
3. Immutabilité de la révision publiée/archivée originale et immutabilité des associations d'un brouillon dérivé sont deux propriétés distinctes.
4. Correction d'une correspondance de source, réaffectation intentionnelle d'un blip et migration d'identifiants historiques sont trois opérations distinctes.
5. Alias de désignation, référence conjointe et identité commune entre deux notices ne sont pas synonymes.

## 6. Questions Q2 encore ouvertes

- Quel faisceau de preuves permet de confirmer qu'une notice source correspond à une référence ou à une édition déjà enregistrée ?
- Comment identifier les faux homonymes et les notices de granularité différente ?
- Quel registre de provenance conserve les identifiants de source, URL, dates, états et preuves ?
- Quelles conditions exigent une revue humaine, y compris lorsque la désignation semble identique ?

## 7. Questions Q4 encore ouvertes

- Quel statut donner à un alias textuel, à une désignation conjointe ISO/IEC et à une relation entre organismes ?
- Comment préserver l'orthographe source sans normalisation destructive ?
- Comment distinguer les alias attestés des hypothèses de rapprochement ?
- Comment conserver les relations documentaires sans dépendre exclusivement des arêtes Cytoscape ?

## 8. Dépendances de gouvernance

- **DEC-009 OPEN** : identité ISO, édition, preuve de correspondance et politique de refresh.
- **DEC-010 OPEN** : association blip→standard ou édition, gestion d'`assessmentId` et réaffectation.
- **DEC-016 OPEN** : identité et collisions entre catalogues multiples.
- **DEC-017 OPEN** : séparation source brute, normalisation, gouvernance et projection.
- **DEC-018 OPEN** : relations exportables indépendamment du graphe Cytoscape.

## 9. Limites et non-décision

Les expériences utilisent un catalogue fictif, des snapshots fictifs, le véritable module de persistance exécuté dans Node.js `vm` et des contrôles externes expérimentaux.

Elles n'exécutent pas toute l'interface W2UI/Cytoscape, ne valident pas un export par tous les composants applicatifs et ne vérifient aucune source ISO canonique.

Les douze tests B1-R2 et B2 sont réussis. Ces succès valident des observations expérimentales, et non la conformité métier du comportement constaté.

**Aucune option n'est adoptée.** Aucun `standardId` existant n'est renommé, réinterprété ou migré. Aucune révision historique n'est modifiée.

## 10. Suite proposée

Préparer des fixtures Q2/Q4 portant sur des notices de sources différentes, des alias attestés ou supposés, des désignations conjointes et des collisions de granularité. Leur validation doit être indépendante du simple libellé et ne doit pas imposer prématurément un modèle d'identité.

La présente synthèse demeure strictement documentaire et candidate.
