# Conception de la consultation ISO — contrat utilisateur / données

## Consultation fonctionnelle

Un groupe sélectionné dans `w2sidebar` définit un prédicat hiérarchique (ICS ou TC/SC, descendants inclus). La recherche texte et les champs de filtres sont combinés par intersection. Le tri doit porter sur l'ensemble du résultat logique. `w2grid` conserve une ou deux fenêtres actives selon la navigation ; la taille n'est pas le nombre de résultats accessibles.

## Contrats techniques existants

- `window.__radarIsoWindowed.current()` : génération active.
- `page({type,limit,after,dimension,groupKey,search,icsFilter,committeeFilter,sortField,sortDirection})` : au plus `limit` notices + curseur opaque `next`. `limit <= 500`.
- `get({type,id})` : fiche individuelle.
- `ensureGroupIndex()` / `groupIndexStatus()` : préparation et état des ancêtres ICS/TC-SC.
- `ensureSortIndex()` / `sortIndexStatus()` : préparation et état du tri global titre/anglais/stade.

Le moteur renvoie `total:null` pour de nombreux filtres. Ne pas présenter une estimation comme un total vérifié.

## Validation S14-W

Le module `radar-s14-w-functional-audit.js` cherche une combinaison **existante** ICS+comité à partir d'une fenêtre bornée, vérifie la recherche textuelle correspondante, construit si nécessaire les seules clés de tri persistantes, puis contrôle l'ordre et les chevauchements de fenêtres dans les deux sens pour trois champs de tri. Il ne réimporte pas ISO et ne modifie pas la génération active.

L'indexation peut prendre du temps et requérir de l'espace IndexedDB. Ne pas relancer plusieurs fois simultanément. Le diagnostic est opt-in, non exécuté au démarrage de l'application.

## Non-régressions requises avant clôture

- Défilement jusqu'au-delà d'au moins deux frontières de fenêtre, sans saut visuel ni perte de sélection.
- Recherche dans tout le catalogue, et non seulement dans `grid.records`.
- Intersection ICS+TC/SC non vide et recherche textuelle combinée.
- Tri global asc/desc par référence, titre et stade.
- Limitation du nombre de notices en mémoire et stabilité lors d'une navigation prolongée.
- Accessibilité et comportement clavier/trackpad, sans exiger les DevTools.


## S14-X — Recherche et arborescences de navigation (11 novembre 2026)

**Exigence fonctionnelle :** lorsqu’un utilisateur recherche des normes dans la vue ICS ou TC/SC, le volet gauche doit présenter uniquement les classifications ou comités associés à au moins une norme répondant à la recherche, en conservant les ascendants nécessaires à la navigation. Une recherche sans résultats produit une arborescence vide ; effacer la recherche restaure l’arbre complet.

**Contrat :** le filtre de l’arbre découle de l'ensemble des résultats de la requête IndexedDB (`search`, `icsFilter`, `committeeFilter`) sans limiter l’analyse aux fenêtres visibles dans w2grid. Le nœud sélectionné est désélectionné s’il ne peut plus contenir de résultat ; les réponses asynchrones obsolètes sont ignorées. Le comportement existant de la table et de son tri reste inchangé.

**Implémentation :** `js/radar-iso-tree-filter.js` parcourt les résultats fenêtrés par lots de 250, ne stocke que les identifiants des groupes correspondants, puis conserve leurs ancêtres. Les groupes ICS et TC/SC sont identifiés par les métadonnées des normes (classification et comité responsable) et par le modèle de navigation. Les notices ne sont pas accumulées en mémoire. Le traitement s'annule lors d’une nouvelle recherche.

**Limite et optimisation :** une recherche générique trouvant un très grand nombre de normes parcourt de nombreuses fenêtres. Le filtrage de l’arbre est asynchrone et les nœuds restent temporairement inchangés pendant le calcul. Un futur index inversé par terme pourra accélérer ce calcul. Ce contrat ne prétend pas garantir la mémoire de l’ensemble de Chrome.

