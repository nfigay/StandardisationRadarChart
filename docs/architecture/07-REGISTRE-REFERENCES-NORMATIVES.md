# S12 — Registre de références normatives : première intégration

**Statut : implémentation locale limitée, validation navigateur requise.**
**Socle : Lot 1, Lot 2 et correctif S11.**
**Décisions : DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 : OPEN.**

## Décision de conception validée par l'utilisateur

Une norme publiée appartient à l'autorité de son organisme de normalisation (SDO). Un enregistrement local du catalogue est une **notice de référence**, non une publication de norme. Un blip est la **projection contextuelle** d'une notice dans une révision de radar. La présence de `ISO` ou `IEC` dans la désignation ne démontre ni l'existence ni la conformité de la notice.

## Périmètre intégré — S12-A

- Nouveau menu `Références normatives / Standard references` dans les outils du radar.
- Recherche locale par `standardId`, titre, désignation, organisme déclaré, source et statut, avec affichage limité à 50 notices (aucune interrogation externe).
- Déclaration autonome d'une notice locale portant titre, organisme **déclaré**, désignation, édition facultative, source facultative et statut **`unverified`** imposé.
- Stockage **exclusif** dans `imports[0].source.standards[]` via `radar-catalog-persistence.js`. Les lectures sont défensives ; pas de base de données parallèle ou état persistant doublé.
- `standardId` opaque assigné une seule fois ; la déclaration n'ajoute aucun nœud Cytoscape ni blip, et ne modifie aucune révision de radar.
- Action `Ajouter au radar actif` : ouvre le formulaire de blip avec le standard présélectionné ; création uniquement si une révision `draft` du catalogue est active, en réutilisant `addBlipToActiveDraft` et son rollback.
- Limitation CSS de la hauteur des listes de zone/quadrant dans le formulaire existant.
- Conservation du mode legacy « création rapide + blip » pour compatibilité, désormais libellé comme local/non vérifié (il reste à migrer vers la déclaration explicite).

## Contrat local de données — provisoire, compatible sans migration

L'objet `standards[]` existant est conservé ; nouvelles notices avec `standardId`, `name` et `extensions.referenceDeclaration` :

```json
{
  "standardId": "standard_<UUID>",
  "name": "Titre déclaré",
  "extensions": {"referenceDeclaration": {
    "designation": "désignation déclarée",
    "issuer": "organisme déclaré",
    "editionDesignation": null,
    "sourceName": "Manual entry",
    "sourceUrl": null,
    "verification": "unverified",
    "origin": "manual",
    "declaredAt": "date ISO 8601"
  }}
}
```

Ces métadonnées sont des **annotations locales provisoires**. Elles ne constituent pas le contrat définitif `referenceId`/`editionId` de `DEC-009`, ne permettent pas d'affirmer un rapprochement officiel et ne créent pas une identité normative unifiée. Les notices historiques sans `referenceDeclaration` s'affichent avec `verification = unknown` et `origin = legacy` ; elles ne sont pas migrées implicitement.

## Non-objectifs, risques et travaux ultérieurs

- **Aucune** connexion ISO, IEC, ETSI ou autre SDO et **aucune** vérification externe automatique.
- Pas d'édition arbitraire d'une notice déjà utilisée : nécessite gouvernance des changements, traçabilité, édition et relations de succession.
- Pas de fusion/déduplication sur la seule désignation ; pas de résolution de collisions multi-catalogues.
- Pas de garantie que les extensions locales soient acceptées par une validation schématique externe future : vérification du round-trip dans le Lot 3 avant adoption définitive.
- Les notices `unverified` restent consultables ; leur vérification ultérieure doit conserver un historique et une preuve source.
- Les décisions `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` restent explicitement `OPEN`.
- Propriétés historiques `working_group` et `radarchart` exposées en éditeur : correction distincte non réalisée dans ce lot.
- S11 : protection `published` et `archived` validée en tests unitaires mais non encore vérifiée dans le navigateur.

## Validation

Tests `radar-standard-registry.test.mjs` : recherche, déclaration, source HTTPS, lecture défensive, conservation d'une révision published, absence de second stockage. Suite historique inchangée. Contrôles navigateurs à réaliser sur Mac : déclaration depuis un catalogue importé, affichage `unverified`, projection vers une révision `draft`, préservation des positions, export/import à programmer dans le Lot 3.
