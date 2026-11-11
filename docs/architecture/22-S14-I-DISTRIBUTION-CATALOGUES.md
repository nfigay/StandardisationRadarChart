# S14-I — Distribution de catalogues SDO : première implémentation ISO

## Objectif et séparation des responsabilités

- **Application open source** (diverses cibles Vite) : consultation des catalogues et des radars, stockage local IndexedDB, fonctionnement autonome. Aucun jeton/service obligatoire.
- **Collecteur exploité par l'opérateur** : `tools/sync-iso-open-data.mjs` préexistant, qui télécharge les jeux ISO et le manifeste local de collecte.
- **Publication opérateur** : `tools/publish-catalog.mjs`, qui vérifie les empreintes sources, produit des jeux gzip immuables dans `releases/<version>/`, publie le manifeste de release, puis remplace atomiquement le pointeur racine `manifest.json`.
- **Consommateur** : `js/radar-catalog-distribution.js` qui récupère le manifeste et les deux jeux, vérifie SHA-256 AVANT import, décompresse gzip côté navigateur, puis utilise `__radarIsoOpenData.importJsonLines` existant.

## Contrat HTTP statique v1

`GET <base>/manifest.json` : `{schemaVersion:1,catalogId:'iso',release:'YYYY-MM-DD',manifest:'releases/YYYY-MM-DD/manifest.json'}`.

`GET <base>/releases/<release>/manifest.json` : `{schemaVersion:1,catalogId:'iso',release,source,sourceLicense,generatedAt,datasets:[{id,source,path,compression:'gzip',mediaType:'application/x-ndjson',bytes,sha256,uncompressedBytes,uncompressedSha256,records}]}`.

Les ressources `deliverables.jsonl.gz` et `committees.jsonl.gz` résident à côté du manifeste de release. Aucune URL arbitraire n'est fournie par les jeux : chemins relatifs vérifiés. Les fichiers sont immuables ; le pointeur racine est mutable. Le déploiement peut être statique (CDN, GitHub Pages, serveur Vite statique) avec CORS configuré si les origines diffèrent.

## SDO multiples

Le transport est générique dans son principe (manifeste, version, intégrité), mais le **client v1 est explicitement ISO**. Ne pas projeter automatiquement ICS ou TC/SC sur les futurs SDO. Une évolution du protocole et des adaptateurs propres aux SDO devra être soumise aux décisions d'architecture encore ouvertes.

## Sécurité, données et limites

- Les fichiers collectés ne comprennent que les sources publiques configurées par l'opérateur. L'attribution et les conditions de redistribution de chaque jeu doivent être vérifiées et publiées.
- Pas de données de radar, de blip ni d'organisation dans les catalogues distribués ; pas de modification automatique des révisions publiées.
- Le navigateur vérifie les octets reçus et leur contenu décompressé avant import. Le code de consultation est en lecture seule.
- **Limite importante :** l'importeur IndexedDB existant remplace chaque jeu séparément. Bien que les deux téléchargements soient validés avant le premier import, une défaillance d'écriture pendant l'import peut laisser des jeux de générations différentes. Une mise à niveau IndexedDB transactionnelle globale est à prévoir.
- La distribution v1 est une release complète (pas de deltas, pas d'historique de changement calculé). Le RSS reste optionnel et distinct des métadonnées de normes. Aucune synchronisation automatique en arrière-plan.
- Sans service disponible, l'import manuel JSONL et le cache IndexedDB existant restent utilisables.
- Le bouton de synchronisation demande une URL explicite et ne sélectionne aucun fournisseur imposé.

## Séquence opérateur

1. L'opérateur exécute son collecteur ISO existant.
2. L'opérateur publie une release avec `node tools/publish-catalog.mjs --repo <repo> --out <dossier-publication> --release 2026-11-09`.
3. Il héberge les fichiers publiés sur une origine HTTPS avec CORS adéquat si nécessaire.
4. L'utilisateur active « Synchroniser le catalogue distribué » et renseigne l'URL de base.

## En attente

- Finaliser S12-R1 (identités, provenance, blip).
- Atomicité des générations dans IndexedDB et journal des changements.
- Politiques de versions/deltas, sous-ensembles et stratégies de stockage pour catalogues volumineux.
- Gouvernance des métadonnées SDO et contrats multi-SDO (DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 ouverts).
