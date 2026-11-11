# START HERE — Stable project handover / future conversations

**Baseline ID:** `SRC-DOC-0.1` · **Last consolidated:** 2026-11-06 · **Current workstream:** `10G-UX-B1.4`, preparation stage; last completed diagnostic `B1.4-P2`.

## Product mission

Standardization Radar Chart is a browser-first, offline-first standards governance Viewer/Editor. It must enable a consortium (e.g. ASD SSG), an enterprise, and standards experts to identify relevant external standards, assess them in their own governance context, build interactive radars, track external alignment and internal adoption, and eventually connect decisions to enterprise architecture and interoperability evidence.

**Business invariant:** the authoritative identity/edition of a standard is not a blip and not a context-specific assessment. A standard may be represented in several radars with distinct positions and decisions.

## Non-negotiables

1. **No repository changes, patches, commits or deployments without a separately explicit user authorization.** Browser diagnostics must be read-only unless separately authorized.
2. Diagnostic DevTools scripts include a **one-click button copying the full JSON report**; no second manual copy step.
3. **W2UI-first:** W2UI owns panel layout, navigation, visibility and resize lifecycle; do not invent a parallel layout manager or independent ResizeObserver controlling panels.
4. SVG/D3 owns radar geometry, labels and exportable infographic; Cytoscape owns interactive graph/blips. A single logical coordinate contract governs both.
5. Preserve node coordinates, stable IDs, revision integrity and draft/published protections; never call legacy random `plotData()` on a resize.
6. Preserve browser/offline-first and open file interchange; avoid mandatory application servers or installed executables.
7. Distinguish **evidence / proposals / decisions / implementation / validation**. Do not mark proposed functionality delivered.

## Verified current baseline (source snapshot + browser reports)

- `radar.html`: W2UI `mainLayout` (`top`, `left`, `main`, `right`, `bottom`); left workspace explorer and hidden toolbar; main radar plus internal `#sidebar`; right contextual forms.
- Radar CSS uses nominal 800×800 and `transform: scale(0.75)`; SVG and Cytoscape layers overlay inside `#radar-container`.
- `js/radar.js`: `drawSVG()` rings 150/250/350 and four quarter labels via SVG `foreignObject`; `plotData()` random placement for legacy blips and calls `cy.fit()`.
- Catalog revisions include `radarRevisions`, `organizations`, `standards`, `portfolios`, optionally `assessments`; each blip requires `blipId`, `standardId`, `ring`, `quadrant`, `position`, optionally `assessmentId`.
- Catalog adapter projects revision blips into Cytoscape with `data.radarchart` metadata; catalog UI blocks editing published/archived revisions; persistence produces a derived draft if a published/archived revision differs. The exact paths of all user commands still require validation.
- B1.3-D: 26 nodes retained, zero changed model coordinates; W2UI main width 1352→510px, SVG/Cy center separation 9.13→123.75px; responsive misalignment **confirmed**.
- B1.4-P2: Cytoscape v3.30.2; camera at zoom 1/pan 0,0; zoomingEnabled/panningEnabled/userZoomingEnabled/userPanningEnabled all false; graph internal size 765×800 matches its CSS client dimensions, while parent is `scale(.75)`.

## What remains OPEN

- Exhaustive live source inventory; ISO dataset schema, source attribution, refresh strategy, edition identity, identifiers, ICS search/index performance; details of `#cy2-container` and internal `#sidebar`; all import/export pathways; publication/EA links.
- Shared viewport implementation: proposal is 800×800 logical model and W2UI-triggered scale/pan; verify actual Cytoscape programmatic camera behavior and all `fit()` call paths before making changes.
- Workflows and scope of comparison/analytics, user interaction scenarios, authority for governance decisions.

## Next steps, in order

1. Review/accept this documentation baseline and unresolved decisions; no code edits.
2. Complete missing ISO/source and import/export inspections, using one-click read-only reports, and update evidence register.
3. Authorize a **separately scoped** B1.4-A pure geometry module + tests, then B/C/D integrations with explicit gates.
4. Implement ISO research `w2grid` in W2UI main workspace, then selected-items basket, ISO-standard → contextual assessment → blip creation in draft revisions.
5. Contextual sheets, comparison/analytics, publication/export and EA links, each validated against requirements.csv.

## How to work in another conversation

Provide this file, `01-ANALYSE-EXISTANT.md`, `02-SPECIFICATION-CIBLE.md`, `01-DECISIONS.md`, `requirements.csv`, and current code audit/log. Ask the assistant to **first state its evidence baseline**, identify any requirement IDs in scope, and obtain separate approval before altering code. After work, update requirements statuses, evidence and an implementation log with tests and observed results. Never infer that an old audit represents the current checkout.

## Session handoff template (fill after each development session)

- Git commit/branch inspected: **NOT PROVIDED**
- Change authorization: **NONE**
- Source changes since this baseline: **UNKNOWN**
- Requirement IDs tackled: **NONE**
- Tests run / results: **NONE**
- Evidence/diagnostic new report: **B1.4-P2** (last received)
- Next permitted action: **documentation review / read-only gap audit**

## DOC-P0 — Git local, 2026-11-06

Le rapport DOC-P0 communiqué par l'utilisateur établit que `docs/` est absent et que l'arbre de travail contient des fichiers modifiés et non suivis. **Interdire toute commande Git destructive ou opération de remplacement automatique.** La documentation est préparée dans un dossier de staging et peut être ajoutée après validation explicite. Voir `../evidence/02-DOC-P0-REPO-AUDIT.md`.

**Contrat d'outillage : Node.js et Bash, sans Python ou Perl pour ce projet.** Audits en lecture seule ; SHA-256, rapports exploitables ; pas de commit, push ou déploiement sans autorisation distincte.


## DOC-P5 / DOC-P6 — État constaté au 6 novembre 2026

- **DOC-P5-R1 : installation locale réussie**, selon le rapport transmis : 13 fichiers créés, 13 SHA-256 vérifiés, aucun rollback. Ils sont encore non suivis dans Git (`?? docs/`, `?? DOCS-BASELINE-README.md`, `?? README-DOC-BASELINE.md`) tant qu'aucun `git add`/commit distinct n'a été autorisé.
- **DOC-P6-A :** 49 exigences retrouvées sans doublon ni divergence d'ID entre spécification et CSV, 38 fichiers inspectés statiquement ; aucun test lancé.
- **DOC-P6-B :** contrats et déclarations repérés pour catalogues, révisions, import ISO, intégrité, export et viewport.
- **DOC-P6-C :** 12 constats vérifiables par extraits exacts (`OBS-P6-01..12`) et risques explicités dans [le rapport DOC-P6](../evidence/03-DOC-P6-C-REVUE-CONTRATS.md).
- **DOC-P7 :** patch documentaire consolidé préparé en staging, **non installé** et non approuvé.

**Base Git auditée :** branche `main`, HEAD observé `6f20f28`, arborescence de travail modifiée/non suivie. Ce n'est pas un inventaire d'un commit propre ; tout changement ultérieur requiert un nouvel état Git.

**Prochaine étape métier :** arbitrage des contrats ISO (organisme/norme/partie/édition, provenance, jeu réel), puis définition/test des round-trips `catalog → Cytoscape → catalog`. **Prochaine étape technique distincte :** seulement après autorisation, chantier `B1.4-A` de géométrie pure et tests.

**Rappel du contrat d'intervention :** Node.js/Bash ; audit lecture seule, staging, diff et SHA-256, approbation explicite avant installation ; backup et rollback pour remplacements ; jamais de `git commit`/`push` implicite.
