# S14 — Consolidation des tests avant publication

## Périmètre

Release GitHub Pages avec catalogue ISO distribué,
fenêtrage IndexedDB, navigation ICS/TC-SC et
compatibilité avec le radar historique.

## Contrôles

- Reproduction de la distribution depuis l'index Git.
- Préservation du fichier ICS.csv historique.
- Contrôle des scripts classiques et des ressources Pages.
- Suite complète de tests Node.
- Vérification de la distribution statique.

## Réconciliation des tests

Les simulations Node ont été actualisées pour les API
navigateur utilisées par l'application.

Les assertions historiques ont été adaptées aux contrats
S14 : taille de fenêtre configurable, schéma IndexedDB v3,
hiérarchie ICS et libellés localisés.

La navigation du workspace est vérifiée par l'identifiant
métier de révision plutôt que par la profondeur des nœuds.

Le panneau ISO fournit une indication explicite lorsqu'aucun
comité TC/SC n'est disponible.

## Limites

Les tests Node et les contrôles statiques ne remplacent pas
la validation fonctionnelle dans un navigateur.

Le déploiement GitHub Actions et le site publié doivent être
vérifiés après le push.

## Qualification S14.3 — état au 14 novembre 2026

| Lot | Tests complets | Preuve réelle |
|---|---:|---|
| A8.2 | 532 | pilot-a82, source 0b14a41, gh-pages ed814d6, huit assets contrôlés |
| A8.3 | 552 | commit local 94aef3e, deux définitions chargées dans Chrome |
| A8.4 | 568 | projection interne générée et ouverte dans le Viewer ; preuve 05 |
| A8.5-R1 | 585 | démarrage rev-1 et recette Publisher/Viewer 9/9 ; preuve 06 |

Les avertissements classiques Vite/CommonJS ne sont pas des échecs ; ils restent
à traiter dans la modularisation. La recette A8.4 n'a pas affiché une fiche ISO
projetée (jeu manuel). A8.5/A8.6 : vérifier changement de langue, conservation
source, sélection et fiche ISO, préchargement réel du fichier téléchargé,
fonctionnement hors connexion et absence de métadonnées d'auteur. Les tests
statiques/VM ne démontrent pas la fidélité graphique ni la non-divulgation
de secrets écrits dans un champ autorisé. Aucun résultat distant supposé.

A8.6 candidat : vérification des octets du modèle, HTML, manifeste et ZIP, registre natif. Recette locale hors connexion et réimport du catalogue requis ; voir architecture 86.

### A8.6-R1 — Candidat

Source A8.6 `c73653c` : 593 tests validés dans le rapport local. Correctif R1 : 595 tests disponibles réussis sur les sources modifiées, hors cinq tests Vite du fichier `client-variants.test.mjs` (dépendances absentes de l'instantané). 600 tests attendus pour la suite complète sur Mac, sans affirmer leur réussite avant exécution. Les sept nouveaux tests couvrent fiche/collection/unique, import interdit, ambiguïté, verrouillage du payload invalide, dialogue et références du radar actif. Chromium HTTP local bloqué par la politique de navigation de l'environnement d'analyse ; recette navigateur et build final non réalisés. Voir preuve 07. Exécuter la recette des deux modes, changement de langue, navigation et détail ISO ; contrôler ZIP réel, registre et retéléchargement, puis fonctionnement hors réseau. Ne pas publier avant qualification.

## A8.6-R2

Candidat à qualifier selon preuve 08 : 31 tests Publisher, 597 tests exécutables sans Vite, 602 attendus sur installation complète. Refaire le build Pages/standalone et la recette d'onglet Blob ISO, comparaison historique, confirmation de répétition, réouverture JSON et retéléchargement sans mutation. Ne pas annoncer la correction ISO acquise avant la recette. Aucun push automatique.