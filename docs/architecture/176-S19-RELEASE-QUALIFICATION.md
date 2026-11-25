# S19 — Qualification et livraison

Date de qualification : 25 novembre 2026.

## Baseline

- S18-A : 05f2d650362a39531aedb85c070d6ca5ac4ca38e.
- La livraison distante précédente correspond à S17.
- La présente livraison consolide S18 et S19.

## Fonctionnalités

- Géométrie paramétrable et optimisation du placement.
- Titres du radar contextualisés et internationalisés.
- Dossiers stratégiques intégrés aux révisions.
- Édition TipTap et commandes natives W2UI.
- Références associées et navigation contextuelle.
- Verrouillage de la sélection pendant l’édition.
- Prévisualisation documentaire par reconstruction DOM filtrée.
- Consultation documentaire en pleine page.
- Projection des dossiers dans les publications.
- Téléchargement du Viewer HTML autonome.
- Génération intermédiaire avec provenance locale explicite.

## Contrats consolidés

- Le déplacement des blips reste verrouillé à l’entrée dans un brouillon.
- Le passage explicite en visualisation précède le changement de blip.
- Les références historiques sont préservées en lecture.
- Les références source publiées conservent leur provider.
- Le Viewer ne présente pas les commandes de création ou d’édition de dossier.
- Les ressources CSS de pleine page sont embarquées dans le HTML autonome.

## Qualification

- S19-RELEASE-B4 : 1013 tests réussis sur 1013.
- Tests ciblés : 48 sur 48.
- Aucun test ignoré.
- Vérification statique des sources réussie.
- Recette fonctionnelle R34-R10-C : 11 contrôles réussis.

Les tests DOM isolés utilisent des simulations.
Ils ne constituent pas une certification de sécurité.
La qualification de la distribution officielle reste distincte.

## Sécurité et transportabilité

Gmail a signalé une alerte antivirus sur un Viewer candidat.
ClamAV 1.5.5, avec bases actualisées, n’a détecté aucune menace
dans ce même artefact le 25 novembre 2026.
L’origine exacte de l’alerte Gmail reste indéterminée.
Ce résultat ne démontre pas définitivement un faux positif.

La séparation physique du code Creator et Viewer,
la réduction des dépendances et l’industrialisation
des contrôles antivirus sont reportées à un chantier ultérieur.

## Périmètre des données

Les caches locaux ISO Open Data et RSS, les sauvegardes
temporaires et les catalogues métier ne font pas partie
du périmètre de cette livraison de sources.

## Dossiers d’architecture S19

