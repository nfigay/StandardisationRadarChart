# DOC-P0 — Audit de l’arborescence Git (2026-11-06)

**Provenance :** rapport exécuté par l’utilisateur dans son dépôt local, transmis le 2026-11-06. **Niveau :** preuve utilisateur, non vérifiée par un accès direct au dépôt depuis l’environnement de génération.

## Faits observés

- Branche : `main`.
- Un seul document Markdown suivi à la racine : `README.md`; également `css/theme/README.md`.
- Aucun répertoire `docs/` à la date de l’audit.
- Arbre de travail **non propre** : `M js/radar.js`, `M radar.html` et plusieurs chemins non suivis (modules, `src/`, `tests/`, `scripts/`, `package.json`, `vite.config.js`, `node_modules/`, `.radarchart-build/`).
- Il est interdit de remplacer ou nettoyer ces éléments lors de l’intégration de la documentation.

## Décision d'intégration

La baseline documentaire est fournie en **staging**, sans écriture dans le dépôt utilisateur. L'intégration doit être additive, contrôlée par comparaison des chemins et SHA-256, puis approuvée explicitement avant toute copie. Aucun `git add`, commit, push, reset ou clean n'est inclus dans le processus.

## Suivi

- DOC-P0 : réalisé d'après le rapport utilisateur.
- DOC-P1 : package de staging Node/Bash préparé.
- DOC-P2 : vérification à réaliser dans l'environnement Git local avant intégration.
- DOC-P3 : revue et accord explicite de l'utilisateur avant installation.
- DOC-P4 : installation avec protection des collisions et rollback, **non autorisée à ce stade**.
