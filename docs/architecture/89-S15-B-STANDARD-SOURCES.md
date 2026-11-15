# 89 — S15-B : sources documentaires de standardisation

Candidat du 15 novembre 2026, construit sur S15-A/R1 consolidé : `af248ca643c14b0b2391370c0f9dce305df2d47e`. A8.6 (`pilot-a86`) reste la seule release publique ; le présent document est un delta, pas une réécriture de l'AS-IS A8.6.

## 1. Responsabilités et parcours

Le catalogue métier natif 1.0.0 reste propriétaire des `standards[]`. Les sources documentaires fournissent des notices à sélectionner ; elles ne sont pas des catalogues métier, et aucune acquisition ni actualisation ne modifie implicitement les radars ou les notices intégrées. Aucun nouveau modèle d'identité norme/édition (DEC-009) n'est introduit.

Dans Creator, Références du catalogue → Sources de standardisation → choix de la source → Charger le catalogue → recherche → sélection → Ajouter au catalogue. Pour W3C, choisir d'abord une série, puis une publication datée. Après intégration, la grille native affiche toutes les références et sélectionne la notice. Le moteur de création de blips existant peut l'utiliser. La déclaration locale reste disponible. ISO délègue aux grilles ISO et à l'administration S14-Z existantes, sans recopier son corpus dans le nouveau cache.

`radar-standard-sources.js` : adaptateurs, validation des réponses, instantanés, IndexedDB et recherche. `radar-standard-source-dialog.js` : dialogue natif, i18next FR/EN, sélection explicite et protection contre les résultats asynchrones d'un autre catalogue. `radar-catalog-persistence.js` : mutation métier atomique et contrôle de l'identité/provenance. `radar-standards-panel.js` : grille, filtre d'origine, sélection et consultation. Viewer n'acquiert rien et ne dispose pas des commandes auteur. Les contrôles de capacité existants sont réutilisés.

## 2. Sources et identités

| Source | Transport | Identité native | Métadonnées |
|---|---|---|---|
| ISO Open Data | S14 existant | `iso-deliverable:<id>` | inchangées |
| RFC Editor | https://www.rfc-editor.org/rfc-index.xml | `rfc:<numero sans zeros initiaux>` | titre, date, stream, statut courant/publication, URI RFC |
| W3C | https://api.w3.org/specifications et `/shortname/versions` | `w3c-tr:<shortname>:<YYYYMMDD>` | titre de publication, date, statut, URI TR datée |

Documentation officielle : https://www.rfc-editor.org/retrieve/ ; https://www.rfc-editor.org/standards ; https://www.w3.org/api/ ; https://www.w3.org/TR/ . Les RFC ne sont pas tous des standards IETF ; le stream distingue IETF, IAB, IRTF, Independent Submission, Editorial Stream et série historique. Le titre et le statut documentaire ne sont pas traduits. Les publications W3C non datées, URL non TR ou URL mutables ne sont pas importables dans cette version ; les exclusions sont comptées. Les notices W3C datées et les RFC historiques sont acceptés si leur identité et leurs champs obligatoires sont valides. Les pages HAL sont toutes parcourues avec contrôle de l'origine et du chemin ; limites de taille et de nombre, délai par requête, absence de DTD XML et unicité de la clé. Aucun accès arbitraire à une URL utilisateur.

## 3. Contrats de données

L'extension native `extensions.externalDocument` (contrat `schemas/external-document-v1.schema.json`) est une copie portable de la notice sélectionnée :

```json
{
  "schemaVersion": 1,
  "sourceId": "w3c",
  "key": "json-ld11:20200716",
  "issuer": "W3C",
  "designation": "json-ld11",
  "title": "JSON-LD 1.1",
  "edition": "2020-07-16",
  "status": "Recommendation",
  "stream": null,
  "url": "https://www.w3.org/TR/2020/REC-json-ld11-20200716/",
  "acquiredAt": "2026-11-15T00:00:00.000Z"
}
```

`referenceDeclaration` conserve les champs S15-A, `origin` vaut `rfc-editor` ou `w3c`, `verification` vaut `source-verified`. Ce statut signifie une provenance documentaire contrôlée par le chemin d'acquisition ; il ne constitue ni une validation de conformité, ni une signature numérique de l'organisme. Le cache local est une frontière de confiance de la machine auteur. Le noyau 1.0.0 et le schéma des blips restent inchangés. Les liens vers les publications utilisent HTTPS.

