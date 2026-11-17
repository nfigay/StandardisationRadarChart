# 100 — S16-A-C1 : consolidation du Creator et contrôle avant publication

Statut : **CANDIDAT DE CONSOLIDATION NON PUBLIÉ**. Base : S16-A-R4-R1 ; qualification utilisateur observée le 17 novembre 2026 : **95/95 tests ciblés, 694/694 tests Node, recette navigateur 8/8**. Ces résultats sont des observations rapportées et ne constituent pas une qualification du livrable C1 lui-même.

## Frontière de responsabilité

Le **Standardization Radar Chart exprime des recommandations** de standardisation, situées sur un radar, indépendamment du statut courant ou historique d'une édition. Le radar ne garantit pas qu'une norme est effectivement applicable à une application, une configuration, un équipement ou un système. La **qualification d'un écosystème opérationnel** relève d'une activité indépendante, fondée sur inventaires, preuves et contraintes d'exploitation. Aucune fonctionnalité d'« applicabilité opérationnelle » n'est introduite à cette étape ; les recommandations existantes restent inchangées.

## Parcours Creator à stabiliser

1. Ouvrir **un seul catalogue métier** ; distinguer cette donnée native des catalogues documentaires consultables.
2. Dans **Standards**, choisir explicitement une source (ISO, RFC, W3C, OMG), puis consulter la liste ou la fiche et son origine.
3. Les actions d'acquisition sont **explicites et propres à la source** ; aucune collecte implicite au chargement du Creator. Le cache privé de source est séparé des notices natives.
4. Sur OMG, ouvrir l'**historique d'une famille**, choisir une **édition précise**, puis **Intégrer** dans le catalogue métier ouvert ; le bouton reste désactivé en l'absence d'une sélection ou d'un catalogue éditable.
5. Une édition historique ne remplace ni son homologue plus récente ni la recommandation associée à un blip. L'intégration est idempotente par identité de version, et l'absence d'adoption ISO explicite ne vaut pas absence de relation.
6. La consultation **Viewer** est en lecture seule. Les fonctions dépendantes du relais local OMG ne sont pas promises dans les distributions statiques GitHub Pages.

## Dossier de prépublication

Le nouvel outil `tools/radar-s16-prepublication-audit.mjs` établit un état **en lecture seule** : branche, HEAD, références protégées, absence de staging, fichiers attendus et empreintes R4/R4-R1. La sortie JSON est un artefact d'audit, pas un feu vert de publication. Les caches ISO/OMG privés n'ont pas vocation à être embarqués dans Pages. Un build et ses tests restent à exécuter dans le dépôt utilisateur, puis les livrables doivent être comparés à la version publiée A8.7.

### Portes à franchir avant un commit et un déploiement

- Audit C1 intégral et contrôles Node réussis sur macOS.
- Construction `npm run build:pages`, suivie de `npm run verify:pages` et de l'inspection des fonctionnalités réellement accessibles dans la distribution statique ; vérifier notamment que les fonctions requérant le relais local sont désactivées/annoncées sans fausse promesse.
- Inventaire explicite des fichiers à versionner, exclusions des caches et des sauvegardes privées, validation manuelle du diff de documentation et de code.
- Décision de release, autorisation **explicite** du commit, de la mise à jour de `main`, du tag et du déploiement de `gh-pages` ; ces actes sont distincts.
- Vérification post-publication du Viewer et du Creator distribués sans altérer les artefacts A8.7 avant accord.

**Non-objectifs C1 :** modification du schéma natif `1.0.0`, éditeur d'applicabilité opérationnelle, collecte massive de versions, commit automatique, push, tag ou publication.
