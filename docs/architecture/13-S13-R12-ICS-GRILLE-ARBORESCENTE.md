# S13-R12 — Grille inférieure arborescente et réutilisation ICS

## Portée
- Supprime le panneau latéral historique `w2sidebar` de l'ICS (les données et relations ne sont pas supprimées).
- Réutilise le chargement existant de `https://nfigay.github.io/StandardisationRadarChart/ICS.csv` via Papa Parse : aucune duplication des sources.
- Affiche les classifications ICS avec `w2grid` dans le panneau inférieur. Hiérarchie `identifier` / `parent` rendue par `w2ui.children`.
- Conservation d'une vue distincte des références applicatives, alimentée par `__radarStandardRegistry.records`; celle-ci permet la création de blips dans un draft.
- Recherche par code, titre français ou anglais avec conservation des ancêtres et développement des branches correspondantes.
- La classification ICS n'est pas une référence de norme et ne génère pas directement de blip.

## Limites et travaux ultérieurs
- Aucun standard ISO réel n'est créé à partir d'une classification ICS, faute de relation standard ↔ ICS dans le fichier ICS.csv.
- Le menu existant `Fetch Standard(RSS)` est un placeholder ; aucun flux RSS de normes n'est pour l'instant intégré.
- S14 : ajouter une source ISO Open Data de métadonnées de normes, peupler la même grille de références, et filtrer par ICS/libellé, TC/SC et WG selon couverture vérifiée.
- Le statut snapshot / publication reste inchangé : on ne supprime que le panneau de navigation ICS historique.
- Refactoriser les profils de colonnes lorsque plusieurs SDO seront présents. Décisions DEC-009/010/016/017/018 non tranchées.

## Référence documentaire
- https://w2ui.com/web/docs/2.0/w2grid.records — enregistrements hiérarchiques `w2ui.children`, `w2ui.expanded`.
