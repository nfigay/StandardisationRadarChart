# S14-S — Publication ISO statique et ICS versionnée

## Invariants

- L'application ne contacte pas les serveurs ISO officiels ; la collecte reste un processus opérateur indépendant.
- Deux datasets principaux (deliverables et committees) restent au schéma v1. L'application stocke ces datasets en IndexedDB via S14-M et les interroge avec S14-OP par fenêtres.
- ICS est une **extension optionnelle** versionnée, publiée dans `extensions/ics/<release>`, sans modifier le manifeste ISO v1 déjà actif. Un pointeur associé à la même release ISO évite les mélanges accidentels.
- Le cache ICS est dans `standardisation-radar-ics-extension-v1`. La génération courante est activée **après** analyse et contrôle SHA-256/nombre de lignes. Une interruption laisse l'ancienne nomenclature active. La nomenclature contient ~1 400 lignes, dont la matérialisation de métadonnées pour le sidebar est acceptable ; aucune notice ISO n'est chargée globalement.
- **Atomicité entre jeux :** ISO (deliverables+committees) et ICS s'activent de manière indépendante. Si ICS échoue, les métadonnées ISO déjà synchronisées restent actives ; le résultat mentionne l'échec partiel et l'ancienne ICS est conservée. Ne pas prétendre à une transaction multi-bases.
- Le stockage des radars et blips est complètement séparé.

## Producteur et distributeur

1. Collecter les JSONL ISO officiels, puis publier le catalogue v1 (pré-existant).
2. Valider la provenance, la licence et le droit de redistribuer le fichier `ICS.csv`. **Sans cette revue, ne pas publier l'extension ICS.**
3. Exécuter `tools/prepare-iso-site.mjs --repo <repo> --out <newdir> --ics <ICS.csv> --acknowledge-ics-redistribution-rights`.
4. Le programme recalcule les empreintes SHA-256 compressées et décompressées de deliverables/committees, produit un site statique autonome, puis publie l'extension ICS avec manifeste et pointeur. Il refuse d'écraser une publication existante.
5. Déployer le répertoire sur un hébergement HTTPS ; configurer CORS pour GET, et le type des `.gz` (de préférence `application/gzip` sans `Content-Encoding`). Un serveur qui décompresse automatiquement demeure compatible grâce aux empreintes brutes du moteur S14-M.

## Client applicatif

- `radar-catalog-config.json` placé à la racine de l'application indique une URL relative de test par défaut. Pour déploiement réel, y mettre l'URL HTTPS du service de distribution **distinct** du site de l'application.
- L'action « Synchroniser le catalogue distribué » consulte `manifest.json`, évite le téléchargement ISO si la release est déjà active, récupère l'extension ICS si elle existe, puis recharge les vues.
- En cas de 404 ou de page de repli HTML pour un pointeur ICS inexistant, le client indique `not-published`, il ne lance pas d'exception JSON brute.
- La navigation ICS privilégie la nomenclature vérifiée d'IndexedDB ; à défaut, l'ancien fichier CSV reste utilisable.
- Le client ne dispose pas encore d'une liste dynamique des versions ni d'un déploiement HTTPS public ; aucun hébergeur n'est créé par ce lot.

## Limites et validation

- L'examen des licences et les conditions de redistribution ICS restent à la charge de l'opérateur.
- Les tests Node valident l'assemblage d'une publication miniature, les empreintes, les chemins et les règles d'installation ; l'import navigateur IndexedDB de l'extension devra être vérifié dans Chrome.
- L'import JSONL se fait par lots ; le parser maintient une ligne incomplète, pas un tableau de 81 768 notices.
- La recherche textuelle par parcours des curseurs peut encore être lente pour les requêtes peu sélectives ; elle est bornée en mémoire.
- Le chemin legacy `readAll()` subsiste lorsque la génération S14-M n'est pas active ; ce comportement est explicitement distinct du mode fenêtré.
- Mesures mémoire : le diagnostic S14-Q et le stress S14-R sont en lecture seule. Les instantanés `performance.memory` ne démontrent ni les pics ni les fuites ; mesurer au besoin avec Chrome Performance/Memory.
- Suivi métier différé : références ↔ standards ↔ blips en draft uniquement. DEC-009/010/016/017/018 restent ouverts.
