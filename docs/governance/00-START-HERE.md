# START HERE — Référentiel courant du projet

<!-- S14.3-A8.5-CURRENT -->

## 1. État de référence — 14 novembre 2026

- Distribution publique A8.2 : `pilot-a82`, source `0b14a418b3e5a206a4611b8f6cd86887b5f8449d`, Pages `ed814d6da7d57dc2324ea26b68cea1659d0c227d` ; 532 tests.
- A8.3 : commit local `94aef3e0c73b866dcceb5844044a1a93e106e299`, 552 tests ; définitions chargées dans Chrome.
- A8.4 : 568 tests, construction et recette Creator → projection JSON → Viewer réussies ; qualification documentée dans architecture 84 et preuve 05.
- A8.5-R1 : qualifiée pour le parcours Publisher → Viewer HTML, 585 tests et recette Chrome 9/9 ; preuve 06.
- A8.6 : candidat, génération ZIP vérifiée et registre de livraison. A8.6-R1 : correctif candidat Viewer centré sur le radar (fiche dans left, périmètre figé, une révision par radar) ; recette navigateur, ZIP réel, hors connexion et persistance à qualifier. A9 : composition physique et autres modes.

Le HEAD et l'état de travail réels doivent être lus dans Git avant toute intervention.
A8.2 reste la version publique jusqu'à décision et publication distinctes.
Les états historiques plus bas ne sont pas la baseline courante.

## 2. Documents à lire en priorité

1. [Architecture commune 79](../architecture/79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md)
2. [Guidelines Creator/Publisher et Viewer](GUIDELINES-CREATOR-PUBLISHER-VIEWER.md)
3. [Plan de réalisation S14.3](PLAN-REALISATION-S14-3-CREATOR-PUBLISHER-VIEWER.md)
4. [Registre des décisions](01-DECISIONS.md)
5. [Checklist de revue](02-REVIEW-CHECKLIST.md)
6. [Matrice des exigences](../requirements/requirements.csv)
7. [Spécification cible](../architecture/02-SPECIFICATION-CIBLE.md)
8. [Architecture de distribution 77](../architecture/77-S14-3-DISTRIBUTION-GH-PAGES.md)
9. [Modèle et projection 83/84](../architecture/83-S14-3-PUBLICATION-MODEL.md) — [projection](../architecture/84-S14-3-NATIVE-PUBLICATION-PROJECTION.md)
10. [Publisher 85](../architecture/85-S14-3-PUBLISHER-UI-AND-PREVIEW.md) — [preuves A8.4](../evidence/05-A84-CREATOR-VIEWER-VALIDATION.md) — [preuve A8.5-R1](../evidence/06-A85-R1-PUBLISHER-VALIDATION.md)

Les documents historiques restent des sources de
preuve et de contexte.

En cas de contradiction sur la séparation Creator,
Publisher et Viewer, la décision S14.3-A8.0 prévaut.

11. [Livraison autonome 86](../architecture/86-S14-3-STANDALONE-PUBLICATION-DELIVERY.md)
12. [Viewer publié centré sur le radar 86-R1](../architecture/86-R1-S14-3-RADAR-CENTRIC-PUBLISHED-VIEWER.md) — [preuve 07 et recette](../evidence/07-A86-R1-RADAR-VIEWER-CANDIDATE.md)

## 3. Mission du produit

Standardization Radar Chart est une application
browser-first et offline-first de gestion,
d'évaluation et de publication de connaissances
relatives à la standardisation.

Elle permet notamment à des consortiums,
entreprises et experts de maintenir leurs catalogues,
évaluer les normes, construire des roadmaps et
distribuer des espaces de consultation adaptés.

Le Creator et le Publisher constituent une seule
application et un même environnement de travail.

Les acteurs qui construisent les catalogues et
les roadmaps préparent également les publications.

Le Creator/Publisher génère des Viewers configurés
à partir du même socle applicatif et du même
modèle métier natif.

