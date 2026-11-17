# 94 — S16 : fédération des connaissances de normalisation

État : contrat candidat S16-A-R1, non publié. Base A8.7 `1df817baad2072b005936197414da1ea6353f392`, delta S16-A installé et validé 648/648 sur le Mac, non commité. Ce dossier prolonge [02](02-SPECIFICATION-CIBLE.md), [89](89-S15-B-STANDARD-SOURCES.md), [90](90-S15-C-REFERENCE-LIFECYCLE.md) et [93](93-S16-A-MULTISOURCE-STANDARDS-WORKSPACE.md). DEC-009, 010, 016, 017 et 018 restent ouverts.

## 1. Invariants et cible

Le catalogue natif JSON 1.0.0 reste la représentation portable et durable du travail. Les collections existantes `organizations`, `portfolios`, `standards`, `assessments`, `radarRevisions` et les publications constituent les autorités métier. Aucun catalogue SPM parallèle, aucune nouvelle table d'organisations canoniques, aucune duplication des objets de gouvernance. Les corpus externes restent séparés des données métier ; un instantané documentaire n'est pas une organisation métier. Les identités externes sont qualifiées par leur ressource ; un libellé commun n'est jamais une preuve d'identité.

La cible fédère les ressources documentaires d'organismes de normalisation, associations, consortiums et autorités (ISO, IEC, IEEE, OMG, IETF, W3C, OASIS, ETSI, CEN-CENELEC, INCOSE/SEBoK, The Open Group, ASD, LOTAR, etc.). MOSA est une approche et non un organisme ; SD-28 et ASSIST sont des ressources distinctes. Guides, classifications, architectures de référence et profils sont représentables sans prétendre qu'ils sont tous des normes.

Un même organisme peut gouverner un portefeuille, publier des spécifications, contribuer aux travaux d'un autre organisme ou adopter des profils. Ces rôles sont des relations vers une identité existante. Les organisations seulement décrites par une source restent des notices externes jusqu'à résolution explicite. Les personnes et affiliations sont distinguées ; pas de rapprochement par nom ni de collecte de coordonnées dans ce lot.

## 2. Noyau conceptuel et correspondances

| Concept | Autorité / traitement candidat |
|---|---|
| Organisation | `organizations[].organizationId` ; identité native réutilisée si résolue ; libellés externes non canoniques |
| Portefeuille | `portfolios[].portfolioId` et `ownerOrganizationId` ; contexte de gouvernance existant |
| Référence de standard | `standards[].standardId` ; conserver identifiant, provenance, cycle de vie |
| Publication / édition | `extensions.isoDocument`, `extensions.externalDocument` et déclaration native ; DEC-009/010 à instruire |
| Groupe / comité | Identité qualifiée de source ; relation vers organisme et activité, sans nouveau modèle natif adopté |
| Personne / affiliation | Identités de source ; affiliation qualifiée, rôle, dates, provenance ; futur arbitrage de confidentialité |
| Classification | Schéma et concept identifiés, affectation et correspondances explicites ; ne pas imposer ICS partout |
| Activité | Projet, travail préparatoire ou historique de document ; distinguer de la publication |
| Relation documentaire | Source, sujet, cible, nature, justification ; une adoption ISO ne fusionne pas les publications |
| Assessment | `assessments[].assessmentId` ; évaluation contextualisée native |
| Profil | Concept candidat : sélection d'éditions, rôles, contraintes, besoins, alternatives et preuve ; référence au portefeuille existant, pas de second portefeuille |
| Radar / révision | Identités natives ; projection des positions et évaluations |
| Provenance | Déclarations et instantanés S15 existants ; provenance de champ dans la vue de consultation ; future provenance d'assertion à instruire |

SKOS, ORG, PROV-O et Dublin Core sont des pistes de correspondance sémantique, pas de nouvelles dépendances ni un choix de triplestore. OMG API4KP, Commons et MVF constituent également des références à instruire, notamment pour les ressources de connaissances, acteurs et taxonomies. Les modèles normatifs lisibles par machine sont distincts de la métadonnée de la publication et de sa licence.

## 3. Registre des ressources et contrat de lecture

`js/radar-standard-sources.js` enrichit le registre S15-B, sans seconde autorité métier :

- `knowledgeConcepts`: dictionnaire conceptuel candidat, immuable.
- `listResources({integratedOnly})`, `getResource(id)`: ressources documentaires et capacités, accès, état du connecteur, droits à instruire.
- `descriptors`: compatibilité S15, exactement ISO Open Data, RFC Editor et W3C. Les nouvelles ressources ne deviennent pas automatiquement importables. `validSource` reste limité aux connecteurs de publications S15 réellement supportés.
- `describeNativeReference(row)`: projection de lecture d'une ligne de `listReferenceRecords()`. Préserve `standardId` ; distingue sourceIdentity et identité métier ; chaque champ est `reported` ou `not-reported`, avec provenance. Absence ne signifie pas négation. Ne modifie ni ne conserve le catalogue.
- `readRfcContext(key)`: lecture explicite d'une RFC via Datatracker, groupe source-scoped et historique des Internet-Drafts ; pas de personnes/adresses collectées dans le résultat normalisé ; ne modifie pas le snapshot RFC Editor. `tools/read-standard-context.mjs --list` ou `--rfc 2026` fournit un accès Node de diagnostic.

Le registre contient 29 ressources candidates/actives. Une ressource peut avoir plusieurs capacités ; la disponibilité, la mise en œuvre et les droits sont indépendants. Les valeurs `to-review` ne constituent pas une affirmation de disponibilité ou d'autorisation. Les entrées de découverte ne font pas apparaître une nouvelle organisation dans `organizations[]`. Les connecteurs existants conservent leurs acquisitions, caches, générations et protections S15. Aucune requête implicite au démarrage. Les Viewers ne peuvent pas acquérir le contexte RFC ; la projection Publisher demeure inchangée.

## 4. Priorité OMG

Voir [95 — OMG : ressources, acquisition et droits](95-S16-OMG-SOURCE-ACQUISITION.md). OMG est désormais cible prioritaire, au même titre que l'enrichissement IETF/W3C. Le catalogue public et les métadonnées versionnées RDF/JSON-LD sont des ressources distinctes de fichiers normatifs. Le premier outillage est un diagnostic privé, pas un connecteur métier, et ne doit pas être inclus dans les distributions.

## 5. Trajectoire et critères

R1 : registre et noyau de lecture, cartographie de l'existant, preuve candidate de découverte Datatracker et OMG. R2 : navigation W2UI-first (sélecteur alimenté par le registre, `w2toolbar`, `w2grid`, fiches), séparation de la consultation et de la mutation. B : enrichissement des organisations et portefeuilles natifs. C : élicitation, besoins, évaluations et profils d'utilisation conjointe ; D : relations et provenance de graphe, projection et partage. Persistance Workspace à traiter au moment utile, sans nouvelle persistance métier concurrente.

Aucune modification du schéma 1.0.0, des transactions S15-C ou de la projection Publisher dans R1. Les correspondances OMG/ISO, identités de personnes, consolidation multi-catalogues et profil métier restent des sujets à arbitrer. Les nouveaux tests vérifient le registre, l'absence de nouvelles importations, la projection native non mutante, les contrôles Viewer et les contrats des outils. Qualification complète et essais d'accès réels sur le Mac requis avant consolidation. Les résultats de préqualification partielle ne valent pas qualification de release.
