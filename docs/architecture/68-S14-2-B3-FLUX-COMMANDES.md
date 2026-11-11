# S14.2-B3 — Flux déclenchés par les commandes

## Objectif

La fenêtre Catalogue doit permettre à l'utilisateur de
comprendre, avant de cliquer sur une commande :

1. L'origine et l'emplacement des données.
2. Le transfert ou le traitement effectué.
3. L'emplacement du résultat.
4. Les changements possibles et les préconditions.

Il ne s'agit pas d'une carte générale de l'architecture.

## Modèle d'interface

COMMAND_FLOWS est un modèle déclaratif bilingue
associant chaque commande existante à un flux pédagogique.

Le schéma SVG présente :
origine → traitement → destination.

Deux encarts précisent les emplacements de départ et
d'arrivée. Deux lignes décrivent le transfert et l'impact.

Les indications décrivent les effets attendus de la
commande, pas la réussite d'une exécution particulière.

## Opérations

- distributedSync : distribution HTTP publiée vers la
  génération ISO du navigateur, si nécessaire.
- sync : chargement des fichiers servis par le déploiement,
  si la source locale est configurée.
- import : fichier JSONL choisi sur le disque utilisateur
  vers le mécanisme d'import de données ISO.
- changesLoad : ressource facultative vers la consultation
  du journal d'évolutions.
- rssSync : source RSS locale facultative vers le cache et
  la consultation des actualités.
- refresh : données disponibles vers les vues de l'application,
  sans téléchargement d'une distribution.

## Distinctions critiques

Un fichier local servi par HTTP n'est pas un fichier choisi
dans le disque de l'utilisateur.

Le catalogue distribué hébergé sur GitHub Pages est
distinct de sa copie installée dans IndexedDB.

La reconstruction de vues est distincte de l'installation
d'une nouvelle version du catalogue.

Les données métier des radars ne doivent jamais être
présentées comme un simple cache ISO.

## Compatibilité

Le rendu du flux est purement informatif.
Aucun changement aux gestionnaires de commandes, au suivi
de synchronisation, au moteur ISO, aux générations,
aux données des radars ou à leur persistance.

Le guide terminologique B2 reste disponible.

## Validation

Contrats bilingues, distinction des emplacements et
des transports, absence d'effet métier dans le rendu,
suite complète, build Pages et recette navigateur.

La cartographie devra être révisée si les mécanismes
d'import ou de stockage sont modifiés ultérieurement.
