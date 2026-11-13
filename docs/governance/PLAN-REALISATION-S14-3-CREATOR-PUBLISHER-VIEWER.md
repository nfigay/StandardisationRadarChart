# Plan de réalisation — S14.3 Creator/Publisher et Viewers

## 1. Référence et statut

Ce plan remplace la trajectoire qui prévoyait de
construire séparément le Creator et un Client minimal,
puis de rapprocher ultérieurement les deux applications.

Il ne remplace pas les travaux métier S13, S14,
S14.1 et S14.2 déjà réalisés.

Références :

- [Architecture cible 79](../architecture/79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md)
- [Guidelines](GUIDELINES-CREATOR-PUBLISHER-VIEWER.md)
- [Prototype Client A6/A7](../architecture/78-S14-3-CLIENT-THREE-DISTRIBUTIONS.md)

## 2. Baseline

Sources : 6b969f3.
Distribution publique : bf6472a.

État technique :

- 464 tests réussis ;
- 3 variantes du Client expérimental construites ;
- 19 ressources HTTP positives vérifiées par SHA-256 ;
- types MIME ES6 corrects ;
- infrastructure de publication atomique opérationnelle ;
- documents d'architecture jusqu'au numéro 78.

La qualification navigateur complète du Client reste ouverte.

Les trois modes du Creator/Publisher restent à réaliser.

Le Creator historique demeure la référence fonctionnelle
pour la migration de l'interface et du moteur commun.

## 3. Objectif final

Une application Creator/Publisher capable de créer,
maintenir et publier les connaissances.

Des Viewers dérivés de cette application, configurés
pour différents acteurs et périmètres de consultation.

Chaque famille dispose des trois modes :

- HTML standalone hors ligne ;
- HTML et bundle JavaScript unique ;
- HTML et modules ES6 natifs.

Le Creator/Publisher autonome peut produire des Viewers
sans outils externes de développement.

## 4. Principes d'exécution

Les identifiants A8.x et A9.x désignent des jalons logiques.

Ils peuvent être regroupés en interventions substantielles
lorsque leurs dépendances et validations le permettent.

Le plan n'impose pas une succession de micro-itérations.

Chaque intervention de développement apporte du code,
des tests et une contribution architecturale.

La réalisation ne doit pas être retardée par une nouvelle
phase générale de conception lorsque les décisions sont
déjà établies.

Les numéros des futurs documents sont des réservations
indicatives, à confirmer lors de chaque lot.

## 5. Vue d'ensemble

| Lot | Résultat concret | Architecture indicative |
|---|---|---|
| A8.0 | Référentiel documentaire de convergence | 79 |
| A8.1/A8.2 | Socle commun et premier Viewer utilisant l'interface historique | 80-81 |
| A8.3/A8.4 | Publications persistantes et projection configurable des connaissances | 82-83 |
| A8.5 | Publisher intégré et prévisualisation réelle | 84 |
| A9.1/A9.2 | Composition sélective et génération des trois Viewer | 85-86 |
| A9.3 | Trois distributions du Creator/Publisher | 87 |
| A10 | Qualification de bout en bout et substitution du prototype | 88 |

## 6. A8.0 — Référentiel documentaire

Livrables :

- architecture 79 ;
- guidelines ;
- plan de réalisation ;
- mise à jour des références de gouvernance ;
- correction de la spécification cible ;
- qualification historique des architectures 77 et 78 ;
- exigences de convergence CPV-01 à CPV-12.

Porte de validation :

- absence de contradiction entre les trois documents ;
- liens documentaires résolus ;
- décisions approuvées rendues explicites ;
- préservation des documents historiques ;
- aucune modification fonctionnelle ;
- commit documentaire identifié.

## 7. A8.1 — Profils, capacités et initialisation

### Objectif

Rendre le moteur historique configurable sans créer
un second moteur de présentation.

### Travaux

