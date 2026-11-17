# S16-A-C4 — Achèvement de la consultation documentaire en ligne (premier incrément OMG)

**Statut : candidat local, aucune publication automatique.** Base S16 publiée : `a30a23eefbbc136eba0a16e19e700e208189933e`.

## Objet

Achever l'objectif initial S16 : retrouver les spécifications et leurs éditions depuis un Creator hébergé sur GitHub Pages **sans transfert de fichiers sur le poste de l'utilisateur**. Les sources ISO, RFC et W3C restent dans leur connecteur existant. L'obstacle immédiat est OMG : son relais d'acquisition S16 n'est disponible que dans le Creator local.

## Architecture du premier incrément

- `tools/prepare-omg-public-links.mjs` transforme **sur décision explicite de publication** des instantanés privés vérifiés et complets en pointeurs bibliographiques restreints : `url`, `status` et `publicationDate` pour le catalogue, `url` et `publicationDate` pour les historiques. Aucun titre de texte, description, tableau ISO, PDF, HTML, document ni instantané `private-only` n'est publié par cette projection.
- L'opérateur examine les droits de redistribution avant de passer `--approve-public-links`. Le script refuse une source incomplète, un doublon, une identité hors de `www.omg.org` ou un répertoire cible préexistant.
- Les fichiers approuvés sont installés dans `catalog-distribution/omg-public/index.json` et `catalog-distribution/omg-public/histories/<family>.json`. Le build existant copie récursivement `catalog-distribution`, sans modifier ses manifestes ISO.
- Le Creator charge ces documents avec `fetch` **same-origin**, sans identifiants, sans relais local et sans repli sur un proxy public. Il valide à nouveau chaque édition, chaque URL et la complétude déclarée avant de remplacer atomiquement l'index de session. Les instantanés privés de l'utilisateur en IndexedDB ne sont pas écrasés.
- Le menu « Sources de standardisation » expose un chargement OMG depuis Pages. Sur Pages, l'entrée OMG déclenche automatiquement ce chargement en l'absence d'index actif. La consultation d'une famille active charge ses éditions par le même mécanisme. L'import/export JSON reste un secours facultatif.
- L'import dans le catalogue métier reste une action explicite ; les identités et éditions sont préservées. Le Viewer publié ne réalise aucune acquisition.

## Contrats et limites

- Ce mécanisme offre un **index en ligne sur GitHub Pages**, actualisé lors de la dernière publication de métadonnées. Ce n'est pas une interrogation temps réel du serveur OMG.
- Une absence d'index public entraîne une erreur explicite, pas une récupération silencieuse de données privées. Le premier déploiement effectif nécessite la génération et l'examen du jeu de pointeurs, puis une nouvelle construction de la distribution.
- Le statut `public-links-only` et l'origine `published-links` empêchent de confondre les pointeurs avec des instantanés documentaires complets. Les titres de liste sont des identifiants lisibles (ex. `UML 2.5.1`) en attendant une politique de republication des titres.
- Les acquis ISO AP242, les relations de remplacement et le Scope restent inchangés. RFC/W3C restent servis par leur mécanisme précédent ; il faudra vérifier séparément leur accès réel en session Pages vierge.
- Les dates sont issues du jeu de référence officiel validé. Les onze éditions UML sont couvertes par un jeu de test synthétique ; le test ne publie pas de fichier privé.
- La complétude de l'historique vaut pour les versions formelles présentes sur la page officielle **au moment de la collecte**, jamais pour l'applicabilité opérationnelle d'une édition.

## Tests et recette à exécuter

1. Tests ciblés : validation stricte des URL, doublons, rejet des instantanés incomplets, onze identités UML distinctes, accès Pages depuis les chemins `/radar.html` et `/author/radar.html`, interdiction d'acquisition en Viewer, absence de mutation du catalogue.
2. Régression locale : `node --test tests/*.test.mjs` (attendu **729 tests** après installation si la base reste à 722).
3. Revue documentaire et droits : vérifier le fichier projeté avant tout commit ou publication ; conserver privés les instantanés source.
4. Build et recette Pages : index OMG présent sur une session neuve, recherche UML, 11 éditions sans import JSON, ajout explicite d'une édition, deuxième édition distincte, absence de mutation par consultation seule.
5. Vérifier aussi ISO AP242, RFC, W3C et Viewer sur Pages avant de qualifier l'objectif multisource complet.

## Mode de préparation après revue de droits

```bash
node tools/prepare-omg-public-links.mjs \
  --catalog "$HOME/Documents/StandardizationRadarChart-Audits/S16-OMG-Current.json" \
  --history "$HOME/Downloads/S16-OMG-History-UML.json" \
  --out catalog-distribution/omg-public \
  --approve-public-links
```

**Ne pas exécuter cette génération ni publier ses résultats sans validation du périmètre de redistribution.** La commande ci-dessus indique le contrat, pas une autorisation juridique.
