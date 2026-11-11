# S14-L3-R1 — Ouverture des fiches de classification et de comité

Constat : l'icône de consultation de la sidebar ne déclenche pas la fiche. Le gestionnaire initial écoute uniquement click sur le montage w2layout. w2sidebar peut traiter la sélection et actualiser les nœuds avant click.

Correction : délégation pointerdown en capture sur document, avec contrôle d'appartenance au panneau; repli click pour activation clavier; affichage différé en microtâche de la fiche existante w2popup+w2form. Aucun changement au cache ISO, à la recherche ni aux modèles.

Validation navigateur requise : ICS, TC, SC; clic sur icône ne doit pas modifier la sélection; sélection du texte continue de filtrer la grille; popup se ferme et se rouvre normalement.
