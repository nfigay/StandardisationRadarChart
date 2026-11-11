# S14-L5-B — Représentations HTTP et intégrité du catalogue

## Diagnostic confirmé le 11 novembre 2026

Le serveur Vite envoie `Content-Encoding: gzip` pour les fichiers `.jsonl.gz`. Le client `fetch()` reçoit parfois le contenu JSONLines déjà décompressé. L'audit S14-L5-A compare les tailles/empreintes et confirme les correspondances exactes avec les valeurs `uncompressedBytes` et `uncompressedSha256` du manifeste 2026-11-09. Les fichiers sur disque sont intègres.

## Contrat de lecture

Le client accepte soit :
- la représentation gzip dont `bytes` et `sha256` concordent avec le manifeste, puis décompression et revalidation ;
- la représentation brute dont `uncompressedBytes` et `uncompressedSha256` concordent avec le manifeste, sans nouvelle décompression.

Dans les deux cas, la représentation brute est contrôlée avant toute activation IndexedDB. Toute absence de métadonnées brutes valides, ou discordance de taille/empreinte, entraîne un rejet. Le code S14-K conserve son import atomique des jeux ISO. Aucune configuration Vite ni donnée ISO existante n'est modifiée.

Cette correction n'établit pas un résultat de synchronisation structuré : la consolidation S14-L5 des opérations, des résultats et de la distribution ICS reste ouverte.
