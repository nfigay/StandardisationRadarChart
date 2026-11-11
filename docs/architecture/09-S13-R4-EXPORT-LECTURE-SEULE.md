# S13-R4 — Autorisations du menu et export après publication

## Constat et qualification
Le menu principal `Fichiers` appelle `handleMenuAction` dans `radar.html`. L'export `files:savecatalogjson` était interdit sur une révision `published` ou `archived` par la liste `readonlyMenuAllowed`, alors que la barre d'outils acceptait déjà l'action `savecatalogjson`. En outre, le routage des actions `files:*` vers la barre d'outils intervenait **avant** le contrôle de lecture seule du menu principal : les imports de graphe pouvaient contourner ce premier filtre. Ces défauts concernent les autorisations de l'interface, et non la transaction de publication.

Un diagnostic ultérieur a constaté `importedCatalogs: 0`, `activeGroup: null` et un graphe vide. Il ne permet pas d'affirmer qu'une transition a effacé un catalogue : une nouvelle session ou un rechargement produirait le même état. Ce correctif ne récupère pas de données restées uniquement en mémoire.

## Correction retenue
1. `files:savecatalogjson` figure parmi les actions permises sur les révisions en lecture seule.
2. La branche `files:*` contrôle désormais le statut **avant** la délégation vers `w2ui.toolbar.onClick`. L'export catalogue et la création explicite d'un nouveau catalogue sont autorisés ; les imports de graphe SSR/CSV et les sauvegardes de graphe non prévues sont refusés sur `published` et `archived`.
3. La délégation existante reste la seule voie d'export : elle vérifie la présence d'un seul catalogue et refuse de convertir implicitement les sources ASD. Le téléchargement reste explicite, sans auto-enregistrement.
4. `imports[]`, l'adaptateur, les snapshots, les positions Cytoscape et les règles de transition `draft → published → archived` demeurent inchangés.
5. `radar.html` possède déjà un avertissement général `beforeunload`. Il n'est ni un mécanisme d'auto-sauvegarde, ni une preuve de téléchargement ; on ne le duplique pas.

## Preuves et validation
`tests/radar-lifecycle-menu.test.mjs` exécute le préambule **réel** de `handleMenuAction`, avec un W2UI simulé, pour couvrir : export en lecture seule, refus d'import SSR, refus de création de blip, accès inchangé en draft et existence de l'avertissement de sortie. Les autres tests du dépôt ont été rejoués sur copie complète. Une vérification utilisateur reste indispensable : publier un catalogue de test, exporter via **Fichiers**, confirmer la présence du JSON, réimporter et vérifier les statuts et positions.

## Décisions ouvertes et limites
S12-R1 (doublons, cohérence Référence/Standard/Blip) reste ouvert. Le suivi de modifications non sauvegardées à un niveau plus précis que `beforeunload` est une évolution distincte. Les décisions `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` restent `OPEN`. Pas de fermeture anticipée des validations du Lot 3.
