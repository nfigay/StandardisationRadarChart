# S14-L3 — Navigation des référentiels ISO (Sidebar + Grid + Form)

## Décision de présentation (implémentation expérimentale)

Les listes arborescentes S14-L2 sont remplacées, dans les vues **ICS** et **TC/SC**, par une navigation en `w2sidebar` logée dans un `w2layout` redimensionnable, avec `w2grid` dans le panneau principal. La sélection d'un groupe filtre les normes et éditions dans la grille. La consultation d'un groupe s'effectue dans un `w2popup` contenant un `w2form` en lecture seule. Les fiches de normes existantes sont conservées sans modification dans ce lot.

## Identité et provenance

`__radarIsoSidebarIndex` est une projection en mémoire des données déjà lues dans IndexedDB. Ce n'est ni une table supplémentaire ni un registre métier. Un standard multi-ICS est projeté sous plusieurs catégories sans duplication de la source. Le TC/SC parent sélectionne par défaut les normes des descendants ; un groupe sans association connue figure dans « Sans comité connu ».

## Garanties et limites

La vue ISO plate reste virtualisée par w2grid ; les résultats de sélection de groupe sont projetés depuis les 81 768 normes déjà lues dans la mémoire JavaScript. Il n'y a pas encore de requête paginée par curseur IndexedDB. La navigation ne change aucun blip, registre métier, statut ni révision. L'import ISO, RSS, les évolutions et la distribution sont conservés.

Le rattachement aux groupes est fondé sur les identifiants ICS et le champ `ownerCommittee` disponible ; les associations non trouvées restent dans un groupe explicite. L'import préalable des classifications CSV reste celui de S14-R12. L'interface doit encore être validée dans Chrome sur la version exacte de w2ui de l'application. Le lot suivant simplifiera la barre d'outils et regroupera les opérations de synchronisation dans « Gérer les sources ».

DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018 restent ouverts. S12-R1 (identité Référence/Standard/Blip) reste ouvert.
