# 120 — P2 : pipeline local permanent, preuves et reprise

## Statut

Incrément P2 de rationalisation, candidat à qualifier sur macOS. Les contrats s'appuient sur [117](117-S16-REX-LIVRAISON-ET-CONTRATS-S17.md) et sur la [réconciliation S16](119-S16-ARCHITECTURE-REALISEE-ET-RECONCILIATION.md). Aucune modification des distributions S16 ni de leurs mécanismes de publication.

## Interface et périmètre

L'entrée permanente est `npm run pipeline -- qualify|build-local --audit-dir CHEMIN_ABSOLU [--resume]`. `qualify` exécute `npm test` puis `scripts/verify-source.mjs`. `build-local` ajoute la construction via `scripts/build-safe.mjs local` puis sa vérification via `scripts/verify-build.mjs local`. Les scripts spécialisés restent l'autorité pour les opérations elles-mêmes. Le pipeline ne propose **ni publication, ni commit, ni push, ni nettoyage**.

## Contrat de reprise

Chaque phase réussie est journalisée dans `pipeline-state.json` avec SHA Git complet et mode. L'état est écrit de façon atomique à l'échelle du fichier (écriture temporaire et renommage). En cas d'échec, la phase fautive n'est pas considérée comme accomplie. `--resume` exige la même provenance Git et rejoue seulement les phases non validées. Si un build local est marqué réussi, son fichier `radar.html` doit garder son empreinte, et `verify-build.mjs local` doit réussir avant reprise.

**Limite explicite :** un arrêt entre la création du répertoire de build et l'enregistrement de sa preuve laissera une destination occupée. Le pipeline refuse alors de l'effacer ou de la réutiliser automatiquement. La réparation nécessite une intervention opérateur documentée ; ce cas n'est pas encore une reprise entièrement automatique. L'empreinte porte sur `radar.html` et non sur chaque fichier du build ; la vérification statique existante complète partiellement la preuve, sans garantir la conservation de tous les octets.

## Garde-fous et audit

Le pipeline exige `main`, un SHA Git complet et l'absence de modifications **suivies** avant lancement ou reprise. Il ne collecte pas de secrets volontairement. Les journaux et résultats sont enregistrés sous le répertoire d'audit explicite. L'encapsulation macOS de qualification copie dans le presse-papiers le chemin exact du ZIP retour en cas de succès et le texte du diagnostic en cas d'échec. Les sorties Git non suivies restent hors du commit et ne sont pas effacées.

## Qualification

Tests en fixtures jetables : séquencement, échec de phase, reprise, refus de rerun non autorisé, sortie occupée, divergence Git, empreinte différente, absence de commande distante. La qualification utilisateur requiert la suite Node complète et un `qualify` sur le dépôt réel. La construction `build-local` reste une étape distincte, potentiellement coûteuse et bloquée par une sortie préexistante. Aucun test navigateur, Pages HTTP ou publication n'est implicite.

## Suite P2

Étudier ensuite le build Pages et la distribution finale, les points de contrôle d'origine, les SHA des produits et la reprise après interruption post-build, sans modifier la CI ou un publisher existant avant d'en démontrer la parité. Une décision de suppression/déplacement des scripts doit reposer sur preuves et non sur leurs noms.

## Installation sans commit

L'installateur P2 exécute directement `npm test` et la vérification source car les modifications P2 non committées rendent volontairement inapplicable le contrôle de propreté du pipeline permanent. La qualification complète de la commande `npm run pipeline` doit être réalisée **après versionnement explicitement autorisé** ou dans une copie Git propre. Ce comportement n'autorise aucun commit automatique.
