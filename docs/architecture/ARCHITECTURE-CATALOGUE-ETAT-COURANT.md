# Architecture de référence — catalogue ISO (état S14-W)

> **Périmètre documentaire (réconciliation S16-ARCH-R1, 17 novembre 2026).** Ce texte conserve les constats spécifiques au catalogue ISO depuis S14-W jusqu'à A8.5 ; malgré son nom de fichier, il **ne constitue pas à lui seul la photographie de toute l'application à la fin de S16**. Pour l'architecture transversale Creator / sources ISO, OMG, RFC/IETF, W3C / Publisher / Viewer, les qualifications et les décisions supplantées, consulter [119 — Architecture S16 réalisée et réconciliation](119-S16-ARCHITECTURE-REALISEE-ET-RECONCILIATION.md). Les sections « non validé » sont des états datés de leurs campagnes, et non des conclusions automatiquement reconduites après S16. La séparation gouvernance/logiciel est régie par [115](115-S16-C6-R3-GOUVERNANCE-HORS-LOGICIEL.md).


## Statut des affirmations

- **Observé et validé par l'utilisateur (S14-Q)** : génération `2026-11-09`, 81 768 livrables, 810 comités ; lecture paginée IndexedDB ; index hiérarchiques actifs ; fenêtre ICS 01 et TC 121 ; détails par identifiant. Deux fenêtres successives distinctes.
- **Observé S14-V** : tri référence asc/desc en deux fenêtres ; ICS 07 en deux fenêtres ; commandes de tri et filtres ICS/TC/SC visibles ; index de tri `ready:false` au relevé du 11 novembre. Intersection particulière ICS 07 + TC 121 vide, sans que cela constitue un bug.
- **Implémenté, à valider en situation** : défilement automatique entre les fenêtres, mémoire de la grille limitée à deux pages, tri titre/français/anglais/stade après indexation.
- **Non validé** : usage prolongé sans fuite, continuité visuelle du passage aux fenêtres adjacentes, compteur exact de résultats filtrés, saut arbitraire, distribution publique ICS.

## Chaîne de données

ISO Open Data (source officielle) → collecte opérateur `tools/sync-iso-open-data.mjs` → cache opérateur `iso-open-data-cache/` → publication immuable `catalog-distribution/releases/<version>/` → manifeste SHA-256 → hébergement HTTP(S) → streaming et validation → IndexedDB versionné `standardisation-radar-iso-windowed` → requêtes `page()` et `get()` → panneau w2ui.

- Vite/localhost : environnement de développement seulement.
- IndexedDB est le stockage de consultation des utilisateurs ; les fichiers ISO ne sont pas conservés en mémoire comme modèles complets.
- Dans le panneau, l'arborescence ICS ou TC/SC définit le groupe logique ; les fenêtres portent sur les normes associées, **pas** sur les nœuds de l'arborescence.
- La recherche texte, les facettes ICS et comités et le tri doivent être évalués sur la requête complète avant le fenêtrage.
- L'index de tri `sortKeys` (IDB v3) est construit une fois par génération ; sa présence ne peut être supposée avant `sortIndexStatus().ready === true`.
- L'index hiérarchique `groupLinks` est utilisé pour les groupes parents quand prêt.

## Sources et gouvernance

| Jeu | Origine réelle connue | Cible cliente | Situation |
|---|---|---|---|
| Normes ISO | ISO Open Data JSONL | IndexedDB `records`/index | Distribué et importé |
| Comités TC/SC | ISO Open Data JSONL | IndexedDB `records` | Distribué et importé |
| Arbre ICS | `https://nfigay.github.io/StandardisationRadarChart/ICS.csv` (source historique) | IndexedDB ICS distinct, ou CSV de secours | Publication versionnée non confirmée, vérifier droits |
| Évolutions ISO | Comparaison de deux versions produite par l'opérateur | Cache d'événements séparé | Aucune comparaison réelle confirmée |
| RSS | Collecteur opérateur optionnel | Base RSS séparée | Facultatif |

Ne pas déduire une autorisation de redistribution du seul fait qu'une URL soit publique. Ne pas confondre le « catalogue local » (fichiers Mac opérateur) avec le cache navigateur (IndexedDB).

## Comportement recherché de l'interface

Arborescence → recherche/facettes → tri global → défilement naturel → lecture paginée de l'index sans matérialisation du catalogue complet. Les changements de sélection et de critères invalident les anciennes réponses. Les fiches sont chargées par identifiant, indépendamment de la page affichée.

