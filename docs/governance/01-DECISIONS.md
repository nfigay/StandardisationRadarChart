# Registre des décisions et des arbitrages

**Status definitions:** `ADOPTED-PRINCIPLE` = prior principle agreed in conversation, **not** code authorization; `PROPOSED` = subject to approval; `OPEN` = unresolved; `SUPERSEDED` = historical.

| ID | Statut | Décision / question | Motif | Condition de révision |
|---|---|---|---|---|
| DEC-001 | ADOPTED-PRINCIPLE | W2UI possède layout, panels, visibilité et cycle resize; D3/Cytoscape rendent dans la surface allouée | Eviter systèmes de layout concurrents | Tests panel/resize |
| DEC-002 | ADOPTED-PRINCIPLE | Standards, assessments et blips sont conceptuellement distincts | Distinguer consensus et adoption | Revue métier/cardinalités |
| DEC-003 | ADOPTED-PRINCIPLE | Published/archived non éditables en place | Auditabilité | Régression sur toutes commandes |
| DEC-004 | ADOPTED-PRINCIPLE | Modulaire et browser/offline-first, sans backend obligatoire | Faible administration, portabilité | Build/deployment audit |
| DEC-005 | PROPOSED | Repère radar 800×800, centre (400,400), R=[150,250,350]; caméra partagée et aspect ratio uniforme | Eliminer désalignement B1.3-D | Preuves runtime et tests |
| DEC-006 | PROPOSED | Cytoscape zoomingEnabled=true/panningEnabled=true, userZoom/pan=false; API viewport sync | Besoin de contrôle programmatique tout en gardant vue verrouillée | P2 API study + test en mémoire autorisé |
| DEC-007 | PROPOSED | Vue `Standards` dédiée dans main avec W2UI `w2grid`; sélection multiple et panier | Corpus volumineux, sidebar étroit | Prototype UX et performance |
| DEC-008 | PROPOSED | Fiches contextuelles séparées Standard/Edition, Blip, Radar, Assessment, EA | Respecter contextes et responsabilités | Scénarios utilisateurs |
| DEC-009 | OPEN | Séquence d'identification stable ISO/édition et stratégie de refresh des métadonnées | Eviter collisions et liens caducs | Inspection données ISO réelles |
| DEC-010 | OPEN | Association exacte blip→édition ou standard générique et versionnement `assessment` | La relation actuelle ne porte que `standardId` + `assessmentId?` | Arbitrage métier + contrat de schéma |
| DEC-011 | OPEN | Indexation ISO (mémoire, worker éventuel, préindex statique) et volume admissible | Performance / navigateur hors ligne | Benchmark corpus réel |
| DEC-012 | OPEN | Stratégie de montage des vues W2UI (panels vs nested layout vs espaces commutés) | Préserver W2UI-first sans doubles scrolls | UX prototype |
| DEC-013 | OPEN | Politique de publication autonome SVG/PNG/PDF et `foreignObject` | Export interopérable | Prototype export multimoteur |
| DEC-014 | OPEN | Format échange EA et granularité des liens | Eviter couplage/réplique EA | Cas d'usage EA / ArchiMate |
| DEC-015 | OPEN | Règles de migration des blips legacy (IDs parfois labels) | Reconciliation sans fausse correspondance | Jeu de fixtures / revue humaine |
| DEC-016 | OPEN | Politique de sélection/import de catalogues multiples | Persistance actuelle restreinte à un catalogue pour certaines actions | Scénarios multi-consortium |

| DEC-019 | ADOPTED-PRINCIPLE | Creator/Publisher unique ; Viewers dérivés du socle commun avec capacités, modules et données configurés | Réutilisation applicative et publication adaptée aux destinataires | Qualification A8/A9/A10 |

**Approval rule:** toute conversion d'une proposition en `ADOPTED-PRINCIPLE`, ou décision de coder, doit être tracée avec date, auteur/approbateur et référence (issue/commit/échange). L'accord sur cette baseline documentaire ne vaut pas autorisation de modifier l'application.


## DOC-P6 — Points de décision supplémentaires (non tranchés)

| ID | Statut | Question à arbitrer | Motif et preuve | Condition de décision |
|---|---|---|---|---|
| DEC-017 | OPEN | Définir la séparation contractuelle : source ISO brute, normalisation/indexation, données de gouvernance, projection W2UI/Cytoscape | DOC-P6 : le flux TC JSONL aplatit certains champs et neutralise `addEdge` ; l'ICS dépend d'une URL | Inspection des corpus et scénarios offline + schémas d'échange |
| DEC-018 | OPEN | Définir une représentation des relations ISO/EA exportable sans perte indépendamment des arêtes Cytoscape | DOC-P6 : `project` retourne `edges: []`; `toBlips` refuse les arêtes et champs inconnus | Contrat de relations, round-trip et non-régression |

**Maintien explicite :** `DEC-009` (identité édition/partie), `DEC-010` (liens standard/assessment/blip) et `DEC-016` (multi-catalogues) restent `OPEN`. Les constats ne valent ni approbation d'une cible ni autorisation de modifier le code.

## Traçabilité B1.4 — Viewport W2UI–SVG–Cytoscape

**Date :** 2026-11-06  
**Document de preuve :** [04-B1.4-VALIDATION-VIEWPORT.md](../evidence/04-B1.4-VALIDATION-VIEWPORT.md)

La réalisation B1.4 apporte des preuves d'implémentation concernant
les décisions techniques existantes :

