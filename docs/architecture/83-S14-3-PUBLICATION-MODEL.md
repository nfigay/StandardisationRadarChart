# 83 — S14.3-A8.3 : modèle natif des publications

## 1. Base et périmètre

Base publiée : `0b14a418b3e5a206a4611b8f6cd86887b5f8449d`, `pilot-a82`.
Références : architecture 79, DEC-019, plan de réalisation §9, architectures 81/82.
Le Creator/Publisher reste une seule application. A8.3 fournit le modèle et les
services ; A8.4 fournit la projection, A8.5 l'interface de publication, A9 la
composition et la génération. Aucun nouveau moteur de radar ni store parallèle.

## 2. Contrat de persistance

Le catalogue natif conserve son `schemaVersion: "1.0.0"`. L'extension optionnelle
`extensions.publications` contient `{schemaVersion: 1, definitions: [], releases: []}`.
Le schéma structurel est [publications-v1.schema.json](schemas/publications-v1.schema.json).
Le validateur exécutable `js/radar-publication-model.js` est normatif pour les
contraintes sémantiques (références, unicité, cohérence inter-champs, timestamps,
états, versionnement). Il n'exécute ni I/O, ni accès au DOM ou au graphe.
La distribution synchrone classic est transitoire, cohérente avec le bootstrap
commun sous HTTP et `file://`. Aucun changement des dépendances npm.

Les catalogues A8.2 sans extension sont lus tels quels. Lire un état vide ne crée
pas l'extension et ne rend pas le catalogue modifié. La première mutation l'ajoute.
Les versions inconnues et les champs inconnus de cette extension sont refusés :
pas de migration silencieuse ni de perte de données. Les autres extensions natives
sont préservées. Le JSON exporté par le service existant enveloppe ces données avec
la même preuve SHA-256 (intégrité, non authenticité). Aucun autosave.

## 3. PublicationDefinition

| Champ | Contrat |
|---|---|
| definitionId | Identité stable générée par UUID, indépendante du nom |
| version | Entier positif, incrément sur changement réel, version attendue pour mutation |
| status | active ou archived ; réactivation après validation |
| createdAt, updatedAt | Horodatages UTC ISO 8601 |
| configuration.name, description | Nom et description modifiables |
| audience | Libellé libre et identifiants d'organisations connus (public cible, non ACL) |
| scope | Règle de sélection, identifiants natifs de révisions/radars et filtres org/portefeuille |
| capabilities | Socle Viewer actuel : catalog.open, radar.navigate, radar.consult ; aucune mutation |
| presentation | Titre, langue FR/EN, souhait d'afficher les références |
| packaging | Modes standalone, bundled, modules ; données embedded ou external |
| dataPolicy | Inclusion souhaitée des copies ISO et évaluations ; extensions par allowlist uniquement |

Une définition peut sélectionner plusieurs révisions publiées par identifiants
(`explicit`), ou toutes les révisions publiées des radars nommés
(`allPublishedForRadars`). Ce second choix n'est pas une règle « dernière version ».
Les filtres organisation et portefeuille sont intersectés ; une sélection explicite
hors filtre est refusée, chaque radar sélectionné doit avoir au moins une révision
éligible. Les identifiants sont vérifiés, ainsi que l'appartenance portefeuille/org.
La résolution renvoie des identifiants triés de manière déterministe. Les définitions
actives ne sélectionnent jamais de brouillon ou de révision archivée.

Les paramètres sont des intentions, non une garantie que toutes les combinaisons de
modes/conditionnement seront réalisables. A8.4/A9 résoudront les contraintes de
fermeture et de composition ; notamment le traitement d'un assessment référencé
si l'utilisateur demande de ne pas le distribuer. Les trois capacités actuelles
constituent le minimum obligatoire de v1 ; le catalogue des capacités configurables
sera élargi avec les composants réellement disponibles. Pas de permissions d'accès
fondées sur la seule audience, ni d'envoi automatique de données.

## 4. PublicationRelease

Identité indépendante `releaseId`, date, instantané complet de la définition active
utilisée (version incluse), mode technique, identifiants et versions des révisions
résolues avec radar/org/portefeuille, identité du catalogue source, empreinte SHA-256
du catalogue natif (hors `extensions.publications` et conteneur extensions vide
résultant de ce retrait), commit logiciel complet, inventaire des modules, liste
d'artefacts (chemin relatif sûr, taille, SHA-256), résultats de contrôle rapportés.
Le digest est celui de la source native exportable, pas celui de la projection ni
une copie de toutes les anciennes données. La canonisation est `sorted-json-v1`.

