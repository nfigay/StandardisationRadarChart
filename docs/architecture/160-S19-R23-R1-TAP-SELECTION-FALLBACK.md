# S19 R23-R1 — Synchronisation lors du clic sur un blip

Le panneau de dossier écoute **select** et **tap** Cytoscape sur les nœuds. Le clic direct peut ne pas émettre de nouvel événement select selon l'état de sélection du graphe.

La même fonction de contrôle (nœud visible, standardId, correspondance du graphe, sélection effective du panneau) traite ces événements. showNode dédoublonne le même identifiant, conserve le sous-onglet Context/Extra ou Dossier stratégique, sauvegarde avant changement, revient en visualisation et restaure la sélection si la sauvegarde échoue.

Limites : le fonctionnement graphique et l'absence d'un calque interceptant les clics demandent une recette dans Chrome. Le correctif ne change ni les données ni la géométrie.
