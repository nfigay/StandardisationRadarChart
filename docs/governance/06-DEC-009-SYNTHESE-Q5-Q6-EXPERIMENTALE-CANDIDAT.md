# DEC-009 — Synthèse expérimentale Q5/Q6 — CANDIDAT

> CANDIDAT — NON ADOPTÉ. Document de preuves expérimentales, sans décision métier, migration ou modification du schéma.

## 1. Portée et état des décisions

- Q5 : domaine d’unicité, collisions et identité entre catalogues.
- Q6 : statuts des normes, retrait, succession et correction des métadonnées.
- DEC-009 OPEN ; DEC-010 OPEN ; DEC-016 OPEN ; DEC-017 OPEN ; DEC-018 OPEN.
- Aucune option n’est adoptée. Ce document ne constitue pas une autorisation d’implémentation.

## 2. Méthode et preuves

Les audits A1/A2 sont statiques. Les expériences B1/B2 exécutent des modules réels dans des VM Node isolées avec des catalogues fictifs.
Leur périmètre exclut un parcours complet W2UI, la vérification externe ISO, une fusion de catalogues et toute validation d’autorisation métier.

| Banc | Résultat | Script SHA-256 |
|---|---|---|
| B1 | 6/6 | `a562623919589c3214d901aa0654ebc0929e643f409c005bedc1b10a2af560bd` |
| B2 | 6/6 | `7d9d1c79ea0059c4b319195ce4c166c676df335822b13d3f08a29aba369bb30b` |

Les rapports originaux et leurs empreintes figurent dans le manifeste C1. Les sources applicatives et le registre des décisions ont été contrôlés sans écriture.

## 3. Q5 — Unicité et collisions

- **B1-01** : `prepare()` accepte deux objets `standards[]` partageant un même `standardId` dans la fixture. Résolution et unicité sont distinctes.
- **B1-02** : un doublon de `revisionId` dans le catalogue préparé est rejeté.
- **B1-03** : un doublon de `blipId` dans une révision est rejeté.
- **B1-04** : deux artefacts avec le même `catalogId` sont validés individuellement avec des empreintes différentes ; import simultané non testé.
- **B2-01** : deux artefacts de contenu divergent peuvent partager un `catalogId` et rester intègres individuellement. Le garde expérimental constate `SAME_ID_DIFFERENT_DIGEST`.
- **B2-02** : `build()` refuse l’export de deux catalogues mémorisés. Le parcours complet W2UI de fusion/import multiple n’est pas testé.

Conséquence expérimentale : aucune unicité fédérée des standards ou des catalogues ne découle des seules validations observées. Le domaine d’unicité de `referenceId`, `editionId` et `sourceRecordId` reste à arbitrer.

## 4. Q6 — Temporalité et succession

- **B1-05** : une propriété fictive `status: withdrawn` sur un standard coexiste avec `status: draft` sur une révision de radar ; conservation comme donnée, sans validation normative.
- **B1-06** : une relation `replaces` dont la cible est inconnue est conservée par le parcours testé ; la succession n’est pas validée.
- **B2-03** : la révision `published` originale reste inchangée et un `draft` dérivé porte `basedOnRevisionId`. Cette filiation concerne les radars, non la succession ISO.
- **B2-04** : une cible absente est conservée dans des données de succession, alors que le garde indépendant classe `UNRESOLVED_TARGET`.
- **B2-05** : changement de métadonnées temporelles dans une fixture sans changement de `standardId`. Aucun mécanisme applicatif de refresh ni provenance historique n’a été testé.
- **B2-06** : le garde expérimental distingue `NO_DECLARED_RELATION`, `UNRESOLVED_TARGET`, `RESOLVED_UNVERIFIED` et `EVIDENCE_DECLARED_NOT_AUTHORIZED`.

Une preuve déclarée ne démontre pas son authenticité et ne constitue pas une autorisation de changement d’identité.

## 5. Questions non arbitrées

1. Quel domaine d’unicité faut-il retenir pour les identifiants locaux, les identifiants de source et les identités de référence/édition ?
2. Comment traiter deux catalogues portant des identités identiques mais des contenus divergents ?
3. Quel contrat de provenance et de temporalité appliquer aux corrections de métadonnées ISO ?
4. Comment distinguer retrait, remplacement effectif, remplacement envisagé et absence d’information ?
5. Quels contrôles imposer sur les cibles de relations, les preuves externes et les autorisations métier ?
6. Comment conserver le round-trip legacy et l’immuabilité des révisions publiées ou archivées ?

## 6. Dépendances et limites

- DEC-009 : identité ISO et stratégie de rafraîchissement.
- DEC-010 : association blip, standard et édition.
- DEC-016 : catalogues multiples et politique de collision.
- DEC-017 : séparation des données et provenance.
- DEC-018 : représentation des relations normatives.

Ces scénarios fictifs n’adoptent ni modèle d’identité canonique, ni nouveau champ obligatoire, ni politique de succession.
Les tests ne prouvent pas un fonctionnement de bout en bout et ne doivent pas entraîner de modification des catalogues historiques.

## 7. Conclusion expérimentale

**Q5/Q6 restent ouvertes.** Les contrôles de résolution, d’unicité, d’intégrité, de filiation des révisions et de preuve normative doivent être spécifiés séparément.

Aucune option n’est adoptée ; aucune migration, modification applicative ou décision de gouvernance n’est autorisée par cette synthèse.
