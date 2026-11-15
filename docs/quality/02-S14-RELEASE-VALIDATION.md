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

Candidat à qualifier selon preuve 08 : 31 tests Publisher, 597 tests exécutables sans Vite, 602 attendus sur installation complète. Refaire le build Pages/standalone et la recette ISO du HTML de prévisualisation téléchargé et ouvert localement (H1), comparaison historique, confirmation de répétition, réouverture JSON et retéléchargement sans mutation. Ne pas annoncer la correction ISO acquise avant la recette. Aucun push automatique.
Actualisation A8.6-R2-H1 : baseline R2 validée 602/602 sur Mac, navigation blob:null en échec navigateur (URL relative et WebCrypto). Correctif : téléchargement du HTML de prévisualisation puis ouverture locale, contrôles d’intégrité inchangés. Recette navigateur encore requise. Workspace reporté.

### A8.6 finalisation

H1 `9c3bc4f` : 602 tests, 11/11 contrôles Safari, zéro anomalie restante. Après simplification de la consultation HTML, exécuter la suite complète et la recette delta de la preuve 08 avant toute publication. Ne pas assimiler cette qualification à un push ou à une diffusion.


## A8.6 — qualification finale et préparation de publication (2026-11-15)

Baseline applicative `f7939c362cd9343cd92b6087235b8a29d2c06765` : 602 tests et recette finale 6/6, après H1 11/11. Voir `docs/evidence/09-A86-FINAL-QUALIFICATION.md`. Publication préparée avec le tag `pilot-a86`, portail actualisé, anciens liens et Client conservés. Aucun statut publié avant contrôle distant. Workspace et convergence SPM reportés. Consultation autonome HTML acceptée.

## Clôture A8.6 — publication effective

603/603 tests sur Mac pour le commit de release `894ae2a1ed25f7cef6bbbb56b3d2520792ecdc55`. Les 602 tests de la baseline applicative et les recettes Safari H1 11/11 et Final 6/6 sont documentés dans [preuve 09](../evidence/09-A86-FINAL-QUALIFICATION.md). Le rapport de publication fourni par l'utilisateur confirme le push source/tag, la vérification des assets distants et le push Pages `d24d7ef448be374528c725dbcb6845175aebda03`. Voir [preuve 10](../evidence/10-A86-PUBLICATION.md). Le démarrage des distributions publiques dans un navigateur n'est pas attesté par ce rapport et reste à enregistrer. Aucun nouveau test applicatif n'est revendiqué pour A8.6-DOC.
