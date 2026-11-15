# A8.7 — Release publique qualifiée

Date : 15 novembre 2026.

Statut : publiée et qualifiée publiquement.

Tag : pilot-a87.

Commit source : 545ed539df2e117a8aab5158a4bcc5c151308ba3.

Commit GitHub Pages : 1eb772603268a48b653e0bde36187a6b7e15e143.

## Qualification

- 645/645 tests Node.js.
- 53/53 contrôles navigateur S15-A/B/C.
- 60/60 contrôles S15-D, dont 36 repris.
- 50/50 contrôles intégrés A8.7-RC.
- 46/46 contrôles de recette publique.

Ces campagnes sont complémentaires et ne doivent
pas être additionnées comme des tests indépendants.

## Publication

Publication atomique du commit source et du tag.
GitHub Release avec quatre assets authentifiés.
GitHub Pages publié sans force push.
Préservation de pilot-a86 et des releases historiques.

La distribution Git contient 389 fichiers physiques,
dont 388 fichiers inventoriés dans le manifeste.
L’archive Git a été comparée octet pour octet à la
distribution qualifiée.

## Recette publique

Le manifeste public correspond au commit qualifié.
Huit fichiers Web essentiels ont été vérifiés
par SHA-256, ainsi que les quatre assets téléchargés
sans authentification.

Le véritable Creator Web a installé le corpus ISO
et acquis les sources RFC Editor et W3C.

| Source | Nombre | Stockage |
|---|---:|---|
| RFC Editor | 9858 | browser-cache |
| W3C index | 1721 | browser-cache |
| JSON-LD 1.1 | 17 | browser-cache |
| DAML+OIL Axioms | 1 | browser-cache |

Aucun cache documentaire local servi.

Création du catalogue natif multi-sources,
réconciliation, protection, cinq blips, révision
publiée, export, réouverture dans le Creator autonome
téléchargé et génération du Viewer HTML et du ZIP.

Viewer publié ouvert hors ligne et fiche ISO
consultée en lecture seule.
Viewer Web et Viewer générique également vérifiés.

Aucune exception JavaScript, erreur console,
défaillance réseau ou requête bloquée signalée.

## Empreintes de la recette publique

Catalogue canonique :
a4a9108b8c2df1fc4337401e7c93891654470c0fad3e8f53172340527242b095

Projection publiée :
ea2d095a2183eff07cc713aef26fb1f8f0193efdf49ab80d74a4a95e55982747

| Asset de release | SHA-256 |
|---|---|
| standardization-radar-creator.html | e5627668e2c1e6924c55052d13dd55d4f16d9dd775fc16890e8b5d63c690b49f |
| standardization-radar-viewer.html | 444b56d291e3bb5d31a7c1f2d7c7908fd512f3c3c383510b4ac9e00f7a2d58ee |
| RELEASE-NOTES.md | 112a63440986ca4407016e6f5fadfcd2ef694c8e2863a8f7fbd2feae898bb82f |
| SHA256SUMS | e064c9eee2425bfe859390108ee5006baabe9dec8df3a9c982922de1df38ec6b |

## Accès publics

- https://github.com/nfigay/StandardisationRadarChart/releases/tag/pilot-a87
- https://nfigay.github.io/StandardisationRadarChart/distributions.html
- https://nfigay.github.io/StandardisationRadarChart/radar.html

## Preuves

Voir a87/manifest.json et les six rapports associés.
Les rapports originaux restent conservés localement.
Les copies archivées anonymisent le dossier utilisateur.

Le manifeste distingue les empreintes des originaux
et celles des copies anonymisées.

## Limites

Qualification du scénario documenté, non exhaustive.
Vérification HTTP des fichiers Web essentiels ;
comparaison intégrale de la distribution au niveau Git.

Client indépendant et PLM historique : vérifications
de construction, couverture fonctionnelle limitée.

Réconciliation ISO, migration automatique entre éditions,
DEC-009/DEC-010 et convergence Workspace/SPM hors périmètre.

La disponibilité future des services RFC/W3C
reste une dépendance externe.

## Conclusion

A8.7 constitue la nouvelle baseline publique stable.
Le tag pilot-a87 reste fixé au commit qualifié.
Les consolidations documentaires ultérieures ne
nécessitent pas de redéploiement de GitHub Pages.
