# 29 — S14-L1 — Virtualisation ISO sur catalogue complet

## Constat
Le cache IndexedDB du navigateur contient 81 768 références ISO. Le panneau les lit actuellement toutes dans une liste JS, mais la vue plate « Normes ISO » applique ensuite une limite artificielle de 1 800 avant w2grid.

## Décision de lot
S14-L1 supprime uniquement ce plafond pour la grille plate, en conservant la virtualisation native de w2grid et en appliquant recherche globale avant projection. La recherche est temporisée de 180 ms. Aucun mécanisme de pagination UI n'est réimplémenté. Les données sources ne sont pas modifiées.

## Limites et suite
La projection complète consomme de la RAM : pour l'instant, les 81 768 métadonnées sont déjà chargées en mémoire. Il faut mesurer le comportement dans Chrome et passer ensuite à un adaptateur asynchrone IndexedDB (avec requêtes, pagination et index plein texte) sans charger toutes les notices. Les arborescences ICS/TC-SC conservent temporairement leur plafond distinct de 1 800 feuilles et nécessitent le chargement différé par branche. Ne pas annoncer que ce lot rend leurs feuilles exhaustives.

## Non-régression
Conserver les identifiants ISO, les libellés FR/EN, les w2form, les registres locaux, les relations avec les blips et tous les statuts de révision.

## Gouvernance
DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 restent OPEN.
