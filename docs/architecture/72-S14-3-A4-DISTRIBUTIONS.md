# S14.3-A4 — Séparation des distributions

## Deux produits

### Author / Créateur

Entrée actuelle : `radar.html`.

Responsabilités :
- création et modification des roadmaps ;
- révisions, publication et administration ;
- accès au catalogue ISO ;
- import et gestion des sources.

Build historique préservé dans cette itération.

### Client

Entrée : `client.html`.

Responsabilités :
- chargement explicite d'une roadmap publiée ;
- affichage en lecture seule ;
- utilisation exclusive des notices ISO du paquet ;
- aucune gestion du catalogue ISO global.

## Premier packaging isolé

Commande : `npm run build:client`.

Sortie : `.radarchart-build/client/`.

Le build utilise une configuration Vite séparée :
`vite.client.config.js`.

La configuration désactive la copie du dossier public
et n'utilise pas le plugin de copie des ressources
historiques du Créateur.

Le Client est construit à partir de son seul HTML et
de ses dépendances transitives.

## Vérification

Commande : `npm run verify:client`.

Contrôles :
- présence de client.html et du bundle JavaScript ;
- absence de radar.html ;
- absence des données ISO et des ressources du Créateur ;
- absence de références aux gestionnaires ISO ;
- inventaire des fichiers ;
- empreinte SHA-256 de chaque fichier ;
- vérification du manifeste de distribution.

Le contrôle porte sur les artefacts générés.

Il n'établit pas à lui seul l'absence de toute capacité
réseau future : les dépendances devront rester auditées
lors de leurs évolutions.

## Protection des sorties

Un build existant n'est pas écrasé.

Aucun mécanisme de publication GitHub Pages n'est
modifié dans R1.

Les caches ISO, IndexedDB et données utilisateur
ne sont pas modifiés.

## Étapes suivantes

- vérifier le rendu du Client dans un navigateur ;
- reproduire fidèlement le radar du Créateur ;
- stabiliser le format de publication ;
- intégrer l'export dans le Créateur ;
- décliner les packagings standalone, server et modules ;
- publier les deux produits et leurs manifestes.
