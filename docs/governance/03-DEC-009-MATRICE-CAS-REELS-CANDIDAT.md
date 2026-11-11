# ISO-P1-F3 — Matrice d'arbitrage DEC-009

**Statut :** CANDIDAT — non approuvé
**Date de référence :** 2026-11-06
**Décision :** DEC-009 — OPEN
**Origine :** ISO-P1-F1 et qualification ISO-P1-F2-A

## 1. Portée des preuves

Les notices citées sont des observations de métadonnées publiques.
F2-A a vérifié la structure et l'intégrité de la matrice F1 :
il ne constitue pas une nouvelle consultation indépendante des
pages ISO, ni une certification des informations normatives.

Les observations ne constituent pas des identités canoniques.
Aucun schéma, rapprochement ou codage n'est approuvé ici.

## 2. Corpus de travail

| Cas | Désignation | Questions | Notices officielles |
|---|---|---|---|
| F01 | ISO 8601-1:2019 | Q1 | [ISO 1](https://www.iso.org/standard/70907.html) |
| F02 | ISO 8601-2:2019 | Q1 | [ISO 1](https://www.iso.org/standard/70908.html) |
| F03 | ISO/IEC 27001:2022 | Q4, Q2 | [ISO 1](https://www.iso.org/standard/27001) |
| F04 | ISO/IEC 27001:2022/Amd 1:2024 | Q3 | [ISO 1](https://www.iso.org/standard/88435.html) |
| F05 | ISO/IEC 27001:2013/Cor 2:2015 | Q3 | [ISO 1](https://www.iso.org/standard/69378.html) |
| F06 | ISO 9001:2015 → ISO 9001:2026 | Q2, Q6, Q7 | [ISO 1](https://www.iso.org/standard/62085.html), [ISO 2](https://www.iso.org/quality-management/iso-9001-2026) |
| F07 | ISO/CD 8601-2 | Q1, Q6 | [ISO 1](https://www.iso.org/standard/91030.html) |

Les liens ci-dessus correspondent aux observations de la matrice
ISO-P1-F1. Ils permettent de consulter les notices sans dépendre
du dossier de staging. Leur contenu et leur statut peuvent évoluer.

## 3. Matrice de décision Q1–Q7

| Question | Sujet | Cas | Éléments disponibles | Arbitrage restant | Preuve manquante |
|---|---|---|---|---|---|
| Q1 | Granularité normative | F01, F02, F07 | Parties distinctes ; projet de nouvelle édition | Famille, norme, partie et projet : identités et relations | Contrat de granularité approuvé |
| Q2 | Confirmation d’une édition | F03, F06 | Désignation conjointe et succession documentées | Preuves de correspondance entre notices de sources différentes | Politique de rapprochement et provenance |
| Q3 | Amendements et corrigenda | F04, F05 | Publications liées à une édition identifiée | Identité autonome et cardinalité des relations | Décision de modélisation documentaire |
| Q4 | Références conjointes et alias | F03 | Désignation ISO/IEC préservée | Equivalences, alias et portée des organismes | Exemples de notices provenant de plusieurs sources |
| Q5 | Portée d’unicité | Aucun cas direct | Aucune preuve empirique dans F01–F07 | Unicité locale, par source ou fédérée | Jeu de collisions multisources et décision DEC-016 |
| Q6 | Cycle de vie | F06, F07 | Succession effective et projet futur distingués | Dates d’effet, historisation et corrections de statut | Contrat de provenance temporelle |
| Q7 | Compatibilité historique | F06 | Cas illustrant un changement d’édition | Préservation des standardId, blips et révisions publiées | Round-trip de catalogues legacy sans mutation |

## 4. Orientation technique non adoptée

L'option C (référence normative et éditions distinctes) demeure
une hypothèse de travail cohérente avec les cas étudiés.

Les clés applicatives existantes, notamment standardId, ne doivent
pas être recalculées ni réassignées automatiquement.

L'absence de correspondance déterminée doit rester explicite.
Les révisions published et archived demeurent non éditables en place.

## 5. Dépendances

- DEC-010 : association standard, édition, assessment et blip.
- DEC-016 : politique multi-catalogue et collisions.
- DEC-017 : séparation source, normalisation et gouvernance.
- DEC-018 : représentation et export sans perte des relations.

Ces décisions restent OPEN et ne sont pas tranchées par F3.

## 6. Prochaine étape d'arbitrage

Examiner Q1 et Q3 à partir des publications liées ; approfondir
Q2 et Q4 sur des provenances multiples ; traiter Q5, Q6 et Q7
avec des scénarios de collision, d'historisation et de round-trip.

**DEC-009 reste OPEN.**
**Aucune autorisation de modification applicative.**