- [123-S19-RATIONALES-RENDERING-AND-PERSISTENCE.md](123-S19-RATIONALES-RENDERING-AND-PERSISTENCE.md)
- [124-S19-R7-PERSISTENCE-FOUNDATION.md](124-S19-R7-PERSISTENCE-FOUNDATION.md)
- [125-S19-R7-R3-CATALOG-RATIONALES.md](125-S19-R7-R3-CATALOG-RATIONALES.md)
- [126-S19-R74-R75-EDITOR-REFERENCES.md](126-S19-R74-R75-EDITOR-REFERENCES.md)
- [127-S19-R75-RELATED-REFERENCES.md](127-S19-R75-RELATED-REFERENCES.md)
- [131-S19-R74-EDITOR-BLOCK-STYLES.md](131-S19-R74-EDITOR-BLOCK-STYLES.md)
- [133-S19-R74-TASK-DOM-AND-CODE-BLOCK.md](133-S19-R74-TASK-DOM-AND-CODE-BLOCK.md)
- [135-S19-WORKSPACE-TABS-AT-TOP.md](135-S19-WORKSPACE-TABS-AT-TOP.md)
- [136-S19-R74-W2UI-EDITOR-MENUS.md](136-S19-R74-W2UI-EDITOR-MENUS.md)
- [137-S19-R74-EDITOR-MENU-TAXONOMY.md](137-S19-R74-EDITOR-MENU-TAXONOMY.md)
- [138-S19-R74-EDITOR-COLORS-PERSISTENCE.md](138-S19-R74-EDITOR-COLORS-PERSISTENCE.md)
- [139-S19-W2UI-NATIVE-COLOR-PICKERS.md](139-S19-W2UI-NATIVE-COLOR-PICKERS.md)
- [144-S19-R74-PARAGRAPH-LAYOUT.md](144-S19-R74-PARAGRAPH-LAYOUT.md)
- [145-S19-R74-W2UI-PARAGRAPH-MENU-ICONS.md](145-S19-R74-W2UI-PARAGRAPH-MENU-ICONS.md)
- [146-S19-W2UI-ALIGNMENT-SUBMENU-COMPATIBILITY.md](146-S19-W2UI-ALIGNMENT-SUBMENU-COMPATIBILITY.md)
- [147-S19-TABLE-DIMENSIONS-AND-LIST-MARKERS.md](147-S19-TABLE-DIMENSIONS-AND-LIST-MARKERS.md)
- [148-S19-TABLE-SIZING-CONSISTENCY.md](148-S19-TABLE-SIZING-CONSISTENCY.md)
- [149-S19-NATIVE-TIPTAP-TABLE-RESIZE.md](149-S19-NATIVE-TIPTAP-TABLE-RESIZE.md)
- [150-S19-R19-W2UI-DOCUMENT-FULLSCREEN.md](150-S19-R19-W2UI-DOCUMENT-FULLSCREEN.md)
- [151-S19-R19-R1-SINGLE-FULLSCREEN-EXIT.md](151-S19-R19-R1-SINGLE-FULLSCREEN-EXIT.md)
- [152-S19-R19-R2-W2UI-OVERLAY-STACKING.md](152-S19-R19-R2-W2UI-OVERLAY-STACKING.md)
- [153-S19-R20-WORKSPACE-PREVIEW-CONSISTENCY.md](153-S19-R20-WORKSPACE-PREVIEW-CONSISTENCY.md)
- [154-S19-RADAR-TITLE-I18N.md](154-S19-RADAR-TITLE-I18N.md)
- [155-S19-R21-R1-SVG-TITLE-HEADER.md](155-S19-R21-R1-SVG-TITLE-HEADER.md)
- [156-S19-R21-R2-VISIBLE-TITLE.md](156-S19-R21-R2-VISIBLE-TITLE.md)
- [157-S19-RADAR-HEADER-OUTSIDE-VIEWPORT.md](157-S19-RADAR-HEADER-OUTSIDE-VIEWPORT.md)
- [158-S19-R22-SELECTION-SYNCHRONIZATION.md](158-S19-R22-SELECTION-SYNCHRONIZATION.md)
- [159-S19-R23-SELECTION-CONTEXT-AND-DOSSIER-PREVIEW.md](159-S19-R23-SELECTION-CONTEXT-AND-DOSSIER-PREVIEW.md)
- [160-S19-R23-R1-TAP-SELECTION-FALLBACK.md](160-S19-R23-R1-TAP-SELECTION-FALLBACK.md)
- [161-S19-R24-W2UI-CYTOSCAPE-SELECTION-VIEWPORT.md](161-S19-R24-W2UI-CYTOSCAPE-SELECTION-VIEWPORT.md)
- [162-S19-R25-W2UI-BLIP-FORM-LIFECYCLE.md](162-S19-R25-W2UI-BLIP-FORM-LIFECYCLE.md)
- [164-S19-R25-R2-SURGICAL-RADAR-JS-PATCH.md](164-S19-R25-R2-SURGICAL-RADAR-JS-PATCH.md)
- [165-S19-R26-W2UI-FORM-RENDER-FOCUS-TABS.md](165-S19-R26-W2UI-FORM-RENDER-FOCUS-TABS.md)
- [166-S19-R27-LAZY-PROPERTIES-W2UI.md](166-S19-R27-LAZY-PROPERTIES-W2UI.md)
- [167-S19-R28-EXPLICIT-VIEW-BEFORE-BLIP-SWITCH.md](167-S19-R28-EXPLICIT-VIEW-BEFORE-BLIP-SWITCH.md)
- [168-S19-R29-CYTOSCAPE-EDIT-SELECTION-LOCK.md](168-S19-R29-CYTOSCAPE-EDIT-SELECTION-LOCK.md)
- [169-S19-R30-INERT-WORKSPACE-DOSSIER-PREVIEW.md](169-S19-R30-INERT-WORKSPACE-DOSSIER-PREVIEW.md)
- [170-S19-R30-R1-CONSOLIDATED-R28-R29-UPGRADE.md](170-S19-R30-R1-CONSOLIDATED-R28-R29-UPGRADE.md)
- [171-S19-R31-WORKSPACE-PREVIEW-FIDELITY.md](171-S19-R31-WORKSPACE-PREVIEW-FIDELITY.md)
- [172-S19-R32-FLUID-DOSSIER-WIDTH.md](172-S19-R32-FLUID-DOSSIER-WIDTH.md)
- [173-S19-R33-PREVIEW-TABLE-PIXEL-GEOMETRY.md](173-S19-R33-PREVIEW-TABLE-PIXEL-GEOMETRY.md)
- [175-S19-R34-R1-INTERMEDIATE-HTML.md](175-S19-R34-R1-INTERMEDIATE-HTML.md)

