# S15-C — Préparation et qualification du candidat

Baseline attendue : `eb214da42c7533210daf0a2d6487be5f4231a0a0` ; branche `feature/s15-standards-sources`. S15-B consolidé localement : 631 tests, 44 contrôles Chrome et quatre acquisitions officielles réussis. Aucun changement de main, tag A8.6 ou distribution publique.

## Préparation

14 nouveaux tests couvrent suppression explicite, dépendances stockées et non sauvegardées, évaluations et extensions, refus sur snapshot indisponible, réconciliation à identité exacte, édition inconnue/distincte, ambiguïtés et collisions, actualisation contrôlée, protection des références utilisées, token et génération périmés, Viewer et non-divulgation de l'historique dans une projection. Résultat local : 14/14, 640 tests réussis hors module Vite, vérification statique des sources réussie. Suite complète Mac attendue : 645 tests dans 100 fichiers. Le module `tests/client-variants.test.mjs` contient cinq tests Vite et ne peut être chargé dans l'environnement de préparation dépourvu de Vite. Aucun résultat Mac S15-C acquis par anticipation.

## Recette automatique attendue sur Mac

- Non-régression S15-A-R1 : 15 contrôles.
- S15-B/C déterministe : 15 Creator + 4 Viewer. Nouveaux contrôles : dépendance publiée, FR/EN, réconciliation RFC 1, conservation d'identifiant, comparaison inchangée, suppression confirmée, actualisation explicite d'une notice RFC inutilisée après changement simulé, absence de contrôle cycle de vie Viewer.
- S15-B/C sur caches officiels : 15 Creator + 4 Viewer. Réutilisation des caches officiels R2 si leurs empreintes concordent ; sinon acquisition explicite des quatre corpus par le script existant. Vérification de la concordance des inventaires. Aucun accès réseau externe pendant la recette sur caches. Le scénario de changement simulé de métadonnées est réservé à la recette déterministe.
- Total attendu : 53 contrôles Chrome. Le harnais utilise DOM, W2UI, i18next et services natifs réels ; les dépendances du graphe sont testées par fixtures de snapshots et catalogue. Ce n'est pas une recette de démarrage intégral ou de distribution.

Installation différentielle sur l'état S15-B consolidé, sauvegarde des fichiers modifiés, vérification des empreintes, aucun commit/push ni modification du catalogue personnel. Les rapports Mac seront ajoutés à ce document lors de la consolidation après succès.

## Qualification finale macOS — 15 novembre 2026

Qualification S15-C réussie sur macOS.

- Node.js v22.23.5 : 645/645 tests, 100 fichiers.
- Aucun échec, test ignoré, annulé ou TODO.
- Vérification statique des sources réussie.
- Chrome S15-A-R1 : 15/15 contrôles.
- Chrome S15-B/C déterministe : 19/19 contrôles.
- Chrome S15-B/C sur corpus officiels : 19/19.
- Total : 53/53 contrôles navigateur réussis.
- Aucune exception JavaScript.

### Cycle de vie des références

Protection des références utilisées par une
révision publiée, contrôle des dépendances
et internationalisation FR/EN validés.

Réconciliation exacte de la déclaration locale
local-rfc-1 sans changement d'identifiant.

Suppression explicite d'une référence inutilisée.

Actualisation des métadonnées de rfc:9110
sans changement d'identifiant, validée avec
le jeu de données déterministe.

Absence de commandes de cycle de vie dans
le Viewer.

Les tests métier couvrent également les
dépendances de session non sauvegardées,
les protections des références utilisées,
la confidentialité de la déclaration originale
et les sélections devenues obsolètes.

### Réutilisation des sources officielles

- rfc-editor: 9858 notices, acquisition 2026-11-15T16:31:41.735Z, SHA-256 0ba594f0ee30513957f9a84f28fd753e8cd751add352f655a4fd0d58b1d3c823.
- w3c: 1721 notices, acquisition 2026-11-15T16:31:50.898Z, SHA-256 798653d01c5253328487cd908e70503501e89564fde2efe0b08db07588215026.
- w3c-json-ld11: 17 notices, acquisition 2026-11-15T16:31:51.137Z, SHA-256 48174cb440ae031f042cd87969553aa250f67a39e5cb5ce3b79e65a3f200c518.
- w3c-daml+oil-axioms: 1 notices, acquisition 2026-11-15T16:31:51.305Z, SHA-256 01360081cf7e4d8a44b6c018c0e2475b23fc630e7dacf0fd0af4961f87d21459.

Mode reused-S15-B-R2.
Concordance des inventaires vérifiée :
9 858 RFC et 1 721 spécifications W3C.

Recette réussie sur les caches officiels
sans accès réseau extérieur.

### Périmètre et limites

Le modèle de catalogue natif 1.0.0 est conservé.
Les identifiants métier ne sont pas modifiés.
Aucune migration automatique de blips ni
suppression en cascade.

Les références utilisées restent protégées,
y compris dans les brouillons et les snapshots
de session.

La réconciliation documentaire ISO et la
migration de blips entre éditions restent
hors périmètre de S15-C.

DEC-009 et DEC-010 restent ouvertes.

La qualification concerne les services,
les dialogues et les grilles sur jeux de
données isolés, déterministes et officiels.
Elle ne constitue pas une recette intégrale
du démarrage applicatif, de la génération
des distributions et de la publication
Creator/Publisher/Viewer.

Conclusion : S15-C qualifié et consolidable.
S15-D doit réaliser la qualification intégrale
avant une nouvelle publication publique.

A8.6 demeure la distribution stable.
