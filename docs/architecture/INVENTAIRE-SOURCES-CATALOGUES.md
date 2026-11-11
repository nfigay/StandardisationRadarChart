# Inventaire des sources et stockages de catalogues — état établi le 11 novembre 2026

| Jeu | Source connue | Intermédiaire producteur | Publication client | Stockage utilisateur | État confirmé |
| --- | --- | --- | --- | --- | --- |
| Normes ISO | ISO Open Data `iso_deliverables_metadata.jsonl` | `iso-open-data-cache/deliverables.jsonl` | `catalog-distribution/releases/2026-11-09/deliverables.jsonl.gz` | IndexedDB génération active `standardisation-radar-iso-windowed` | 81 768 notices, release 2026-11-09 validée |
| Comités ISO | ISO Open Data `iso_technical_committees.jsonl` | `iso-open-data-cache/committees.jsonl` | `catalog-distribution/releases/2026-11-09/committees.jsonl.gz` | Même génération IndexedDB | 810 comités validés |
| Nomenclature ICS | `https://nfigay.github.io/StandardisationRadarChart/ICS.csv` | CSV local ABSENT de la racine du dépôt lors du diagnostic | Extension ICS du catalogue prévue par S14-S/T ; non publiée lors du dernier diagnostic | IndexedDB ICS séparé lorsqu'installé, sinon ancienne source CSV | Source HTTP CSV vérifiée par le diagnostic de l'utilisateur ; provenance initiale et droits de redistribution À CONFIRMER |
| Journaux de différences | Calcul entre deux publications ISO par `tools/compare-catalogs.mjs` | `catalog-distribution/changes/` | Manifeste + journaux dérivés | Cache client et grille des évolutions | Une seule release confirmée ; journal réel non établi |
| RSS ISO | Flux RSS autorisés et configurés | `iso-rss-cache/` | Ressources servies localement ; politique de distribution à finaliser | IndexedDB RSS distinct | Facultatif, pas une source canonique des normes |
| Standards / blips / révisions du radar | Données métier de l'application, distinctes des normes ISO | Catalogues métier | Exports et révisions radar | Stockage métier de l'application | Aucun de ces objets n'est modifié par la synchronisation ISO |

## Flux cible

Source officielle → collecte/validation par l'opérateur → publication versionnée SHA-256 sur hébergement HTTPS → synchronisation du navigateur → IndexedDB → requêtes fenêtrées → w2ui.

Vite/127.0.0.1 ne constitue aujourd'hui qu'un serveur d'essai. L'hébergement HTTPS distant public n'est pas confirmé déployé.

## Risques / décisions

- Vérifier la provenance et la licence de la nomenclature ICS avant redistribution publique.
- Clarifier la stratégie de retrait de l'ancien CSV distant une fois la publication ICS déployée.
- Définir les versions des manifestes et la politique des caches avant déploiement multi-clients.
- Maintenir les décisions d'architecture ouvertes : DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 ; ne pas les fermer automatiquement.
