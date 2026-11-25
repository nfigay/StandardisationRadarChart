# Architecture 138 — S19-R74/R75 : couleurs documentaires persistantes

## Intention

L'éditeur documentaire repose sur Tiptap pour le schéma JSON et sur W2UI pour ses menus. Cette itération ajoute le menu **Couleurs** et ses sous-menus, sans multiplier les boutons et sans modifier le modèle de dossier stratégique, les identifiants métier ou la géométrie du radar.

- **Couleur du texte** : marques `textStyle` avec `attrs.color`.
- **Surlignage** : marque Tiptap `highlight`, `attrs.color` et configuration existante multicolore.
- **Fond du paragraphe** : attribut global `backgroundColor` attaché au nœud `paragraph` existant.
- **Réinitialisation** : une action « Aucune couleur » par catégorie, y compris suppression du fond de paragraphe.

La palette est volontairement finie : uniquement des valeurs `#RRGGBB` inscrites dans le code du menu, afin d'assurer prévisibilité et restitution sécurisée. Les couleurs des textes, fonds de paragraphe et surlignages sont indépendantes.

## Intégration non destructive

Le module `js/radar-rationale-styles.js` est chargé après le bundle Tiptap préexistant. Il **réutilise les classes d'extension déjà chargées**, grâce à `Highlight.extend()` et `StarterKit.extend()`, au lieu de créer un second runtime ProseMirror ou de remplacer le bundle signé. Le panneau n'entre en édition que lorsque le module de styles est disponible, pour éviter de réenregistrer un document contenant des marques inconnues.

Le CSS additionnel est limité aux sélecteurs S19 et ne modifie aucune règle globale W2UI. Les mises en forme ne sont pas « juste du CSS » : elles font partie des attributs du JSON sauvegardé via `editor.getJSON()` et le `write()` existant.

Le renderer HTML R8 assure la même restitution de chaque attribut. Son `safeColor` n'accepte que les hexadécimaux complets ; toute valeur étrangère ou malveillante reste sans effet CSS. La prévisualisation conserve sa politique CSP `default-src 'none'` et l'iframe sans `allow-scripts`.

## Migration et compatibilité

Aucune réécriture des dossiers sauvegardés. Les documents sans ces attributs conservent leur présentation précédente. Le renderer R7 peut être porté à la base R8 consolidée dans le même passage ; il reste sécurisé.

L'installateur identifie strictement les panneaux R9/R12/R12-R1, le CSS de R11/R12 et les renderers R7/R8 ; il sauvegarde chaque fichier remplacé, protège les fichiers existants et revient à l'état précédent si les validations échouent. Il rend autonomes les tests historiques R11/R12 qui, précédemment, attendaient une variable d'environnement d'installateur. Aucun commit ni push.

## Validation / limites

Les tests Node couvrent la structure des attributs, les commandes et les palettes FR/EN, le rendu HTML et l'exclusion du CSS malveillant, la conservation des chemins CRUD/références et la compatibilité des tests historiques. Ils ne remplacent pas une recette navigateur réelle des extensions Tiptap 3.34.0, des sous-menus W2UI et de la sauvegarde/reprise.

**Recette** : sélectionner du texte → Couleurs → Couleur du texte ; surligner une autre partie ; placer le curseur dans un paragraphe → Fond du paragraphe ; sauvegarder, rouvrir et visualiser ; réinitialiser chaque catégorie ; vérifier sur un ancien dossier sans couleurs, en FR et EN. Conserver le mouvement des blips verrouillé par défaut lors de la sélection.
