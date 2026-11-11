# Validation, migration et suivi d'implémentation

**Status:** plan proposé; **no tests in this plan have been run** as part of producing this documentation.

## 1. Gates de réalisation

| Gate | Condition d'entrée | Sortie vérifiable | Autorisation |
|---|---|---|---|
| G0 — Baseline documentaire | Analyse + spécification + matrices disponibles | Relecture, décisions ouvertes assignées | Documentation only |
| G1 — Audit restant | Sources ISO/import-export/Git HEAD accessibles | Preuves et exigences corrigées | Read-only |
| G2 — Viewport pur | DEC-005 validée | Module pur + tests mathématiques; pas de DOM | Approbation explicite distincte |
| G3 — Intégration viewport | G2 tests verts, P2 camera protocol validé | W2UI resize adapter + SVG/Cy sync | Approbation explicite distincte |
| G4 — ISO browser | Identité ISO, index et critères UX validés | w2grid ISO, filtres, sélection persistante | Approbation explicite distincte |
| G5 — ISO→draft blips | Schéma migration et protection révisions approuvés | Ajout contrôlé, round-trip, aucune régression | Approbation explicite distincte |
| G6 — Consolidation | UCs/analyses/exports validés | E2E, documentation et tests de build | Approbation explicite distincte |

## 2. Jeux de test à constituer

- `FX-VP-01`: 800×800, 765×800, 510×583, 1352×583, 350×800, grands et petits panneaux.
- `FX-VP-02`: 8 puis 26 blips répartis sur les zones, sélection vide puis active, positions avant/après et révisions distinctes.
- `FX-ISO-01`: standards avec plusieurs éditions, versions remplacées, ICS multiples, comité renseigné/inconnu, caractères non ASCII et champs absents.
- `FX-ISO-02`: 1 référence ambiguë, 1 introuvable, 1 doublon, 1 remplacement incomplet.
- `FX-CAT-01`: `draft`, `published`, `archived`, une révision non sélectionnée, changement de groupe et export/import.
- `FX-CAT-02`: catalogue avec plusieurs radars, et deux catalogues importés pour tester limitation actuelle et évolution choisie.
- `FX-EXP-01`: titre long, 4 labels de quadrants, légende, blips, liens optionnels, provenance.

## 3. Tests à couvrir

| VER | Validation | Méthode | Acceptance |
|---|---|---|---|
| VER-VP-01 | Calcul pur `s`, pan | Node unit | valeurs exactes / epsilon documenté |
| VER-VP-02 | Alignement SVG-Cy | Chrome browser fixture | écart centres et rayons <1 px après layout stable |
| VER-VP-03 | Invariants resize | Avant/après JSON | aucun nœud, modèle, sélection, révision modifié |
| VER-VP-04 | Camera lock | Cycle W2UI + interactions utilisateur | contrôle app possible, pas de pan/zoom utilisateur |
| VER-ISO-01 | Champs/index ISO | Fixtures + vrai jeu | correspondances correctes, zéro fausse édition |
| VER-ISO-02 | Performance w2grid | Chronométrage sur vrai jeu | budget à approuver, pas de DOM massif |
| VER-BLP-01 | Sélection ISO→draft | E2E UI+export JSON | identifiants/relations/révisions conservés |
| VER-BLP-02 | Publié protégé | E2E UI/exports | published/archived inchangés, nouveau draft tracé |
| VER-MIG-01 | Réconciliation legacy | Fixtures ambiguës | aucune auto-association erronée |
| VER-EXP-01 | Export autonome | ouvrir SVG/raster hors app | blips + titres + légendes + provenance visibles |
| VER-ANA-01 | Diff revisions | Oracle comparatif | ajout/retrait/mouvement qualifiés, données manquantes signalées |
| VER-EA-01 | Link out EA | Tests de référence | lien typé et cible cohérents; non duplication |
| VER-BUILD-01 | Source/build | `npm run verify:source`, `npm run build`, `npm run verify:build`, pages | commandes réussies dans contexte déclaré |

## 4. Migration et compatibilité

1. Capturer l'état Git et les exports originaux avant intervention; créer fixtures **non sensibles**.
2. Privilégier additive schema + adaptateurs, à défaut changement de `schemaVersion` explicitement versionné.
3. Pour chaque blip legacy, établir mapping conservant ID historique et standardId candidat, provenance et niveau de certitude; revue humaine si collision, label ambigu ou édition manquante.
4. Ne pas changer implicitement un `published`/`archived`, ni les snapshots de session ni l'intégrité de manifeste.
5. Vérifier les formats importés/exportés historiques, et les cas `imports.length !== 1` actuellement refusés.
6. Un rollback consiste à revenir au commit antérieur **et** restaurer les artefacts d'origine; aucun script destructeur par défaut.

## 5. Journal d'implémentation (à renseigner, ne rien présupposer)

| Date | Exigences | Commit/branch | Description | Tests, résultats | Décision / approbateur | État |
|---|---|---|---|---|---|---|
| 2026-11-06 | DOC only | aucun | Documentation baseline v0.1 proposée, hors dépôt | Vérification fichiers internes seulement | À approuver | Proposed |

**Reporting:** une exigence n'est `implemented` que si un code change identifié existe; elle n'est `verified` que si un test/document probant daté existe. Décrire les régressions et les limites, pas seulement un « vert » global.

## Lot 1 — moteur de création (2026-11-07)

Implémentation candidate dans `js/radar-catalog-creation.js` et `js/radar-catalog-persistence.js`, documentée dans `docs/architecture/04-LOT1-MOTEUR-CREATION.md`. Tests sous `tests/radar-catalog-creation.test.mjs` : commandes standard existant/nouveau, statuts interdits, collisions, références, rollback, navigation de session, et Cytoscape réel headless. Contrôles source et suite complète requis avant application. Ce résultat ne vaut pas validation navigateur ni round-trip complet JSON/SSR/CSV.
