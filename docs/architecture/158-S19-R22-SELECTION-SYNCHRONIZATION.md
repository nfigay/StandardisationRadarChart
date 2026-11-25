# S19-R22 — Synchronisation de sélection Cytoscape / W2UI / Tiptap

## Objectif

Le changement de nœud sélectionné doit rafraîchir Propriétés ou Dossier stratégique sans changer d'onglet ni de mode, y compris lorsque la sélection vient d'une action autre qu'un clic direct.

## Architecture

- Écouter `select` sur le core Cytoscape associé au panneau, sans changer l'état graphique.
- Conserver `tap` existant pour les versions qui n'exposent pas `generateFormFromCytoscapeElement` globalement et dédoublonner les passages pour un même blip.
- Abonner un seul core ; libérer l'abonnement de l'ancien core quand le contexte change.
- Sauvegarder le document actif avant changement ; bloquer la transition si la persistance a échoué.
- Réutiliser le shell, le tab W2UI et le layout plein écran : ne pas reconstruire le panneau root.
- Pour un blip sans dossier, conserver l'onglet Dossier stratégique et afficher le message d'absence avec une création possible uniquement sur un brouillon éditable.

## Non-objectifs

Aucune mutation de la géométrie, aucune migration des dossiers, aucune synchronisation par timer, aucun changement du SVG ou des légendes.

## Recette navigateur

Dans le brouillon actif : sélectionner A avec dossier, B avec autre dossier, C sans dossier, successivement depuis Propriétés puis depuis Dossier stratégique ; vérifier la mise à jour du titre, formulaire, référence et contenu, sans perdre l'onglet ni les modifications. Tester aussi une sélection programmatique et le retour du plein écran.
