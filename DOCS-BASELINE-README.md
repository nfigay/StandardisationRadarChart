# Standardization Radar Chart — Documentation baseline

**Baseline:** `SRC-DOC-0.1` · **Date:** 2026-11-06 · **Status:** working baseline / review required · **Language:** French, technical identifiers in English.

> This package is a **documentation proposal**, not a modified copy of the Git repository. Copy `docs/` and `README-DOC-BASELINE.md` into the repository after review. No source code, deployment or Git operation has been performed.

## Read in this order

1. [Start here / cross-conversation handover](docs/governance/00-START-HERE.md): stable context, constraints, what's next.
2. [Consolidated analysis](docs/architecture/01-ANALYSE-EXISTANT.md): **AS-IS, evidence and gaps**, no premature solution claims.
3. [Consolidated specification](docs/architecture/02-SPECIFICATION-CIBLE.md): **TO-BE, requirements and acceptance criteria**.
4. [Decision register](docs/governance/01-DECISIONS.md): what is decided, proposed or open.
5. [Traceability matrix](docs/requirements/requirements.csv): requirements -> source -> changes -> tests -> status.
6. [Verification and migration](docs/quality/01-VALIDATION-MIGRATION.md): tests, regression, rollout and review.
7. [Evidence register](docs/evidence/01-SOURCES-ET-CONFIANCE.md): source provenance and limits.

## Structural rule: four kinds of statement

- **OBS** (observation): observed in archived source or runtime report, with exact evidence.
- **REQ** (requirement): desired, verifiable target behavior, never described as existing.
- **DEC** (decision): adopted / proposed / open; proposed decisions are not authorization to implement.
- **VER** (verification): test to execute and record as PASS / FAIL / BLOCKED; never premark as PASS.

The analysis file contains observations and gaps. The specification file contains normative requirements, acceptance and design constraints. Architecture decisions, verification and status live in their own files. **Do not use this draft documentation to assert that future modules have already been delivered.**

## Scope

Viewer/Editor overall: W2UI workspace and contextual sheets; ISO standards browsing and selection; stable relation between ISO standards, contextual assessments and radar blips; radar editions/revisions; D3/SVG and Cytoscape viewport; analysis and comparison; import/export, provenance, integrity, offline-first browser deployment; Vite modularization; future enterprise architecture linking.

## Baseline limitations

The project files supplied here are a source snapshot `RadarChart-Audit-20261105-143446.zip` (2026-11-05) and browser reports B1.3-C/D, B1.4-P0/P1/P2 (2026-11-06). This is **not** an exhaustive verification of the entire live Git tree, ISO source data, or end-to-end UI. Complete inventory and test work remain mandatory. Functional and architectural completeness of scope is distinct from source-code verification completeness.

## Git integration suggested

Copy only the `docs/` subtree and optionally this file as `README-DOC-BASELINE.md`. Do not overwrite the project's root README without review. Use a separate documentation commit only after explicit approval. Keep `docs/governance/00-START-HERE.md` as the stable entry point for future conversations and update the matrix after **every accepted implementation step**.
