# S14-K — Atomicité des données distribuées et rapprochement en lecture seule

## Contexte

S14-I valide les données compressées SHA-256 avant import. L'importateur historique S14-A/D efface ensuite les jeux `deliverables` et `committees` indépendamment : une panne au milieu peut laisser le cache vide ou incohérent. S14-J produit les journaux de différences, sans prouver qu'une référence absente est retirée.

## Contrat d'activation

1. Télécharger les deux jeux et vérifier les empreintes (S14-I).
2. Décompresser et valider intégralement les deux JSONLines (S14-K), vérifier identifiants uniques et compte attendu du manifeste.
3. Exécuter **une seule transaction IndexedDB `readwrite`** couvrant `deliverables`, `committees` et `sync`. Toute erreur doit annuler l'ensemble.
4. Ne changer l'indicateur de release locale qu'après confirmation `oncomplete` de cette transaction.
5. L'import manuel existant est conservé comme chemin autonome, mais **ne fournit pas la même atomicité inter-jeux**.

## Veille et identités

Le module `radar-catalog-followed.js` propose `correlate(changes, registry)` et `fieldDetails(change)` en lecture seule. La correspondance par `sourceRecordId` est considérée fiable pour la référence; celle par désignation uniquement reste **candidate et doit être validée**. Le module ne modifie ni blips, ni révisions publiées. L'intégration visuelle complète des alertes ciblées est encore à réaliser après validation du contrat réel de registre (S12-R1 / DEC-009 OPEN).

## Limites

- L'activation utilise un traitement en mémoire des enregistrements validés avant transaction : son coût sur un catalogue ISO complet doit être éprouvé dans Chrome.
- Une seule transaction peut être longue; des erreurs de quota annulent tout et préservent l'état précédent.
- Il n'existe encore qu'une release ISO réelle (`2026-11-09`) : aucun changement historique réel n'a été inféré.
- Ne pas confondre métadonnées source ISO, références métier et blips.
- Le chemin S14-I devient dépendant du module atomique S14-K ; le patch est bloquant si les ancrages sont incompatibles.

## Décisions

DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 restent OPEN. Ni nouvelle politique de version ni mutation des publications n'est décrétée dans ce lot.
