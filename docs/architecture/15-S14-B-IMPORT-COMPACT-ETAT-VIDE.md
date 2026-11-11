# S14-B — Import compact et états vides explicites

## Constat de validation navigateur

- Le sélecteur « ISO : normes JSONL » est redondant avec les vues de la grille et occupe une hauteur excessive sous les styles globaux de `radar.html`.
- La vue « Comités TC / SC » reste vide si IndexedDB ne contient aucun enregistrement `committees`. L'import des normes ne peuple pas, à lui seul, l'arbre des comités.

## Correction

- Supprimer le `select` d'import; utiliser la vue active comme type de jeu :
  - `ICS et normes` → `deliverables` (`iso_deliverables_metadata`).
  - `Comités TC / SC` → `committees` (`iso_technical_committees`).
  - `Références locales` → import désactivé (aucun type ISO implicite).
- Bouton compact « Importer JSONL » avec sélecteur de fichier caché; sélection du type figée au moment de l'ouverture du dialogue de fichiers, pour éviter les courses lors d'un changement de vue.
- Si aucune donnée TC/SC n'a été importée, afficher une instruction d'import explicite dans la barre d'état.
- Le cache IndexedDB, les contenus des radars et les modèles d'identité ne changent pas.

## Périmètre

Le correctif ne télécharge aucune donnée ISO automatiquement et n'implémente ni proxy RSS ni rapprochement métier. `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` restent OPEN.
