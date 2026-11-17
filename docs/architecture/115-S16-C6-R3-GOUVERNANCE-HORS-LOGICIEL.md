# 115 — S16-C6-R3 : séparation de la gouvernance juridique et du logiciel

## Décision

Les droits de réutilisation, licences et autorisations relèvent exclusivement des responsables humains et procédures externes. Le Creator et les collecteurs ne doivent afficher aucune conclusion juridique ni exiger de drapeau d’approbation juridique.

## Périmètre technique

Suppression des alertes « redistribution non autorisée » et des affichages `rights` dans le panneau; suppression des propriétés juridiques dans les descripteurs de sources; suppression des barrières `--approve-public-links`, `approved` et `publicationReview` des outils de génération; adaptation des tests qui exigeaient ces barrières.

## Invariants maintenus

Validation des URL officielles, familles et versions, SHA-256, absence de copie des snapshots privés, statut formel/en préparation/non résolu, refus des entrées incomplètes et doublons, chemin sûr, répertoire de sortie non préexistant, sauvegardes et absence de déploiement automatique. Les valeurs `distribution` conservent leur sens purement technique de format/projection et ne constituent pas des permissions.

## Qualification

Installer les modifications atomisées et sauvegardées;  effectuer la régression Node sur la branche S16. Reconstituer puis qualifier le build Pages séparément, avant toute publication explicitement demandée. Les documents historiques 107–114 relatifs aux autorisations intégrées sont supplantés par la décision 115 et ne décrivent plus le contrat actif.
