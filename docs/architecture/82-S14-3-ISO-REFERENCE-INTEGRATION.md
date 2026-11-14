# A8.2 — Lot 2 : intégration documentaire ISO

## Référence et objectif

Base : `2c6e8bf8814280504195da8260074287074d564a` (A8.2 R2). R5 reste la distribution publique. Le lot relie la consultation ISO globale à la représentation métier native, sans créer de second modèle métier.

## Contrat documentaire

Une sélection explicite dans une fiche ISO du Creator crée un `standard` du catalogue natif. `extensions.referenceDeclaration` décrit l'origine `iso-open-data` et la vérification `source-verified` (notice issue du corpus installé, non une certification ni une vérification indépendante de la norme). `extensions.isoDocument` version 1 est une copie portable des métadonnées normalisées : identifiant du livrable, référence, release ISO, titres/descriptions multilingues, ICS, comité, stade, édition, date, type, langues, pagination et relations documentaires. Les champs bruts, les données IndexedDB et l'identifiant de génération local ne sont pas distribués. Une valeur absente reste vide ; un titre anglais n'est pas présenté comme une traduction française.

Le seul point d'entrée de cette intégration est `__radarCatalogPersistence.importIsoReference(id)`. Il exige le profil Creator autorisé à déclarer des références, exactement un catalogue natif, et un livrable relu dans la génération ISO active. La génération et l'identité du workspace sont vérifiées après les lectures asynchrones. Aucun payload ISO fourni par le caller n'est accepté.

## Identité et rapprochement

L'identité documentaire est `(source ISO Open Data, id de livrable)` ; l'identifiant métier des nouvelles références est `iso-deliverable:<id>`. Réutiliser un identifiant déjà intégré ne modifie ni la copie ni les révisions. Une édition portant un identifiant et une désignation distincts peut être intégrée séparément. Une collision d'identifiant ou une désignation identique à une référence existante non reliée est signalée, sans fusion implicite ni promotion d'une référence manuelle. La réconciliation explicite et l'évolution d'une copie existante sont réservées à un prochain lot.

## Consultation et cycle de vie

Le Creator ouvre une fiche ISO et choisit **Ajouter au catalogue**, puis **Voir les références**. Ajouter une référence ne crée pas de blip. La commande historique Ajouter au radar reste disponible dans la vue Références pour un brouillon actif ; elle utilise le même standardId. Les révisions publiées sont inchangées. L'intégration marque le catalogue modifié via la comparaison canonique A8.2 et est incluse dans l'export JSON normal.

Les deux profils consultent les références natives via le même fournisseur et la même grille. Le détail ISO d'une référence utilise exclusivement la copie embarquée dans le JSON, y compris dans le Viewer ; les identifiants des relations sont présentés tels quels, sans accès au corpus global. Les filtres textuels couvrent aussi les titres, descriptions, ICS et comité. Le Viewer n'a aucun bouton d'intégration et ne déclenche aucune installation ISO. La fermeture du workspace ferme la fiche active et conserve IndexedDB. Le gestionnaire de sources existant est maintenu ; la commande Voir les références réutilise le changement de mode de la barre d'outils.

## Vérification et limites

Tests fonctionnels des services : identité, collisions, provenance, éditions, contrôle de profil, génération, changement de workspace, détection des modifications, export/reimport, création de blip, consultation et fiche en lecture seule. Tests sur doubles de navigateur : la recette Chrome réelle est nécessaire. Le corpus historique non versionné n'est pas autorisé comme source d'intégration. Les notices des exemples sont fictives ; les références source-verified ne sont produites qu'à partir du corpus installé. Aucun changement du schéma natif 1.0.0, du moteur IndexedDB ni du générateur de publication ; les métadonnées sont dans les extensions existantes. Pas de recherche documentaire distante, de gestion des droits de diffusion, de mise à jour automatique de copies, de navigation hiérarchique ICS/TC/SC sur sous-ensemble, ni de génération de publications dans ce lot. La publication future devra projeter les références nécessaires et leurs extensions, sans ajouter de données non sélectionnées.

## R2 — Libellés documentaires

La fiche globale conserve la clé i18next `rawTab` et les données originales. La copie native utilise les clés `storedTab`, `storedData` et `grpStored`, traduites FR/EN dans le même bundle. Le test de fiche vérifie les deux contextes et l’absence de consultation globale dans le Viewer. Aucun test historique n’est modifié.

