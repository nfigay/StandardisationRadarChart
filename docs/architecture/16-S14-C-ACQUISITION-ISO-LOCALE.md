# S14-C — Acquisition locale ISO Open Data et alimentation de la grille

## Constat

S14-A/B mettaient en place les vues et IndexedDB mais n'acquéraient aucun fichier officiel. La grille TC/SC et les feuilles de normes restaient vides sans import manuel. Ce lot intègre le téléchargement à partir des URL **ISO Open Data** officielles, côté Node.js sur le Mac, et le chargement automatique depuis le serveur Vite de l'application vers IndexedDB.

## Flux

1. `node tools/sync-iso-open-data.mjs <racine-du-dépôt>` télécharge `iso_technical_committees.jsonl` et `iso_deliverables_metadata.jsonl` depuis `isopublicstorageprod.blob.core.windows.net` dans `<repo>/iso-open-data-cache/`.
2. L'outil écrit un `manifest.json` avec les tailles, SHA-256, date de synchronisation et URL officielles. Aucun accès à un proxy tiers, aucun secret.
3. Après actualisation de `radar.html`, le navigateur lit le manifeste sur **sa propre origine**. Pour chaque jeu absent ou modifié (SHA-256 dans `syncInfo.filename`), il déclenche l'import IndexedDB existant.
4. La grille w2ui présente les normes sous ICS et TC/SC selon les métadonnées normalisées. Le registre des références utilisateur et les blips sont inchangés.

## Limites et risques connus

- Le téléchargement nécessite un accès réseau depuis Node.js sur le Mac ; les permissions et la disponibilité du stockage ISO doivent être vérifiées en condition réelle.
- `iso-open-data-cache/` contient des données publiques volumineuses ; conserver ce dossier hors du versionnement Git, via `.gitignore` utilisateur si souhaité. Pas de modification automatique de `.gitignore`.
- L'import actuel remplace le cache de chaque jeu ; un import interrompu peut vider ce jeu. Une transaction atomique par jeu est une amélioration ultérieure.
- La grille S14-A limite la projection à 1 800 normes et peut donc masquer certaines associations : optimisation requise.
- Le bouton « Charger catalogue ISO » ne télécharge pas les sources externes depuis le navigateur : il importe les fichiers déjà synchronisés sur le Mac.
- Les métadonnées ISO Open Data sont sous ODC-By 1.0 : conserver la mention d'attribution.
- Ni RSS ni le rapprochement avec le registre métier/blips ne sont livrés ici.

## Décisions

Les DEC-009/010/016/017/018 restent ouvertes. Ce lot n'introduit ni nouveau standardId ni changement du cycle de vie des révisions.
