# 86 — S14.3 A8.6 : livraison Viewer autonome

## Contrat

A8.5-R1 est qualifiée pour le parcours Publisher (preuve 06). A8.6 ajoute la génération contrôlée d'une livraison, en réutilisant `PublicationRelease` v1 et la projection native. Le Creator autonome propose un ZIP unique contenant `viewer.html`, directement ouvrable sans import JSON, et `manifest.json`. Le candidat HTML A8.5 et la prévisualisation restent disponibles, sans création de livraison. Les autres modes sont différés.

## Provenance et assemblage

Le générateur Node construit le Viewer d'abord. Il embarque dans le Creator seul le modèle HTML et une preuve de construction (commit Git complet, SHA-256 des octets UTF-8, taille et inventaire des entrées de scripts). Le Creator exige sa propre provenance complète et identique ; un suffixe working-tree est refusé pour une livraison. Le commit identifie la source locale de construction, non une attestation externe. L'inventaire décrit les entrées de scripts, pas encore la fermeture fine des dépendances bundlées et dynamiques (A9).

Le service `generateStandalonePublication(graph,id,expectedVersion)` contrôle la capacité, le catalogue unique, la définition active et sa version, le mode autonome et les données embarquées. Il prépare le plan et la projection, compare leurs digests et leurs révisions, contrôle l'identité du workspace et sa représentation canonique avant/après les opérations asynchrones. `radar-publication-delivery.js` vérifie le hash et la taille du modèle, le digest de la projection, l'insertion unique du payload et son aller-retour ; il utilise JSZip déjà présent dans le dépôt. Le ZIP est relu avec CRC et SHA-256 des deux entrées, et son propre SHA-256 est calculé. Le Blob destiné au téléchargement est relu : son SHA-256 et sa taille doivent également correspondre à ceux du ZIP. Le registre natif est modifié seulement après validation et nouvelle vérification du plan.

## Manifeste public et historique privé

Le manifeste public contient une identité de livraison, date, format/version, mode, commit, empreinte du modèle, digest de projection, révisions et inventaire des entrées de scripts, ainsi que taille et SHA-256 de `viewer.html`. Il ne contient ni identifiant/digest du catalogue source, ni définition, ni destinataires, ni historique. Le manifeste ne se hache pas lui-même. Le registre privé enregistre les trois artefacts (HTML, manifeste, ZIP) avec empreintes et tailles, l'instantané complet de définition et les versions résolues. Le statut historique `reported-passed` est conservé pour compatibilité ; les checks explicitent les vérifications réellement effectuées par ce générateur. L'ancienne API d'enregistrement de preuves déclarées n'est pas une attestation de contrôle des octets ; elle refuse les noms des contrôles réservés à ce générateur. Un catalogue importé ou édité manuellement reste une source de preuves déclarées, pas une attestation signée.

La livraison est enregistrée dès que les octets sont générés et contrôlés ; le téléchargement est demandé ensuite. Un refus ou échec du téléchargement ne supprime pas une livraison valide ; la dernière livraison reste retéléchargeable dans le dialogue, sans nouvelle entrée. L'utilisateur doit exporter le catalogue de travail pour rendre l'historique durable. Aucune garantie de réception, d'écriture disque ou de signature/authenticité. Un SHA-256 n'est pas une signature.

## Limites et portes de qualification

A8.6 est candidat jusqu'à recette utilisateur du ZIP, comparaison du hash local, réouverture du catalogue exporté et ouverture/naviguation hors connexion physique. Le manifeste et la preuve de construction ne sont pas des signatures ; un attaquant modifiant le Creator peut modifier ses preuves. Le modèle reste celui du Viewer commun ; les nouveaux composants ZIP et assembleur sont omis du Viewer autonome, mais l'exclusion physique du code historique et des ressources inutiles est A9.1. A9.2 Web bundlé/modulaire ; A9.3 Creator. Les contextes libres/relations génériques et secrets présents dans un champ autorisé restent les limites d'A8.4. La recette ISO utilise une fiche synthétique.

## Preuve de construction locale

La construction Pages écrit hors du site `.radarchart-build/pages-provenance.json` : commit, état propre et empreinte des chemins/tailles/SHA-256 de tous les fichiers émis. La construction autonome avec commit complet refuse une source Git modifiée, des entrées logicielles non suivies ou un build Pages périmé/altéré. Les données ISO locales restent des ressources de construction, distinctes de la provenance du code. Cette preuve locale ne remplace pas une signature ni une construction reproductible indépendante.

## A8.6-R1 — Consultation centrée sur le radar

La recette utilisateur a identifié un menu d'import et un arbre de catalogue encore présents dans le Viewer publié. Le correctif R1 distingue contexte publié et Viewer générique ; fiche radar dans le panneau gauche, sélection de radars uniquement lorsque nécessaire, une révision publiée retenue par radar. Aucun import/remplacement du périmètre embarqué. Les contrats de livraison, provenance et registre ci-dessus sont conservés. Voir [86-R1](86-R1-S14-3-RADAR-CENTRIC-PUBLISHED-VIEWER.md) et [preuve 07](../evidence/07-A86-R1-RADAR-VIEWER-CANDIDATE.md). La qualification navigateur et ZIP réel reste ouverte.
