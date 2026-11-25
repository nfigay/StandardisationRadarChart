# 170 — S19 R30-R1 : consolidation R28 → R30

## Constat
L'installateur R30 exigeait SHA256 R29 alors que le dépôt réel est resté en R28 (17fdf452…). L'installation a correctement été refusée, mais la répétition de versions correctives rendait la recette inutilement difficile.

## Décision
Distribuer un seul panneau final commun à R29 et R30, avec les deux évolutions : verrou de sélection Cytoscape pendant l'édition et suppression de l'iframe `srcdoc` pendant la prévisualisation Workspace. Réutiliser les implémentations inchangées des archives respectives.

## Conditions
Contrôle strict sur les empreintes R28, R29 et R30 ; aucune substitution silencieuse. Tests dynamiques du verrou et liste blanche DOM ; vérification syntaxique ; backup avant remplacement ; restauration en cas d'erreur. Le moteur d'export et les coordonnées du radar ne sont pas modifiés.

## Limites
Les tests Node simulent certaines API DOM/Cytoscape. La recette navigateur réelle reste nécessaire, particulièrement pour vérifier les styles et les références documentaires.
