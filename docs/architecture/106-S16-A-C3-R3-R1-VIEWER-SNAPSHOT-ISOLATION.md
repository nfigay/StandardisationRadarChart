# S16-A-C3-R3-R1 — Isolation documentaire des fiches ISO publiées

## Constat

La résolution C3-R3 des liens ISO, correcte dans le Creator et son cache fenêtré IndexedDB, appelait aussi `findDeliverable()` pour les copies documentaires ISO stockées dans le catalogue publié. Le test A8.2 interdisant toute consultation du catalogue global dans le Viewer échouait (`Unexpected global lookup`).

## Décision

- Une fiche issue d'un instantané ISO conservé (`nativeReference`) n'interroge ni `findDeliverable()` ni le cache IndexedDB global pour ses relations.
- La fiche conservée affiche les valeurs documentaires originales d'identifiants de relation telles que stockées, sans présumer de leur résolution.
- La fiche documentaire ISO globale continue de résoudre ses relations avec le cache global, puis le cache fenêtré à la demande.
- Les descriptions/Scope, références, traductions et données brutes restent inchangées.
- Pas de mutation du catalogue métier, de réseau implicite, de commit, ni de publication dans ce correctif.

## Qualification

Conserver le test A8.2 `published and global ISO details use distinct translated labels and source scopes` **sans modification**. Ajouter trois tests sur le comportement natif/global, exécuter les tests ISO/OMG et l'intégralité des tests Node. Compléter par une recette dans Creator et Pages après construction de la distribution.

## Publication

C3-R3-R1 est un correctif local non publié. La publication doit inclure la vérification du périmètre des sources privées et une recette sur le build Pages statique.
