# Registre des preuves et limites de couverture

## Classification

- `SOURCE-STATIC`: source de fichiers observée, photographie datée.
- `RUNTIME-OBS`: diagnostic navigateur observé à une date/état particuliers.
- `BUSINESS-SOURCE`: document de cadrage métier, non preuve d'implémentation.
- `PROPOSAL`: conception proposée, non vérifiée.

| Code | Type | Source | Ce qu'elle supporte | Limites |
|---|---|---|---|---|
| EV-001 | SOURCE-STATIC | `RadarChart-Audit-20261105-143446.zip` (2026-11-05) | `radar.html`, `js/radar*.js`, `package.json`, `src`, tests | Pas de commit Git associé; photographie historique |
| EV-002 | RUNTIME-OBS | `Texte collé(20261106-130650).txt` / B1.3-C | `drawSVG`, `plotData`, module `getZone` | Extraits Vite, source map incluse; pas d'interaction |
| EV-003 | RUNTIME-OBS | `Texte collé(20261106-131150).txt` / B1.3-D | Misalignment mesuré après changement de layout et stabilité des positions | Fenêtre aussi redimensionnée; 26 nœuds, scénario unique |
| EV-004 | RUNTIME-OBS | `Texte collé(20261106-131913).txt` / B1.4-P0 | CSS, propriétaires, éléments et scripts runtime | 5 fichiers interrogés, pas tout dépôt |
| EV-005 | RUNTIME-OBS | `Texte collé(20261106-132136).txt` / B1.4-P1 | Blocs W2UI/Cy et références `fit()` dont revision-session | 6 modules supplémentaires + extraits ciblés |
| EV-006 | RUNTIME-OBS | JSON B1.4-P2 collé le 2026-11-06 | Cy version 3.30.2, dimensions, options, CTM SVG | Read-only; ne prouve pas les setters |
| EV-007 | BUSINESS-SOURCE | `ASD SSG Radar Chart presentation to GIFAS 20260401.pptx` | Motivation, acteurs, radar factory, EA, processus | Vision, non état logiciel vérifié |
| EV-008 | SOURCE-STATIC | `RadarChart-UX-STATE-01-catalogue-test-corrige.json` | Exemple de catalogue de test (à inspecter avant usage pour fixture) | Pas un schéma ISO complet |

## Preuves de premier ordre et références de code

- `radar.html` lignes approx. 65–100 (CSS), 1604–1648 (layout), 1866–1875 (resize), 2071–2091 (Cytoscape).
- `js/radar.js` 11–25 (sélection), 247–394 (SVG), 397–450 (blips et `cy.fit()`).
- `js/radar-catalog-adapter.js` (projection et `data.radarchart`).
- `js/radar-catalog-ui.js` (validation des références et verrouillage published).
- `js/radar-catalog-persistence.js` (export, draft et limite mono-catalogue).
- `js/radar-revision-session.js` (snapshot/restore, `graph.fit()`).
- `js/radar-artifact-integrity.js` (sorted-json-v1 + WebCrypto SHA-256).

## Audit complémentaire nécessaire pour clôturer l'exhaustivité

- `GAP-AUD-01`: inventaire complet HEAD Git, scripts, CSS, tests, workflow build et vues alternatives.
- `GAP-AUD-02`: schéma des jeux ISO/ICS/comités; provenance/licences, identifiants versionnés, refresh, correspondances, index et temps de réponse.
- `GAP-AUD-03`: inventaire de tous les formats import/export, options de menu, cycle draft/publish et capture de fixtures réelles.
- `GAP-AUD-04`: comportement des contextual sheets, formulaires et events Cytoscape, `#cy2-container`, `#sidebar`.
- `GAP-AUD-05`: expérience E2E multi-radars/multi-catalogues et interaction avec EA.

## Règle de mise à jour

Après chaque inspection, ajouter identifiant, date, source, commit si connu, méthode, ce qui a été vérifié, limites. Ne pas remplacer une preuve par une interprétation dans l'analyse. Ne jamais copier dans Git des données sensibles, jetons ou chemins personnels inutiles.
