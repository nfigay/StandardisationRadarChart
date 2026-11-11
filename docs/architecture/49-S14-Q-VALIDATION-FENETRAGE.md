# S14-Q — Validation de bout en bout du catalogue ISO fenêtré

## Objectif et périmètre

Valider par des observations, sans modifier les données, les lectures de la génération S14-OP active dans IndexedDB. La publication confirmée par l'utilisateur est `2026-11-09`, 81 768 normes et 810 comités. L'index `groups:<generation>` a été signalé prêt avec `alreadyBuilt:true`. Cela ne constitue pas une mesure de pic mémoire.

## Contrat de preuve

1. L'index doit être `ready:true`, de la même génération que l'actif.
2. Les requêtes de normes, de comités, d'ICS parent et de TC parent doivent retourner au plus 100 notices par appel, avec marqueur de continuation, sans chevauchement de deux pages successives.
3. La clé de chaque norme d'un groupe doit appartenir à sa hiérarchie via `hierarchy(dimension, record)`.
4. `get(id)` retourne la fiche correspondante.
5. Une lecture ponctuelle de `w2ui.standardReferencesGrid.records.length` signale la mémoire de la grille visible, **pas** le nombre d'objets ISO vivants dans toute l'application.
6. Les chiffres `performance.memory` sont indicatifs et facultatifs (Chrome) ; ni le pic mémoire, ni l'occupation du processus, ni la mémoire d'IndexedDB n'y sont couverts. `performance.measureUserAgentSpecificMemory()` est également soumis à des contraintes et ne fournit pas toujours une mesure exploitable.
7. Le script d'audit statique constate les branchements `windowedActive`. Il ne prouve pas quels chemins ont été exécutés pendant une session donnée.

## Limites connues

- Le panneau comprend toujours un chemin de compatibilité qui appelle `provider.readAll('deliverables')` si aucune génération fenêtrée n'est active. Le supprimer impose un arbitrage explicite sur les installations anciennes.
- Le panneau peut stocker en mémoire la liste des comités et celle des classifications ICS ; elles restent distinctes des 81 768 fiches.
- Le journal d'évolutions et les RSS sont d'autres sources, susceptibles d'utiliser des tableaux en mémoire. S14-Q ne mesure pas leur volume et ne les migre pas.
- Le navigateur peut avoir d'autres onglets et processus : une différence de tas JS sur deux instants n'est pas une preuve d'absence de fuite.
- Les performances de groupes dépendent de la taille de l'index, des filtres de recherche et du matériel de l'utilisateur. Un test sur deux fenêtres ne remplace pas un profilage long.
- Le mode `groupKey` requiert une génération indexée. Avant cela, le moteur peut recourir à une recherche plus coûteuse.

## Livraison

S14-Q est **additif, en lecture seule** : nouveau script de diagnostic navigateur, audit statique Node, tests et présent document. Il n'altère ni le panneau, ni le moteur d'import, ni IndexedDB. Les diagnostics produisent un JSON stable pour le presse-papiers Chrome / `pbcopy` macOS.

## Critères pour conclure

Ne pas déclarer « zéro chargement intégral » ni « mémoire bornée sur l'application entière » à partir de la seule lecture de deux pages. Compléter par des profils Chrome DevTools Heap Snapshots / Performance (avant et après navigation répétée), le contrôle du repli historique et la validation manuelle de la navigation Sidebar + Grid + Form.
