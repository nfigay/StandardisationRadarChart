# 84 — S14.3-A8.4 : projection native des publications

## 1. Périmètre et décisions

Suite de l'architecture 83 et de l'architecture 79 §11. Une définition
persistante est résolue dans le même catalogue métier et produit un nouveau
catalogue natif `schemaVersion: "1.0.0"` lisible par le Viewer commun.
La projection est pure, détachée et déterministe. Elle n'est pas une mutation,
un changement de révision ou une PublicationRelease. L'ancien format expérimental
`standardisation-roadmap` v2 reste inchangé.

Le module `js/radar-publication-projection.js` utilise le modèle A8.3 et ne
connaît ni le graphe, ni le DOM, ni le réseau. Le service de persistance capture
le catalogue exportable (incluant les modifications natives du workspace),
exclut l'extension d'auteur, vérifie la capacité `publication.create`, la version
attendue, l'identité du workspace et l'état canonique avant/après le calcul
asynchrone des empreintes. Le résultat n'écrit rien dans le catalogue et ne
modifie pas la baseline de sauvegarde.

## 2. Fermeture et politique positive d'attributs

La sélection est celle d'A8.3 (explicite ou toutes les révisions publiées des
radars choisis). Les identifiants et versions existants sont préservés ; les
révisions sont triées par identifiant, l'ordre des blips est préservé ; les
collections de dépendances sont dédupliquées et triées. Les références ambiguës,
absentes ou incohérentes dans le périmètre sont refusées. L'audience est une
intention, pas une ACL ; ses organisations ne sont pas ajoutées par défaut.

| Objet | Champs distribuables v1 |
|---|---|
| Catalogue | schemaVersion, title issu de presentation.title, collections natives nécessaires |
| Organisation | organizationId, name |
| Portefeuille | portfolioId, ownerOrganizationId, name |
| Révision publiée | schemaVersion, revisionId, radarId, ownerOrganizationId, portfolioId, status, title, version, blips |
| Blip | blipId, standardId, label, ring, quadrant, position{x,y}, assessmentId si autorisé |
| Standard | standardId, name, extensions explicitement décrites ci-dessous |
| Évaluation (si autorisée) | assessmentId, name, title, standardId si présent et cohérent |

La fermeture suit révision → organisation, portefeuille → organisation,
blip → standard et, si autorisé, assessment. Un assessment référencé est
contrôlé même si la politique l'exclut ; dans ce cas `assessmentId` est retiré
et le détachement est compté. Lorsque la politique l'inclut, seul le résumé
identifié est distribué ; les décisions et justifications ne sont pas encore
couvertes par un contrat stable. Pas d'inclusion implicite d'autres standards.
Les coordonnées sont copiées par axes numériques finis, non par objet entier.

## 3. Extensions et données documentaires

- `extensions.publications` et tous les autres champs d'auteur sont exclus.
- Seuls les noms d'affichage des radars/révisions retenus sont conservés via
  `extensions.administration.radarNames` / `revisionLabels`. Pas de nameHistory.
- `standard.extensions.referenceDeclaration` : issuer, designation,
  editionDesignation, sourceName, origin, verification. URL source et date
  de déclaration volontairement exclues (elles peuvent être internes).
- `standard.extensions.isoDocument` : seulement si dataPolicy.isoDocument.
  Schéma 1, ISO Open Data, release, id, reference, title, scope, titleI18n,
  scopeI18n, icsCodes, ownerCommittee, currentStage, edition, publicationDate,
  deliverableType, supplementType, languages, pages, replaces/replacedBy.
  Les valeurs sont typées (chaînes, listes de chaînes, dictionnaires de langue
  aux clés contrôlées). Les identifiants bibliographiques externes ne déclenchent
  aucune inclusion d'autres normes. Pas de sourceData, pas de corpus global.
- Contextes libres, extensions de blip/révision, propriétés arbitraires,
  relations génériques sans contrat natif : exclus. Le rapport explicite ces
  limitations. DEC-009/010 restent ouverts ; aucun contrat relationnel inventé.

Une allowlist structurelle ne peut pas reconnaître un secret écrit dans un
champ volontairement publiable (nom, titre, libellé, texte de scope, etc.).
Le Publisher doit permettre la prévisualisation/relecture avant distribution.
Les textes documentaires peuvent être multilingues ; les futures commandes UI
utiliseront i18next. Aucun changement d'interface dans ce lot de moteur.

## 4. Services et artefact

`__radarPublicationProjection.project(source, configuration)` retourne
`{catalog, report}` ; `verify(source, configuration, candidate)` reconstruit
et compare canoniquement la projection, refusant tout écart.

`__radarCatalogPersistence.preparePublicationProjection(graph,id,expectedVersion)`
retourne un catalogue détaché et le rapport auteur, avec identifiant/version de
définition, compteurs, révisions résolues, digest SHA-256 de source et projection
(`sorted-json-v1`). Le rapport n'est PAS embarqué dans le JSON distribué.
`downloadPublicationProjection` télécharge exclusivement le JSON natif projeté
sous `radar-publication-<12 premiers caractères du digest>.json` et retourne le
rapport avec filename. Le digest couvre le contenu canonique, pas les octets
indentés du fichier. Le déclenchement du téléchargement n'est pas un accusé de
réception disque. Aucun historique de livraison n'est créé à cette étape.
La vérification des octets, l'enveloppe et la provenance de livraison définitive
relèvent d'A9. La définition de présentation et de conditionnement n'est pas
encore appliquée au Viewer ; le titre du catalogue est projeté.

## 5. Qualification et limites

`tests/radar-a84-projection.test.mjs` : 16 tests sur le modèle réel, sélection
multiradar/dynamique, fermeture, évaluations, contrôle des valeurs imbriquées,
non-divulgation de champs et lignes non retenus, déterminisme, contrôle négatif,
concurrence, compatibilité avec le chargeur et l'adaptateur Viewer, restriction
API, téléchargement exact et bootstrap. Pas de modification des tests existants.
Les exemples projetés du package proviennent réellement du moteur et du catalogue
A8.3 synthétique ; aucune preuve de génération de release inventée.
CPV-06/12 : implémentation candidate partielle ; qualification sur dépôt et
recette navigateur, contrat de relations/contexte, prévisualisation, vérification
des artefacts et exclusion physique de code restent nécessaires. Les modules
transitoires sont encore présents dans le Viewer commun ; l'API d'auteur y est
refusée, ce qui n'est pas une protection des octets déjà distribués.

## 6. Qualification réelle A8.4 — 14 novembre 2026

Installation exacte depuis A8.3 (94aef3e) : 568/568 tests, dont 16 A8.4,
construction Pages stricte, deux applications autonomes et projections
exemples. Dans Chrome, `A84-CREATOR-PROJECTION` confirme rev-1 et rev-3,
2 radars, 2 standards, 2 blips, 0 évaluations, 0 instantanés ISO, même digest
canonique préparation/téléchargement et aucun historique fictif.
`A84-VIEWER-VALIDATION` confirme chargement du fichier produit, deux groupes,
rev-3 active, un blip affiché, profil Viewer et refus de publication.create.
Voir [preuve 05](../evidence/05-A84-CREATOR-VIEWER-VALIDATION.md).

Qualification du périmètre implémenté ; CPV-06/12 restent partiels. Pas de
preuve navigateur de fiche ISO projetée ni de composition de distribution
finale. Les restrictions de champs/relations et le caractère canonique du
digest demeurent. A8.5 et A8.6 traitent l'interface et le Viewer préchargé.
