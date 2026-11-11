# S14-K-R1 — Dialogues de révision et i18n

## Constat
Le sélecteur de révision historique était un formulaire HTML personnalisé dont le titre mélangeait français et anglais et dont le sélecteur était soumis à la règle CSS globale `select { height: 150px }`. Les options divulguaient des identifiants de révision techniques. La publication et l'archivage utilisaient `window.confirm` avec des textes codés en français.

## Modification
- `js/radar-revision-dialogs.js` fournit des traductions FR/EN pour les dialogues de révision, un libellé de révision court, un `w2form` de sélection avec champ `list` et une confirmation `w2confirm` pour publication et archivage.
- `js/radar-catalog-ui.js` délègue l'affichage du sélecteur tout en conservant l'activation via `__radarWorkspaceExplorer` et la synchronisation du menu de groupes.
- `radar.html` charge le module avant l'UI et réutilise le dialogue lors des transitions de cycle de vie.
- Aucun contrat métier, identifiant ou règle de protection n'est modifié. Les statuts métier restent `draft`, `published`, `archived`.

## Limites et suite
- La commande « créer/ouvrir un draft » reste une action directe, et non un formulaire de saisie ; son ergonomie et ses notifications pourront être homogénéisées ultérieurement.
- La traduction des messages d'erreur des autres parties de l'application reste distincte.
- Le rendu réel de `w2form` et `w2confirm` doit être validé dans Chrome.
- DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018 restent OPEN.
