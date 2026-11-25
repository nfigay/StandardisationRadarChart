# S19 R21-R1 — En-tête SVG pour le titre i18n

Le titre SVG est séparé de l'aire du radar par une extension supérieure du viewBox, passant de `0 0 800 800` à `0 -120 800 920`, pour les géométries classique et S18 personnalisée. Le radar n'est pas déplacé dans son système de coordonnées et les positions des blips restent inchangées.

Le module `radar-title.js` dessine une hiérarchie explicite : marque, organisation, nom du radar (sur plusieurs lignes si nécessaire), version et statut, puis horodatage réellement disponible ou indication de son absence. Les lignes ont un interligne de 19 unités SVG. Les chaînes sont intégrées via `textContent` pour empêcher les injections HTML. Le titre est recomposé lors de l'activation de la révision et du changement de langue FR/EN, sans migration de données.

La régression graphique doit être vérifiée dans Chrome à petites et grandes résolutions, pour les deux géométries, après changement de langue, et dans le Viewer publié si celui-ci réutilise ce SVG. Une mise en page réellement adaptative pour noms de longueur exceptionnelle pourra nécessiter un calcul de largeur au rendu.
