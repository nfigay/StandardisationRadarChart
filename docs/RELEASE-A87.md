# Standardization Radar Chart — A8.7

Statut : publiée et qualifiée / Published and qualified.

Tag: pilot-a87.

## Français

A8.7 étend A8.6 par une gestion homogène
des références de standardisation : ISO Open Data,
RFC Editor, W3C et déclarations locales.

Le Creator permet la recherche, la sélection
et l’intégration explicite des publications.
Les références utilisées sont protégées.
Les références inutilisées peuvent être supprimées,
actualisées ou réconciliées selon leur source.

Les identifiants métier sont conservés.
Le format natif de catalogue reste en version 1.0.0.

Le Publisher produit des Viewers HTML autonomes
et des livraisons ZIP avec manifeste d’intégrité.
Les informations privées de réconciliation ne sont
pas transmises à la projection publiée.

Le Viewer fonctionne sans acquisition documentaire
externe, sans corpus ISO global et sans commande auteur.

### Accès aux sources

Les acquisitions externes sont explicites et facultatives.
Aucun téléchargement RFC/W3C au démarrage.

Si les services distants sont indisponibles, notamment
en cas de restriction CORS, le dépôt permet une
acquisition Node.js suivie d’un accès Web local :

```sh
node tools/sync-standard-sources.mjs rfc-editor w3c w3c:json-ld11
npm run dev
```

Le répertoire standard-source-cache est local,
ignoré par Git et non distribué par défaut.
Le serveur Vite local permet au Creator de le consulter.

Cette solution ne constitue pas un import direct de
fichier documentaire dans le site GitHub Pages ou
dans le Creator HTML autonome.

### Limites

- Réconciliation ISO non incluse.
- Pas de migration automatique entre éditions.
- DEC-009 et DEC-010 restent ouvertes.
- Workspace et convergence SPM hors périmètre.
- Les six variantes de l’application commune
  ne sont pas toutes distribuées.

## English

A8.7 extends A8.6 with a unified approach to
standardization references: ISO Open Data,
RFC Editor, W3C and local declarations.

The Creator supports explicit source acquisition,
search, selection and integration of publications.
Used references are protected. Unused references
can be removed, updated or reconciled when supported
by their source and lifecycle rules.

Business identifiers remain stable.
The native catalog format remains version 1.0.0.

The Publisher generates standalone HTML Viewers
and ZIP deliveries with integrity manifests.
Private reconciliation history is excluded
from published projections.

Published Viewers require no external documentary
acquisition, no global ISO catalog and no author controls.

External source acquisition is explicit and optional.
Availability depends on remote services and browser
cross-origin policies.

If remote access fails, the Node.js acquisition tool
can produce snapshots for a local HTTP Creator.
Direct portable snapshot file import into the public
site or standalone Creator is not provided in A8.7-RC.

ISO reconciliation, automatic edition migration,
DEC-009/DEC-010, Workspace and SPM convergence
remain outside this release scope.

## Qualification

S15 functional baseline:
03474a66da02f57bcf5184b605b994ca5bc06c99.

645 Node.js tests, 53 component browser checks,
60 final qualification checks including reused evidence.

See evidence/14-S15-D-FINAL-VALIDATION.md.

The A8.7 release candidate must be rebuilt and
qualified from its own committed source.

## A8.7 — Clôture de la release publiée

15 novembre 2026 : A8.7 publiée et qualifiée.

- Source : 545ed539df2e117a8aab5158a4bcc5c151308ba3.
- Pages : 1eb772603268a48b653e0bde36187a6b7e15e143.
- Tag : pilot-a87.
- 645/645 tests Node.js.
- 50/50 contrôles candidat A8.7-RC.
- 46/46 contrôles publics.

Creator Web, Creator autonome, Publisher et Viewer
publié qualifiés avec les véritables distributions.
Acquisitions RFC Editor et W3C directes validées
sur le site public sans cache documentaire local.

A8.7 remplace A8.6 comme baseline stable.
Les versions historiques restent accessibles.

S15-A/B/C/D et livraison A8.7 sont clos.
DEC-009 et DEC-010 restent ouvertes.
Aucun nouveau chantier métier n’est engagé
par cette clôture documentaire.

Release: https://github.com/nfigay/StandardisationRadarChart/releases/tag/pilot-a87
