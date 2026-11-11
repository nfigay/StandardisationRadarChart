# Architecture de référence — S14-U : arborescence et fenêtres de normes

## Exigence et sémantique

Le `w2sidebar` représente une **hiérarchie de classifications ICS ou de comités TC/SC**, **pas une liste paginée de normes**. Ses nœuds décrivent la nomenclature et peuvent être développés indépendamment. La grille `w2grid` contient la fenêtre des **normes correspondant au nœud sélectionné et, lorsqu'il s'agit d'un groupe parent, à ses descendants**. Le choix `100 / 250 / 500` borne uniquement la quantité de normes transférées à la grille lors d'une requête IndexedDB.

Le nœud sélectionné constitue un filtre, non un positionnement de fenêtre. Quand l'utilisateur sélectionne une autre branche, modifie la recherche ou la taille de fenêtre, la navigation repart à la première fenêtre du nouveau résultat. Les commandes Début, Précédent et Suivant naviguent seulement dans les résultats de la branche courante. Sans sélection de branche, la requête porte sur les normes du catalogue entier ; l'interface le signale. Un parent TC/SC comprend les SC descendants selon le modèle de navigation chargé.

## Stockage et volumétrie

- Nomenclature de navigation : classifications ICS et métadonnées des comités (quantités réduites, indépendantes des 81 768 normes).
- Notices : IndexedDB S14-M, requêtes `page(type:'deliverables',dimension,groupKey,after,limit,search)`.
- Index hiérarchique S14-P disponible (`ready:true`) : pages des groupes parents sans scan de l'intégralité des notices.
- Historique des curseurs : `windowHistory` ne stocke que les clés de pagination, pas les notices précédentes ; w2grid ne reçoit que la fenêtre active.
- Les requêtes sont annulées logiquement par `windowToken` si une nouvelle sélection intervient avant la résolution.
- Les nombres `1–100`, `101–200`, etc. indiquent le **rang des résultats dans la sélection courante**, pas les identifiants ISO, ni les positions dans l'ensemble du référentiel.

## Correction UX S14-U

Le libellé de navigation et la barre d'état affichent maintenant le contexte **ICS ou TC/SC**, le groupe choisi, la mention « sous-groupes inclus », le numéro de fenêtre et la plage de résultats, ou « aucune norme ». Le total de 81 768 apparaît seulement en vue globale sans recherche. On n'invente pas un total par groupe : l'API de pagination actuelle fournit un `next` mais pas un `totalCount` indexé ; calculer ce total à chaque sélection serait coûteux. Une future optimisation pourra matérialiser des compteurs par groupe versionnés avec les index persistants.

## Ce que ce lot NE change PAS

- Aucune modification de la structure IndexedDB, des index, des données ISO, de la logique métier, des blips et des révisions.
- Aucun nouvel accès HTTP ni changement de source ICS. La nomenclature historique GitHub Pages est encore présente comme repli ; les droits de republication d'ICS ne sont pas établis.
- La pagination est séquentielle par curseur (pas de saut direct à la 450e fenêtre).
- Le tri natif par clic sur une colonne de w2grid ne correspond pas nécessairement au tri *global* des 81 768 normes : les tris globaux exigent des index de données et une API de tri côté IndexedDB. Ne pas présenter un tri local à la fenêtre comme un tri global.

## Dossiers d'architecture à consolider

Reporter ce contrat dans les documents de référence existants sur la navigation et l'IndexedDB ; conserver les décisions `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` ouvertes. L'inventaire des sources doit distinguer ISO Open Data (métadonnées normes, comités), GitHub Pages historique (ICS.csv), service de distribution versionné, IndexedDB des utilisateurs, et les jeux complémentaires RSS et journaux. Le présent document décrit l'implémentation observée du paquet S14-T-R1 et ne vaut pas audit des fichiers du Mac non transmis.
