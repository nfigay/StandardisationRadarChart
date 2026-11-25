# Architecture 139 — Color pickers natifs W2UI, Tiptap S19

## Décision

Remplacer la palette codée en dur R13 par les composants `w2toolbar` natifs `text-color` et `color` de W2UI 2.x. Les sous-menus hiérarchiques restent réservés aux groupes textuels, listes, tableaux et styles. Trois color pickers directs : caractères, surlignage, fond de paragraphe, accompagnés d'un menu d'effacement indépendant.

## Architecture

- Vue : `js/radar-rationale-panel.js` construit les trois items `text-color` / `color` / `color` avec `overlay.advanced` et `overlay.transparent`.
- Evénement : `onClick` transmet la couleur réellement choisie (sous `event.color` ou `event.detail.color`), jamais celle déjà affichée au clic d'ouverture. `s19PickerHex` accepte uniquement 6 chiffres hexadécimaux, avec ou sans `#`. Une valeur vide / transparente restaure la couleur par défaut.
- Edition : `editor.chain().focus()` et restauration de la sélection prise avant l'ouverture du popup. Les modifications utilisent `setColor`, `setHighlight({color})` et `updateAttributes('paragraph',{backgroundColor})`.
- Persistance : mêmes attributs JSON et même module d'extensions que R13. Aucun changement du schéma documentaire ni du renderer. La politique de validation CSS ne permet pas l'injection de propriétés arbitraires.
- Limites : seules les couleurs opaques RGB à six caractères sont admises ; si un W2UI retourne une forme alpha, elle est refusée (pas de conversion implicite). Palette native disponible uniquement quand `w2toolbar` est présent ; le fallback n'imite pas un faux picker.

## Compatibilité

Installateur à deux chemins : une base strictement reconnue avant R13 reçoit l'installation complète, tandis que R13 déjà installé reçoit uniquement le panneau, les tests actualisés et cette note. Contrôles de hash, sauvegarde, rollback, aucun commit ou push. Modes Viewer et exports inchangés.

## Recette Chrome obligatoire

Vérifier les trois popups W2UI et leur vue avancée, sélectionner du texte avant d'ouvrir le picker, appliquer une couleur à la sélection plutôt qu'au mot suivant, effacer chaque format et tester le retour au format par défaut. Contrôler la sauvegarde/réouverture, la visualisation HTML et le basculement FR/EN. Les tests Node ne reproduisent pas les événements interactifs du navigateur.
