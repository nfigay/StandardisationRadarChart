# S19 R25 — Lifecycle W2UI du formulaire Blip

## Observation Chrome

Les changements de blip entraînent des erreurs répétées : `blipForm`, `blipForm_toolbar` et `blipForm_tabs` sont déjà enregistrés dans le registre global `w2ui`. Le code d'origine construit le formulaire *avant* que le panneau S19 vérifie si le changement est accepté, et construit éventuellement le même formulaire depuis plusieurs écouteurs Cytoscape.

## Décision

- Les deux gestionnaires historiques de `radar.html` délèguent directement la sélection au panneau S19, sans instancier le formulaire à l'avance.
- `s19SelectedNode` délègue également sans construction anticipée.
- `showNode` conserve sa protection contre les changements pendant une sauvegarde en échec, déduplique les événements, enregistre l'édition et restaure l'onglet Propriétés ; seulement ensuite il demande le nouveau formulaire.
- La factory de `radar.js` libère les enregistrements W2UI `blipForm`, `blipForm_toolbar`, `blipForm_tabs` avant de créer son remplaçant. Le fallback lorsque le panneau S19 est absent continue de fonctionner.

## Limites

Les tests Node vérifient la séquence et simulent le registre W2UI. La validation effective nécessite Chrome (blips successifs, Dossier → Visualisation, propriétés Context/Extra, édition et cas sans dossier).

Aucun changement des données métier, des coordonnées, du SVG, des exports ou des structures de dossier. Aucun commit/push automatique.
