# DEC-009 — Dossier d'arbitrage candidat : identité ISO

**Statut :** PROPOSITION DOCUMENTAIRE — décision non prise
**Date :** 2026-11-06
**Décision :** DEC-009 — OPEN
**Contrat lié :** ../architecture/03-CONTRAT-IDENTITE-ISO-CANDIDAT.md

## 1. Objet

Déterminer le niveau d'identité à retenir pour les normes, parties
et éditions ISO sans modifier rétroactivement les catalogues, les
blips historiques ou les révisions publiées.

Ce document présente des options et une recommandation technique.
Il n'enregistre aucune approbation métier et n'autorise aucun codage.

## 2. Éléments établis

- Le catalogue applicatif utilise `standardId`.
- Les blips référencent `standardId` et éventuellement `assessmentId`.
- Les données ICS représentent une classification.
- L'import JSONL des comités n'est pas un contrat d'identité des normes.
- L'extracteur HTML ISO expérimental expose des champs de référence
  et d'édition, sans garantir une identité normative canonique.
- Aucun corpus ISO réel représentatif n'a été validé par ISO-P1.
- Les révisions published/archived doivent rester non éditables en place.

## 3. Options examinées

| Option | Principe | Atouts | Risques |
|---|---|---|---|
| A | Un standard applicatif par édition | Ciblage direct d'une édition | Continuité entre éditions non explicite |
| B | Un standard applicatif par référence stable | Identification pérenne d'une référence | Éditions insuffisamment individualisées |
| C | Référence stable et éditions distinctes | Identités précises et évolution explicite | Contrat, provenance et migration à définir |

### Recommandation candidate

Étudier en priorité **l'option C**, avec :
- maintien intégral des `standardId` existants ;
- ajout conceptuel d'identifiants `referenceId` et `editionId` ;
- provenance explicite des notices externes ;
- absence de rapprochement ou de choix d'édition implicite ;
- aucune réécriture des révisions published/archived.

Cette recommandation n'est pas une adoption de DEC-009.

## 4. Dossier de preuves expérimentales

| Périmètre | Preuve | Résultat | Limite |
|---|---|---|---|
| D01–D14 | Identités, collisions, legacy, révisions | 14/14 tests | Modèle isolé |
| D15–D22 | Alias, provenance, succession, conflits | 8/8 tests | Modèle isolé |
| Ensemble | Contrôles et empreintes vérifiés | 22/22 tests | Fixtures fictives |
| Sources réelles | Corpus ISO représentatif | Non disponible | Identification métier non validée |
| Intégration | Catalogue, W2UI, export et round-trip | Non testée | Aucune migration autorisée |

Les validations ne prouvent pas la conformité aux règles d'identification
publiées par ISO ni la fiabilité d'un rapprochement automatique.

## 5. Questions soumises à arbitrage

| ID | Question | Choix / preuve encore nécessaire |
|---|---|---|
| Q1 | Famille, norme et partie sont-elles des identités distinctes ? | Granularité métier de la référence |
| Q2 | Quelles preuves confirment qu'une notice vise une édition ? | Sources faisant autorité et règles de confirmation |
| Q3 | Quelle identité pour amendements et corrigenda ? | Objets autonomes ou relations documentaires |
| Q4 | Comment gérer les références conjointes et leurs alias ? | Organismes et système de désignation |
| Q5 | Quelle portée d'unicité pour les clés ? | Catalogue local, source, fédération |
| Q6 | Comment gérer retrait, succession et correction des métadonnées ? | Historisation et règles de refresh |
| Q7 | Comment enrichir un standard legacy sans édition connue ? | Représentation explicite de l'incertitude |

## 6. Conditions préalables à une adoption

1. Examiner un jeu représentatif de notices ISO autorisées,
   comprenant parties, éditions, amendements et retraits.
2. Statuer explicitement sur Q1 à Q7.
3. Valider le périmètre d'unicité, la provenance et les collisions.
4. Définir les règles de rapprochement confirmé et de refus.
5. Réaliser une revue d'impact sur les catalogues JSON 1.0.0.
6. Préparer des tests de round-trip et d'immutabilité.
7. Tracer formellement l'approbation selon la règle du registre
   des décisions, avec date, approbateur et référence.

## 7. Décisions connexes à ne pas préjuger

- **DEC-010 — OPEN :** liens et cardinalités standard / édition /
  assessment / blip.
- **DEC-016 — OPEN :** politique multi-catalogue.
- **DEC-017 — OPEN :** frontière entre source brute, normalisation,
  gouvernance et projection.
- **DEC-018 — OPEN :** représentation et export sans perte des relations.

L'arbitrage DEC-009 peut établir un principe d'identité sans décider
simultanément les contrats détaillés de ces domaines.

## 8. Proposition de décision, non approuvée

« Retenir comme cible conceptuelle une identité de référence normative
distincte de l'identité de chaque édition, tout en préservant les
identifiants applicatifs historiques. Les règles de correspondance,
de provenance, de migration et de versionnement demeurent soumises
aux arbitrages et validations complémentaires indiqués ci-dessus. »

**Statut final de ce dossier :** proposition à examiner.
**Statut de DEC-009 :** OPEN.
**Autorisation de développement :** aucune.