## Tests nouveaux ou consolidés

- `tests/radar-a85-publisher.test.mjs`
- `tests/radar-application-profile.test.mjs`
- `tests/radar-lifecycle-ui-sync.test.mjs`
- `tests/radar-s18-placement.test.mjs`
- `tests/radar-s19-r25-w2ui-form-lifecycle.test.mjs`
- `tests/radar-s19-r26-w2ui-form-render.test.mjs`
- `tests/radar-s19-r27-lazy-properties.test.mjs`
- `tests/radar-s19-r28-edit-selection-lock.test.mjs`
- `tests/radar-s19-r29-graph-edit-lock.test.mjs`
- `tests/radar-s19-r30-workspace-preview.test.mjs`
- `tests/radar-s19-r31-preview-fidelity.test.mjs`
- `tests/radar-s19-r32-fluid-dossier-width.test.mjs`
- `tests/radar-s19-r33-table-geometry.test.mjs`
- `tests/radar-s19-r34-r1-intermediate.test.mjs`
- `tests/radar-s19-r34-r10-viewer.test.mjs`
- `tests/radar-s19-r74-r11-workspace-tabs.test.mjs`
- `tests/radar-s19-r74-r12-editor-menu.test.mjs`
- `tests/radar-s19-r74-r12-r1-menu-taxonomy.test.mjs`
- `tests/radar-s19-r74-r13-colors.test.mjs`
- `tests/radar-s19-r74-r16-layout.test.mjs`
- `tests/radar-s19-r74-r16-r1-alignment-icons.test.mjs`
- `tests/radar-s19-r74-r16-r2-alignment-menu.test.mjs`
- `tests/radar-s19-r74-r17-r1-dimensions.test.mjs`
- `tests/radar-s19-r74-r17-table-lists.test.mjs`
- `tests/radar-s19-r74-r18-native-table.test.mjs`
- `tests/radar-s19-r74-r19-fullscreen-layout.test.mjs`
- `tests/radar-s19-r74-r19-r1-single-exit.test.mjs`
- `tests/radar-s19-r74-r19-r2-overlay-layering.test.mjs`
- `tests/radar-s19-r74-r20-preview-width.test.mjs`
- `tests/radar-s19-r74-r21-r1-title-layout.test.mjs`
- `tests/radar-s19-r74-r21-r2-title-header.test.mjs`
- `tests/radar-s19-r74-r21-r3-title-separation.test.mjs`
- `tests/radar-s19-r74-r21-title.test.mjs`
- `tests/radar-s19-r74-r22-selection-sync.test.mjs`
- `tests/radar-s19-r74-r23-context-switch.test.mjs`
- `tests/radar-s19-r74-r24-viewport-selection.test.mjs`
- `tests/radar-s19-r74-r7-block-styles.test.mjs`
- `tests/radar-s19-r74-r75.test.mjs`
- `tests/radar-s19-r74-r9-editor-interactions.test.mjs`
- `tests/radar-s19-r75-related-links.test.mjs`
- `tests/radar-s19-rationale-catalog-integration.test.mjs`
- `tests/radar-s19-rationale-renderer.test.mjs`
- `tests/radar-s19-rationale-revision.test.mjs`

## Publication

La publication utilise le pipeline officiel existant.
Les résultats de construction et de publication distante
doivent être vérifiés séparément.

## Exception de contrôle typographique

Le module généré radar-rationale-tiptap.js est conservé
sans modification de ses octets.

Les espaces présents dans le code généré, notamment
dans les chaînes multilignes, ne sont pas normalisés.

Le contrôle Git des espaces reste obligatoire pour
tous les autres fichiers de la livraison.

Cette exception ne désactive aucun test fonctionnel
et ne dispense pas la bibliothèque des contrôles
de construction ou de syntaxe.