- caractériser les points d'entrée et l'initialisation ;
- identifier les commandes et services métier existants ;
- définir le profil Creator/Publisher ;
- définir le profil Viewer de consultation ;
- introduire un registre de capacités ;
- introduire les contrôles d'exécution correspondants ;
- appliquer les premières capacités à l'interface réelle ;
- préserver les comportements des révisions existantes.

Les composants UI ne sont pas réécrits pour cet objectif.

### Livrables

Code exécutable de configuration et contrôle des capacités,
intégré à l'application existante.

Tests unitaires et d'intégration.

Premier document de modularisation du socle commun.

### Acceptation

- comportement Creator historique conservé ;
- profil par défaut compatible avec les usages existants ;
- capacités inconnues traitées explicitement ;
- mutations interdites refusées dans le profil Viewer ;
- première ouverture du véritable radar en lecture seule ;
- absence de nouveau moteur de rendu.

Cette étape ne garantit pas encore l'exclusion physique
de tous les modules inutilisés.

## 8. A8.2 — Interface commune de consultation

### Objectif

Obtenir un Viewer réellement utilisable à partir
des composants historiques du Creator.

### Travaux

- composition des panneaux, menus et actions ;
- navigation dans le périmètre de consultation ;
- réutilisation du radar Cytoscape ;
- réutilisation des détails et dialogues ;
- sélection et consultation des normes ;
- gestion commune de session et de fermeture ;
- distinction entre état métier et préférences locales ;
- traitement des commandes d'édition legacy restantes.

### Acceptation

- même rendu et même géométrie ;
- même sélection de blips ;
- dialogues et composants communs ;
- navigation entre objets disponibles ;
- absence de commandes d'édition non autorisées ;
- absence de mutation après invocation directe ;
- confirmation de fermeture interne ;
- protection des révisions publiées dans le Creator ;
- recette navigateur de parité.

A8.1 et A8.2 peuvent constituer une intervention
fonctionnelle commune, avec des validations distinctes.

## 9. A8.3 — Modèle métier des publications

### Objectif

Intégrer les publications dans le workspace natif.

### Travaux

- spécifier PublicationDefinition et PublicationRelease ;
- définir identités, relations et cycle de vie ;
- intégrer la persistance et les migrations ;
- gérer la création, modification et consultation ;
- enregistrer les paramètres de publication ;
- conserver la provenance des livraisons.

### Acceptation

- plusieurs définitions coexistantes ;
- définition persistée après sauvegarde/restauration ;
- références vers les objets métier valides ;
- modification d'une définition sans mutation
  des livraisons antérieures ;
- compatibilité des workspaces existants ;
- absence d'un second modèle indépendant de workspace.

## 10. A8.4 — Projection configurable des connaissances

### Objectif

Produire le véritable espace de consultation
à partir du modèle natif.

### Travaux

- sélection de plusieurs roadmaps et révisions ;
- sélection des organisations et portefeuilles ;
- gestion des normes, évaluations et relations ;
- résolution de la fermeture des références ;
- sélection explicite des attributs ;
- traitement des extensions et conflits ;
- production d'une configuration et de données résolues.

### Acceptation

- projection d'une sélection multiradar ;
- références nécessaires présentes et cohérentes ;
- identités et coordonnées conservées ;
- aucun brouillon ou attribut privé inclus par défaut ;
- absence de donnée hors périmètre ;
- conflits de fermeture détectés ;
- données sources non modifiées ;
- projection consommable par le socle commun.

Le format experimental v2 reste compatible en tant
que format minimal tant que sa stratégie d'évolution
n'a pas été qualifiée.

## 11. A8.5 — Publisher intégré

### Objectif

Permettre la préparation des Viewers dans le Creator,
sans application Publisher séparée.

### Travaux

- interface Publications et distributions ;
- édition des définitions persistantes ;
- sélection des destinataires ;
- sélection des connaissances ;
- sélection des capacités ;
- choix du mode technique ;
- prévisualisation isolée ;
- lancement de génération ;
- historique des livraisons produites.

