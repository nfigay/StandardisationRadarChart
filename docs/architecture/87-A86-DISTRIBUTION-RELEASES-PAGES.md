# A8.6 — construction et distribution du logiciel

**AS-IS** · 15 novembre 2026 · source `894ae2a1ed25f7cef6bbbb56b3d2520792ecdc55` · tag `pilot-a86` · Pages `d24d7ef448be374528c725dbcb6845175aebda03`.

## 1. Trois services, trois responsabilités

| Service | Entrée | Sortie |
|---|---|---|
| Dépôt Git | Sources, tests, documents sur main | Historique, tags, navigation des fichiers |
| GitHub Releases | Tag et fichiers joints via CLI `gh` | Interface native `/releases`, notes Markdown et téléchargements |
| GitHub Pages | Site statique construit, branche gh-pages | Portail et applications HTTP |

GitHub produit l'interface Releases et les archives de sources ZIP/tar.gz du tag ; les quatre assets explicitement joints ne sont pas ces archives automatiques. Le portail `distributions.html` est notre propre page générée et contient des liens vers les assets de la release. Il ne faut pas créer de page HTML pour chaque release. Un tag est une référence Git ; une release est un objet GitHub associé au tag, avec titre, notes et assets.

## 2. Construction locale

1. `npm run build:pages` appelle `scripts/build-pages-complete.mjs`, construit avec Vite et complète les scripts classiques et le corpus ISO distribué dans `.radarchart-build/pages` ; `npm run verify:pages` vérifie les fichiers statiques. `scripts/pages-build-provenance.mjs` associe la provenance à la source.
2. `scripts/build-common-standalone.mjs` construit les HTML Creator et Viewer à partir du socle commun. Le Creator embarque le corpus ISO global et le modèle Viewer ; le Viewer générique n'embarque pas le corpus global. `scripts/verify-standalone-publication.mjs` contrôle template, projection, composition, roundtrip, inventaire ZIP, CRC et SHA-256.
3. `npm run build:dist` appelle `scripts/build-web-distribution.mjs build` : assemble le portail, le site Radar, les distributions historiques Client et PLM selon le contrat existant, et le manifeste `site-manifest.json`. `npm run verify:dist` contrôle l'ensemble. Le répertoire `dist/` n'est pas le code source.
4. Le package de release prépare `release-assets/` : `standardization-radar-creator.html`, `standardization-radar-viewer.html`, `RELEASE-NOTES.md`, `SHA256SUMS`. Les deux HTML sont contrôlés contre la construction qualifiée. Le manifeste du site est distinct des empreintes des assets.

## 3. Publication effectuée

Le script d'orchestration `publish.mjs` est fourni dans le package externe `RadarChart-A86-Release.zip` (il n'était pas un script versionné du dépôt). La copie de référence est [ici](../evidence/release-a86/publish.mjs). Elle est historique, liée à A8.6 ; ne pas la relancer depuis un HEAD ultérieur. Le contrôle `--check` ne modifie pas les références distantes. `--publish` vérifie l'origine, le HEAD, le parent qualifié, les preuves, les octets locaux, l'authentification gh et les références distantes. Il effectue ensuite un push atomique main/tag sans force, crée la release avec `gh release create --verify-tag`, vérifie les quatre assets par téléchargement et empreintes, puis appelle `npm run publish:dist` (`scripts/publish-web-distribution.sh`) pour le site. Les étapes Release et Pages ne sont pas atomiques ensemble. Voir [preuve 10](../evidence/10-A86-PUBLICATION.md).

Commande illustrative de création (le script réel fournit des chemins absolus et vérifie l'état) :

```sh
gh release create pilot-a86 --repo nfigay/StandardisationRadarChart --verify-tag \
  --title 'Standardization Radar Chart A8.6' --notes-file RELEASE-NOTES.md \
  standardization-radar-creator.html standardization-radar-viewer.html RELEASE-NOTES.md SHA256SUMS
```

Cette commande n'est pas à rejouer : la release existe déjà. GitHub Pages sert la branche gh-pages ; le portail n'est pas hébergé par Releases. Une mise à jour de documentation sur main n'actualise pas automatiquement la release taguée ni les fichiers Pages construits.

## 4. Navigation

- [Releases](https://github.com/nfigay/StandardisationRadarChart/releases) et [tag pilot-a86](https://github.com/nfigay/StandardisationRadarChart/releases/tag/pilot-a86).
- [Documentation figée au tag](https://github.com/nfigay/StandardisationRadarChart/tree/pilot-a86/docs) et [documentation évolutive main](https://github.com/nfigay/StandardisationRadarChart/tree/main/docs).
- [Portail Pages](https://nfigay.github.io/StandardisationRadarChart/distributions.html), [Creator](https://nfigay.github.io/StandardisationRadarChart/radar.html), [Viewer](https://nfigay.github.io/StandardisationRadarChart/radar.html?profile=viewer).
- [Documentation GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) ; [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## 5. Ne pas confondre logiciel et publication métier

Une GitHub Release diffuse les outils génériques. Une livraison métier issue du Publisher est un ZIP contenant un Viewer préchargé et un manifeste, associé à une configuration de radars. Elle n'est jamais automatiquement envoyée sur GitHub. Les données privées et catalogues de travail ne doivent pas être joints aux assets publics. Le registre métier conserve les métadonnées de livraison, pas les octets ZIP historiques. Workspace reporté.
