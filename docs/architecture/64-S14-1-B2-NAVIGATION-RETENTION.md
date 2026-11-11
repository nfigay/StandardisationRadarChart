# S14.1-B2-B — Navigation et rétention ISO

## Objectif

Préserver le fonctionnement de consultation progressive du
catalogue ISO et formaliser les conditions de sécurité du
stockage IndexedDB.

## Navigation

Le panneau conserve :
- une taille de fenêtre configurable ;
- deux fenêtres de notices au maximum dans w2grid ;
- un historique de curseurs pour revenir en arrière ;
- un chargement automatique lors du défilement ;
- un jeton permettant d'ignorer des résultats obsolètes.

Le lot B2-B ajoute des tests fonctionnels exécutant les
fonctions de navigation existantes avec un fournisseur de
pages simulé.

Les tests vérifient :
- avance, retour, nouvelle avance ;
- absence de doublons ;
- taille bornée de la grille ;
- arrêt en fin de catalogue ;
- récupération après erreur ;
- rejet d'une réponse devenue obsolète ;
- déclenchement par événement de défilement.

## Rétention IndexedDB

Le catalogue ISO distribué utilise des générations
immuables et un pointeur de génération active.

L'API `purgeGeneration()` refuse la génération active
au moment de son contrôle initial.

Cette protection ne suffit pas, à elle seule, à définir
une politique complète de nettoyage.

Décision B2 :
- aucune purge automatique ;
- aucune commande de purge exposée dans l'interface ;
- aucune modification des radars, groupes, révisions ou blips ;
- conservation des générations tant qu'un inventaire
  fiable et une politique de nettoyage ne sont pas disponibles.

## Prérequis à un nettoyage futur

Avant toute suppression volontaire :
1. Inventorier les générations réellement présentes.
2. Identifier explicitement la génération active.
3. Distinguer les données ISO des données du radar.
4. Gérer les opérations concurrentes d'importation
   ou d'activation.
5. Protéger les métadonnées d'index et les références.
6. Exiger une confirmation explicite.
7. Tester sur une base IndexedDB de simulation.

Le nettoyage futur doit être conçu comme une opération
administrative distincte de la consultation du catalogue.

## Compatibilité

La politique de chargement automatique S14.1-B1 reste
inchangée. Les sources facultatives B2-A restent
indépendantes de la navigation et du stockage principal.
