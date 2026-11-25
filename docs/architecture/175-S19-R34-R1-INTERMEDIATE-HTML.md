# S19-R34-R1 — Publications HTML intermédiaires

Décision MVP : preview et téléchargement standalone depuis un Creator local sans commit ni release.

La génération locale réemploie `build-common-standalone.mjs`, mais avec une racine de ressources explicitement locale (`RADAR_INTERMEDIATE_SOURCE_DIR`) et une provenance `local-intermediate-uncommitted`, jamais un SHA prétendu propre. Le générateur officiel reste inchangé par défaut et continue ses contrôles Pages.

La génération réécrit seulement `.radarchart-build/local/radar.html` et non les sources suivies par Git. Les téléchargements HTML depuis ce Creator intermédiaire utilisent la même projection que la prévisualisation, incluant `radarRationales` autorisés. Une reconstruction est nécessaire après changement du code applicatif, mais pas après changement des données métier dans le Creator. Aucun déploiement GitHub Pages n'est requis.

Limitation : l'assemblage autonome local dépend des ressources complètes du dépôt, de Vite et d'esbuild. Une recette navigateur de dossiers et références, hors ligne, demeure obligatoire.


## R34-R5 — Construction locale canonique

Le profil local du Radar Chart ne constitue pas un mode Vite. Vite interdit le mode `local`, reserve au suffixe des fichiers environnement.

Le generateur intermediaire delegue la construction au pipeline canonique `scripts/build-safe.mjs local`, egalement utilise par `npm run build`.

Le contrat de provenance `local-intermediate-uncommitted` reste inchange. La qualification du build et la recette navigateur restent obligatoires.


## R34-R6 — Reconstruction intermédiaire transactionnelle

Le générateur intermédiaire utilise npm run build.

Le pipeline build-safe conserve son interdiction
d'écraser une construction existante.

La construction précédente est archivée dans
.radarchart-build/intermediate-history.

En cas d'échec, la construction incomplète est conservée
pour diagnostic et la construction précédente est restaurée.

Les distributions Pages et leurs contrôles de provenance
restent inchangés.


## R34-R10 — Consultation documentaire autonome

Le Viewer ne crée pas les commandes de création
et de modification du dossier stratégique.

Le Creator conserve ses commandes et les contrôles
d'éligibilité à une révision brouillon.
Les gardes métier restent obligatoires.

La feuille radar-rationale-fullscreen.css est
déclarée statiquement dans radar.html.
Le générateur autonome intègre cette ressource
avec son mécanisme commun de traitement CSS.

Le chargement dynamique de la feuille est supprimé.
Le layout W2UI et le cycle de vie du shell sont conservés.

La qualification doit vérifier le Viewer réellement
embarqué, puis le HTML exporté ouvert hors ligne.
