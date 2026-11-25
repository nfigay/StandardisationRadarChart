# 159 — S19 R23: sélection, sous-onglets et dossier

## Contexte
R22 synchronise Cytoscape et le panneau du dossier, mais la reconstruction de `blipForm` revient sur l'onglet interne « Blip » même si l'utilisateur consultait « Context » ou « Extra ». La sélection d'un autre blip pouvait aussi conserver le mode édition documentaire.

## Invariants
- Une seule sélection Cytoscape fait autorité ; les événements `select` + `tap` restent dédoublonnés par l'identifiant du nœud.
- Le top-level W2UI `Propriétés` / `Dossier stratégique` reste actif lors du changement.
- Le sous-onglet du formulaire `Blip` / `Context` / `Extra` est rétabli si le nouvel objet possède cet onglet ; sinon W2UI conserve son défaut.
- Si une édition de dossier est active lors du choix d'un autre blip, on sauvegarde **avant** le changement. En cas d'échec, le contexte et la sélection graphique précédents sont restaurés ; sinon le nouvel objet s'ouvre **en Visualisation**.
- Si aucun dossier n'existe, le panneau standard de visualisation signale son absence et conserve l'action « Créer un dossier » dans un brouillon autorisé.
- Pas de changement du schéma documentaire, de la position des nœuds, ni de création de dossier implicite.

## Tests
11 tests R22/R23 couvrent les chemins de sélection, l'échec d'enregistrement, l'état de visualisation, les sous-onglets Context/Extra, le dossier absent et le dédoublonnage.

## Réserve
La recette dans Chrome reste obligatoire pour valider l'API des sous-onglets W2UI et la synchronisation complète avec le formulaire métier.