Le moteur de génération peut initialement produire
une configuration résolue et un premier artefact
qualifiable, avant la couverture des trois modes.

### Acceptation

- workflow continu depuis le Creator ;
- configuration enregistrée puis réouverte ;
- prévisualisation sur les vrais composants ;
- données de prévisualisation limitées à la projection ;
- retour au contexte d'édition sans perte ;
- distinction entre publication métier et révision ;
- aucune obligation d'utiliser une autre application.

## 12. A9.1 — Composition sélective des modules

### Objectif

Transformer le profil Viewer fonctionnel en une
distribution logicielle sélective.

### Travaux

- identifier les frontières des modules ;
- distinguer consultation, édition et publication ;
- construire un graphe de dépendances ;
- résoudre la fermeture selon les capacités ;
- adapter les dépendances legacy ;
- produire un manifeste de composition ;
- qualifier les ressources préconstruites nécessaires
  à la génération depuis le navigateur.

### Acceptation

- fermeture de dépendances vérifiable ;
- modules exclus réellement absents ;
- absence de chargement implicite de modules interdits ;
- fonctionnement des capacités sélectionnées ;
- absence de catalogue global non demandé ;
- stratégie de génération hors Node.js démontrée.

Un simple masquage des commandes ne satisfait pas
cette porte de validation.

## 13. A9.2 — Trois modes Viewer

### Objectif

Générer les trois modes depuis une même définition
de publication et le même socle commun.

### Travaux

- construction ou assemblage natif ES6 ;
- bundle applicatif unique ;
- HTML autonome ;
- intégration des données ;
- génération de manifestes ;
- téléchargement ou archive des artefacts ;
- intégration au portail public pour les exemples
  génériques non confidentiels.

### Acceptation

- mêmes capacités et connaissances dans les trois modes ;
- fonctionnement HTTP sous le préfixe Pages ;
- fonctionnement standalone sous file:// hors ligne ;
- exclusion des modules non nécessaires ;
- téléchargement depuis le Publisher ;
- intégrité et provenance vérifiables ;
- absence de dépendance au prototype SVG.

## 14. A9.3 — Trois modes Creator/Publisher

### Objectif

Distribuer l'environnement complet de création
et de publication dans les trois modes.

### Travaux

- point d'entrée natif complet ;
- bundle applicatif unique ;
- intégration des ressources standalone ;
- catalogue ISO accessible hors ligne ;
- persistance et sauvegarde/restauration ;
- intégration des ressources logicielles nécessaires
  à la génération des Viewers ;
- qualification de la taille et des performances.

### Acceptation

- création et édition de roadmaps ;
- navigation et consultation des catalogues ;
- gestion des révisions ;
- définition et génération des publications ;
- sauvegarde et restauration du workspace ;
- fonctionnement hors ligne du standalone ;
- génération de Viewer depuis le Creator autonome ;
- aucune obligation de Node.js, Vite ou Git à l'usage.

## 15. A10 — Qualification intégrée

### Parcours de référence

1. Ouvrir ou créer un workspace.
2. Gérer les catalogues et les références.
3. Créer et éditer plusieurs roadmaps.
4. Publier leurs révisions.
5. Définir deux publications pour des acteurs distincts.
6. Sélectionner des périmètres et capacités différents.
7. Prévisualiser les deux Viewers.
8. Générer les trois modes pour chaque définition.
9. Vérifier les artefacts, les modules et les données.
10. Consulter les Viewers dans un navigateur réel.
11. Qualifier le fonctionnement autonome.
12. Générer une nouvelle livraison depuis une
    définition réutilisée.

### Portes de qualification

- tests historiques sans régression ;
- parité Creator/Viewer ;
- protection des mutations métier ;
- absence de données hors périmètre ;
- fermeture des références ;
- exclusion physique des modules ;
- prévisualisation fidèle ;
- intégrité et provenance ;
- publication depuis le Creator autonome ;
- recette des six distributions de référence.

### Transition finale

Mettre à jour le portail et les statuts de distribution.

