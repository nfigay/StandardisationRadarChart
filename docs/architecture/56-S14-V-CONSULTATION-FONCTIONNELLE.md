# S14-V — Contrat fonctionnel de consultation ISO (état intégré, non encore validé en Chrome)

## Besoin utilisateur

Dans les vues Normes ISO, ICS et TC/SC, l'utilisateur doit pouvoir :

1. Rechercher dans l'ensemble des notices actives, et non dans le seul contenu de w2grid.
2. Filtrer par code ICS, par comité TC/SC et par un nœud sélectionné dans l'arborescence, avec conjonction logique.
3. Trier **l'ensemble des résultats** par référence, titre FR, titre EN ou stade (ascendant/descendant), sans tri local d'une tranche seulement.
4. Parcourir automatiquement les fenêtres successives par trackpad, molette ou clavier, sans croissance illimitée de `grid.records`.
5. Ouvrir une fiche par identifiant sans copier toute la base en mémoire.

## Réalisation S14-V

- IndexedDB schéma 3 : magasin `sortKeys`, index d'ordre [`generation`,`type`,`field`,`value`,`id`].
- Import : alimenter les clés de tri au fur et à mesure des lots, dans la transaction de chaque lot.
- Catalogue préexistant : `ensureSortIndex()` reconstruit ces clés par lots de 300, sans télécharger une nouvelle publication.
- Requête : `page({sortField,sortDirection,search,dimension,groupKey,icsFilter,committeeFilter,after,limit})`.
- Le curseur IndexedDB fournit l'ordre global. Les autres prédicats sont vérifiés avant de retenir les lignes de sortie.
- Le panneau fournit un champ de recherche, deux filtres explicites ICS et TC/SC et une liste de tris globaux. Les en-têtes des colonnes ISO ne déclenchent plus de faux tris locaux.
- Le panneau charge les pages suivantes en approchant de la fin du défilement et peut relire la précédente vers le haut. Au maximum deux fenêtres sont matérialisées dans `grid.records`. Les bookmarks IndexedDB sont conservés.
- L'ancienne pagination manuelle reste comme secours, particulièrement pour l'accessibilité.

## Précautions et limites

- Le filtrage et la recherche textuelle sont globaux et **bornés en mémoire**, mais certaines combinaisons et certains tris peuvent demander un parcours de nombreuses entrées IndexedDB. Il ne s'agit pas encore d'un index plein texte.
- Le comptage total exact d'une recherche à plusieurs critères n'est pas affiché : il requiert un calcul distinct.
- La conservation exacte du défilement visuel avec l'ensemble des versions w2ui installées n'a pas été testée dans Chromium dans l'environnement de production du correctif ; test utilisateur obligatoire.
- Les filtres par saisie exigent des codes exacts (ICS 07, TC/SC ISO/TC 121). La sélection dans le sidebar demeure la voie privilégiée pour les groupes.
- `readAll()` existe encore comme solution de compatibilité lorsque **aucune génération fenêtrée n'est active** : à traiter dans le plan de dépréciation.
- Les décisions de modèle de données référentiel/standard/blip (S12-R1, DEC-009/010/016/017/018) demeurent ouvertes. Aucun changement métier n'est réalisé ici.

## Tests requis avant validation utilisateur

- Normes ISO : recherche « nanotechnologie » et tri titre A→Z, puis Z→A.
- ICS 07 : recherche textuelle et filtre TC/SC, puis défilement traversant plus de 100 normes.
- TC/SC parent : navigation dans sous-comités et retour vers le haut.
- Changement rapide de filtre pendant une lecture en cours : aucune ancienne réponse ne doit remplacer la nouvelle.
- Fiche détaillée : lecture par identifiant.
- Mémoire : contrôler `grid.records.length <= 2*windowSize` lors de longs parcours.
- Corrélation entre colonnes affichées et ordre effectivement appliqué à tous les résultats.

## Mise à jour des référentiels

Le présent document est une mise à jour de conception **sur la consultation**, pas une assertion que tous les dossiers de référence du dépôt ont déjà été réconciliés. L'inventaire des sources accompagne cette livraison.
