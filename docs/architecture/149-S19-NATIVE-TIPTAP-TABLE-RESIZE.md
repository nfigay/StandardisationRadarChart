# Architecture 149 — Redimensionnement natif des tableaux Tiptap

## Choix

- Édition : activer `Table.configure({resizable:true})` ou `TableKit.configure({table:{resizable:true}})` dans le registre d’extensions existant, avec la même instance de Tiptap.
- Stockage : conserver les `colwidth` pixels natifs ; ne pas ajouter de pourcentages persistants concurrents.
- Visualisation et export HTML statique : normaliser les `colwidth` connus du premier rang en `colgroup` de pourcentages totalisant 100 %, pour la largeur du conteneur documentaire.
- Lignes : garder le `s19MinHeight` existant, sans ajouter de poignée fictive.
- Compatibilité : une largeur non valide ou partielle entraîne le mode automatique de la prévisualisation ; aucun attribut invalide n’est injecté dans le HTML.

## Réserves et recette

Les cellules fusionnées sur la première ligne sont prises en compte via leur `colspan` et leur tableau de `colwidth`. Les cas plus complexes avec une première ligne incomplète nécessitent un test navigateur. La largeur exacte obtenue dans le navigateur dépend de la présence de contenu non sécable et du DOM généré par Tiptap.

Après application, vérifier la présence d’une poignée sur la séparation de deux colonnes, sa manipulation et la conservation après sauvegarde, ainsi que l’adaptation proportionnelle en Visualisation et en plein écran. Ne pas publier sans cette recette.