`preparePublicationRelease` fixe le périmètre et la provenance de données ;
`recordPublicationRelease` revérifie le plan, le digest et la version courante
avant d'ajouter une livraison. Le changement de workspace pendant le calcul ou une
modification concurrente rend le plan obsolète. L'historique n'est pas modifié par
l'édition ou l'archivage d'une définition. La suppression d'une définition avec
historique est refusée. Les instantanés d'une même version ne peuvent diverger.
Une ancienne livraison conserve ses identifiants même si une révision est ensuite
archivée/supprimée : elle n'est pas une référence vers une révision mutable.

**La génération n'est pas implémentée dans A8.3.** Le registre accepte les métadonnées
d'une génération externe sous contrat strict, marquées `reported-passed` ; il ne
vérifie pas les octets des artefacts ni ne certifie le commit logiciel fourni.
Les preuves de génération réelles et leur vérification seront produites par A8.4/A9.
Ne pas appeler cette API avec des données de démonstration pour créer une vraie
livraison. L'immutabilité est celle des services et du modèle de persistance ; un
éditeur externe peut falsifier un fichier et recalculer son hash. Pas de signature.

## 5. Services et intégration

Les fonctions sont exposées par `window.__radarCatalogPersistence`, propriétaire de
l'unique état `imports[]`. Toutes les API d'auteur exigent `publication.create` et
un seul catalogue actif (profil absent ou Viewer : refus). Les lectures et résultats
sont des copies détachées. Toute mutation prépare et valide une copie avant commit.

| Service | Contrat |
|---|---|
| publicationState() | Copie des définitions et livraisons |
| createPublicationDefinition(configuration) | Crée v1 active |
| updatePublicationDefinition(id, expectedVersion, configuration, status='active') | Remplace la définition, version optimiste ; no-op stable |
| removePublicationDefinition(id, expectedVersion) | Supprime uniquement sans historique |
| resolvePublicationDefinition(id) | Définition active et identifiants résolus |
| preparePublicationRelease(graph, id, expectedVersion, mode) | Plan détaché et digest réel de source, sans mutation |
| recordPublicationRelease(graph, plan, evidence) | Ajout d'une livraison, evidence = codeCommit, modules, artifacts, checks |

`remember`, `build`, et le précontrôle `prepare` de Catalog UI valident l'extension
avant installation/export. Une tentative de remplacement invalide ne ferme pas le
workspace courant. Le dirty flag A8.2 détecte les mutations ; fermeture et export
utilisent les services existants. L'archivage/suppression de révisions est contrôlé
avant mutation : une définition active ne peut être rendue invalide. Le conflit
est traduit via `menu.revisionDialogs.publicationScopeConflict` (FR/EN) à la
frontière UI, sans traduire les exceptions techniques. Un Viewer refuse un JSON
contenant l'extension d'auteur, même si toutes ses révisions sont publiées. Cette
barrière n'est pas une garantie de confidentialité des octets déjà transmis.
Le moteur A8.4 devra retirer l'extension entière et appliquer une projection fermée.

## 6. Qualification et suite

`tests/radar-a83-publications.test.mjs` : sources réelles, profil commun et WebCrypto,
plusieurs définitions, compatibilité, contraintes et références, résolution multi-
radars, cycle de vie, versions optimistes, historique, aller-retour enveloppe JSON,
concurrence, protection Viewer et opérations sur les révisions. Aucun test historique
modifié. Les exemples du package sont synthétiques, sans preuve de génération fictive.
Qualification complète de la suite et des builds à réaliser sur le dépôt réel.
CPV-04/05 : implémentation candidate en cours, preuves finales à consolider.
CPV-06/07/08/09/10/12 restent à réaliser ; aucun changement de la release `pilot-a82`.
L'interface Publisher complète est A8.5 ; pas de nouveau bouton d'auteur dans A8.3.

## 7. Qualification A8.3 — 2026-11-14

Installation sur la base publiée `0b14a41` : empreintes pré/post vérifiées,
552/552 tests dont 20/20 A8.3, Pages strict sans erreur ni avertissement
de readiness, Creator et Viewer autonomes construits et contrôlés.
Recette Chrome du Creator autonome : `publicationState()` retourne le
schéma 1, deux définitions actives v1 et zéro livraison. Le catalogue
de démonstration contient les sélections explicite `rev-1`, `rev-3` et
dynamique du radar `demo-radar` (révisions attendues `rev-1`, `rev-2`).
Les validations de chargement, de persistance et de restrictions sont
positives (tests automatisés pour export/réimport et immuabilité).
La recette navigateur n'a pas encore exécuté un export/réimport ni
une génération. CPV-04/05 : preuve partielle, interface et génération
restantes. A8.2 demeure la version publique.
