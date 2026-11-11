# DEC-009 — Synthèse expérimentale Q1/Q3 (candidat)

Statut : **CANDIDAT — NON ADOPTÉ**

Décision : **DEC-009 OPEN**

Périmètre : analyse de Q1 (granularité des identités normatives) et Q3 (amendements et corrigenda).

Ce document ne modifie ni les décisions de gouvernance ni les schémas applicatifs.

## 1. Objet et sources

Les observations ISO proviennent du corpus ISO-P1-F1 et des documents candidats :

- \`docs/architecture/03-CONTRAT-IDENTITE-ISO-CANDIDAT.md\`
- \`docs/governance/02-DEC-009-DOSSIER-ARBITRAGE-CANDIDAT.md\`
- \`docs/governance/03-DEC-009-MATRICE-CAS-REELS-CANDIDAT.md\`

Les expériences comparées sont :

- B1 : \`DEC009-Q1Q3-B1\`, 16 tests réussis.
- B2 : \`DEC009-Q1Q3-B2-A\`, 6 tests de résistance réussis, précédés de la réexécution des 16 tests B1.

Les deux expériences sont conservées exclusivement sous \`Downloads\`.

## 2. Cas étudiés

| Cas | Désignation | Question exercée |
|---|---|---|
| F01 | ISO 8601-1:2019 | Partie et édition |
| F02 | ISO 8601-2:2019 | Autre partie et regroupement éventuel |
| F04 | ISO/IEC 27001:2022/Amd 1:2024 | Amendement et édition cible |
| F05 | ISO/IEC 27001:2013/Cor 2:2015 | Corrigendum, édition cible, retrait |
| F07 | ISO/CD 8601-2 | Projet distinct d'une édition publiée |

Les désignations et interprétations sont reprises des fixtures expérimentales et du corpus F1. Elles ne constituent pas un référentiel ISO canonique.

## 3. Modèles concurrents

### A — Minimal

- Références normatives et publications individualisées.
- Éditions et types documentaires explicités.
- Relations documentaires conservées.
- Familles non intégrées au cœur du modèle.

### B — Hiérarchique souple

- Références et publications individualisées.
- Familles facultatives.
- Projets identifiables comme tels.
- Relations documentaires transversales.
- Regroupement ISO 8601 marqué \`hypothesis\`, non confirmé.

Les deux projections sont des prototypes, et non des contrats de données applicatifs.

## 4. Résultats B1 — Conservation

16 tests réussis sur 16.

- Restitution des cinq fixtures dans les deux modèles.
- Projet conservé comme \`committee-draft\` et \`under-development\`.
- Relation \`intended-replacement\` conservée distincte d'un remplacement effectif.
- Blip fictif conservant son \`standardId\`, sans \`referenceId\` ni \`editionId\` inventés.
- Regroupement familial hypothétique non présenté comme fait établi à la restitution.
- Perte d'une relation ou d'une URL détectable par comparaison aux fixtures.

La restitution est effectuée par des transformations réciproques issues du même prototype.

## 5. Résultats B2 — Résistance

6 tests réussis sur 6.

| Test | Altération contrôlée | Résultat |
|---|---|---|
| B17 | Cible de relation non déclarée dans la baseline | Refus |
| B18 | Fusion de deux notices de provenance distincte | Détection |
| B19 | Projet converti en publication effective | Refus |
| B20 | Relation documentaire changée de sémantique | Refus |
| B21 | Famille hypothétique promue comme confirmée | Refus |
| B22 | Réaffectation de \`standardId\` legacy | Refus |

Le validateur B2 est indépendant des fonctions de projection mais dépend des mêmes faits de référence.

Le contrôle B17 ne valide pas l'existence des cibles auprès d'ISO.

## 6. Résultats comparatifs

| Critère | Modèle minimal | Hiérarchique souple |
|---|---|---|
| Restitution sur cinq cas | Réussie | Réussie |
| Résistance aux six scénarios | Réussie | Réussie |
| Relations explicites | Oui | Oui |
| Familles conceptuelles | Hors cœur du modèle | Facultatives |
| Supériorité démontrée | Non | Non |

Les résultats ne permettent pas de sélectionner un modèle.

## 7. Compatibilité historique

Invariants candidats, non adoptés :

- Conserver la valeur et le sens historique inconnu de \`standardId\`.
- Ne pas attribuer automatiquement d'édition à un blip existant.
- Ne pas réécrire les révisions \`published\` ou \`archived\`.
- Exiger une correspondance justifiée avant tout rapprochement ISO.
- Préserver les informations de provenance et les incertitudes.

B1 et B2 ont seulement testé un blip fictif isolé.

Aucun aller-retour d'un catalogue JSON applicatif réel n'a été réalisé.

## 8. Questions non résolues

- Q1 : granularité famille/référence/partie/édition/projet.
- Q2 : preuve de correspondance entre notices de sources différentes.
- Q3 : identité technique et cardinalité des publications liées.
- Q4 : références conjointes, alias et collisions sémantiques.
- Q5 : domaine d'unicité des identifiants.
- Q6 : succession, retrait et évolution temporelle.
- Q7 : compatibilité et round-trip des catalogues historiques.

Dépendances maintenues ouvertes :

- DEC-010 : cible des assessments.
- DEC-016 : unicité et identification.
- DEC-017 : séparation des données sources et du modèle normalisé.
- DEC-018 : relations documentaires et export.

## 9. Conclusion non décisionnelle

Les modèles minimal et hiérarchique souple conservent les faits déclarés et résistent aux six altérations expérimentées.

Les tests étayent le besoin de désignations, provenances, statuts et relations explicites.

Ils ne démontrent ni l'obligation d'un regroupement familial ni la validité normative des identifiants.

Aucune option n'est adoptée. DEC-009 et ses dépendances restent OPEN.

## 10. Suite suggérée

Approfondir Q2/Q4 en confrontant des notices de sources distinctes et des références conjointes, en conservant provenance, ambiguïtés et identifiants historiques.

Aucune installation applicative, migration, décision ou opération Git n'est autorisée par ce document.
