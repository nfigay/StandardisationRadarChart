# Standardization Radar Chart

Creator, Publisher et Viewer de connaissances de normalisation. Le projet contient des parcours de consultation de références ISO, OMG, RFC/IETF et W3C et des publications HTML autonomes.

## État courant — fin de S16

La dernière livraison fonctionnelle S16 est le commit `c92fbe5a9120b93051407b1c5ec9c3590db7efa2` (764 tests Node lors de sa qualification, recettes Creator/Viewer et export HTML hors ligne rapportées). La clôture documentaire S16 est publiée sur `main` au commit `cf370ade6a872c6e4bc7320456e33a138c5ab46b`. Ces références sont **historiques** ; vérifier le HEAD réel avant toute opération.

- [Démarrage et conventions du projet](docs/governance/00-START-HERE.md)
- [Index documentaire : entrée courante](docs/DOCUMENTATION-INDEX.md)
- [Architecture consolidée S16](docs/architecture/119-S16-ARCHITECTURE-REALISEE-ET-RECONCILIATION.md)
- [Plan de réalisation et objectifs ouverts](docs/governance/PLAN-REALISATION-S14-3-CREATOR-PUBLISHER-VIEWER.md)
- [Retour d'expérience livraison S16 / contrats S17](docs/architecture/117-S16-REX-LIVRAISON-ET-CONTRATS-S17.md)

## Utiliser et développer

- [Portail GitHub Pages](https://nfigay.github.io/StandardisationRadarChart/distributions.html)
- [Creator Web](https://nfigay.github.io/StandardisationRadarChart/radar.html)
- [Viewer Web](https://nfigay.github.io/StandardisationRadarChart/radar.html?profile=viewer)
- Prérequis de développement : version Node indiquée dans `.nvmrc`, npm et les dépendances installées via `npm install`.
- `npm run project -- status` : état Git et commandes disponibles, sans mutation.
- `npm test` : suite Node sur les fichiers `tests/*.test.mjs` (nombre réel de tests affiché par Node).
- `npm run project -- verify` : vérification des sources existante (sans build).
- `npm run project -- build` : délégation à `npm run build` ; **refuse** une sortie locale déjà présente, sans nettoyage automatique.

Les scripts spécialisés et procédures de publication restent disponibles mais ne sont **pas** lancés automatiquement par la façade. Tout commit, push et déploiement requiert une autorisation humaine distincte. La qualification navigateur et la recette utilisateur ne sont pas remplacées par les tests Node.

## Archives et versions antérieures

La release [A8.7](docs/RELEASE-A87.md) et son [tag](https://github.com/nfigay/StandardisationRadarChart/releases/tag/pilot-a87) sont conservés comme jalons historiques, et non comme statut courant de S16. Les cibles A9/A10 restent des objectifs à qualifier, non des fonctionnalités implicitement terminées.
