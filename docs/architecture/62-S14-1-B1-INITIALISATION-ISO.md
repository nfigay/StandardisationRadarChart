# S14.1-B1 — Initialisation du catalogue ISO

## Constat

La version S14.1-A déclenchait la synchronisation distribuée
au moyen de `remote.click()`. L'appel était non attendu et
les erreurs étaient interceptées dans un gestionnaire UI distinct.

Le test réel sur GitHub Pages a établi que l'installation initiale
n'était pas fiable, tandis que la persistance au rechargement fonctionnait.

## Décision

Une seule opération asynchrone `synchronizeDistributedIso(origin)`
est appelée par l'installation initiale et le bouton manuel.

Elle assure :
- l'exclusion des appels concurrents ;
- l'attente de la synchronisation et du rechargement du cache ;
- la conservation du résultat de synchronisation ;
- l'observabilité via `window.__radarIsoStartup` ;
- l'affichage des erreurs sans les masquer au démarrage.

La présence d'une génération active évite sa réinstallation
au démarrage.

## Invariants

- Aucun effacement d'IndexedDB.
- Aucun effacement des radars, révisions ou blips.
- Aucune suppression de génération de catalogue.
- Le bouton de synchronisation reste disponible.
- La distribution continue d'utiliser le manifeste publié.

## Validation

Tests Node, build complet Pages, vérification de la distribution,
puis test navigateur sur un profil privé neuf.
Les tests statiques ne remplacent pas le test fonctionnel réel.

## Ordre de chargement des dépendances

Le contrôle de `radar.html` a identifié que les scripts
`radar-iso-stream-core.js`, `radar-iso-windowed-db.js` et
`radar-iso-stream-distribution.js` étaient chargés en fin
de document, après le script principal qui initialise le panneau.

Ils sont désormais chargés avant `radar-standards-panel.js`
dans l'en-tête.

Le chargement est synchrone et ordonné. L'initialisation
du panneau retrouve donc les API de stockage et d'importation
déjà enregistrées.

Ce correctif élimine une course possible au démarrage,
mais son efficacité complète reste à confirmer dans un
navigateur vierge.
