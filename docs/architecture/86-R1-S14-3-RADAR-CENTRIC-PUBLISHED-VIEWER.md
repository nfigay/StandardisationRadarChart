# 86-R1 — S14.3 A8.6-R1 : Viewer publié centré sur le radar

## Décision et périmètre

Baseline exacte : A8.6 candidat, `c73653c8ae165c369ac15da41398ed3682a922c8`. Précision DEC-019, échange utilisateur du 14 novembre 2026 : le catalogue est l'unité de gestion du Creator ; le radar retenu pour la diffusion est l'unité de consultation du Viewer publié. Un Viewer publié porte un radar ou une collection figée de radars, avec une seule révision publiée par radar. La fiche descriptive remplace l'arbre dans le panneau **left** existant. Le centre reste le radar SVG/Cytoscape et le panneau droit reste dédié au blip.

Le profil Viewer générique continue à accepter un catalogue JSON et à afficher son arbre. Il sert aux échanges techniques et ne constitue pas l'expérience du destinataire de la publication.

## Contrat d'interface

- En publication unique : accès direct au radar, fiche et références ; aucun sélecteur.
- En collection : un sélecteur localisé FR/EN, puis la fiche du radar actif. La navigation utilise `workspaceExplorer.activate(group)` et le même adaptateur/session que le Creator. Aucun arbre ni choix de versions historiques.
- Fiche : titre de publication, nom métier du radar (`administration.radarNames` avant `revision.title`), organisation, portefeuille, version publiée, libellé de révision ou identifiant, nombre de références distinctes positionnées. Le titre SVG prend le nom métier du radar ; la date d'ouverture ne constitue pas une date d'applicabilité.
- Au changement de radar : fiche, titre SVG, graphe et grille de références se synchronisent ; l'ancienne fiche de blip et le détail ISO sont fermés. La grille filtre les standards des blips du radar actif, à partir des seules références projetées ; aucune consultation du corpus global ISO. Le bouton Références respecte `presentation.references`.
- Les métadonnées sont rendues par `textContent`, jamais interprétées comme HTML. Les libellés de la fiche sont FR/EN et se rafraîchissent au changement de langue ; W2UI reste propriétaire du layout et son arbre utilise un hôte distinct du panneau publié.

## Applicabilité et compatibilité du modèle

La révision publiée et la révision applicable ne sont pas synonymes. Le modèle natif de la baseline ne fournit pas de contrat explicite d'applicabilité temporelle. Le Publisher propose des révisions publiées regroupées par radar ; l'utilisateur retient explicitement celle à diffuser. Le mode dynamique existant `allPublishedForRadars` reste compatible, mais une sélection qui résout plusieurs révisions d'un même radar est refusée lors de l'enregistrement depuis le dialogue et de la préparation de toute nouvelle publication courante. Le payload Viewer impose également l'unicité par `radarId`, avant composition ou chargement. Aucune sélection implicite de la version la plus récente ; aucune modification silencieuse de la définition ou de la révision. Les définitions historiques et le moteur de projection brut A8.4 restent lisibles ; une définition ambiguë doit être corrigée explicitement avant une nouvelle livraison. Un futur produit d'audit/version comparative nécessite un contrat distinct.

Le schéma de catalogue et le format de payload A8.5/A8.6 restent inchangés. Aucun ajout de date d'application, de description métier, de contact ou de responsable absent de la projection positive actuelle. Ces métadonnées enrichies demandent un contrat métier et une politique explicite de diffusion (ne pas utiliser la description privée du Publisher comme description du radar). La version affichée est celle réellement diffusée, sans prétendre certifier son applicabilité.

## Contexte et contrôle fonctionnel

`radar-application-profile.js` détecte le contexte publié avant la construction des menus : présence du payload dans le head du Viewer autonome, ou `publicationPreview=1` pour la prévisualisation HTTP. Le Viewer commun conserve son profil `viewer` et expose `published`. Le contexte de publication est permanent dans cette instance. `catalog.open` est refusé ; les menus Fichiers et sélection de révision ainsi que les commandes d'import, remplacement et fermeture sont indisponibles. Le workgroup menu W2UI `item2` reste une dépendance interne du chargement natif mais est caché et interdit comme action en contexte publié. Le service initialise une seule fois, de manière synchrone après contrôle du digest, les révisions déjà sélectionnées par le Publisher. Les opérations normales d'import, enregistrement supplémentaire, fermeture, remplacement de graphe et navigation vers un groupe non chargé restent interdites. Un payload invalide ne déclenche pas de retour au Viewer générique.

La liste de capacités du schéma de définition v1 est conservée pour la rétrocompatibilité ; elle n'est pas le contrat d'autorisation d'une instance publiée. Les permissions effectives sont calculées dans le profil d'exécution. Le contrôle est fonctionnel, non une sandbox, une signature ou une protection DRM contre la modification locale d'un fichier HTML.

## Livraison et qualification

La même projection vérifiée alimente prévisualisation HTTP/HTML, candidat et livraison ZIP. Pas de changement dans les contrats SHA-256, provenance, manifeste ou ledger A8.6 ; une livraison antérieure reste un artefact historique et doit être régénérée pour bénéficier du R1. Pas de publication externe supplémentaire ni de refonte générale ISO dans ce lot.

Tests : extension des suites `radar-a85-publisher.test.mjs` et `radar-a82-iso-integration.test.mjs` (sept cas nouveaux : collection, unique, services interdits, ambiguïté et générique, payload invalide verrouillé, refus du dialogue, références actives). Suite disponible : 595 réussites sans Vite ; 5 tests historiques de `client-variants.test.mjs` nécessitent les dépendances npm absentes de l'archive source. La suite complète attendue après installation est 600 tests. La tentative Chromium locale a été bloquée par la politique de navigation de l'environnement d'analyse ; la qualification sur navigateur et la reconstruction sur Mac restent obligatoires. Voir [preuve 07](../evidence/07-A86-R1-RADAR-VIEWER-CANDIDATE.md) et architecture 86.
