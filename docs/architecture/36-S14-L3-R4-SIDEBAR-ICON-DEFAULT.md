# S14-L3-R4 — Protection du rendu w2sidebar

## Diagnostic

Dans la distribution `lib/w2ui.min.js` du projet, la construction d'une icône de type objet lit `d.icon.style` depuis la configuration de la sidebar. Avec `sidebar.icon === null`, le rendu provoque `Cannot read properties of null (reading 'style')`.

## Correction

La sidebar `isoCatalogSidebar` reçoit une valeur par défaut explicite `icon: { text: '', style: '' }`. Les icônes des noeuds, la sélection, les compteurs, les menus contextuels et les interactions ne sont pas modifiés. La correction n'accède ni au cache IndexedDB ni aux données métier.

## Validation

Vérifier l'ouverture des vues ICS et TC/SC et le double-clic sur un noeud. La vérification statique ne remplace pas un test réel dans Chrome. À terme, éviter les dépendances aux détails internes de la version locale w2ui et couvrir le montage de la sidebar avec un test navigateur.
