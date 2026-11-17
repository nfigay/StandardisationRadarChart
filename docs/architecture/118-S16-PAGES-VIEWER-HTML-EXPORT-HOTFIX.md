# 118 — S16 : rétablissement de l'export HTML depuis GitHub Pages

## Constat de recette
Le Creator hébergé prévisualise le Viewer mais n'offre pas le téléchargement HTML autonome, contrairement au Creator autonome : le HTML de Pages n'embarque pas `radar-viewer-template` et `radar-viewer-template-proof`.

## Correction retenue
La construction Pages appelle **le générateur autonome déjà existant** après une première preuve de provenance Pages. Elle récupère exactement les ressources non exécutables du Creator autonome, contrôle le SHA-256 et la taille du Viewer, les intègre dans le HTML du Creator Pages, puis **recalcule la provenance du build modifié**. Aucun changement du modèle métier ni du formulaire.

Le générateur autonome exige une source **committée et propre**. En conséquence la qualification applicative peut être menée avant commit, mais le build intégré complet doit être exécuté après un commit explicite autorisé, sur une source propre. Le code est conçu pour s'arrêter s'il ne peut pas établir cette preuve ; aucun contournement de provenance n'est permis.

## Qualité et limites
- Tester le contrat d'injection (identité des octets, preuve, unicité des balises, non-régression du panneau).
- Après commit : reconstruire Pages de zéro, vérifier que le Creator Pages contient les deux ressources, vérifier la provenance après injection et la distribution finale.
- Après publication : recette humaine de téléchargement du Viewer HTML et ouverture hors connexion, ainsi que prévisualisation conservée.
- Ne pas publier les caches ISO locaux ni les sauvegardes.
- La conversion des autres fenêtres vers w2UI et l'amélioration de leurs libellés appartiennent à S17.
