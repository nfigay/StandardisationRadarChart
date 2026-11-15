# A8.7 — Architecture de préparation de release

Statut : release publiée et qualifiée publiquement.

Baseline documentaire S15-D : df66a17eb6ee73d47501ae453dca6b80b5f6a4ee.

## 1. Périmètre

Le moteur métier qualifié S15-C est inchangé.
La préparation A8.7 actualise la distribution,
le portail, les notes de release et la qualification.

## 2. Harnais unifié

tools/qualification/a87-qualify.mjs dérive du
harnais historique S15-D-R2 authentifié.

Le commit candidat complet est fourni en argument.
Une copie Git isolée est construite avec Node.js
et npm. Le dépôt utilisateur reste intact.

Les contextes Chrome sont indépendants :

1. Creator Web et sources locales qualifiées.
2. Creator autonome et Publisher.
3. Viewer publié autonome.
4. Test des sources sur l’origine publique Pages.

Les trois premiers contextes réexécutent
les assertions métier S15-D.

Les contextes autonomes interdisent les requêtes
HTTP(S). Les empreintes des distributions,
de la projection et des livraisons sont contrôlées.

## 3. Accès documentaire public

L’adaptateur exact du candidat est exécuté dans
la page publique existante de nfigay.github.io.
Il réalise ses acquisitions directes et valide
les index et historiques avec le moteur natif.

Ce test conserve les politiques CORS de Chrome.
Aucun proxy ni désactivation de sécurité Web.

Une acquisition indisponible est un résultat
distinct de la qualification fonctionnelle locale.
Elle exige une décision explicite avant publication.

Les caches officiels locaux restent une solution
de repli pour le Creator servi par HTTP local.
Ils ne sont ni commités ni publiés automatiquement.

Un import direct de fichiers de cache dans le
Creator public ou autonome nécessite un travail
complémentaire si ce besoin devient bloquant.

## 4. Publication

Le portail candidat cible pilot-a87.
Les releases A8.6 et A8.2 restent accessibles.

Le candidat est reconstruit depuis son commit exact.
Aucune fusion, création de tag ou publication
distante ne fait partie de cette préparation.

Après qualification et décision de publication,
GitHub Release puis GitHub Pages devront être
contrôlés sur les artefacts réellement déployés.

## 5. Limites

Le harnais unifié est une adaptation de la campagne
S15-D macOS. Il requiert les quatre instantanés
officiels déjà qualifiés et leurs empreintes.
Ce n’est pas encore un runner CI générique.

La recette couvre le scénario S15-D documenté,
non toutes les interactions possibles.

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

Preuves : ../evidence/15-A87-PUBLISHED-VALIDATION.md