**Validation :** tests d’unité S14-X couvrant ICS, TC/SC, ascendants, recherche vide, annulation, filtres combinés et absence de mutation du modèle. La validation interactive Chrome est encore requise.

## S14-Y — Recherche avancée booléenne hiérarchique (11 novembre 2026)

La recherche simple reste active. La recherche avancée ajoute un AST de groupes `AND` / `OR`, chaque groupe pouvant être inversé par `negated: true` (NON). Les critères feuilles comprennent `field` (`all`, `reference`, `title`, `titleEn`, `description`, `ics`, `committee`, `stage`), `comparison` (`contains`, `equals`, `prefix`) et `value`. Les groupes peuvent être imbriqués, la profondeur étant limitée à 12 et le nombre total de nœuds à 128. Aucune évaluation de code dynamique (`eval`) n'est autorisée.

Le contrat de requête `page({ ..., advancedQuery })` applique l'AST **à chaque notice candidate du curseur IndexedDB**, avant d'ajouter une ligne à la fenêtre, ce qui permet un tri global conservé et une limite de 500 lignes retournées. La recherche simple, les sélections ICS et TC/SC, les filtres explicites et l'AST avancé sont combinés par ET. Pour conserver la cohérence de la vue, `radar-iso-tree-filter` transmet le même AST et ne conserve dans l'arbre que les branches des résultats correspondants, en préservant les ancêtres. Une mise à jour de l'expression invalide les réponses d'une requête précédente (`advancedRevision`, `treeSearchToken`, `windowToken`).

Les comparaisons sont insensibles à la casse et aux diacritiques, les tableaux ICS sont évalués comme des listes de valeurs (au moins une valeur satisfait le prédicat). Une valeur absente ne satisfait pas une condition positive. Un groupe `NOT` inverse son résultat complet, y compris avec les valeurs absentes. La recherche n'exige pas de matérialisation globale en mémoire, mais des expressions peu sélectives, négatives ou en OU peuvent nécessiter des parcours longs ; aucune promesse d'index plein texte n'est formulée.

Le constructeur est disponible dans un dialogue natif via le bouton « Recherche avancée… » dans les vues fenêtrées. Les contrôles permettent l'ajout, la suppression et l'imbrication de groupes, leur choix ET / OU et leur négation, ainsi que l'effacement de l'expression. Le constructeur reprend l'AST d'exemple spécifié par l'utilisateur ; cette proposition n'est appliquée qu'après clic sur « Appliquer ». Il n'est pas encore question d'un langage textuel libre ou de persistance de recherches enregistrées.

**Critères de validation restant à exécuter dans le navigateur réel :** ouverture, modifications de groupes imbriqués, recherche attendue, synchronisation de l'arborescence, fenêtres successives, maintien du tri, suppression de l'expression, absence de régression dans les autres modes et consommation mémoire prolongée.

## S14-Y-R2 — Édition intuitive des expressions booléennes

Le groupe racine est permanent. Les groupes imbriqués peuvent être ajoutés au groupe courant ou en tant que frères, dissous en conservant leurs enfants ou supprimés avec tous leurs enfants. Toute condition peut être englobée dans un nouveau sous-groupe sans être ressaisie. Une pile d’annulation locale au dialogue restaure la précédente structure après les modifications de l’arbre ; « Repartir de l’exemple » réinitialise le brouillon, sans appliquer la recherche. Les données ne sont modifiées qu’à l’action « Appliquer ». Les groupes vides ou critères incomplets ne peuvent pas être appliqués ; le validateur déjà en place le signale. Les actions sont associées explicitement à chaque nœud.


## S14-Z — Gestion des sources et publication GitHub Pages

La gestion des sources présente une commande principale de synchronisation du catalogue distribué. Les fonctions locales/import/journal/RSS sont réservées au panneau d’administration avancée. Les résultats structurés de synchronisation distinguent `unchanged`, `updated`, `not-published` et `error`. Le catalogue ISO reste stocké dans IndexedDB, servi par un service HTTPS distinct du build GitHub Pages. Voir `59-S14-Z-GESTION-SOURCES-PUBLICATION.md` pour les dépendances, la validation et les décisions ouvertes.
