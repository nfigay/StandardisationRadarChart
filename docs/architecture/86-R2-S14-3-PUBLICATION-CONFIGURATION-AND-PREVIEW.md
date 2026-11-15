# A8.6-R2 — Configurations livrées et prévisualisation autonome

Baseline `824eb7e771efcca8d6b1d22637f4e6d09a054dac`. Le Publisher reste intégré au Creator ; aucun nouveau registre ni Workspace. La recette R1 utilisateur (600 tests) confirme le retéléchargement sans mutation : quatre livraisons avant et après, téléchargement demandé, ZIP reçu. Les générations distinctes expliquent les quatre entrées. L'accès ISO dans la prévisualisation reste le seul défaut de consultation signalé.

## Contrat de persistance

La liste native `extensions.publications.releases` demeure la source de vérité. Chaque entrée contient la définition historique, les révisions résolues (radarId, revisionId, version), le commit, les artefacts et contrôles. R2 accepte une propriété optionnelle `reason`, chaîne non vide, trim, 1000 caractères maximum, sans augmenter la version du schéma. Les anciennes entrées sans motif restent valides ; aucun motif ni nom historique n'est reconstruit depuis l'état courant. Les lecteurs antérieurs stricts peuvent refuser une entrée R2 avec motif : conserver une copie du catalogue original avant migration. Le motif est privé, jamais projeté dans le Viewer ou son manifeste public. Le numéro L001 est calculé par ordre du registre de la définition ; seul releaseId constitue l'identité persistante. Il ne représente ni une version métier ni un statut de diffusion.

## Historique et équivalence

Fiches dépliables : identifiant, date UTC, version de définition, mode, motif, identifiants et versions des révisions, commit, SHA-256 du Viewer, nom/taille/hash ZIP. Comparaison avec l'entrée précédente de la même définition : définition, révisions, mode, commit, empreinte du catalogue source et empreinte du Viewer. Une variation source n'implique pas une variation de la projection ; des octets Viewer différents ne prouvent pas une évolution métier. Si aucune empreinte Viewer n'est disponible, l'équivalence est indéterminée. Pas de comparaison détaillée des blips.

Avant génération depuis l'UI, préparer la projection et composer le HTML ; comparer SHA-256 de ces octets à toutes les entrées standalone de la même définition. Si identique, confirmation explicite avant création ; annulation sans mutation. Le service vérifie que le HTML réellement assemblé correspond au hash comparé avant d'enregistrer le ledger. Le SHA-256 du HTML ne dépend pas de l'UUID et de l'horodatage de livraison ; ceux du manifeste et ZIP peuvent varier. La preuve est une identité binaire du Viewer, pas une équivalence sémantique de toute la configuration. Les appels bas niveau restent compatibles et peuvent générer sans UI. Les contrôles A8.6 de provenance, projection, ZIP et Blob restent actifs. Le motif est facultatif même en cas de répétition explicite.

Le retéléchargement réutilise le Blob de la dernière génération dans le dialogue courant ; aucune écriture ledger. Le catalogue ne contient pas les octets des ZIP. L'interface l'indique. Enregistrer/exporter le catalogue reste nécessaire ; aucun statut de sauvegarde physique ou diffusion officielle n'est déduit d'un téléchargement.

## Prévisualisation

En Creator autonome, le bouton prépare exactement le HTML composé pour le candidat. Le lien explicite télécharge ce HTML (attribut download, sans target), puis l'utilisateur ouvre le fichier local depuis son gestionnaire de fichiers. L'URL Blob sert uniquement au transport et est révoquée à la fermeture ou au changement de prévisualisation. La navigation directe Blob R2 a échoué sur navigateur réel depuis file:// : URL blob:null sans base relative valide et WebCrypto SHA-256 indisponible. H1 supprime cette navigation, sans modifier ni contourner les contrôles d'intégrité, ni charger des données supplémentaires. Le statut indique « préparée », pas « chargée » ; aucun reçu de démarrage ni de sauvegarde physique. Aucune livraison créée. Le parcours HTTP sans template embarqué conserve l'iframe et le protocole A8.5. La consultation ISO depuis le fichier téléchargé doit être confirmée en recette réelle. La cause du défaut iframe R1 reste indéterminée.

## Report Workspace

Décision utilisateur du 15 novembre : reporter Workspace persistant, stockage binaire et convergence SPM pour privilégier les évolutions métier et la release. SPM possède un projet ChatGPT dédié et son contrat de collaboration ; aucune modification de SPM n'est décidée ici. Les acquis analysés (baseline SPM `47e4c97551856e85bf35702ad96e4c15d9e80ccc`) concernent identité, snapshot, sauvegarde vérifiée, transitions et activation transactionnelle. La généralisation des ressources binaires reste à étudier. Le registre natif et les manifestes A8.6 devront rester réutilisables. Aucun nouveau format Workspace ni dépendance SPM introduits.

## Finalisation A8.6 — clarification de la consultation

H1 a été qualifié dans Safari en file:// (602 tests, 11 contrôles fonctionnels, commit `9c3bc4fa99aff37592661f5f4519d81d3f624052`). Le parcours de prévisualisation H1 et le téléchargement candidat étaient redondants. Le Creator autonome expose désormais une seule action « Consulter le Viewer candidat (HTML) » : téléchargement direct du même HTML, sans manifeste ni écriture du registre ; ouverture locale par l’utilisateur. Pas de navigation Blob. Le bouton de prévisualisation est réservé au Creator HTTP sans template embarqué (iframe existante). La livraison ZIP et ses garanties restent inchangées. Une vraie prévisualisation temporaire sans fichier local est reportée ; aucune modification de Workspace.

## Clôture de réalisation

La recette H1 puis Final confirme la consultation ISO et les parcours de publication ; 11/11 et 6/6 contrôles, preuves 09/10. Les réserves « à confirmer » des sections historiques sont levées pour les scénarios testés en Safari. La cause iframe initiale reste inconnue ; la prévisualisation autonome sans téléchargement reste reportée. La publication logicielle A8.6 ne rend pas les publications métier privées accessibles publiquement.
