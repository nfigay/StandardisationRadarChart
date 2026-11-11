# Lot 1 — Moteur de création de standards et de blips

**Date :** 2026-11-07  
**Statut :** intégré aux sources du livrable Lot 1 ; validation navigateur manuel encore requise après installation.  
**Portée :** commandes métier synchrones, sans formulaire (Lot 2), sans refonte du SSR/CSV (Lot 3).

## Responsabilités et source d'autorité

- `js/radar-catalog-creation.js` expose `window.__radarCatalogCreation` et deux commandes synchrones : `addBlipToActiveDraft(graph, request)` et `addStandardBlipToActiveDraft(graph, request)`.
- `js/radar-revision-session.js` fournit exclusivement le groupe actif. `js/radar-catalog-adapter.js` fournit la révision et son statut.
- `js/radar-catalog-persistence.js` possède **la seule** collection source `imports[]` : `ownsRevision`, `validateCreation`, `commitCreation` sont les trois opérations de vérification/commit ajoutées. Aucun second catalogue de standards n'est créé.
- Standard = enregistrement dans `imports[0].source.standards`, **pas** un nœud Cytoscape. Blip = enregistrement de révision + nœud Cytoscape (`type: business-object`, `radarchart.*` conforme à la projection existante).
- `radar.html` charge le moteur avant l'UI, sans ajout de commande d'interface ni modification du code historique `js/radar.js`.

## Contrats d'entrée

`addBlipToActiveDraft(cy, {standardId, label, ring, quadrant, position, blipId?, assessmentId?, context?, extensions?})`

`addStandardBlipToActiveDraft(cy, {standard:{name, standardId?, ...}, label, ring, quadrant, position, blipId?, assessmentId?, context?, extensions?})`

`position` est `{x:number,y:number}` en coordonnées modèle. `assessmentId` doit pointer vers une entrée existante lorsque renseigné ; `context` et `extensions` sont des objets JSON. Identifiants absents générés par `crypto.randomUUID()` avec les préfixes `standard_`, `blip_`. Aucun enrichissement ISO implicite. Chaque commande retourne `{blipId,standardId,revisionId,added:true}` **uniquement** après insertion et commit réussis.

## Séquence transactionnelle

1. Résoudre le groupe actif et vérifier qu'il appartient à l'unique catalogue importé, et que sa révision est `draft`.
2. Valider les champs obligatoires, la position, les références de standard/assessment et les collisions d'IDs dans la collection privée.
3. Préparer une seule projection Cytoscape de blip avec les mêmes clés que `radar-catalog-adapter.js`.
4. Vérifier de nouveau l'identité de la révision, puis appeler `graph.add(node)` **une fois** ; ni `plotData()` ni recalcul des autres positions.
5. Exécuter `commitCreation`, qui construit des copies des tableaux affectés avant remplacement. En cas d'échec d'insertion/commit, retirer uniquement le blip créé, sans supprimer les nœuds préexistants.
6. Les exports continuent via `build()` ; le snapshot actif donne les coordonnées finales, tandis que `source.standards` contient le standard nouvellement ajouté.

**Frontière :** code synchrone sur le thread navigateur. Les commandes n'exposent pas de transaction distribuée ; elles s'appuient sur la validation pré-commit, l'affectation synchrone sans callback et le rollback compensatoire de l'ajout Cytoscape. Un échec du rollback est propagé via `AggregateError`. Les modules voisins conservant d'autres invariants ne sont pas refondus dans ce lot.

## Tests et limites

`node --test tests/*.test.mjs` et `npm run verify:source`. Les tests incluent un moteur Cytoscape 3.30.2 réel en mode headless, la conservation des positions et l'export `build()`. Tests navigateur, round-trip JSON signé/inspec­té, navigation UI réelle, SSR/CSV et placement visuel relèvent de la validation applicative des Lots 2–3.

## Hypothèses et arbitrages ouverts

- Le standard nouvellement créé a au minimum `name`; ses métadonnées ISO sont saisies/attachées explicitement par l'appelant, jamais déduites.
- L'API reste sur **un seul catalogue importé** et refuse le workspace non-catalogue ; `DEC-016 OPEN`.
- La relation du blip demeure `standardId` plus `assessmentId?` ; aucune identité édition inventée ; `DEC-009 OPEN` et `DEC-010 OPEN`.
- Aucun couplage automatique à la source ISO ou aux relations EA ; `DEC-017 OPEN`, `DEC-018 OPEN`.
- Le placement initial et les règles UX W2UI sont au Lot 2 ; la commande exige une position modèle finie.
- Les révisions `published` et `archived` sont refusées, même lorsqu'un utilisateur dispose de droits de modifier le graphe directement.

## Validation d'application

Le paquet livré doit être appliqué **uniquement après** comparaison des SHA-256 initiaux avec l'archive d'origine, avec sauvegarde des fichiers destinataires. Les fichiers déjà modifiés `js/radar.js` et `radar.html` sont protégés : `radar.html` est modifié seulement pour la ligne de chargement et la version d'origine est contrôlée par empreinte. Aucun `git reset`, aucun `git clean`.
