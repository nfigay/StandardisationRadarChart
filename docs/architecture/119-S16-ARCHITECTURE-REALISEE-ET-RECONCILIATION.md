# 119 — S16 : architecture consolidée, traçabilité et réconciliation documentaire

**Statut : architecture S16 réconciliée, installée et qualifiée localement (S16-ARCH-R1-R5) ; versionnement documentaire local S16-ARCH-R1-R6.**
**Référence de la photographie fonctionnelle :** `c92fbe5a9120b93051407b1c5ec9c3590db7efa2`.
**Référence documentaire publiée :** `277a0c8c386d5be61176571f82f6b07dcf9b42a2` (`main`, parent fonctionnel S16).
**Portée de la preuve :** synthèse des documents fournis et des recettes consignées dans 117/118 ; la collecte R3 ne comprend ni sources JS ni tests, donc aucune nouvelle inspection des implémentations ou exécution de tests n'est prétendue.

## 1. Lecture du corpus et périmètre

L'inventaire local S16-ARCH-R1-R3 transmis le 17 novembre 2026 contient **117 documents Markdown** sous `docs/architecture`, **87 références locales analysées**, **0 cible absente selon l'analyseur**. Ce dernier ne résout pas toutes les formes de liens ni les références dynamiques : « 0 cible absente » ne constitue pas une certification générale.

Les documents historiques décrivent l'état vrai d'un incrément à leur date, non nécessairement l'état actuel du produit. `ARCHITECTURE-AS-IS-A86.md` et `87-A86-DISTRIBUTION-RELEASES-PAGES.md` demeurent des photographies A8.6. Les documents S15/S16 numérotés sont les deltas successifs. Le présent 119 fournit le point d'entrée transversal pour la fin de S16 ; le catalogue historique ISO conserve ses détails et doit être lu avec son avertissement d'actualisation.

**Attention à la numérotation :** le numéro **118** est déjà attribué à `118-S16-PAGES-VIEWER-HTML-EXPORT-HOTFIX.md`. Il ne doit pas être réutilisé pour cette synthèse.

## 2. Vue logique et responsabilités

| Couche / produit | Responsabilités retenues dans les documents | Limite à préserver | Documents |
|---|---|---|---|
| Creator | Édition du catalogue natif, acquisition/consultation des références, sélection explicite des notices, préparation des publications | Consultation documentaire ≠ mutation métier ; import et déclaration explicites | [79](79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md), [88](88-S15-A-REFERENCES-SOURCES.md), [93](93-S16-A-MULTISOURCE-STANDARDS-WORKSPACE.md), [96](96-S16-A-R2-FEDERATED-STANDARDS-UI.md) |
| Référentiel métier | Catalogue natif et persistance comme autorité sur organisations, portefeuilles, standards, évaluations et révisions | Pas de second registre métier déduit des sources documentaires | [89](89-S15-B-STANDARD-SOURCES.md), [90](90-S15-C-REFERENCE-LIFECYCLE.md), [96](96-S16-A-R2-FEDERATED-STANDARDS-UI.md) |
| Sources documentaires | ISO fenêtré/IndexedDB ; connecteurs OMG, RFC/IETF et W3C ; identités et éditions distinctes | Provenance de la source ≠ validation d'applicabilité opérationnelle d'une édition | [82](82-S14-3-ISO-REFERENCE-INTEGRATION.md), [94](94-S16-FEDERATED-STANDARDIZATION-KNOWLEDGE.md), [95](95-S16-OMG-SOURCE-ACQUISITION.md), [102](102-S16-A-C3-ISO-EDITION-NAVIGATION.md), [111](111-S16-A-C6-OMG-HISTORIQUES-PUBLICS.md) |
| Publisher | Choix du sous-ensemble publiable, projection des données et composition des ressources Viewer | Ne publie pas le corpus global des références par défaut | [83](83-S14-3-PUBLICATION-MODEL.md), [84](84-S14-3-NATIVE-PUBLICATION-PROJECTION.md), [85](85-S14-3-PUBLISHER-UI-AND-PREVIEW.md) |
| Viewer | Consultation de la projection native et des seules copies documentaires embarquées | Pas d'acquisition globale implicite ni de dépendance au cache ISO du Creator | [86-S14-3-STANDALONE-PUBLICATION-DELIVERY](86-S14-3-STANDALONE-PUBLICATION-DELIVERY.md), [106](106-S16-A-C3-R3-R1-VIEWER-SNAPSHOT-ISOLATION.md), [118](118-S16-PAGES-VIEWER-HTML-EXPORT-HOTFIX.md) |
| Livraison | Builds, contrôle de provenance Git, distributions Pages, export HTML autonome | Commit, push et publication soumis chacun à autorisation humaine | [87](87-A86-DISTRIBUTION-RELEASES-PAGES.md), [92](92-A87-RELEASE-PREPARATION.md), [117](117-S16-REX-LIVRAISON-ET-CONTRATS-S17.md), [118](118-S16-PAGES-VIEWER-HTML-EXPORT-HOTFIX.md) |

## 3. Chaîne de consultation et de publication

