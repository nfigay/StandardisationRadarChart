# DEC-S14-N — Fenêtrage de la grille « Normes ISO »

## Périmètre livré
- Vue « Normes ISO » : fournisseurs de pages de 100 fiches depuis `standardisation-radar-iso-windowed`, sans `readAll()` dans sa branche de rendu. Boutons précédent/suivant et invalidation des requêtes concurrentes.
- Recherche textuelle exécutée via curseur IndexedDB : mémoire bornée en sortie mais recherche **linéaire**, sans index plein texte et sans total filtré exact.
- Consultation détaillée par ID via IndexedDB : ne dépend plus de `isoDeliverables.find()` dans la vue fenêtrée.
- Vue historique conservée comme repli si aucune génération S14-M n'est active. Le repli utilise encore des tableaux complets.

## Limite et suite impérative
**Cette livraison ne prétend pas résoudre le fenêtrage complet.** `loadIsoCache()` charge encore `deliverables` et `committees` en mémoire pour construire les index de sidebar ICS/TC-SC historiques. Les vues ICS et comités restent donc globales. Il faut migrer l'index de navigation et les filtres de sidebar vers des index persistants (links) et des métadonnées agrégées, puis supprimer `readAll()` du panneau. Les caches historiques restent inchangés.

## Ordre de chargement
Dépendance au lot S14-M, `radar-iso-windowed-db.js` chargé avant l'ouverture de la vue. L'ancienne base est laissée intacte.

## Risques et tests
- Pas de modification des radars, des révisions ou des blips.
- Les deux boutons sont désactivés aux frontières et les résultats obsolètes sont écartés.
- Les requêtes de détail utilisent une clé `generation,type,id`.
- Les fonctions `--check` et `--apply` vérifient les ancrages, sauvegardent avant modification et refusent les écrasements de documents.
- Mesurer mémoire et temps de réponse sur Chrome réel, en particulier une recherche qui parcourt la totalité des enregistrements.
