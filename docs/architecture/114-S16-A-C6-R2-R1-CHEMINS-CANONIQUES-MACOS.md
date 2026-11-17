# S16-A-C6-R2-R1 — Chemins canoniques et qualification macOS

## Anomalie

C6-R2 réussit la qualification de la candidate réelle (496 éditions formelles et 7/7 contrôles HTTP/API), mais échoue quatre fois dans les fixtures de tests. Les quatre cas échouent avant leurs assertions avec `Non-regular input` dans `tools/enrich-omg-public-histories.mjs` ligne 57.

La comparaison précédente `realpathSync(file) === file` traitait un chemin valide comme une erreur lorsque le répertoire racine temporaire comporte un alias de système de fichiers, notamment `/var` vers `/private/var` sur macOS.

## Décision

Comparer le chemin réel du fichier au chemin du fichier relatif à la **racine candidate canonique** :

`lstatSync(file).isFile() && realpathSync(file) === resolve(realpathSync(candidate), item.path)`

Le contrôle `lstatSync(file).isFile()` reste strict : un lien symbolique à la place du fichier est rejeté. Les contrôles de confinement `inRoot`, les empreintes SHA-256, l'approbation explicite, les doublons et l'intégrité documentaire restent inchangés.

## Qualification et traçabilité

- 6 tests C6-R2 historiques : succès dans le paquet de préparation.
- 2 tests additionnels : racine candidate aliasée acceptée ; fichier d'entrée symbolique rejeté.
- Le processus d'installation qualifie les tests focalisés C4/C6 et la suite Node complète sur le Mac cible ; aucune conclusion de réussite globale n'est faite avant réception du rapport.
- Les fichiers de distribution OMG, le build Pages, les sources C5, les preuves d'édition et les métadonnées Git ne sont pas modifiés.

## Périmètre de publication

Aucun commit, push ni déploiement. Le contrôle d'interface Creator et le parcours ISO/RFC/W3C restent à qualifier séparément.
