# 111 — S16-A-C6 : historiques OMG multi-familles consultables sur Pages

## Finalité

Achever la disponibilité **en ligne sans import JSON** des références historiques OMG déjà collectées dans S16 C5. Les références historiques des éditions formelles sont indépendantes de la version courante et de la recommandation du radar. Le radar conserve une identité officielle par version, mais ne calcule pas l'applicabilité opérationnelle à un produit ou à une configuration.

## Source de vérité et couverture

Entrées privées : `S16-C5-R1-COMPLETE-COVERAGE` (checkpoint, 14 lots, rapports et fichiers `private-only`), reprise C5-R2 (`reconciliation.json`, dix familles sélectionnées) et index de liens C4 déjà validé. Le consolidateur refuse les catalogues incomplets, les familles non prévues, les doublons, les changements de famille dans la reprise, les métadonnées incohérentes et les histoires formelles incomplètes. Seule une famille initialement `unresolved` peut être remplacée par le résultat d'une reprise.

Sorties candidates, dans **un dossier d'audit hors dépôt** :

- `index.json` : catalogue courant C4 préexistant, inchangé ;
- `histories/<FAMILY>.json` : références formelles officielles, dates et provenance au format `omg-public-history-links` déjà lu par le Creator C4 ;
- `coverage.json` : état de chaque famille et décompte des éditions formelles / versions en préparation ;
- `c6-review.json` : SHA-256 de chaque fichier et anomalies documentaires résiduelles.

**Ne sont jamais recopiés** : instantanés privés complets, descriptions, documents, HTML, fichiers ISO privés, diagnostics ligne à ligne. Les familles `in-process-only` n'ont pas de faux historique formel ; UTP2 conserve l'état `unresolved` tant que les liens croisés avec UTP 1.x ne sont pas qualifiés. Le Creator C4 charge les fichiers d'historique formels par la route relative `catalog-distribution/omg-public/histories/<FAMILY>.json`. Le manifeste de couverture est préparé pour une prochaine présentation explicite des cas non formels dans l'interface ; ce lot ne prétend pas encore afficher les versions alpha/bêta comme éditions formelles.

## Publication et droits

La projection minimise les données aux identifiants, URLs et dates, mais **une projection minimisée n'équivaut pas à une autorisation légale de redistribution**. Une revue bibliographique et juridique reste requise ; l'option `--approve-public-links` ne doit être utilisée qu'après cette revue et ne lance aucun déploiement. Aucun push automatique. La distribution candidate est ensuite relue, intégrée au build statique et testée dans un profil navigateur vierge avant commit.

## Contrôle de qualité

- Le jeu de familles issu de l'index C4 correspond exactement aux 270 familles du checkpoint ; la liste de spécifications du catalogue reste distincte du nombre d'éditions.
- Les références C5 sont revalidées par `validateOmgHistory`, projetées via C4 `project`, et chaque nombre de versions est vérifié.
- La reprise C5-R2 ne modifie pas les checkpoints précédents.
- Tests : séparation `verified` / `in-process-only` / `unresolved`, non fusion UTP / UTP2, rejet des sources incomplètes, conservation des anciennes éditions, compatibilité API de consultation C4.

## Recette navigateur prévue

Après intégration au build Pages : session privée → OMG → chargement catalogue du site → recherche UML, BPMN, BMM → historique complet et sélection distincte de versions antérieures, sans import fichier ni relais local ; contrôle du comportement lorsque l'historique est `in-process-only` ou `unresolved`. Recette transverse ISO/RFC/W3C avant publication.
