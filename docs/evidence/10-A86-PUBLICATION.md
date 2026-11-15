# A8.6 — preuve de publication effective

Date : 15 novembre 2026. Source : rapports JSON utilisateur A86-RELEASE-PREPARED, A86-RELEASE-PUBLICATION --check et --publish ; qualification locale : [preuve 09](09-A86-FINAL-QUALIFICATION.md). Il s'agit de faits rapportés par l'opérateur, non d'une nouvelle exécution des tests ici.

| Référence | Valeur |
|---|---|
| Application | `f7939c362cd9343cd92b6087235b8a29d2c06765` |
| Release | `894ae2a1ed25f7cef6bbbb56b3d2520792ecdc55` |
| Tag | `pilot-a86` |
| Pages | `d24d7ef448be374528c725dbcb6845175aebda03` |
| Ancien main | `0b14a418b3e5a206a4611b8f6cd86887b5f8449d` |
| Ancien Pages | `ed814d6da7d57dc2324ea26b68cea1659d0c227d` |
| Tests release | 603/603, 0 échec |
| Manifeste site SHA-256 | `7ac36a68bdbef3b8f0ef54fbbd3868d8ac5110cb35420e2868ce793af465b467` |
| Source/tag push | true |
| Release vérifiée | true |
| Pages push | true |

Rapport final : phase complete, ok true. Préflight : ok true, aucun changement distant, tag initialement absent. Les assets ont été vérifiés par retéléchargement dans le script de publication. Les 603 tests et les contrôles de composition/ZIP proviennent du rapport de préparation. [Release](https://github.com/nfigay/StandardisationRadarChart/releases/tag/pilot-a86) et [portail](https://nfigay.github.io/StandardisationRadarChart/distributions.html). La présence publique de la release A8.6 et des releases antérieures est observée via l'interface GitHub ; le test navigateur des distributions publiques reste ouvert (`browserRecipeRequired: true`).

La documentation post-release est consolidée sur main sans déplacer le tag ni reconstruire les artefacts qualifiés. Les copies de référence du script d'orchestration et des notes sont dans [release-a86](release-a86/). Aucun secret, chemin personnel ou journal d'authentification n'est reproduit.