1. Les sources ISO/OMG/RFC/W3C sont consultables via des connecteurs ou des copies documentaires distinctes du catalogue natif. Leur prise en compte dans une référence métier est explicite (88–96).
2. Les identités d'éditions et les liens ISO doivent rester contextualisés ; la résolution d'une fiche issue d'un Viewer publié reste locale à sa projection (102–106).
3. Les historiques OMG publics documentés par 108–114 représentent des **références bibliographiques par édition**. Les données acquises ou distribuées ne constituent pas une recommandation d'emploi dans une configuration opérationnelle (108–114).
4. Le Publisher construit une projection maîtrisée du catalogue natif (79, 83–86), et le Viewer autonome l'affiche sans requérir le corpus global.
5. L'incident Pages d'export HTML a fait l'objet du contrat 118 : insertion de la ressource de template et de sa preuve, puis recalcul de provenance. La recette finale rapportée dans 117 a validé l'export, le téléchargement, l'ouverture hors ligne, le contenu et les références.

## 4. Statuts de qualification, sans extrapolation

| Événement | Preuve relatée | Ce qui n'est pas revendiqué |
|---|---|---|
| A8.6 | Photographie et anciens décomptes de tests | État courant S16 |
| S15 / étapes S16 | Tests et qualifications partielles consignés dans les deltas (648, 694, 729, 754, 762, etc.) | Ces comptes historiques ne remplacent pas la campagne finale |
| Livraison fonctionnelle S16 | `c92fbe5a…`, 764 tests Node annoncés ; Creator/Viewer Pages et export HTML hors ligne validés par recette utilisateur (117, 118) | Nouvelle réexécution des tests dans S16-ARCH-R1 |
| Clôture documentaire | Commit `277a0c8…` poussé vers `origin/main` ; branche `gh-pages` conservée à `645f34dd…` selon audit transmis | Nouvelle qualification HTTP/graphique du site lors du push documentaire |

## 5. Règles d'autorité et décisions supplantées

- **La décision [115](115-S16-C6-R3-GOUVERNANCE-HORS-LOGICIEL.md) prévaut** sur les mentions historiques de contrôles juridiques applicatifs dans 107–114 : droits, licences et arbitrages de redistribution sont exclusivement pris par les personnes responsables et leurs processus externes. Ne pas recréer de `--approve-public-links`, `approved` ou blocage juridique dans le logiciel au titre d'une réconciliation documentaire.
- Les invariants techniques subsistent : URL officielles, identités et versions, absence de copies privées, complétude, contrôles SHA-256 et refus des entrées erronées.
- Les décisions métier ouvertes dans les documents S15/S16 (notamment identités de référence et relations) ne sont **pas** closes par cette synthèse. Ne pas convertir une intention historique « candidat » en garantie d'implémentation sans vérifier la source et les tests.

## 6. Réconciliation des points d'entrée

| Document | Traitement | Motivation |
|---|---|---|
| `ARCHITECTURE-AS-IS-A86.md` | Conserver inchangé | Photographie historique explicite |
| `ARCHITECTURE-CATALOGUE-ETAT-COURANT.md` | Ajouter un avertissement et un pointeur vers 119 | Son titre S14-W et ses sections A8.5 ne couvrent pas l'état S16 |
| `117-S16-REX-LIVRAISON-ET-CONTRATS-S17.md` | Ajouter un addendum après publication, sans effacer le REX | Le statut en en-tête et la précondition de commit antérieure sont aujourd'hui historiques |
| `118-S16-PAGES-VIEWER-HTML-EXPORT-HOTFIX.md` | Conserver inchangé | Décision spécifique export HTML |
| 107–114 | Conserver comme historiques ; lire avec 115 | Éviter d'effacer la provenance et de réintroduire les barrières juridiques |
| 119 (ce document) | Nouveau point d'entrée d'état courant S16 | Traçabilité, statuts et limites explicites |

## 7. Contrats d'entrée de S17

S17 peut travailler sur les fenêtres HTML et leurs réelles contreparties w2UI, les libellés, la validation et la suppression de groupes/blips **sans réouvrir** les contrats de consultation, projection et export S16.

Avant modification métier, vérifier dans les sources le sens de « groupe » (groupe de travail, groupe de révision ou classement documentaire), les API de retrait/suppression, leurs impacts sur révisions et référentiels, et les scénarios de restauration. Le seul document 117 ne permet pas de conclure sur leurs invariants.

L'orchestrateur permanent de livraison prévu par 117 doit être maintenu dans le dépôt, testé sur fixtures jetables et capable de reprise idempotente, avec audits horodatés et provenance SHA complète. Cette capacité reste **à réaliser en S17**, pas « acquise en S16 ».

## 8. Vérification et limites du lot S16-ARCH-R1

- Collection documentaire : ZIP d'inventaire R3 reçu ; 117 Markdown ; 87 liens locaux analysés ; aucune cible absente signalée.
- Consolidation proposée : 119 nouveau, catalogue transversal clarifié, addendum 117 ; **aucune source applicative ni test dans l'archive reçue**.
- Après installation : vérifier les modifications exactes, les liens locaux et les empreintes, produire l'audit d'installation et soumettre séparément tout commit/push.
- Une **réconciliation complète avec code et tests** reste un contrôle complémentaire avant d'affirmer une conformité architecture ↔ implémentation. Ce constat ne remet pas en cause les recettes S16 déjà signées.