La sélection d'une notice est un triplet `(sourceId, key, generation)` ; les métadonnées viennent du service, non d'un formulaire libre. `importSourceReference` exige un catalogue unique et la capacité auteur. Une identité déjà intégrée est réutilisée, sans rafraîchissement implicite de ses métadonnées. Une collision d'identifiant, ou avec une déclaration de même identité, refuse l'import : aucune promotion, fusion ou migration silencieuse. Les déclarations RFC sont comparées par numéro, indépendamment du format de l'année ; W3C distingue les dates explicites, mais une déclaration sans date est ambiguë. Les rapprochements sémantiques approximatifs restent hors périmètre. Les révisions publiées ou archivées et les blips ne sont pas modifiés. La projection A8.6 conserve les champs autorisés de `referenceDeclaration`, exclut l'URL et `externalDocument` du Viewer publié, et ne projette que les standards utilisés. La fiche affiche les champs effectivement disponibles.

## 4. Acquisition et caches optionnels

Aucun chargement réseau automatique au démarrage. « Charger le catalogue » utilise d'abord les instantanés valides disponibles (cache local HTTP de même origine, IndexedDB), en privilégiant le plus récent ; à défaut, acquisition directe. « Actualiser depuis la source » tente explicitement le réseau. Une erreur laisse l'instantané actif intact. Le cache navigateur `radar-standard-sources-v1` est isolé par origine ; les données métier restent séparées. La recherche est locale, bornée à 100 résultats affichés, avec total et affinage. Le chargement W3C d'une série est indépendant du chargement de son index.

Pour une source inaccessible depuis le navigateur (CORS, réseau), `node tools/sync-standard-sources.mjs rfc-editor w3c w3c:json-ld11` acquiert par Node.js. Les instantanés `standard-source-cache/{rfc-editor,w3c,w3c-json-ld11}.json` sont ignorés par Git et remplacés atomiquement source par source. Format `schemaVersion:1, sourceId, acquiredAt, payload` ; XML brut RFC ou lignes normalisées W3C ; historique W3C avec `shortname` et nombre d'exclusions. Le navigateur valide intégralement la structure avant utilisation. Pour un autre historique W3C, la commande accepte `w3c:<shortname>`. Le serveur local rend ces caches disponibles ; une distribution `file://` ne bénéficie pas automatiquement du cache du serveur local. Les références déjà intégrées restent consultables indépendamment de ces corpus.

## 5. Qualification et limites

Voir [preuve candidat](../evidence/12-S15-B-CANDIDATE-VALIDATION.md). Le harnais Chrome isolé exerce les composants réels et le DOMParser, avec réponses déterministes puis avec les instantanés officiels téléchargés sur Mac, sans réseau extérieur pendant la recette cache. Les tests métier exercent notamment le moteur de blips existant, les collisions, la réutilisation et la projection. Les données de recette ne sont pas intégrées au catalogue utilisateur.

Non couverts : installation complète dans l'application publique, acquisition ISO réelle, recette intégrale Publisher/Viewer, nouvelles sources OMG/OASIS/ETSI/IEC/IEEE, édition/suppression et réconciliation manuelle des notices, actualisation métier des éditions, DEC-009, Workspace, convergence SPM et prévisualisation avancée. Ces sujets ne sont pas réputés validés par la recette isolée.

## 6. S15-B-R1 : shortnames historiques W3C

Le diagnostic officiel du 15 novembre 2026 a parcouru 1 721 entrées en deux pages ; cinq shortnames contiennent le caractère littéral `+` : daml+oil-axioms, daml+oil-model, daml+oil-reference, daml+oil-walkthru et xhtml+voice. Le contrat autorise désormais `[A-Za-z0-9][A-Za-z0-9._+-]{0,149}` pour les shortnames, y compris dans les identités datées et la commande CLI. Le caractère + est un caractère de chemin, jamais un espace ou un séparateur de paramètre de requête ; les clés existantes sont inchangées. Les liens restent limités aux chemins HTTPS de l'API W3C, la pagination au même endpoint, les publications TR à une URL datée, avec date et identité cohérentes. Les séquences encodées et les autres caractères non autorisés restent rejetés. Les cinq entrées officielles sont reproduites dans un test ; la recette navigateur exerce aussi l'intégration d'une Note DAML+OIL datée.

Le rapport d'acquisition RFC indique désormais le nombre de balises d'entrée XML (hors commentaires et CDATA), sans modifier le format de cache. La validation DOM et le comptage des notices exploitables restent effectués par le navigateur. Aucun changement du modèle métier ou des projections.
