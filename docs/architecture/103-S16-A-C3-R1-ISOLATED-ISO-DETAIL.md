# S16-A-C3-R1 — Fiche ISO et chargement isolé A8.2

Correctif de compatibilité local, sans changement de règles de standardisation.

Le test A8.2 exécute `showDetail()` indépendamment des fonctions auxiliaires du panneau. La nouvelle commande C3 « Éditions et documents liés » doit donc être conditionnée à la disponibilité de `isoEditionSeries`. Le Creator complet déclare ce résolveur ; la commande y reste active. Un montage isolé sans ce résolveur doit continuer à afficher la fiche ISO habituelle.

Le correctif n'altère ni les notices ISO, ni les relations « remplace/remplacée par », ni IndexedDB, ni le modèle métier. Il ne rend pas un lien manquant plus vérifié.

Qualification requise : nouveau test de garde, 4 tests C3, test A8.2 existant, et régression Node complète. Ensuite recette AP242 et distribution Pages ; aucune publication sans autorisation.
