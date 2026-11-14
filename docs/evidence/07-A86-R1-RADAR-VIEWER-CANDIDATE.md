# 07 — A8.6-R1 : candidat et recette à terminer

Baseline : `c73653c8ae165c369ac15da41398ed3682a922c8`, archive SHA-256 `9a54efb8e7c8cc47d9595c775eaf3e814fa271755371d22d56f9edd32d300487`.

## Constat utilisateur

Le Viewer issu du Publisher A8.6 affiche Fichiers → Ouvrir un catalogue JSON et l'arbre Catalogue/Organisation/Radar/Révision. Le 14 novembre 2026, le destinataire demande un Viewer d'un radar ou d'une collection de radars retenus pour diffusion, avec une fiche descriptive dans le panneau gauche, sans import de catalogue ni navigation historique. Les captures montrent trois livraisons ; elles ne prouvent ni duplication au retéléchargement ni validation du ZIP sur disque.

## Vérification réalisée sur les sources corrigées

- Node v22.16.0 : suites ciblées Publisher et intégration ISO, 46 tests réussis (0 échec).
- Suite de 96 fichiers de tests disponibles, hors `client-variants.test.mjs` : 595 tests réussis (0 échec), dont sept nouveaux. Le fichier exclu importe Vite, absent de l'archive ; ses cinq tests historiques ne sont pas vérifiés ici.
- Exemple synthétique du package : projection de la collection `rev-1`, `rev-3`, et de la publication unique `rev-1` ; exclusion de `rev-2` historique, une notice ISO fictive dans le radar A.
- Pas de preuve de build final ni de recette navigateur : tentative Chromium bloquée (`ERR_BLOCKED_BY_ADMINISTRATOR`) avant chargement des ressources locales HTTP. Ne pas assimiler les tests VM à une recette réelle.

## Recette obligatoire sur le pilote reconstruit

1. Charger `catalogue-publications-a86-r1.json` dans le Creator. Vérifier que l'arbre d'auteur et les commandes de catalogue restent disponibles.
2. Publications → **Collection de radars** → vérifier le périmètre ; seulement `rev-1` et `rev-3`. Prévisualiser : fiche A dans left, deux choix de radars, aucun menu Fichiers ni choix de révision ; choisir B puis A, vérifier le graphe, son titre, les métadonnées, le détail des blips et les références de chaque radar. Tester FR/EN et redimensionnement.
3. Ouvrir Références du radar A et la notice ISO synthétique ; changer vers B : la notice A disparaît, seule la référence B est proposée. Revenir vers A ; notice disponible. Aucun accès au corpus global.
4. Publications → **Radar unique** : prévisualiser, vérifier absence de sélecteur, arbre et import ; seul A est présent, y compris dans le payload. Même contrôle après téléchargement HTML candidat.
5. Éditer la publication de test (sans toucher aux données métier) et tenter `rev-1` + `rev-2` (même radar). Enregistrement refusé ; corriger la sélection ou annuler. Tester le mode dynamique ambigu. Aucune livraison enregistrée par le candidat ou la prévisualisation.
6. Générer le ZIP de la collection. Retélécharger la dernière livraison dans le même dialogue : même identifiant et SHA-256, aucun nouvel enregistrement. Enregistrer le catalogue sous un nouveau nom et le rouvrir ; vérifier l'historique. Vérifier que le ZIP contient exactement `viewer.html` et `manifest.json`, que le hash/tailles du Viewer correspondent au manifeste et que le ZIP correspond au registre.
7. Déconnecter physiquement le réseau ; ouvrir le Viewer extrait de la collection puis celui d'un radar unique. Vérifier le démarrage, la fiche, navigation, le détail ISO. Vérifier le Viewer générique autonome séparé : Fichiers → Ouvrir un catalogue JSON fonctionne toujours, arbre disponible.
8. Vérifier les empreintes et la provenance du pilote, consigner observations, commit, navigateur et résultat. Aucun push ou tag avant acceptation explicite.

Statut : **candidat corrigé, qualification utilisateur restante**. Les preuves de A8.6-R1 ne se substituent pas à la recette complète A8.6 de livraison et de persistance.
