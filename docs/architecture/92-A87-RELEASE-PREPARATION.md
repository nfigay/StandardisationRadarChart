# A8.7 — Architecture de préparation de release

Statut : candidat à qualifier.

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
