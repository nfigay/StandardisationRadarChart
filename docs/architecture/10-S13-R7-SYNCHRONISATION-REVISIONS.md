# S13-R7 — Synchronisation des statuts et reprise de l’édition

## Constat
Les captures utilisateur montraient une révision `draft` dans l’explorateur alors que les actions renvoyaient « read-only ». Les diagnostics ultérieurs ont été effectués dans une session vide et ne prouvent donc pas une suppression de données par la publication. S13-R4 est installé ; le nouveau correctif ne réinstalle pas S13-R4.

## Contrats conservés
- La source autoritative des transitions reste le catalogue privé `imports[]`, synchronisé à l’adaptateur par `transitionRevision`. La session reste propriétaire des snapshots Cytoscape ; aucune reconstruction globale ni second catalogue ne sont ajoutés.
- Seul `draft` est modifiable ; `published` et `archived` restent en lecture seule. Les transitions valides demeurent `draft → published` et `published → archived` ; dériver un draft depuis une publication réutilise la commande existante.
- Les exports JSON restent explicites. Aucune sauvegarde automatique, restauration de mémoire après rechargement ou nouvel accès ISO n’est introduit.

## Correctif
1. `radar-workspace-explorer.refresh()` reconstitue les libellés et icônes des révisions de catalogue à partir de `radar-catalog-adapter.getRevision(group)` au lieu de conserver le statut de l’import initial.
2. `radar-catalog-ui.transitionActiveRevision()` déclenche l’actualisation de l’explorateur après succès du commit ; le menu W2UI historique est déjà mis à jour.
3. `afterSelect()` verrouille les nœuds et sélectionne le mode `locked` pour les révisions `published` et `archived` ; lors de la sélection d’un `draft` de catalogue, il rétablit l’interaction `grabon`. Les groupes historiques non catalogués ne sont pas modifiés.
4. Les actions Publier/Archiver du menu vérifient la révision active et son statut **avant** la confirmation, et expliquent les préconditions en français. La persistance réexécute toujours ses propres contrôles métier.

## Vérifications
Les tests `tests/radar-lifecycle-ui-sync.test.mjs` couvrent l’actualisation de l’explorateur, la transition publiée et l’archivage, le retour vers un draft modifiable et la non-interférence avec un groupe historique. Les 84 tests précédents restent requis. Le scénario navigateur de référence reste : importer un catalogue JSON de test sauvegardé, sélectionner un draft, publier, vérifier libellés et restrictions, exporter, dériver un draft, archiver la publication, réimporter et comparer les positions.

## Risques, limites et décisions ouvertes
Le présent changement ne démontre pas encore à lui seul le comportement interactif du navigateur, la durabilité du JSON téléchargé ou la réconciliation de changements après rechargement. S12-R1 (identité normative, provenance, doublons et propriétés du blip) reste ouvert. DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018 restent `OPEN` ; ce correctif ne statue pas sur leurs arbitrages.
