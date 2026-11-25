# S19-A4-R7-R3 — Dossiers stratégiques natifs dans les révisions de radar

## Décision

Le dossier stratégique est stocké uniquement dans `radarRevisions[].extensions.radarRationales` du **catalogue existant**. Aucun fichier JSON propre aux dossiers n'est proposé à l'utilisateur. L'export normal du catalogue inclut les dossiers.

## Cycle de vie

- La création n'est possible que sur une révision `draft`, appartenant à l'unique catalogue ouvert.
- L'identité est fondée sur le `standardId` et l'`ownerOrganizationId` de la révision, pas sur un libellé approximatif.
- Les dossiers sont chargés directement depuis l'adaptateur de catalogue à chaque sélection.
- Chaque modification Tiptap met à jour à la fois la persistance (`imports[].source`) et l'adaptateur (`registered[]`) ; `build()` et `isDirty()` voient le contenu révisé.
- La création refuse un standard déjà documenté et les révisions non éditables.
- Le bouton de création n'est plus une réinitialisation : il est désactivé lorsqu'un dossier existe.
- Les boutons `Importer JSON` et `Exporter bibliothèque JSON` sont supprimés du panneau ; les anciens dossiers du prototype ne sont pas importés automatiquement.
- Le mode Visualisation utilise le moteur HTML S19-R6 sans éditeur Tiptap.

## Propriétés de sécurité

Le module pur `radar-rationale-revision.js` contrôle le format documentaire, refuse les doublons et les remplacements implicites. Les deux magasins vérifient le brouillon et l'organisation propriétaire. Les extensions étrangères sont préservées par copie.

## Limites et prochaine phase

Le Viewer public n'est **pas encore raccordé** aux dossiers de cette révision. Le cycle Creator/enregistrement/réimport doit être validé avant publication. En mode `file://`, le téléchargement du catalogue produit un nouveau fichier sans écraser automatiquement le fichier d'origine. Les dossiers historiques en mémoire de la session R6 ne sont pas automatiquement convertis ; les copier avant actualisation si nécessaire.

## Vérification

Tests de contrat de stockage : 5 tests. Validation sur la machine cible : suite complète `npm test`, création/édition, sauvegarde catalogue, réimport, comparaison, changement de révision. Vérifier le contenu du JSON sous `radarRevisions[].extensions.radarRationales.items`.
