# S14.3-A3 — Premier Client autonome

## Objectif

Obtenir une première application de lecture seule
n'utilisant que les données de sa roadmap publiée.

## Fichiers

- client.html : interface de lecture seule ;
- js/roadmap-client.mjs : projection graphique et sélection ;
- scripts/export-roadmap-client.mjs : export explicite ;
- tests/roadmap-client.test.mjs : non-régression.

## Flux

Catalogue métier du Créateur
  → choix explicite d'une revision published
  → projection A2 expérimentale version 2
  → paquet JSON autonome
  → sélection locale dans le Client
  → rendu des blips et des informations associées.

## Isolation

Le Client ne charge aucun service ISO, catalogue global,
gestionnaire de sources ou fonction d'édition.

L'ouverture d'un fichier est explicite et locale.
Aucun téléchargement automatique n'est effectué.

Les références ISO non utilisées sont exclues.

## Sécurité

Aucun contenu du paquet n'est injecté via innerHTML.
Le Client n'exécute aucun script issu du paquet.

L'exporteur refuse les révisions draft et archived,
et n'écrase pas un fichier existant.

Le conteneur `artifact.data` est accepté en entrée CLI,
mais la signature/proof d'un artefact n'est pas vérifiée
dans ce lot : provenance à assurer en amont.

## Limites assumées

Ce premier Client visualise les positions publiées sur
un repère SVG provisoire.

Ce n'est pas encore le rendu radar historique exact :
les anneaux, quadrants et configurations visuelles
doivent être comparés aux composants du Créateur.

Les champs context et extensions sont toujours exclus
du paquet A2. Leur valeur métier et leur confidentialité
doivent être auditées avant consolidation du format.

Ce lot ne modifie pas la fenêtre Créateur.
Il ne produit pas encore les distributions standalone,
server et modules.

## Suites

- tests de fidélité visuelle sur des révisions réelles ;
- sélection justifiée des context/extensions ;
- consolidation en un format de publication stabilisé ;
- intégration de l'export dans le Créateur ;
- construction des distributions multi-cibles.
