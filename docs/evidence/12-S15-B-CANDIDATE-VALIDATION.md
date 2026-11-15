# 12 — S15-B : qualification du candidat

Baseline S15-A/R1 `af248ca643c14b0b2391370c0f9dce305df2d47e`, 615 tests Node, 15 contrôles Chrome et 24 tris validés sur Mac. Voir preuve 11. Aucune publication S15.

## Préparation

- `node scripts/verify-source.mjs` : succès.
- 623 tests Node exécutés dans l'environnement de préparation, tous réussis ; cinq tests Vite de `client-variants.test.mjs` non exécutés faute de dépendance disponible. 628 tests attendus sur Mac (615 + 13 nouveaux).
- Les nouveaux tests couvrent : normalisation RFC/streams, contraintes XML, HAL/pagination, versions W3C datées, cache optionnel, génération de sélection, collisions/doublons, portabilité JSON, révisions préservées, projection, restrictions Viewer, dialogue FR/EN et création du blip par le moteur existant.
- L'accès réseau direct aux sources officielles est indisponible dans l'environnement de préparation (résolution DNS). L'acquisition réelle est donc à qualifier sur Mac.
- Le navigateur de préparation bloque la navigation locale ; la nouvelle recette Chrome est à exécuter sur Mac. Aucune réussite navigateur S15-B n'est déclarée à ce stade.

## Qualification automatisée Mac

L'installateur conserve la baseline Git et le tag A8.6, vérifie les empreintes, sauvegarde, applique le patch et ne crée aucun commit. Il exécute :

1. `node scripts/verify-source.mjs` et les 628 tests Node, sans exclusion.
2. `node tools/test-s15-a-r1-browser.mjs` : non-régression R1.
3. `node tools/test-s15-a-r1-browser.mjs --s15-b` : données déterministes, XML DOM réel, API HAL, dialogue, FR/EN, RFC 9110, JSON-LD 1.1 daté, idempotence, tri et filtres, restrictions Viewer et cache préservé après échec.
4. `node tools/sync-standard-sources.mjs rfc-editor w3c w3c:json-ld11` : acquisition effective des index officiels et de l'historique sélectionné ; chemins, taille, date et empreinte des instantanés dans le rapport.
5. `node tools/test-s15-a-r1-browser.mjs --s15-b --live-cache` : mêmes parcours sur les instantanés officiels locaux, accès extérieur bloqué.

Le rapport agrégé est persistant et copié par `pbcopy`, même si un contrôle échoue. Les logs détaillés et captures des harnais sont conservés. La recette se fait dans un profil temporaire, sans toucher au catalogue personnel. Un échec réseau est distingué d'un échec des tests ; il ne déclenche pas de rollback du code installé. Le script est relançable avant commit.

Le harnais ne démarre pas l'application complète et ne constitue pas une recette intégrale d'acquisition ISO et de publication Creator/Publisher/Viewer. La qualification S15-B et l'intégration Git restent à confirmer avec les résultats Mac réels.

## S15-B-R1 — Qualification différentielle

Mac, 15 novembre 2026 : S15-B installé, 628/628 tests Node, 15/15 contrôles Chrome R1 et 13/13 contrôles Chrome S15-B sur données déterministes. Acquisition RFC officielle réussie (14 121 424 octets) et historique JSON-LD 1.1 (17 publications). Échec de l'index W3C : diagnostic en deux pages, 1 721 entrées dont 5 rejetées, toutes avec un + dans le shortname. La recette sur caches réels n'a pas été exécutée.

R1 corrige le contrat de shortname, les validateurs d'index/historique/cache, le schéma et la CLI ; trois tests Node supplémentaires couvrent les cinq entrées officielles, la sélection/import/portabilité d'une publication historique sur fixture et le comptage RFC. 631 tests attendus. Le harnais navigateur S15-B ajoute un parcours historique DAML+OIL. L'acquisition officielle doit inclure w3c:daml+oil-axioms ; la recette hors réseau doit charger ses notices depuis le cache local. Les résultats Mac R1 restent à confirmer ; aucun commit ni publication.

### R2 — isolation de la recette navigateur

Sur Mac, R1 : 631 tests Node réussis, 15 contrôles S15-A réussis, puis 9 contrôles Creator S15-B réussis avant le timeout historique. Le simulateur d'échec réseau RFC restait actif et bloquait l'acquisition de l'historique W3C. R2 borne ce simulateur au contrôle concerné avec finally et distingue les attentes de la série et de l'édition. Aucun changement métier ni assouplissement des assertions. La qualification sur corpus officiels reste à réaliser.

## Qualification finale macOS — 15 novembre 2026

Qualification S15-B + R1 + R2 réussie.

- Node.js v22.23.5 : 631/631 tests, 99 fichiers.
- Aucun échec, test ignoré, annulé ou TODO.
- Vérification statique des sources réussie.
- Chrome S15-A-R1 : 15/15 contrôles.
- Chrome S15-B déterministe : 14/14 contrôles.
- Chrome S15-B sur corpus officiels : 15/15 contrôles.
- Total : 44/44 contrôles navigateur réussis.
- Aucune exception JavaScript dans les recettes.

### Acquisition des sources officielles

- rfc-editor: 9858 notices, acquisition 2026-11-15T16:31:41.735Z, SHA-256 `0ba594f0ee30513957f9a84f28fd753e8cd751add352f655a4fd0d58b1d3c823`.
- w3c: 1721 notices, acquisition 2026-11-15T16:31:50.898Z, SHA-256 `798653d01c5253328487cd908e70503501e89564fde2efe0b08db07588215026`.
- w3c-json-ld11: 17 notices, acquisition 2026-11-15T16:31:51.137Z, SHA-256 `48174cb440ae031f042cd87969553aa250f67a39e5cb5ce3b79e65a3f200c518`.
- w3c-daml+oil-axioms: 1 notices, acquisition 2026-11-15T16:31:51.305Z, SHA-256 `01360081cf7e4d8a44b6c018c0e2475b23fc630e7dacf0fd0af4961f87d21459`.

Concordance des inventaires Node.js et Chrome :
9 858 RFC et 1 721 spécifications W3C.
Les cinq shortnames historiques contenant
le caractère + sont présents.

Intégration effective de la Note W3C
du 18 décembre 2001 avec l'identifiant
`w3c-tr:daml+oil-axioms:20011218`.
Statut Note préservé.

Exploitation des caches documentaires officiels
sans accès réseau extérieur pendant la recette.
Internationalisation FR/EN et restrictions
Creator/Viewer validées.

R1 corrige la validation des shortnames W3C.
R2 isole la simulation de panne réseau
dans le harnais navigateur, sans modifier
le code métier.

Le corpus externe reste distinct du catalogue
métier. Les caches ne font pas partie du commit.

### Périmètre et limites

Qualification des services natifs, adaptateurs,
dialogues et grilles sur jeux de données isolés,
déterministes et officiels.

La recette ne constitue pas une validation
intégrale du démarrage applicatif, de la génération
des distributions ni du parcours de publication
Creator/Publisher/Viewer.

Conclusion : S15-B consolidable sur la branche
feature/s15-standards-sources.
Aucune publication nouvelle ; A8.6 reste stable.
