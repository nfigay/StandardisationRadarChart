# S14-L1-R1 — Cohérence de la projection locale w2grid

## Anomalie
Après S14-L1, la vue ISO remplaçait `grid.records` en direct puis appelait `grid.refresh()`. Les compteurs internes `total` et `buffered` pouvaient conserver des valeurs liées à une vue précédente, provoquant un défilement incohérent malgré 81 768 enregistrements projetés.

## Correction
La vue `iso-list` appelle `grid.clear(true)` (réinitialisation standard w2ui sans refresh intermédiaire), projette l'ensemble des normes filtrées, affecte `grid.records`, `grid.total` et `grid.buffered` de façon cohérente puis utilise le `grid.refresh()` existant. Les autres vues sont inchangées. Aucun changement IndexedDB ni métier.

## Validation encore nécessaire
Tester dans Chrome la scrollbar, le passage à une norme située vers la fin, une recherche avec filtre et le retour vers les vues ICS/TC-SC. L'interface peut nécessiter une stratégie plus avancée pour le volume complet si la virtualisation présente d'autres limites. Ce lot ne constitue pas une pagination IndexedDB.
