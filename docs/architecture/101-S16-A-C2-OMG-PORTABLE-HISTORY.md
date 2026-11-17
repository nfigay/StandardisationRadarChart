# 101 — S16-A-C2 : historiques OMG privés portables dans le Creator statique

**Statut : candidat, qualification Mac et recette Pages requises.** Décision : le Radar exprime des recommandations de standardisation ; il ne certifie ni ne qualifie l'usage opérationnel d'une édition dans un système.

## Défaillance C1 reproduite

Un build Pages peut réussir tout en laissant vide le tableau OMG. Le fichier `S16-OMG-Current.json` ne comporte que l'index courant, pas les historiques `omg-formal-history`. La mémoire et IndexedDB sont séparés entre les origines/ports 5174 et 5189. L'acquisition via `POST /__radar-omg/catalog/history/<family>` requiert le relais local Vite. Le prévisualiseur Pages ne l'offre pas et la politique CORS du site officiel peut empêcher le chargement direct. Les sources préparées localement ne sont pas redistribuées dans les artefacts Pages.

## Contrat C2

L'utilisateur exporte **explicitement**, depuis le Creator local, un fichier `S16-OMG-History-<family>.json` pour une famille déjà acquise ; aucune collecte automatique ni embarquement de cet historique dans le build. Dans le Creator Pages, la commande « Importer un historique OMG (JSON) » reconnaît `sourceId=omg-formal-history` et contrôle rigoureusement la famille, la provenance officielle, toutes les URL d'éditions, les dates, la couverture complète et le digest source (hérité du collecteur). Le snapshot est enregistré dans la clé privée `omg-history:<family>` et l'index OMG reste inchangé. La grille passe immédiatement en vue historique, y compris après une importation sans réseau. Sans stockage navigateur, le document reste consultable en session seulement.

L'export utilise uniquement le snapshot validé de la famille active, et n'exporte pas l'index, les caches ISO ou un catalogue métier. Le JSON est privé, à échanger délibérément entre deux origines locales ; il ne doit pas être publié sur GitHub Pages ni dans le dépôt. Aucun changement à `standards[]`, au schéma natif ou au modèle des blips.

## Limites et recette

C2 **ne rend pas l'actualisation officielle OMG disponible sur GitHub Pages**. Elle requiert encore le Creator local ou un futur service expressément qualifié. Le mode Pages doit rester fondamentalement statique ; le test d'intégration doit donc porter sur la commande d'import manuel et sur la persistance locale, pas sur une requête au relais absent. Qualifier les trois anciens parcours OMG (import HTML, restauration, rafraîchissement) en contrôlant leur sémantique, et pas seulement la visibilité d'un bouton.

Recette : lancer 5174 avec `vite.omg.config.mjs`, sélectionner UML et les 11 éditions ; exporter `S16-OMG-History-UML.json`. Ouvrir le build sous `/StandardisationRadarChart/radar.html` sur 5189, importer l'index courant privé puis l'historique exporté, constater 11 éditions, intégrer UML 1.4 et 2.4.1 distinctement dans un catalogue ouvert, rafraîchir et restaurer l'historique. Ne pas redistribuer les fichiers privés. Le build, les tests Node et la recette navigateur constituent trois validations différentes.
