# S19-R19-R2 — Niveau d'affichage des menus W2UI en plein écran

## Constat
Le layout documentaire R19 avait `z-index:2147483000`, au-dessus des overlays W2UI natifs insérés au niveau de `document.body`. Les menus de `w2toolbar` (Styles, Paragraphe, Listes, Tableau et choix des couleurs) pouvaient être masqués par la surface opaque du plein écran.

## Correction
Le conteneur `#s19-document-fullscreen-root` adopte `z-index:1500`. Dans la feuille W2UI fournie, `.w2ui-popup` utilise `z-index:1600` et `.w2ui-overlay` `z-index:1700`. La surface documentaire reste superposée au layout ordinaire, mais les menus natifs peuvent s'afficher devant elle.

## Périmètre
Une unique règle CSS. Aucun changement de l'instance Tiptap, des commandes W2UI, du schéma des dossiers, du renderer HTML, du radar, ou de la géométrie. Les états de l'éditeur et du layout restent inchangés.

## Recette navigateur
Depuis l'éditeur ouvert en plein écran, ouvrir Styles → Titre, Paragraphe → Alignement, Listes et Tableau puis un sélecteur de couleurs ; vérifier que chaque menu apparaît au-dessus du document et qu'une action s'applique au texte. Fermer le plein écran et confirmer que les menus fonctionnent toujours en mode compact. Vérifier également qu'aucun autre élément du Workspace ne passe devant le dossier.
