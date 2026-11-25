# S19 R24 — Synchronisation du viewport et de la sélection

## Constat

Dans les diagnostics Chrome, `#cy-container` et `#svg-container` avaient la même surface (799 × 236 px), mais le radar illustré dans la capture dépassait cette hauteur. La sélection fonctionne dans Propriétés → Blip et peut échouer après passage à Dossier stratégique. Cela pointe vers une **désynchronisation possible des dimensions** et non une erreur démontrée de l'écoute `tap`/`select`.

## Correction

Un seul `ResizeObserver` surveille les conteneurs du Workspace et du radar, et un `requestAnimationFrame` unique appelle l'API existante `__radarViewportSync` après une modification de layout. Le panneau documentaire demande également cette synchronisation après `refresh` (changement de vue). Aucun changement de sélection, géométrie, coordonnée ou donnée n'est effectué.

## Limites et validation

Les tests Node.js contrôlent le câblage et la coalescence des redimensionnements. La validation navigateur doit encore confirmer les événements `tap`/`select` sur des blips situés en haut **et en bas** du radar, avec les onglets Blip, Context, Extra et Dossier stratégique, en mode Visualisation. Si le problème persiste sans événement `tap`, inspecter `elementsFromPoint` au point cliqué et comparer la taille effective de l'instance Cytoscape ; ne pas ajouter d'écouteurs redondants.
