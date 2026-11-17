# 109 — S16-A-C5-R1 — Classification et reprise des historiques OMG

## Constat

Le collecteur C5 exigeait une table formelle unique. Les pages officielles OMG peuvent distinguer **Formal Versions** et **In Process Versions** (par exemple BACM et BKPMN). Une version bêta ne constitue pas une édition formelle ; une édition formelle ancienne reste une référence documentaire distincte.

## Contrat de collecte

- Les pages interrogées doivent appartenir à `https://www.omg.org/spec/<famille>/` et provenir d'une famille présente dans un catalogue préalablement vérifié.
- Les tableaux sont reconnus par la signature `Version | Adoption Date | URL` et catégorisés par leur titre de section. Une table formelle isolée sans titre explicite reste compatible avec C5 ; les tableaux ambigus sont non résolus.
- Les **éditions formelles** continuent d'être validées par le contrat `omg-formal-history` déjà utilisé par le Creator et le constructeur de liens publics.
- Les **versions en préparation** portent `sourceId=omg-in-process-history`, `documentStatus=in-process` et une identité versionnée OMG avec suffixe `BetaN`. Elles sont écrites dans un fichier privé séparé. Elles ne sont pas publiées par le générateur C4 et ne sont jamais maquillées en éditions formelles.
- La classification `verified` signifie « au moins une édition formelle, et toutes les lignes reconnues validées » ; `in-process-only` signifie « aucune édition formelle, mais des versions en préparation vérifiées » ; `unresolved` signifie « données incomplètes, invalides ou inaccessibles ». Les rejets conservent leur catégorie, leur ligne, leur identité et une raison.
- Un historique partiellement vérifié ne devient pas un historique complet. La configuration opérationnelle et l'applicabilité métier restent hors du périmètre de la collecte.

## Orchestration

`runCoverage()` répartit les familles en lots d'au plus 20, écrit un `checkpoint.json` fixant le contenu du catalogue et la taille des lots, puis écrit un dossier par lot. Une reprise réutilise un `report.json` cohérent sans nouvelle requête. Un dossier `.pending` ou un checkpoint divergent déclenche une erreur explicite ; aucune suppression implicite ni reprise sur des données non vérifiées.

La collecte reste exclusivement dans un répertoire d'audit hors dépôt. Elle n'effectue aucun commit, push ou publication. Les tableaux et les rapports sont des constatations documentaires datées, jamais des recommandations du radar.

## Procédure de qualification

1. Installer C5-R1 et exécuter la régression Node.
2. Recollecter ALMAS, BACM et BKPMN dans un nouveau dossier d'audit pour qualifier les catégories en situation réelle.
3. Lancer un seul lot orchestré sur le corpus actuel ; vérifier sa reprise sans nouveau téléchargement des familles déjà traitées.
4. Préparer, sous approbation documentaire, la projection publique des **éditions formelles vérifiées**. Les versions bêta restent privées jusqu'à validation explicite d'un contrat public distinct.
5. Effectuer une recette Pages dans une session vierge ; aucun remplacement automatique d'une édition ancienne.