### A8.2 — Correction i18n

Retour de recette Creator : intégration ISO fonctionnelle ; les nouveaux libellés doivent suivre la langue active. Les commandes workspace et confirmations utilisent le bundle `menu`, les commandes ISO, messages de résultat, provenance et compteurs utilisent `isoPanel`. Aucune nouvelle instance i18next. Les boutons du workspace sont réactualisés par `languageChanged`, le panneau Viewer utilise `data-iso-translation`, les fiches documentaires utilisent le mécanisme existant de reconstruction lors d’un changement de langue. Les métadonnées documentaires multilingues restent inchangées. Les anciens messages techniques hors du périmètre A8.2 ne sont pas refondus par cette correction.


### A8.2 — Internationalisation des formulaires (R2)

Correction fondée sur l’instantané `RadarChart-Sources-20261114-083558` (HEAD `2c6e8bf`, lot 2 et i18n non committés). Les fichiers sources exacts sont remplacés sous contrôle SHA-256 ; pas de transformateur générique ni de dépendance Acorn dans l’installateur.

- Le formulaire de création utilise `menu.blipForm` dans l’instance i18next commune, pour les deux modes : sélection existante et déclaration manuelle. Les titres, champs, placeholders, aide, options, compteur et résultat sont traduits. `languageChanged` actualise uniquement les textes, conserve les nœuds de saisie et les identifiants sélectionnés ; l’abonnement est retiré à la fermeture.
- Les messages techniques de `submit` et les valeurs métier `Adopted`, `Candidate`, `Track`, `Available`, `Monitored`, `Participated`, `Developed` restent stables. Les erreurs connues sont traduites à la frontière UI ; les erreurs inattendues sont journalisées et présentées par un message générique localisé.
- Le registre de références locales utilise `menu.standardRegister`, conserve les noms, identifiants et statuts stockés, traduit leurs libellés affichés, et préserve la saisie et la sélection lors d’un changement de langue.
- Les dialogues W2UI de révision et de renommage utilisent `menu.revisionDialogs` et `menu.radarAdmin` via i18next. Le choix de langue est pris en compte lors de l’ouverture ; pas de reconstruction automatique d’un popup W2UI modal déjà ouvert dans ce lot.
- Les invites de création du catalogue et l’offre de brouillon pour une révision protégée utilisent `menu.catalogForm`. Les messages préparatoires d’ajout au radar utilisent `isoPanel`. Les traductions des valeurs métier ne modifient ni le rendu graphique historique ni le schéma JSON.

Les tests exécutent la bibliothèque i18next embarquée dans `lib/`, les fonctions sources réelles et un DOM simulé. Le test historique de validation du nom reste inchangé. La recette Chrome et la suite avec Vite installé restent nécessaires. Audit limité aux formulaires et parcours métier natifs : les messages techniques historiques, certains messages du gestionnaire de sources ISO et les libellés des anciens outils de graphe constituent des sujets de contrôle ultérieurs. Les métadonnées documentaires restent multilingues si la source l’est.


## Consolidation pilote A8.2 — 14 novembre 2026

Preuves AUDIT-A82-20261114 : 532/532 tests sur le dépôt réel avec Node 22.23.5 ; construction Pages stricte sans erreur ni avertissement de readiness ; deux HTML autonomes vérifiés. Retour utilisateur : cycle de vie Creator et consultation Viewer positifs, intégration ISO fonctionnelle, libellés du formulaire traduits dans Chrome. Les essais automatisés couvrent la persistance de la copie ISO et les restrictions de profil ; la recette n'est pas une qualification exhaustive du Viewer, du mode physiquement déconnecté ou de Windows. CPV-02/03/11 restent en cours : la preuve couvre les sous-périmètres livrés, non la cible complète. CPV-04 à 10 et 12 ne sont pas déclarées réalisées.

La release pilote `pilot-a82` doit être construite après le commit source définitif, sans provenance de working tree. Les fichiers HTML communs sont distribués via les assets de release ; le portail Pages les référence et distingue le Client indépendant conservé pour compatibilité. Le contrat historique des six variantes n'est pas modifié. L'intégration de la projection documentaire, les définitions de publication, la navigation ICS/TC du Viewer et la refonte des sources restent des travaux ultérieurs.