Les capacités, composants logiciels et données
distribuées sont sélectionnés selon les besoins
des destinataires.

## 4. Principes non négociables

1. Autorisation explicite avant modification,
   commit ou déploiement. Une décision d'architecture
   ne vaut pas autorisation implicite de coder.

2. Réutilisation des composants existants avant
   création d'un composant équivalent.

3. W2UI-first : W2UI possède le layout, les panneaux,
   leur visibilité et le cycle de redimensionnement.

4. SVG/D3 possède la géométrie et les éléments
   graphiques du radar ; Cytoscape possède le graphe
   interactif et les blips. Le repère logique est commun.

5. Préserver les coordonnées, les identifiants,
   les relations, les protections des révisions et
   les invariants du modèle métier.

6. Ne pas utiliser un placement aléatoire historique
   pour répondre à un redimensionnement du viewport.

7. Préserver les usages navigateur et hors ligne,
   ainsi que les formats d'échange ouverts.

8. Distinguer la norme, son édition, l'évaluation
   contextuelle et le blip.

9. Contrôler les capacités dans les services
   applicatifs, et non uniquement dans l'interface.

10. Filtrer les données avant leur distribution
    et vérifier la fermeture des références.

11. Distinguer masquage UI, contrôle d'exécution
    et exclusion physique des modules.

12. Ne pas confondre preuves, propositions, décisions,
    implémentations et validations.

13. Ne pas publier de données confidentielles
    sur GitHub Pages public.

## 5. État fonctionnel et technique

Les lots S13, S14, S14.1 et S14.2 ont établi
les mécanismes historiques de création, de révisions,
de catalogue ISO et de consultation.

Les travaux S14.3-A1 à A7 ont introduit
les projections publiées et l'infrastructure
de distribution multi-produits.

Les réalisations suivantes restent des acquis :

- gestion du catalogue ISO ;
- navigation et recherche dans le catalogue ;
- cycle de vie des révisions ;
- projection du modèle métier ;
- viewport commun W2UI/SVG/Cytoscape ;
- construction Vite ;
- séparation main et gh-pages ;
- manifestes d'intégrité ;
- publication atomique fast-forward ;
- préservation du radar PLM historique.

Les trois variantes techniques du Client A6/A7
sont construites et publiées.

Toutefois, leur moteur HTML/SVG spécifique
constitue un prototype expérimental.

Ce prototype n'est pas le Viewer cible.

Son développement fonctionnel est gelé au profit
de la réutilisation de l'application historique.

La recette navigateur complète reste à terminer,
notamment l'export depuis le Creator et l'usage
des paquets dans les trois variantes.

Les réponses HTTP 503 rencontrées lors de contrôles
négatifs sont des vérifications non concluantes,
et non une preuve de présence des fichiers attendus absents.

## 6. Prochain chantier autorisable

A8.5-R1 : parcours Publisher et Viewer préchargé qualifiés (preuve 06).
A8.6 : qualification de l'HTML autonome préchargé, contrôle d'intégrité des
artefacts et enregistrement de la livraison. A9 : composition physique et
modes Web, puis convergence. Voir le plan actualisé.

## 7. Suite de la réalisation

- A8.3/A8.4 : modèle natif des publications
  et projection configurable des connaissances.
- A8.5 : Publisher intégré et prévisualisation.
- A8.6 : Viewer autonome préchargé et qualification des livraisons.
- A9.1/A9.2 : sélection des modules et trois
  distributions Viewer.
- A9.3 : trois distributions Creator/Publisher.
- A10 : qualification intégrée et substitution
  du prototype Client.

Les lots peuvent être regroupés en interventions
fonctionnelles cohérentes.

Chaque intervention doit produire du code,
des tests et une contribution architecturale,
sauf lorsqu'elle est explicitement documentaire.

## 8. Contrat d'intervention

Outillage : Node.js et Bash.

Les diagnostics sont en lecture seule, sauf
autorisation explicite de modification.

