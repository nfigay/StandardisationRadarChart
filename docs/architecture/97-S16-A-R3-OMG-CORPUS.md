# S16-A-R3 — Corpus documentaire OMG, collecte séparée (candidat)

## Décision de réalisation

R2 : recette utilisateur 10/10 réussie. Demande explicite : ne pas intégrer l'autorisation d'acquisition OMG dans l'application ; fournir un collecteur et un corpus consultable comme ISO. R3 conserve le sélecteur W2UI, la grille commune, les deux vues OMG, le catalogue natif 1.0.0 et les identités métier existantes. Aucune nouvelle collection d'organisations, aucune fusion ou création de standards. DEC-009/010/016/017/018 restent ouvertes.

## Ressource officielle et couverture

Le [catalogue OMG](https://www.omg.org/spec/) fournit une liste alphabétique des publications formelles ou en finalisation, une table de publications récentes et une table séparée d'adoptions ISO. La consultation publique a montré 282 lignes dans la liste principale et 16 lignes d'adoption (observation de la version consultée, non un invariant ni une mesure de la collecte réelle). Une ligne est une publication versionnée, pas une série et pas nécessairement une norme formelle. Les doublons identiques des tables récentes et principales sont dédupliqués par identité versionnée ; les variantes Beta restent distinctes. Les adoptions de versions historiques restent consultables même si la version n'est pas dans la liste principale. La couverture ne signifie pas que tous les historiques ont été acquis. Les rejets, l'absence d'une table reconnue et les limites sont explicités ; pas de données synthétiques présentées comme officielles.

## Collecteur externe

`tools/read-omg-metadata.mjs` reste le collecteur, non une fonctionnalité de gouvernance du Creator. Deux parcours :

- `--prepare-catalog <fichier.html> --out <répertoire privé existant>` : lecture hors réseau d'une copie déjà détenue, parseur partagé, empreinte SHA-256, production `omg-catalog.json` et `report.json` dans un dossier privé unique hors dépôt. Le rapport indique la couverture, les rejets et les comptes. Le fichier reste importable lorsque la couverture est partielle, mais le rapport ne le qualifie pas comme complet. La date d'acquisition originale reste inconnue et n'est pas inventée.
- `--acquire --rights <fichier.json> --out <répertoire privé> --catalog` : acquisition réseau explicite du seul index officiel. Le contrôle du fondement d'acquisition/retention et de l'URL est exclusivement dans l'outil Node. Il réutilise la validation HTTP, le plafond de taille, l'arrêt en cas d'erreur, les copies privées et le rapport de R1. Le fichier `catalog-normalized.json` est le même contrat d'import. `--pilot` ou URL versionnée explicite permettent une exploration complémentaire indépendante, pas un crawl systématique.

Le collecteur ne présume ni l'autorisation de téléchargement massif ni la redistribution. Voir [mentions légales OMG](https://www.omg.org/legal/). L'utilisateur ou le responsable du corpus détermine le fondement applicable hors Creator ; aucune demande de licence n'est imposée au lecteur du corpus. Une importation de données ne constitue pas une autorisation de diffusion. Aucun contenu OMG n'est ajouté au dépôt ou aux distributions.

## Consultation W2UI et cache

- Les commandes OMG sont « Importer / actualiser le corpus », « Charger le corpus en cache », « Effacer les données OMG ». L'ouverture de la source peut restaurer automatiquement le cache local, mais ne fait aucune requête à OMG. Le formulaire de droits et la confirmation d'import R2 sont retirés ; l'API navigateur `loadOmg(rights)` et la fonction d'autorisation navigateur sont supprimées.
- Le fichier HTML ou JSON est borné et validé par le parseur/contrat de données. Aucun HTML source n'est injecté dans le DOM. L'import remplace l'instantané après validation et conserve la provenance déclarée, sans promotion en `source-verified`. Une erreur de format laisse l'instantané actif intact.
- La projection documentaire validée est persistée dans le magasin `snapshots` de la base `radar-standard-sources-v1`, sous `omg-specifications-private`. Elle ne contient ni HTML brut ni autorisations, ni données métier. Les identifiants de fichiers OMG associés aux adoptions sont conservés. L'origine reste `local-unverified`, même après restauration. Si IndexedDB est indisponible, la consultation reste en session et le statut l'indique.
- Les écritures/imports et suppressions de ce service sont sérialisés ; l'effacement invalide les imports en cours et supprime uniquement la clé OMG, sans supprimer les autres corpus. Le cache est propre à l'origine navigateur ; un changement de port ou de profil exige un import distinct. Ce n'est pas un coffre chiffré ; les scripts de la même origine et l'utilisateur du navigateur peuvent accéder aux données. La protection du Viewer demeure applicative et interdit la consultation par ses API.
- La mise à jour consiste à importer le nouvel instantané préparé ; pas de synchronisation automatique du réseau OMG, pas de publication ni intégration métier OMG. Les documents déjà référencés dans le catalogue natif ne sont jamais modifiés.

## Validation et qualification

Les tests R3 couvrent l'absence de formulaire et d'API d'acquisition navigateur, l'import/actualisation, la persistance/relecture, l'effacement ciblé, les erreurs de remplacement, l'invalidation d'import, le collecteur hors réseau et la conservation des identités. Le harnais `tests/radar-s16-r3-omg-cache-browser.html?isolated=1` utilise le véritable IndexedDB dans un document distinct, et refuse un corpus OMG préexistant. Il doit être exécuté sur une origine jetable ; le fixture R2 W2UI reste séparé. Cibles Mac : 74 tests ciblés / 673 tests Node, aucune régression ; aucune publication implicite.

Qualification du corpus officiel brut sur un fichier effectivement disponible encore nécessaire. Les historiques exhaustifs, les métadonnées RDF/JSON-LD et les informations d'acteurs/classifications restent à mapper et qualifier ; les correspondances ISO et les notices locales sont de la connaissance documentaire, non une intégration métier vérifiée. Les tests sur fixtures ne valent pas preuve de couverture du corpus officiel.

### Résultat de préparation

Dans la reconstruction du candidat R2, les 17 tests du moteur fédéré et 4 tests historiques d’internationalisation passent (Node 22.16.0). Trois scénarios ciblés du contrôleur OMG passent dans une copie du harnais privée des modules historiques absents du bundle (publication-model, catalog-create-form, iso-toolbar). Les tests originaux et la suite complète ne sont pas modifiés pour masquer ces absences. Le lancement du fixture Chromium sur le serveur loopback de cet environnement a été bloqué par la politique du navigateur (`ERR_BLOCKED_BY_ADMINISTRATOR`) ; la validation réelle IndexedDB reste à confirmer sur Mac.

R3.1 complète cette architecture : [actualisation en ligne de l’index public](98-S16-A-R31-OMG-ONLINE-CATALOG.md), avec relais local limité et corpus préparé hors dépôt.