- **DEC-001 :** W2UI conserve la responsabilité du dimensionnement
  et des événements de redimensionnement.
- **DEC-005 :** le module `src/domain/radar-viewport.mjs` et son
  intégration utilisent un repère partagé 800 × 800.
- **DEC-006 :** la caméra Cytoscape est programmable tandis que
  les gestes utilisateur de zoom/pan restent désactivés.

**Validation disponible :** 19 tests unitaires du viewport,
5 tests Radar Zone, installation contrôlée avec trois sauvegardes
vérifiées, alignement mesuré à 0 px pour une surface de 555 × 449 px,
et validation fonctionnelle du redimensionnement et des interactions.

**Réserve :** aucune comparaison automatisée des 26 coordonnées
logiques avant/après redimensionnement n'a été produite.

**Portée de cette trace :** elle documente une implémentation
autorisée et validée fonctionnellement. Elle ne convertit pas
automatiquement `DEC-005` ou `DEC-006` en
`ADOPTED-PRINCIPLE`. Un changement de statut requiert un
arbitrage explicite conforme à la règle d'approbation du registre.

Les décisions métier et les questions ouvertes restent inchangées.

## Traçabilité Lot 1 — moteur de création (2026-11-07)

Les deux commandes de création d'une révision `draft` sont implémentées au niveau service ; la persistance du standard passe par le `imports[]` privé existant et le blip par ajout incrémental Cytoscape. Cette intégration ne tranche **aucun** arbitrage métier ISO/édition, assessment, multi-catalogues ni relation EA : **DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 restent OPEN**. Le contrat, les limites et les vérifications associées figurent dans `docs/architecture/04-LOT1-MOTEUR-CREATION.md`.

---

<!-- S14.3-A8.0-COMMON-ARCHITECTURE -->

## DEC-019 — S14.3-A8.0 : convergence applicative

Statut : `ADOPTED-PRINCIPLE`.

Date : 2026-11-12.

Approbateur : porteur du projet.

Référence : échanges de validation A8.0
et baseline documentaire d19b3cc.

Cette décision fixe la cible produit.
Elle ne vaut pas autorisation implicite
de modifier ou publier le code.

Référence : [Architecture 79](../architecture/79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md).

### Décisions

- Creator et Publisher sont une seule application.
- Les acteurs de création assurent également la publication.
- Aucun produit Publisher indépendant n'est introduit.
- Le Viewer réutilise le socle métier et UI du Creator.
- Les capacités et données sont configurables.
- Les modules sont sélectionnés selon les dépendances.
- Les publications sont gérées dans le workspace natif.
- La prévisualisation utilise le socle et les données projetées.
- Les deux familles disposent des trois modes techniques.
- Le Creator autonome doit pouvoir générer des Viewers.
- Le Client A6/A7 est conservé comme prototype transitoire.

### Portée

Cette décision remplace les orientations contradictoires
relatives à deux applications indépendantes.

Elle ne remet pas en cause les contrats métier existants,
la gestion des révisions, les catalogues ISO ni la chaîne
de construction et de publication déjà validée.

### Conséquences

Les nouveaux développements doivent suivre les
[guidelines](GUIDELINES-CREATOR-PUBLISHER-VIEWER.md)
et le
[plan de réalisation](PLAN-REALISATION-S14-3-CREATOR-PUBLISHER-VIEWER.md).

Les détails techniques de composition et de persistance
restent à qualifier par les lots d'implémentation.

### DEC-019 — Précision du 14 novembre 2026 (A8.4 → A8.5/A8.6)

Le destinataire reçoit **le Viewer lui-même**, avec HTML, JavaScript, CSS,
bibliothèques, données projetées et configuration de consultation. Il ne doit
ni installer le Creator ni charger manuellement un JSON séparé pour consulter
une publication autonome. En mode Web, le paquet déployable inclut ses données
ou les références explicites aux données distribuées avec lui.

Le Creator prépare les composants Viewer lors de sa construction, puis les
assemble avec le résultat A8.4 dans le navigateur. Première priorité : HTML
standalone préchargé (A8.6), puis composition sélective et modes Web A9.
La prévisualisation emploie le véritable Viewer, dans un contexte séparé du
workspace d'auteur. Un candidat HTML n'est pas une PublicationRelease qualifiée.
L'exclusion physique des modules inutiles, la vérification indépendante des
octets et l'historique de livraison restent des portes explicites.

Décision adoptée par clarification utilisateur ; voir architecture 85 et plan
révisé. Ne clôture ni CPV-05/07/08/09/10/12 ni DEC-009/010.

### DEC-019 — Précision A8.6-R1 (14 novembre 2026)

**ADOPTED-PRINCIPLE** — clarification utilisateur lors de la recette A8.6 : le destinataire consulte un radar ou une collection déterminée de radars, de préférence les révisions retenues comme applicables. Une seule révision publiée par radar pour la publication courante ; pas de règle implicite de dernière version. La fiche descriptive prend la place de l'arbre dans le panneau left. Le Viewer publié ne charge ni ne remplace de catalogue externe ; le Viewer générique garde cette capacité. Les versions historiques sont un usage distinct. Cette décision n'ajoute pas de modèle temporel d'applicabilité ni de contrat de métadonnées confidentielles. Réalisation et qualification détaillées dans architecture 86-R1 et preuve 07 ; CPV-13/14/15. A8.2 publique inchangée.
