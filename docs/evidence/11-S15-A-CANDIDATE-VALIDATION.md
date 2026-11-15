# S15-A — Validation du candidat et recette locale

**Statut : candidat, recette Mac/navigateur non exécutée.** Baseline A8.6-DOC `2695a6ef64cf338129f9ce0eb4f163dd495db1bf`, archive Git fournie et SHA-256 vérifié `5bf2a7171b46b2dec464e2bd4bdc5e064c53a736c3ba0b93cc39f6dedc669a29`. Le dépôt de travail de préparation est une reconstruction de cette archive, pas le dépôt Git du Mac. Architecture et contrat : [88-S15-A](../architecture/88-S15-A-REFERENCES-SOURCES.md).

## Tests ajoutés et adaptations

`tests/radar-s15-a-references.test.mjs` exécute les scripts réels de profil, registre, persistance, création, projection, panneau et sources dans un environnement Node/vm avec doubles DOM/W2UI et corpus ISO. Les tests couvrent : déclaration opaque non vérifiée et provenance ; refus de doublon exact ; protection de notice ISO ; création et sélection via le formulaire commun puis vrai moteur de blip ; erreur localisée et saisie préservée ; recherche et filtre combinés ; fiches en lecture seule et copie ISO ; Viewer générique et publié avec fermeture du périmètre ; interdiction des commandes auteur ; brouillon obligatoire ; fermeture du dialogue et événement obsolète ; round-trip et projection ; gestionnaire ISO unique. Les deux adaptations des tests A8.2 concernent la signature du helper extrait, son état de dialogue et le contrôle de la barre du Viewer, sans suppression de cas fonctionnel.

Résultats de préparation : 11/11 tests nouveaux réussis ; 609/609 tests réussis en excluant uniquement `tests/client-variants.test.mjs` (5 tests de construction nécessitant Vite). `node scripts/verify-source.mjs` réussi (contrôles statiques). Node v22.16.0. Vite non installable dans l'environnement de préparation (DNS npm). La suite complète attendue est 614 tests ; les cinq tests exclus restent à exécuter. Les doubles ne constituent pas une recette graphique. Aucune qualification complète du build ni de la recette navigateur n'est revendiquée.

## Préconditions de recette Mac

Installer le candidat sur une branche S15 depuis la baseline propre ; vérifier les SHA-256, le tag immuable et les rapports JSON. Node 22.12+ (22.x), dépendances npm de la baseline déjà disponibles. Lancer la validation complète fournie (pas de publication). Créer une copie de travail du catalogue de recette, disposer d'un brouillon et d'une révision publiée ; utiliser la distribution ISO existante si disponible. Ne pas modifier les artefacts publics A8.6.

## Recette fonctionnelle (à renseigner)

| ID | Action | Attendu |
|---|---|---|
| R01 | Ouvrir le Creator et un catalogue ; menu registre | Vue Références ; grille, organisme/source, recherche et filtre ; pas de second registre. |
| R02 | Déclarer une référence non-ISO (titre, organisme, désignation, édition, source/URL HTTPS) | Déclaration non vérifiée, identifiant opaque, formulaire fermé, notice sélectionnée ; aucun blip créé implicitement. |
| R03 | Déclarer à nouveau même organisme/désignation/édition en variant la casse et les espaces ; puis édition distincte | Refus clair sans perte de saisie ni écriture ; édition distincte acceptée. |
| R04 | Afficher la fiche locale/historique ; changer FR/EN | Métadonnées disponibles visibles, lecture seule, aucun statut de confiance inventé. |
| R05 | Sources ISO puis retour Références ; parcourir ISO, intégrer une notice et consulter sa fiche | Commande unique, source installée et administration conservées ; notice ISO native et fiche riche, réimport sans doublon. Tester aussi absence de corpus ISO. |
| R06 | Depuis chacune des deux notices, ajouter un blip au brouillon ; tenter depuis une révision publiée | Réutilisation de l'ID, blip créé dans le seul brouillon ; refus sur publié, catalogue intact. |
| R07 | Filtrer chaque origine, rechercher par source/organisme/édition ; exporter puis rouvrir JSON | Filtres cohérents ; référence et position du blip conservées ; anciennes notices lisibles. |
| R08 | Ouvrir une déclaration, remplacer/fermer le catalogue | Ancien dialogue fermé, filtre réinitialisé, aucune mutation du nouveau catalogue par l'ancien formulaire. |
| R09 | Générer localement un Viewer de publication incluant des blips ISO et non-ISO ; ouvrir hors réseau | Seules les références de la révision sélectionnée sont visibles ; fiches en lecture seule, aucune commande auteur, URL source locale non distribuée. |
| R10 | Charger un catalogue publié dans le Viewer générique | Consultation de toutes les références natives ; pas de gestion de sources ni déclaration. |

Enregistrer pour chaque contrôle résultat, navigateur/version, catalogue et observations. En cas d'échec conserver le rapport JSON et les logs. La recette complète A8.6 et celle des distributions publiques restent des preuves distinctes. Aucune nouvelle publication avant autorisation.

## S15-A-R1 — Retour navigateur et correction

S15-A a passé les 614 tests sur macOS (rapport S15-A-INSTALL-VALIDATE du 15 novembre 2026, aucun échec). La recette réelle a montré cinq références présentes, mais un filtre de provenance surdimensionné masquait la grille ; un tri provoquait une exception W2UI. La correction vise les dimensions du filtre et les métadonnées de colonnes nécessaires à `localSort`, sans modification du stockage. La sélection de la nouvelle déclaration ne masque plus les autres notices.

Validation de préparation R1 : 610 tests réussis, aucun échec, cinq tests Vite non exécutés dans cet environnement ; contrôle statique réussi. Suite complète attendue : 615 tests. Le nouveau test navigateur `node tools/test-s15-a-r1-browser.mjs` utilise un serveur local éphémère, un profil Chrome isolé, le panneau, les services de déclaration/persistance et W2UI réels, des notices historiques de test, et la règle CSS de `radar.html`. Il vérifie les dimensions, le formulaire de déclaration, la sélection, les tris, les filtres et les deux langues dans Creator et Viewer. Il ne remplace pas la recette applicative complète (ISO, blips, publication). Le navigateur de préparation interdit les URL locales par politique ; l’exécution Chrome sur le Mac est requise. Aucun résultat navigateur réussi n’est revendiqué à ce stade.


## Qualification macOS — 15 novembre 2026

S15-A-R1 : suite Node.js complète réussie,
615 tests, 615 succès, zéro échec, zéro test ignoré,
annulé ou TODO. Node.js v22.23.5.

Recette Chrome automatisée S15-A-R1-BROWSER :
15 contrôles réussis sur deux profils, Creator
et Viewer, 24 tris W2UI réussis, aucune
exception JavaScript.

Résultats mesurés : filtre de provenance
30 px de hauteur et 190 px de largeur ;
grille de 176 px dans le harnais isolé.
Déclaration effective et sélection de la
nouvelle référence ; trois notices visibles
dans Creator. Conservation du catalogue
pendant le filtrage. FR/EN et conservation
de la saisie validés. Restrictions du Viewer
validées.

Le harnais utilise le DOM, W2UI, i18next
et les services natifs réels avec un jeu
de données isolé. Il ne constitue pas une
recette intégrale de démarrage, acquisition
ISO et publication Creator/Publisher/Viewer.

Conclusion : qualification automatisée
S15-A et R1 réussie. Consolidation sur la
branche S15. Aucune nouvelle publication ;
A8.6 demeure la distribution publique stable.
