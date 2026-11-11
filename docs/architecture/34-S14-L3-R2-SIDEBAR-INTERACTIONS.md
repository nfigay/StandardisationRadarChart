# S14-L3-R2 — Navigation des référentiels ISO

## Décision de présentation

La sidebar w2ui demeure alimentée par les index dérivés du cache IndexedDB. Les icônes œil HTML et les écouteurs DOM en capture sont abandonnés.

- **Clic simple** : sélection de l'ICS, TC ou SC et filtrage de la grille.
- **Double-clic** : ouverture du w2popup/w2form de consultation du nœud.
- **Clic droit** : menu natif w2sidebar avec « Détails » et « Afficher les normes », traduit via i18next.
- **Clavier** : Entrée sur le nœud sélectionné pour consulter sa fiche.
- **Iconographie** : catégorie ICS, comité TC et sous-comité SC identifiés visuellement.
- **Compteurs** : nombre de références distinctes associées, descendants inclus, issu de la totalité du catalogue local ; aucune duplication d'identité pour les normes multi-ICS.

## Modèle / source de vérité

Aucun changement de stockage, du contrat ISO ni des blips. Les compteurs sont une projection calculée lors de la construction des index et non une nouvelle base. Les groupes sont recalculés lors d'une mise à jour de la source ou du cache.

## Limites et validation

Valider en Chrome les événements natifs de la version w2ui effectivement chargée, le rendu des icônes, le focus clavier, les menus contextuels, les performances de construction des index sur le catalogue réel et l'absence de régression de sélection. Les tests Node ne simulent pas complètement le DOM w2ui.
