# 113 — S16-A-C6-R2 : enrichissement documentaire OMG prouvé par édition

## Incident et constat

C6-R1 a validé 6/7 contrôles de la distribution HTTP. L'échec `Missing BPMN/2.0` est imputable à l'absence de l'édition officielle dans `histories/BPMN.json`, non à la perte d'une édition dans le chargeur. Le tableau « Formal Versions » de la page `/spec/BPMN/` ne représente que certaines éditions. La **complétude du tableau observé** n'est pas la **complétude historique de la famille**.

Les pages officielles indiquent :

- BPMN **2.0**, décembre 2010 : `https://www.omg.org/spec/BPMN/2.0/About-BPMN` ; lien de référence `https://www.omg.org/spec/BPMN/2.0`.
- BPMN **2.0.1**, septembre 2013 : `https://www.omg.org/spec/BPMN/2.0.1`.
- BPMN **2.0.2**, janvier 2014 : `https://www.omg.org/spec/BPMN/` (déjà présent en C6).

L'ancien tableau C5 contenait BPMN 1.0, 1.1, 1.2, 2.0.2 : **4 éditions**. Le correctif ajoute **2 références exactes**, sans supprimer 2.0.2. Le nouveau total formel consolidé devient **496**, dont 6 pour BPMN ; 262 historiques, 270 familles, 7 familles « in-process-only » et UTP2 non résolue restent invariants.

## Décision d'architecture

L'outil `tools/enrich-omg-public-histories.mjs` applique une liste finie de **preuves bibliographiques positives** explicites. Il refuse les liens hors origine OMG, les versions non formelles, les familles non vérifiées, les doublons et les incohérences de comptage ; il n'écrase aucune candidate existante. Un fichier d'évidence séparé (`tools/S16-C6-R2-BPMN-evidence.json`) consigne la source officielle de chaque édition ajoutée et les dates déclarées. L'index courant `index.json` est inchangé. Le manifeste `coverage.json` décrit explicitement ces enrichissements. Les fichiers privés C5 ne sont jamais publiés.

Cela ne prouve **pas** l'exhaustivité historique de toutes les familles OMG : les éditions anciennes doivent être vérifiées à l'échelle des pages de versions, avec une preuve par édition et sans inférence de continuité numérique. Une version 2.0 n'est jamais assimilée à 2.0.1 ou 2.0.2. Ne pas confondre édition formelle, alpha/bêta et filiation UTP/UTP2.

## Installation, qualification, publication

L'installateur vérifie le HEAD de référence, les empreintes d'entrée, dépose le nouvel outil et l'évidence, remplace le **qualificateur** C6-R1 après sauvegarde, et exécute les tests. Il ne touche pas aux historiques ni au build.

La qualification est une opération séparée : `node tools/run-s16-c6-r2-qualification.mjs`. Elle établit une nouvelle candidate à partir de l'audit C6, archive la distribution courante et le build précédent, copie la candidate dans le dépôt, reconstruit avec Node/Vite via `npm run build:pages`, exécute le test HTTP/API C6-R1 actualisé et tente une restauration en cas d'échec. Le rapport est automatiquement copié via `pbcopy` et archivé sous `StandardizationRadarChart-Audits`.

**Limites :** le test HTTP/API ne démontre pas le rendu graphique W2UI ou le clic d'un blip ; ISO/RFC/W3C ne sont pas interrogés pendant ce contrôle. Le build reste `clean:false` tant que les changements sont non commités. Aucune opération Git ni publication ne doit être déclenchée automatiquement. Une revue des conditions de réutilisation des identifiants/liens doit précéder toute distribution publique.
