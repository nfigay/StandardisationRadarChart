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
