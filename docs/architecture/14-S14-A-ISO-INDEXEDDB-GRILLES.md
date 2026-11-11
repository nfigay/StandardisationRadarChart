# S14-A — ISO Open Data, cache local et projections w2ui

## Portée

- Première source SDO : ISO, sans structure ISO imposée au futur modèle multi-SDO.
- Les fichiers officiels JSONLines `iso_deliverables_metadata` et `iso_technical_committees` sont importés explicitement par l'utilisateur, une fois téléchargés depuis ISO Open Data.
- `ICS.csv` préexistant reste la source de la hiérarchie ICS dans cette itération.
- IndexedDB est un **cache de données externes**, séparé du registre de références sélectionnées et des blips édités dans les révisions.
- Vue ICS : catégories / sous-catégories / normes importées ; une norme multi-ICS peut apparaître plusieurs fois en projection avec un même `isoId`.
- Vue TC/SC : hiérarchie `parentId` / `ownerCommittee` ; aucune relation à un WG spécifique n'est inventée.
- Recherche locale sur titre, référence, description (`scope`), ICS, comité, étape selon la vue, plafonnée à 1800 normes affichées pour limiter le coût UI. L'import lui-même n'est pas plafonné.
- L'ajout de blips depuis des normes ISO importées **n'est pas encore raccordé** : une vérification de la convergence des identités est nécessaire avant l'enregistrement dans le registre métier (S12-R1).

## Acquisition

- Téléchargement manuel depuis https://www.iso.org/open-data.html, puis sélection du type de jeu et d'un fichier `.jsonl`/`.ndjson`.
- Les imports remplacent le cache **du jeu choisi uniquement** ; une erreur d'import laisse ce cache vide (pas de restauration automatique de la version précédente). Ne pas y conserver des données irremplaçables.
- Pas de proxy, pas de client RSS actif, pas d'automatisation de synchronisation dans S14-A.
- Le stockage IndexedDB est attaché à l'origine du navigateur ; changement d'origine/effacement des données du site peut vider le cache. Toujours conserver les fichiers source.
- Attribution à afficher avec la vue source : ISO Open Data, ODC-By 1.0.

## Contrats et décisions

- Les champs `id`, `reference`, `title`, `scope`, `icsCode`, `ownerCommittee`, `currentStage`, `edition` sont alignés sur `iso_deliverables_metadata`.
- Les champs `id`, `reference`, `title`, `scope`, `parentId`, `status` sont alignés sur `iso_technical_committees`.
- `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` restent OPEN.
- Suite : import incrémental transactionnel sûr pour volumétrie, rapprochement de références, cache/actualisation réseau, RSS sécurisé, enrichissement dynamique des filtres, gouvernance des menus S13-R11.
