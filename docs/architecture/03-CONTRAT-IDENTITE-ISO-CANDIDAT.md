# ISO-P1-C — Contrat candidat d'identité des normes ISO

**Statut :** PROPOSITION — non adoptée
**Décision associée :** DEC-009 (OPEN)
**Date :** 2026-11-06
**Périmètre :** identité normative, éditions, provenance et compatibilité RadarChart

## 1. Objet et limites

Définir une séparation explicite entre identité applicative,
référence normative stable, édition et enregistrement source.

Ce document est un contrat candidat. Il ne définit ni une migration
approuvée, ni une modification du schéma JSON 1.0.0 existant.

Aucun corpus ISO réel n'a été identifié localement lors de ISO-P1-A.
Les exemples ci-dessous sont fictifs et ne constituent pas des
références ISO vérifiées.

## 2. Éléments établis dans le dépôt

- Le catalogue existant emploie `standards[].standardId`.
- Les blips de révision référencent `standardId` et éventuellement
  `assessmentId`.
- L'adaptateur projette les blips vers Cytoscape.
- Les identifiants ICS concernent une classification, non l'identité
  d'une publication normative.
- L'import JSONL des comités transforme des nœuds et arêtes sans
  contrat d'identité des éditions ISO.
- L'extracteur HTML expérimental expose Reference number, Number,
  Edition et des métadonnées, mais ne fournit aucune identité stable
  démontrée.
- Les révisions published/archived sont non éditables en place.

Sources de preuve : audits ISO-P1-A, ISO-P1-B et DOC-P6.

## 3. Modèle conceptuel candidat

### 3.1 Standard applicatif existant

`standardId` reste une clé interne opaque.

Sa signification normative précise n'est pas présumée :
un enregistrement legacy peut viser une référence générique ou
une édition sans que le système puisse le déduire.

Aucun standardId existant n'est renommé ou recalculé.

### 3.2 Référence normative

`referenceId` est une identité technique distincte qui représente
une référence normative à la granularité explicitement établie
(par exemple une partie de norme).

Attributs candidats :
- referenceId : identité opaque locale, stable dans son catalogue ;
- designation : forme affichable provenant d'une source tracée ;
- issuer / designationSystem : organisme et système de désignation ;
- parentReferenceId : lien optionnel de composition, si vérifié ;
- sourceLinks : provenances et alias, sans écrasement destructif.

Une famille de normes et une partie ne sont pas automatiquement
le même objet.

### 3.3 Édition

`editionId` identifie une édition spécifique d'une référence.

Attributs candidats :
- editionId : identité opaque locale ;
- referenceId : référence parente, obligatoire si liaison connue ;
- editionDesignation : désignation telle que fournie ;
- publicationYear : métadonnée optionnelle, jamais clé suffisante ;
- editionNumber : métadonnée optionnelle si disponible ;
- publicationDate / status : métadonnées sourcées ;
- sourceLinks : origine et historique de synchronisation.

Une année seule ne prouve pas l'unicité d'une édition.
Une édition non identifiée demeure explicitement « inconnue ».

### 3.4 Source et provenance

`sourceRecordId` est l'identifiant de l'enregistrement dans une source
déterminée ; il n'est pas automatiquement une identité normative.

Conserver au minimum, lorsque disponibles :
- sourceName et sourceVersion ou date de collecte ;
- sourceRecordId et sourceUrl ;
- désignations brutes ;
- date d'observation ;
- décision de rapprochement et son niveau de confiance.

Les données brutes doivent rester distinguables des données normalisées.

## 4. Invariants de compatibilité

1. Les valeurs existantes de `standardId`, `blipId`,
   `assessmentId` et `revisionId` ne sont pas recalculées.
2. Le modèle JSON 1.0.0 reste lisible sans nouveaux champs.
3. L'absence d'édition n'entraîne aucune sélection implicite.
4. Une actualisation du titre ou du statut ne change pas l'identité.
5. Aucun import ne fusionne automatiquement deux standards existants.
6. Une ambiguïté d'identité est rapportée, pas résolue silencieusement.
7. Les révisions published/archived ne sont jamais éditées en place.
8. Les exportations ne doivent pas perdre les relations reconnues ;
   le contrat de relations relève aussi de DEC-018.
9. L'identité et le contexte d'une évaluation restent distincts ;
   l'association exacte relève de DEC-010.
10. Les collisions entre catalogues ne sont pas arbitrées ici ;
    la politique multi-catalogue relève de DEC-016.

## 5. Rapprochement candidat

États conceptuels proposés :
- unresolved : données insuffisantes ;
- candidate : rapprochement possible, non confirmé ;
- confirmed : rapprochement vérifié avec provenance ;
- conflict : plusieurs identités compatibles ou données contradictoires.

Une égalité de chaînes de désignation ne suffit pas systématiquement
à produire l'état confirmed.

Aucun algorithme de rapprochement n'est autorisé par ce document.

## 6. Cas limites obligatoires

- Même référence stable, éditions successives.
- Références de parties distinctes.
- Référence générique sans édition déterminée.
- Année présente sans numéro d'édition.
- Amendement et corrigendum : statut d'objet à arbitrer.
- Référence conjointe entre organismes.
- Désignations aliasées ou renommées.
- Retrait, remplacement et succession d'éditions.
- Enregistrements contradictoires issus de plusieurs sources.
- Import d'un catalogue legacy sans métadonnées ISO.
- Collisions entre catalogues et conservation des exports.

## 7. Fixtures illustratives, non normatives

A. Référence fictive `ISO 12345-1` avec éditions 2021 et 2025 :
   deux editionId distincts, un referenceId commun uniquement
   si la correspondance de référence est vérifiée.

B. Blip historique dont seul standardId est connu :
   référence et édition demeurent inconnues.

C. Deux notices partageant un intitulé mais pas une provenance
   suffisante : rapprochement candidate ou conflict, pas fusion.

D. Statut d'une notice modifié sans changement du document visé :
   identité conservée, métadonnées historisées.

E. Révision published portant un ancien lien standardId :
   publication inchangée, enrichissement externe séparé.

## 8. Vérifications préalables à toute implémentation

- Valider les définitions métier de référence, partie et édition.
- Inspecter un corpus ISO réel autorisé, avec cas limites.
- Définir schéma et cardinalités sans modifier silencieusement 1.0.0.
- Tester les collisions, alias et données manquantes.
- Tester les lectures/exportations legacy et les round-trips.
- Tester l'immutabilité des révisions published/archived.
- Tester explicitement les cas de refus et d'ambiguïté.
- Établir les décisions DEC-010, DEC-016, DEC-017 et DEC-018
  qui conditionnent les intégrations ultérieures.

## 9. Arbitrages encore ouverts — DEC-009

1. Quelle granularité distingue famille, partie et référence stable ?
2. Quelle preuve établit que deux notices visent la même édition ?
3. Les amendements/corrigenda ont-ils une identité propre ?
4. Quel domaine d'unicité pour referenceId et editionId ?
5. Quel niveau de provenance est obligatoire ?
6. Quelles règles de refresh, de retrait et de succession ?
7. Comment représenter explicitement la cible d'un legacy standardId
   sans lui imposer rétroactivement une édition ?

## 10. Décision et portée

Option C (référence + éditions distinctes) : candidate à évaluer.

DEC-009 demeure OPEN. Ce document n'autorise ni modification du code,
ni migration des identifiants existants, ni changement du registre
des décisions.