## Responsabilités encore ouvertes

1. Confirmer les tris indexés par titre/titre anglais/stade sur des données réelles.
2. Confirmer une combinaison ICS+comité donnant un résultat et vérifier la recherche textuelle sur l'intersection.
3. Mesurer avec Chrome le changement de page automatique et la conservation de la position, sous répétition.
4. Réconcilier les documents d'architecture historiques avec les sources du dépôt de l'utilisateur ; ce document n'affirme **pas** avoir modifié ces documents inconnus.
5. Publier ICS sous licence vérifiée et valider la synchronisation depuis un serveur HTTPS hors Vite.
6. Reprendre le lien métier référence ISO ↔ standard ↔ blip ↔ révision, sans clore les décisions d'architecture ouvertes.


## Mise à jour S14-X — Projection des arborescences par résultats de recherche

Le moteur fenêtré IndexedDB reste la seule source des normes pour le chemin actif S14-M/V. La nouvelle projection de l’arborescence passe par `radar-iso-tree-filter.js` et est alimentée par les mêmes critères de recherche textuelle et de facettes que la table. Les catégories et les comités restent des métadonnées de navigation ; ils ne sont pas eux-mêmes chargés par fenêtre. La projection ne crée ni nouveau magasin IndexedDB ni copie complète des normes. Ce raccordement ne modifie pas la synchronisation ISO, les données métier, les blips ou le cycle de vie des révisions.

## S14-Y — Moteur de recherche avancée

- `js/radar-iso-advanced-query.js` (script classique) valide et évalue l'AST booléen dans le navigateur.
- `js/radar-iso-windowed-db.js` continue d'exécuter le tri et la pagination par curseur IndexedDB ; `advancedQuery` filtre les candidates sans tableau complet.
- `js/radar-iso-tree-filter.js` reçoit le même `advancedQuery` et projette les seules branches ICS/TC/SC correspondantes, avec ancêtres.
- `js/radar-standards-panel.js` expose le constructeur imbriqué et gère les invalidations de sélection, de recherche et de pagination.
- Le panneau reste un **script classique** ; chargement de l'évaluateur par injection contrôlée de `<script src>` plutôt que par `import()`.
- L'ancienne voie de consultation non fenêtrée reste historique ; la recherche avancée demande une génération S14-M active et ne doit pas être annoncée comme supportée en mode `readAll()`.

## S14-Y-R2 — Constructeur booléen

La modification visuelle de l’AST est réalisée par `__radarIsoAdvancedQuery.edit(tree, action)`, opération pure et immutable. La représentation JSON utilisée par le stockage fenêtré, le tri global et la projection des arbres ICS/TC-SC est inchangée. Les commandes locales d’édition du dialogue n’altèrent pas la recherche active avant « Appliquer ». Aucun nouveau datastore, import ni chargement de normes n’est introduit.


## S14-Z — Gestion des sources et publication GitHub Pages

La gestion des sources présente une commande principale de synchronisation du catalogue distribué. Les fonctions locales/import/journal/RSS sont réservées au panneau d’administration avancée. Les résultats structurés de synchronisation distinguent `unchanged`, `updated`, `not-published` et `error`. Le catalogue ISO reste stocké dans IndexedDB, servi par un service HTTPS distinct du build GitHub Pages. Voir `59-S14-Z-GESTION-SOURCES-PUBLICATION.md` pour les dépendances, la validation et les décisions ouvertes.

## Mise à jour A8.2–A8.5 (14 novembre 2026)

Le corpus ISO distribué (génération 2026-11-09) reste distinct du catalogue
métier natif. A8.2 intègre une copie documentaire bornée et sourcée par standard
(`extensions.isoDocument`) dans le catalogue métier ; voir architecture 82.
Le Creator autonome embarque le corpus global, le Viewer commun n'en charge
pas et consulte uniquement les références de son catalogue natif. Le corpus
local IndexedDB n'est pas une source nécessaire au destinataire d'une publication.

A8.4 projette seulement les standards référencés et les attributs documentaires
autorisés ; l'option ISO exclut ou inclut leur copie documentaire. Voir 84.
Le Viewer préchargé visé en A8.6 contient le catalogue natif projeté, pas le
corpus global. Navigation documentaire par ICS/TC/SC du sous-ensemble et
simplification générale du gestionnaire des sources demeurent à réaliser.
Les observations S14-W antérieures restent historiques.
