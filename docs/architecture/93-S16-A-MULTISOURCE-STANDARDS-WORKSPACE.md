# 93 — S16-A : accès direct aux sources documentaires RFC et W3C

**État : candidat de développement, non publié.** Base source et documentaire
`1df817baad2072b005936197414da1ea6353f392` ; release publique immuable
`pilot-a87` (`545ed539df2e117a8aab5158a4bcc5c151308ba3`).
Ce delta complète les architectures [81](81-S14-3-COMMON-WORKSPACE-CONSULTATION.md),
[82](82-S14-3-ISO-REFERENCE-INTEGRATION.md),
[88](88-S15-A-REFERENCES-SOURCES.md), [89](89-S15-B-STANDARD-SOURCES.md)
et [90](90-S15-C-REFERENCE-LIFECYCLE.md). Il ne réouvre pas S15.

## Motivation et périmètre

Retour de consultation utilisateur A8.7 : la barre Standards en mode Normes ISO
ne rend pas visibles RFC Editor et W3C. Le code S15-B ne présente la commande
Sources de standardisation que dans Références du catalogue. Les moteurs,
acquisitions et transactions existent ; la difficulté est la découvrabilité.

S16-A ajoute deux commandes directes **RFC Editor** et **W3C** dans la barre
du panneau existant, avant Références du catalogue. Elles restent accessibles
depuis les modes Creator, sans devenir des modes de la grille ISO. Le dialogue
documentaire S15-B est réutilisé avec `sourceId` explicite. Il permet chargement,
actualisation, recherche, sélection de publication et comparaison/intégration ;
pour W3C la sélection d'une série puis d'une publication datée reste obligatoire.
Le bouton historique Sources de standardisation reste dans Références.

## Contrats et responsabilités

| Composant | Contrat S16-A |
|---|---|
| `radar-standards-panel.js` | Deux boutons `data-standard-source-shortcut` (`rfc-editor`, `w3c`), libellés via `isoPanel` FR/EN ; utilisation de `openStandardSources` et de son callback existant. |
| `radar-standard-source-dialog.js` | Inchangé : source préselectionnée, acquisition explicite, état du catalogue et génération, fermeture de l'ancien dialogue, gestion des publications datées. |
| `radar-standard-sources.js` | Inchangé : cache documentaire séparé, normalisation, validation et recherche bornée. |
| `radar-catalog-persistence.js` | Inchangé : seule autorité de mutation, capacité `catalog.declareReference`, catalogue natif unique, identité et protections S15-C. |
| Publisher / Viewer | Aucun changement de projection, de composition logicielle ou de capacités. |

Les raccourcis sont créés uniquement côté Creator. Ils sont désactivés sans
exactement un catalogue natif ouvert ou sans capacité de déclaration ; le
gestionnaire de clic recontrôle ces préconditions. Le dialogue et le service
conservent leurs propres contrôles. Aucun chargement réseau n'est déclenché
par l'ouverture d'un raccourci. Une source déjà chargée peut être consultée
dans le dialogue sans réacquisition ; la commande de chargement conserve sa
politique de cache. Les sources ne sont pas injectées dans le catalogue
métier sans une commande explicite d'intégration.

L'ouverture du dialogue ne modifie pas le mode ISO actif, ni les radars.
Après intégration, le callback historique ouvre Références, réinitialise le
filtre de provenance et la recherche, sélectionne la notice et affiche le
résultat. La fermeture du catalogue ferme le dialogue selon A8.2/S15.
Le Viewer générique et le Viewer publié continuent à consulter uniquement
les références natives autorisées ; le dialogue d'acquisition leur est refusé.

## Exigences et vérification

Contribution ciblée à REQ-UI-01/02/04, REQ-ISO-01/03/05,
REQ-CTX-01, REQ-BASE-04, REQ-DATA-04 et CPV-03/11/15.
Aucun changement du statut des exigences ni des décisions DEC-009, DEC-010
ou DEC-016 ; aucune évolution de schéma 1.0.0.

Trois tests ajoutés à `tests/radar-s15-a-references.test.mjs` :
accès direct depuis Normes ISO, sélection RFC/W3C, absence de requête
implicite, langue, fermeture et contrôle catalogue ; intégration SHACL
datée et sélection de la référence native ; absence des raccourcis dans
les deux Viewers et refus direct du dialogue. Le double de projection ISO
isole la grille, sans simuler les services documentaires et métier testés.
Les tests S15 existants restent inchangés.

Préqualification sur le bundle source : les trois nouveaux scénarios passent
avec Node 22.16.0, dans un harnais temporaire dérivé du test existant,
sans les trois modules non fournis et inutilisés dans ces scénarios
(publication model, create form, ISO toolbar).
Ce résultat ne constitue pas la validation du dépôt complet ni une recette
navigateur. Sur Mac, exécuter les tests ciblés puis la suite Node complète ;
attendre 648 tests si le total historique de 645 reste inchangé.
Recette à enregistrer sur le Creator réel (ISO, RFC 8259, SHACL, intégration,
création de blip, export/réouverture, FR/EN, fermeture) et contrôle Viewer.
Aucune qualification publique A8.7 n'est rejouée par principe.

## Limites et suites

Ce lot traite l'accès et la réutilisation du dialogue, pas une nouvelle grille
multisource permanente W2UI, une recherche fédérée, un registre fournisseur
générique, une consultation sans catalogue natif, une pagination externe
différente ou un nouveau modèle d'évaluation. Les champs, limites de recherche
et politiques de cache restent ceux de S15-B. Les fonctionnalités ISO
spécialisées sont conservées. Les sources W3C/RFC ne deviennent pas toutes
des standards normatifs du catalogue. Les relations et filtres spécifiques
supplémentaires ne sont pas introduits.

Le prochain lot métier candidat reprend la gestion des organisations,
portefeuilles et radars, puis le Workspace persistant et la convergence SPM.
Le périmètre reste à instruire selon les contrats existants et le registre de
décisions. Installation, qualification navigateur, commit et publication sont
des portes distinctes ; aucune publication implicite.

## Suite R1 — Fédération documentaire

La validation Mac du candidat initial a réussi 648/648 tests. Les accès directs ont été observés, et la consultation RFC avec intégration réelle a été exercée. La recette a mis en évidence la restriction à un catalogue ouvert et la dette de barre HTML. La refonte W2UI-first reste à réaliser ; ne pas considérer les raccourcis HTML comme la cible définitive. Le registre et le noyau de lecture sont prolongés dans [94](94-S16-FEDERATED-STANDARDIZATION-KNOWLEDGE.md), avec priorité OMG et découverte structurée dans [95](95-S16-OMG-SOURCE-ACQUISITION.md). Aucune nouvelle organisation ni nouvelle persistance métier parallèle. Pas de changement des transactions ou de la projection dans R1.

## R2 — Navigation fédérée

Le candidat [96](96-S16-A-R2-FEDERATED-STANDARDS-UI.md) remplace les raccourcis visibles par une barre W2UI commune et réutilise la grille Standards. La consultation RFC/W3C est indépendante du catalogue; les mutations restent protégées. OMG est visible avec import privé et vue adoptions ISO.
