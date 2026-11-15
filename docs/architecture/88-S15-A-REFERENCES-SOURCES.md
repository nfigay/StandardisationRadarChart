# S15-A — Références normatives et sources : parcours commun

**État : candidat implémenté, non publié.** Baseline A8.6-DOC `2695a6ef64cf338129f9ce0eb4f163dd495db1bf` ; release publique immuable `pilot-a86` (`894ae2a1ed25f7cef6bbbb56b3d2520792ecdc55`). Lire l'[AS-IS A8.6](ARCHITECTURE-AS-IS-A86.md) comme référence historique, puis ce delta. Les décisions de gouvernance prévalent.

## Motivation et limites

La consultation native A8.6 réunit déjà les notices importées et déclarées dans `standards[]`. Pourtant, la fiche détaillée est réservée aux notices ISO enrichies et le registre de déclaration reste un parcours distinct. S15-A homogénéise la sélection, la déclaration, la consultation et l'utilisation de ces références ; il ne remplace ni le moteur ISO ni le catalogue natif.

Conserver : [identité candidate](03-CONTRAT-IDENTITE-ISO-CANDIDAT.md), [registre](07-REGISTRE-REFERENCES-NORMATIVES.md), [création](04-LOT1-MOTEUR-CREATION.md), [cycle de vie](08-S13-CYCLE-VIE-REVISIONS.md), [sources](59-S14-Z-GESTION-SOURCES-PUBLICATION.md), [intégration ISO](82-S14-3-ISO-REFERENCE-INTEGRATION.md), [projection](84-S14-3-NATIVE-PUBLICATION-PROJECTION.md). DEC-009 demeure ouverte : pas de nouveaux `referenceId`/`editionId`, pas de migration ou d'inférence d'identité. Les éditions restent représentées selon le contrat natif actuel. Le Workspace persistant, SPM, la prévisualisation avancée, les connecteurs externes non-ISO, l'édition/suppression des notices et la gestion d'un registre générique de fournisseurs sont hors périmètre de ce delta.

## Responsabilités et parcours

| Composant existant | Delta S15-A |
|---|---|
| `radar.html` | Menu registre ouvre directement la vue Références. |
| `js/radar-standards-panel.js` | Grille W2UI des références natives, organisme/source, recherche, filtre d'origine, fiche W2Form en lecture seule pour toutes les notices, commande de déclaration et sélection de la notice créée. |
| `js/radar-standard-registry.js` | Mode déclaration seule (réutilise formulaire et service) ; conserve l'ancien mode pour compatibilité ; retour après enregistrement ; fermeture au changement de catalogue. |
| `js/radar-catalog-persistence.js` | Autorité unique de mutation : refus de la déclaration exacte déjà présente avant toute écriture. |
| `js/radar-iso-toolbar.js` et `js/radar-s14-z-sources.js` | Commande unique Sources ISO, retour vers Références natives ; administration existante, sans deuxième stockage. |
| Création, profil, révisions, projection | Réutilisés, sans changement de contrat ni de moteur. |

Le Creator ouvre un catalogue natif. Références donne accès aux notices déjà présentes, à leur consultation et à la déclaration locale. Le corpus ISO reste consultable via ses modes ICS/TC-SC/Normes, et ses sources via Sources ISO. L'intégration ISO garde la sélection d'une notice de la génération installée et la copie portable contrôlée. Aucune intégration automatique par simple consultation.

Après déclaration locale, le dialogue se ferme, le filtre revient à Toutes les provenances et la recherche est vidée afin de conserver toutes les notices visibles ; la notice créée est sélectionnée et la grille défile vers sa ligne. La commande existante Ajouter un blip ouvre le formulaire de création à partir de la référence existante. L'enregistrement de la notice et celui du blip restent deux transactions distinctes : la première ne change aucun radar ; la seconde exige un brouillon actif appartenant au catalogue. Une erreur de création de blip ne supprime pas la notice déjà déclarée. L'ancien parcours standard+blip est conservé sans modification et peut encore produire des références sans déclaration riche.

La fermeture/remplacement de catalogue ferme le dialogue de déclaration, invalide les anciens événements de soumission et réinitialise le filtre. Le dialogue d'administration ISO n'est pas un nouveau gestionnaire des sources du catalogue métier ; il explique explicitement leur différence et propose le retour à Références. Le gestionnaire de sources conserve les états du corpus, la vérification des mises à jour et l'administration avancée existants.

## Contrat de données et d'API (delta, schéma natif 1.0.0 inchangé)

La collection `standards[]` du catalogue natif reste l'autorité. Un blip conserve `standardId` ; ni la provenance ni le titre ne deviennent une clé étrangère. Une déclaration locale peut concerner un standard ISO ou non-ISO. Exemple de structure persistée (identifiant et date illustratifs) :

```json
{
  "standardId": "standard_550e8400-e29b-41d4-a716-446655440000",
  "name": "Example protocol",
  "extensions": {
    "referenceDeclaration": {
      "issuer": "IETF",
      "designation": "RFC 9999",
      "editionDesignation": "1",
      "sourceName": "Example source",
      "sourceUrl": "https://example.org/reference",
      "verification": "unverified",
      "origin": "manual",
      "declaredAt": "2026-11-15T00:00:00.000Z"
    }
  }
}
```

