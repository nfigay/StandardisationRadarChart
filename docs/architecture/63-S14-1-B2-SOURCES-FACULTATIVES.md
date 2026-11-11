# S14.1-B2-A — Sources facultatives

## Décision

Le catalogue ISO distribué constitue la source principale
du navigateur et bénéficie de l'installation automatique
introduite et validée en S14.1-B1.

Les flux RSS, le journal des évolutions, les fichiers ISO locaux
et les imports JSONL sont des sources secondaires.

## Politique de chargement

Au démarrage :
- installation ou réutilisation du catalogue ISO principal ;
- lecture des événements RSS déjà présents dans IndexedDB ;
- aucune tentative réseau systématique vers le manifeste RSS ;
- aucune tentative systématique de chargement du journal des évolutions.

Sur action explicite :
- synchronisation du catalogue ISO distribué ;
- synchronisation des fichiers ISO locaux ;
- import JSONL ;
- actualisation RSS ;
- chargement du journal des évolutions.

Une source facultative absente ne constitue pas une erreur
d'installation du catalogue principal.

## Interface

Le gestionnaire de sources existant reste le point d'entrée
commun aux opérations. Son aide distingue les données
distribuées automatiquement des sources locales facultatives.

## Invariants

- Aucune suppression IndexedDB.
- Aucun effacement des radars ou des révisions.
- Conservation des commandes d'import existantes.
- Conservation de la consultation hors ligne des RSS déjà stockés.
- Préservation du chargement ISO automatique de S14.1-B1.

## Prochain lot

S14.1-B2-B : comportement du défilement continu,
identification des générations obsolètes et politique
de rétention avec protection stricte des données utilisateur.