Remplacer le Viewer expérimental par le Viewer commun.

Préserver ou migrer explicitement les URL historiques.

Documenter le devenir du format experimental v2.

Ne supprimer le moteur de présentation expérimental
qu'après validation de la compatibilité et des usages.

## 16. Matrice exigences / réalisation

| Exigence | Lot principal | Preuve |
|---|---|---|
| CPV-01 | A8.3/A8.5 | Parcours Creator/Publisher intégré |
| CPV-02 | A8.1/A8.2 | Parité des composants |
| CPV-03 | A8.1/A8.2 | Tests de refus des mutations |
| CPV-04 | A8.3 | Sauvegarde et restauration |
| CPV-05 | A8.3/A9.2 | Manifestes et provenance |
| CPV-06 | A8.4 | Tests de projection et fermeture |
| CPV-07 | A8.5 | Comparaison prévisualisation/livraison |
| CPV-08 | A9.1 | Graphe et inventaire des modules |
| CPV-09 | A9.2/A9.3 | Recettes des six modes |
| CPV-10 | A9.3 | Génération hors ligne |
| CPV-11 | A8.1/A8.2 | Cycle de vie et parité historique |
| CPV-12 | A8.4/A9.2 | Tests négatifs sur les artefacts |

## 17. Risques et réponses

| Risque | Réponse |
|---|---|
| Dépendances globales historiques | Caractérisation et extraction progressive |
| Duplication Creator/Viewer | Revue systématique de réutilisation |
| Fuite de données | Projection explicite et tests négatifs |
| Mutation par commande legacy | Contrôles dans les services |
| Catalogue autonome trop volumineux | Mesures et fournisseurs adaptés |
| Persistance file:// | Recette réelle et sauvegarde par fichiers |
| Composition navigateur insuffisante | Preuve technique avec artefacts préconstruits |
| Régression de géométrie | Tests de parité et viewport |
| Dépendance au prototype | Gel fonctionnel puis substitution |
| Multiplication des micro-lots | Regroupement en résultats fonctionnels |

## 18. Pilotage

Le plan doit être actualisé à chaque lot terminé.

Un jalon est déclaré terminé seulement sur preuve.

Distinguer dans les rapports :

- sources modifiées ;
- tests réussis ;
- artefacts construits ;
- branches publiées ;
- accès HTTP vérifiés ;
- parcours navigateur qualifiés.

Les tests et recettes restant ouverts sont conservés
dans le suivi, sans être transformés en succès supposés.

La mise à jour documentaire A8.0 ne constitue pas
une implémentation des nouvelles fonctionnalités.

## État d'avancement après A8.1

<!-- S14.3-A8.1-CLOSURE -->

A8.1 — Socle commun et profils : réalisé
dans son périmètre initial.

Preuves disponibles :

- 476 tests automatisés réussis ;
- deux révisions natives navigables ;
- coordonnées conservées ;
- verrouillage des deux blips ;
- formulaire W2UI commun en lecture seule ;
- menus Viewer filtrés ;
- capacités de mutation refusées ;
- zéro erreur du diagnostic consolidé.

Voir l'architecture 80 et les rapports
A8.1-VIEWER-SMOKE et
A8.1-VIEWER-CONSOLIDATED.

A8.2 devient le prochain lot de développement.

Son périmètre est regroupé autour de :

1. Consultation des références natives
   et évaluations distribuées.

2. Réutilisation des panneaux W2UI
   et des fiches de consultation.

3. Séparation des fournisseurs de données
   et des fonctions d'administration.

4. Navigation commune dans les connaissances.

5. Cycle de vie partagé du workspace :
   ouverture, remplacement, fermeture
   et confirmations.

6. Qualification comparative des deux profils,
   y compris les contrôles navigateur
   restant ouverts après A8.1.

Les critères de validation existants sont
conservés.

Les lots A8.3 à A10 restent inchangés.

La composition sélective des modules
n'est pas considérée comme réalisée.