| Champ | Contrat |
|---|---|
| `standardId` | Identifiant opaque unique, produit par UUID pour la déclaration locale. L'identifiant ISO importé reste `iso-deliverable:<id>`. |
| `name`, `issuer`, `designation` | Obligatoires pour la nouvelle déclaration locale, chaînes non vides. L'organisme qui émet le standard et la source de données ne sont pas nécessairement identiques. |
| `editionDesignation` | Facultatif, texte d'édition déclaré, pas une entité ni une preuve d'équivalence. |
| `sourceName`, `sourceUrl` | Métadonnées déclaratives ; URL facultative avec contrôle HTTPS existant. Aucune consultation réseau automatique ni certification de l'URL. |
| `origin`, `verification` | Déclaration locale `manual` / `unverified` imposés par le service ; import ISO `iso-open-data` / `source-verified` selon le mécanisme existant. Ce dernier qualifie la provenance de la notice, pas la conformité à la norme. |
| `extensions.isoDocument` | Copie portable optionnelle issue du corpus ISO, conservée sans modification. Une projection peut l'omettre selon sa politique. |
| Notice historique | Aucune extension obligatoire ajoutée. Vue dérivée `legacy` / `unknown` si métadonnées absentes ; pas de réécriture à la lecture. |

`__radarStandardRegistry.declare(fields)` continue de produire et renvoyer la référence créée via `declareLocalReference`. La persistence refuse avant mutation un `standardId` existant ou une déclaration avec même triplet organisme/désignation/édition (NFKC, espaces réduits, majuscules ; édition absente = vide). Une notice ISO déjà intégrée avec le même organisme et la même désignation est également protégée même si le texte de l'édition diffère. En cas de refus, aucun ID ni donnée existante n'est remplacé : l'utilisateur sélectionne la notice existante. Des éditions explicitement différentes d'une déclaration locale restent possibles ; aucun rapprochement fuzzy, aucune fusion, aucune migration des doublons historiques. Le refus ISO en présence d'une déclaration locale homonyme reste inchangé ; il ne promeut pas une notice manuelle en notice vérifiée.

`__radarStandardRegistry.open(graph, {declaration:true,onDeclared})` est un mode optionnel du dialogue existant ; l'appel historique sans options reste valide. `close()` détruit le dialogue et son écouteur de langue. `listReferenceRecords()` demeure la vue dérivée de lecture : grille, recherche et fiche ne constituent pas une nouvelle persistance. Filtre d'origine = `all | manual | iso-open-data | legacy`, combiné avec la recherche sur identifiant, désignation, titre, organisme, édition, source, URL, provenance et métadonnées ISO existantes. Aucune normalisation de la donnée stockée par le filtre.

## Consultation, autorisations et distribution

- Fiche ISO enrichie : conserver W2Form existant et métadonnées portables ; sans `isoDocument`, utiliser la fiche générique en lecture seule. Les fiches locales/historiques affichent uniquement les champs disponibles, sans inventer de provenance.
- Création d'une référence : capacité `catalog.declareReference` et catalogue natif ouvert ; indépendante du statut du radar. Création du blip : capacité existante, brouillon actif propriétaire ; aucun changement des révisions publiées/archivées.
- Sources ISO : capacité `catalog.admin` ; aucune commande auteur dans Viewer. Une source facultative absente ne rend pas la consultation des références natives dépendante du réseau.
- Viewer générique : toutes les références du catalogue publié ouvert. Viewer d'une publication : uniquement les références des blips de la révision active, y compris la fiche détaillée et le filtre. Le filtre ne peut pas élargir le périmètre. Pas d'IndexedDB ISO ni de récupération réseau pour ces fiches natives.
- Projection : aucune modification de l'allowlist A8.6. `issuer`, `designation`, `editionDesignation`, `sourceName`, `origin`, `verification` peuvent être projetés selon le contrat existant ; `sourceUrl` et `declaredAt` sont exclus des livraisons. Le JSON auteur conserve ces champs. La fermeture des références est assurée par le projecteur existant.
- Aucun changement des formats de publication, scripts de build, artefacts ou branches publiques. Pas de promesse de parité navigateur avant la recette.

## Traçabilité

Ce delta apporte une preuve ciblée supplémentaire à REQ-ISO-01/03/04/05 (source, métadonnées et parcours), REQ-MOD-01/02/04 (identités et lien blip), REQ-BLP-01/04/05 (création, protection des révisions, registre séparé), REQ-CTX-01 (fiche), REQ-DATA-04 (références natives et projection), REQ-BASE-04 (FR/EN), CPV-03/06/12/13/15 (profils, fermeture et consultation). Il ne clôt pas les exigences cibles ni DEC-009 (REQ-MOD-05). Voir [preuve et recette S15-A](../evidence/11-S15-A-CANDIDATE-VALIDATION.md). La revue A8.6 reste une photographie historique.

## S15-A-R1 — Correction de présentation et de tri

La recette réelle a confirmé les déclarations enregistrées, mais le filtre de provenance héritait de la règle globale `select` (largeur 100 %, hauteur 150 px). Le filtre a désormais une taille de contrôle compacte explicite (30 px), dans la barre à hauteur intrinsèque ; la grille conserve la place restante. Les colonnes ajoutées directement par le panneau reçoivent explicitement `editable: {}` : W2UI `localSort` consulte cette propriété même en lecture seule. Aucun changement de schéma ou de persistance. Libellé FR/EN : Références du catalogue / Catalog references. La déclaration sélectionne et fait défiler vers la nouvelle notice sans masquer les autres par une recherche d’identifiant.

La recherche du registre signale désormais organisme et source ; les commandes de recherche avancée ISO et les filtres ISO sont masqués dans la vue native, puis rétablis dans les autres vues. Les libellés et infobulles concernés sont fournis par le dictionnaire i18next existant ; le changement FR/EN conserve la sélection native et les valeurs du formulaire en cours. La règle CSS globale reste inchangée pour les sélecteurs historiques. Le harnais de régression `tools/test-s15-a-r1-browser.mjs` utilise `tests/radar-s15-a-r1-browser.html` et les vrais composants W2UI et i18next, sans toucher aux données de l’utilisateur.
