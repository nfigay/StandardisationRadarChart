# S14.3-A4-R3 — Régression du viewport sur GitHub Pages

## Contexte

Le Créateur superpose un fond SVG et une couche
Cytoscape partageant un repère logique 800 x 800.

Le centre du radar est (400,400).
Les rayons sont 150, 250 et 350.

Le positionnement du fond et du graphe doit utiliser
la même transformation géométrique.

## Défaut identifié

Le module de synchronisation du viewport est importé
dans radar.html depuis un chemin absolu :

    /src/domain/radar-viewport.mjs

Cette adresse est résolue depuis la racine du domaine
et non depuis le sous-répertoire du projet GitHub Pages.

Lorsque le module ne peut pas être chargé,
window.__radarViewportSync n'est pas installé.

Les appels optionnels à cette fonction permettent
à l'application de continuer à fonctionner, mais
sans garantir l'alignement du fond et des blips.

## Correction

Utiliser un import relatif :

    ./src/domain/radar-viewport.mjs

Le calculateur computeRadarViewport est conservé.

La correction ne modifie pas les coordonnées métier,
les données ISO, les révisions ni les exports Client.

## Contrat géométrique

Pour une largeur W et une hauteur H :

    zoom = min(W,H) / 800
    pan.x = (W - 800 * zoom) / 2
    pan.y = (H - 800 * zoom) / 2

Le SVG utilise viewBox="0 0 800 800"
et preserveAspectRatio="xMidYMid meet".

Un point du modèle doit posséder la même position
affichée dans les deux couches.

## Validation

Les tests couvrent la résolution de l'import dans
un sous-répertoire GitHub Pages, le centrage et
l'équivalence des transformations géométriques.

La recette navigateur doit confirmer :

- le chargement du module de viewport ;
- l'installation de la fonction de synchronisation ;
- l'alignement réel des blips et du fond SVG ;
- la conservation des coordonnées métier ;
- la stabilité lors du changement de révision ;
- la stabilité lors du redimensionnement ;
- l'absence de régression du déplacement des blips.

Les tests statiques ne remplacent pas cette recette.

## Distribution

Le correctif est prioritaire sur la création de
la branche gh-pages et des six distributions.

Les futurs builds standalone, bundled et modules
devront préserver le même contrat géométrique.


## Recette Chrome validée

La synchronisation temporaire appliquée dans Chrome
a été validée par l'utilisateur :

- alignement des blips : OK ;
- coordonnées métier conservées : OK ;
- changement de révision : OK ;
- redimensionnement : OK ;
- déplacement dans un brouillon : OK ;
- protection des révisions publiées : OK.

Ces résultats concernent la correction fonctionnelle
testée dans la session navigateur.

Une recette après publication doit confirmer que
la correction permanente est effectivement chargée.
