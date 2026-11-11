# S14-E — Consultation ISO dans un formulaire w2ui

## Objectifs
- Les grilles w2ui du panneau inférieur utilisent `recordHeight: 28` pour retrouver une ligne compacte.
- La colonne description des comités fournit une prévisualisation sur une ligne, avec l'intégralité du texte accessible dans la fiche.
- Le bouton **Détails** ouvre un vrai `w2form` (sans action de sauvegarde), contenu dans une fenêtre modale native, avec onglets **Fiche de la norme** / **Métadonnées originales**.
- Les titres et descriptions en français et en anglais sont présentés séparément, les sauts de ligne sont respectés via des zones de texte en lecture seule.
- Les codes ICS, le comité TC/SC, les stades, les dates, les langues et les relations entre éditions sont présentés sans modifier les métadonnées ISO.

## Invariants
- Pas de changement de persistance IndexedDB, des identifiants, du registre des blips ou des états de révision.
- Une édition absente du cache ISO reste signalée comme telle dans les relations.
- Les métadonnées source sont consultables sans être modifiables.
- La fenêtre modale n'implique pas que le formulaire soit un simple HTML : les champs sont liés et rendus par `w2form`.

## Limites
- Vérification statique et tests automatisés dans cet environnement ; le rendu exact nécessite validation dans le navigateur du Mac.
- Le plafond actuel de projection des 1 800 lignes n'est pas modifié.
- S12-R1 (rapprochement des références et blips) et les décisions architecturales en statut OPEN restent hors périmètre.
