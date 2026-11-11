# S14-L5-A — Audit de distribution, avant évolution du protocole

## Objet

Distinguer trois couches : collecte ISO officielle, publication par l'opérateur, consommation des releases via HTTP(S) par les applications open source. Une instance Vite sur `127.0.0.1` sert uniquement les données locales de l'opérateur et ne constitue pas l'API ISO distante.

## Contrôle d'intégrité

Le producteur publie un manifeste versionné et les empreintes SHA-256 des fichiers `.jsonl.gz` **compressés**. L'application S14-I/K vérifie ces empreintes **avant** import dans IndexedDB. La réponse HTTP peut faire l'objet d'une décompression automatique si un serveur déclare `Content-Encoding: gzip`. Dans ce cas, `fetch().arrayBuffer()` retourne potentiellement les octets décompressés, différents du fichier `.gz` publié. Il faut mesurer les en-têtes et les octets, pas désactiver le contrôle cryptographique.

L'outil `tools/audit-catalog-distribution.mjs` lit en mode lecture seule le pointeur et les releases sur disque puis, si demandé, les fichiers via l'adresse HTTP du serveur. Il retourne les SHA-256, tailles, en-têtes et divergences. Il ne modifie pas IndexedDB, les blips, les révisions ni les releases.

### Recommandation HTTP

Pour distribuer les `.jsonl.gz` tels quels, les servir comme fichiers binaires `application/octet-stream` ou `application/gzip`, **sans** en-tête `Content-Encoding: gzip`. L'application possède déjà sa décompression explicite et vérifie les fichiers compressés. Configurer le serveur de distribution, plutôt que contourner les empreintes. Contrôler que le CDN ne transforme pas les octets.

## Contrats de résultat à implémenter dans une tranche ultérieure

Chaque opération doit publier un résultat typé : `operation`, `status` (`success`, `error`, `cancelled`, `unchanged`), `source`, `release`, `datasets`, `cacheChanged`, `error`, `startedAt`, `finishedAt`. Une commande déclenchée sans réponse ne doit pas être affichée comme réussie. Les imports de fichiers exigent la mention du jeu remplacé et une confirmation explicite.

## ICS et compatibilité

Le manifeste version 1 couvre `deliverables` et `committees`. Pour publier la nomenclature `ics`, conserver le chargement des anciennes releases à deux jeux, puis définir un jeu supplémentaire facultatif dans une nouvelle version de protocole ou une extension explicitement versionnée. Éviter de produire une publication incompatible tant que le client et la transaction de remplacement des trois jeux ne sont pas prêts.

## Décisions maintenues ouvertes

DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018. Pas de changement d'identité normative, ni d'association aux blips dans cet outil.