Les scripts vérifient leurs préconditions.

Les fichiers modifiés font l'objet d'une sauvegarde
et d'une sélection Git explicite.

Les données de travail, caches ISO et sauvegardes
locales ne sont pas supprimés sans autorisation.

Les rapports Terminal sont copiables intégralement.

Les diagnostics DevTools prévoient un mécanisme
de copie du rapport JSON complet.

Avant chaque lot :

- identifier le commit réellement inspecté ;
- identifier les exigences concernées ;
- préciser le périmètre autorisé ;
- examiner les composants et contrats existants ;
- annoncer les critères d'acceptation.

Après chaque lot :

- rapporter les modifications ;
- rapporter les tests effectivement exécutés ;
- distinguer build, publication et recette navigateur ;
- actualiser l'architecture et le plan ;
- enregistrer les preuves disponibles ;
- identifier les limitations restantes.

## 9. Reprise dans une autre conversation

Fournir ce document, l'architecture 79,
les guidelines, le plan de réalisation,
le registre des décisions et les exigences.

Fournir également le rapport Git courant,
les résultats des derniers tests et les
éventuelles modifications locales.

Le nouveau contexte doit utiliser le prochain
chantier indiqué dans le plan de réalisation,
et non reprendre automatiquement une ancienne
étape figurant dans l'historique.

## 10. Session handoff

- Référence publique : A8.2 (0b14a41 / ed814d6).
- Référence locale avant A8.4 : A8.3 (94aef3e).
- Dernière validation réelle : 585/585 et recette Chrome A8.5-R1 9/9.
- Action suivante : qualification A8.6, ZIP et persistance, recette hors connexion.
- Fournir l'instantané Git et les rapports complets ; ne pas reconstruire les sources à l'aveugle.
- Aucun push ni nouvelle publication sans étape dédiée.

## 11. Historique antérieur

Le contenu suivant est conservé pour sa valeur
historique et documentaire.

Il ne décrit plus l'état courant du projet.

Ses indications de prochaine étape, ses anciens
états Git et ses anciennes lacunes de réalisation
ne doivent pas être interprétés comme des
instructions actuelles.

---

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

## Mise à jour 15 novembre 2026 — A8.6-R2

Baseline R1 qualifiée partiellement par l'utilisateur : 600 tests, retéléchargement sans mutation confirmé, ISO en prévisualisation restant. Candidat R2 : [architecture](../architecture/86-R2-S14-3-PUBLICATION-CONFIGURATION-AND-PREVIEW.md), [recette](../evidence/08-A86-R2-PUBLISHER-CANDIDATE.md). Workspace reporté, priorité à la publication puis aux évolutions métier.
Actualisation A8.6-R2-H1 : baseline R2 validée 602/602 sur Mac, navigation blob:null en échec navigateur (URL relative et WebCrypto). Correctif : téléchargement du HTML de prévisualisation puis ouverture locale, contrôles d’intégrité inchangés. Recette navigateur encore requise. Workspace reporté.

## Finalisation A8.6 — décision du 15 novembre

H1 `9c3bc4f` qualifié par 602 tests et 11 contrôles Safari. Unifier la consultation HTML autonome (un bouton, pas de livraison), conserver le ZIP distinct ; recette delta avant publication. La vraie prévisualisation autonome sans téléchargement et le Workspace restent reportés. A8.2 reste publique tant que la release A8.6 n’est pas publiée.


## A8.6 — qualification finale et préparation de publication (2026-11-15)

Baseline applicative `f7939c362cd9343cd92b6087235b8a29d2c06765` : 602 tests et recette finale 6/6, après H1 11/11. Voir `docs/evidence/09-A86-FINAL-QUALIFICATION.md`. Publication préparée avec le tag `pilot-a86`, portail actualisé, anciens liens et Client conservés. Aucun statut publié avant contrôle distant. Workspace et convergence SPM reportés. Consultation autonome HTML acceptée.
