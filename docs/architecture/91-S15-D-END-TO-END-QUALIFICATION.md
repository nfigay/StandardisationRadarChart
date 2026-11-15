# S15-D — Qualification intégrale

Date : 15 novembre 2026.
Statut : scénario intégral qualifié.
Commit fonctionnel : 03474a66da02f57bcf5184b605b994ca5bc06c99.

## Objectif

Qualifier les distributions réellement construites,
du Creator Web jusqu’au Viewer HTML publié.

## Architecture de qualification

Le dépôt utilisateur est préservé. Une copie Git
isolée est construite depuis le commit fonctionnel.
Les dépendances npm effectivement installées sont
enregistrées dans les rapports.

Les distributions Vite locale et Pages, Client,
multi-produits et Web sont construites et vérifiées.
Le Creator et le Viewer autonomes sont produits
depuis les octets Pages attestés.

## Chaîne de preuves

- R2 : construction, 645 tests, Creator Web, ISO,
  catalogue natif multi-sources, publication de
  révision et export du catalogue.
- R3 : réouverture du catalogue dans le Creator
  autonome, Publisher, HTML candidat et ZIP.
- R4 : Viewer publié, lecture seule, confidentialité,
  autonomie réseau et intégrité finale.

Les reprises vérifient les empreintes des rapports,
des fichiers HTML, du catalogue et de la livraison.
Les contrôles repris sont identifiés par reusedFrom.

## Scénario métier

Un radar publié de cinq blips contient ISO 10303-242:2014,
RFC 9110, JSON-LD 1.1, DAML+OIL Axioms réconciliée
et une référence locale INTERNAL-1.

Le modèle de catalogue natif 1.0.0 est conservé.
La réconciliation conserve l’identité métier.
Les références utilisées sont protégées.

## Frontière Creator / Publisher / Viewer

Le Creator conserve les notices et la provenance.
Le Publisher applique une liste positive de champs.
La déclaration privée initiale et referenceReconciliation
sont absentes de la charge utile publiée.

Le HTML candidat ne crée pas de livraison.
Le ZIP crée exactement une entrée historique.
Le viewer.html du ZIP est identique au candidat.

Le Viewer ouvre la révision attendue sans acquisition
ISO ou externe et sans commandes auteur.

## Leçons de qualification

R1 corrige les empreintes et leurs diagnostics.
R2 corrige une expression asynchrone CDP.
R3 et R4 utilisent des contextes Chrome indépendants
pour éviter les délais de navigation inter-applications.

Aucun de ces correctifs ne modifie le code métier
du commit S15-C.

## Limites et suites

Les acquisitions RFC et W3C sont qualifiées à partir
des corpus officiels vérifiés. Les requêtes directes
depuis GitHub Pages et les contraintes CORS ne sont
pas couvertes par cette qualification.

La couverture Client et PLM historique est principalement
une vérification de construction, non une recette exhaustive.

Les harnais archivés reproduisent cette campagne avec
ses chemins et identifiants historiques. Une généralisation
du harnais est un travail distinct.

DEC-009 et DEC-010 restent ouvertes.
La réconciliation ISO et les migrations de blips
entre éditions restent hors périmètre.

A8.7 devra être reconstruite depuis son commit final
et qualifiée avant publication publique.

Preuves : ../evidence/14-S15-D-FINAL-VALIDATION.md
