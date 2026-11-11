# S13 — Cycle de vie explicite des révisions de catalogue

## Périmètre et statut
Implémentation locale S13. La validation interactive sur Mac et le round-trip JSON complet du Lot 3 restent à réaliser. S12-R1 (cohérence référence/standard/blip, doublons, fiche métier) reste ouvert. Aucune modification de `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` : tous `OPEN`.

## Contrat des transitions
- `draft → published` : publication explicite d'une **révision active** du catalogue unique. Le graphe actif est converti avec `toBlips` (même filtre strict que l'export), y compris ses positions courantes. Pas de `plotData`, de layout ou de remplacement du graphe. La révision propriétaire dans `imports[0].source` et le miroir de l'adaptateur sont synchronisés ; le graphe est ensuite verrouillé par la logique existante.
- `published → archived` : archivage explicite d'une **révision active**, seulement si le snapshot Cytoscape ne diffère pas des blips de la publication. Aucun contenu métier de la publication n'est modifié.
- `published/archived → nouveau draft` : commande **Créer / ouvrir draft** déjà existante (`createOrOpenDraft`), enregistre une nouvelle `revisionId`, `extensions.lineage.basedOnRevisionId`, et reprend le contenu sans modifier la source. Aucun second magasin de révisions n'est créé.
- Autres transitions refusées ; confirmation utilisateur requise avant publication et archivage.

## Stockage et identité
Le catalogue privé `imports[]` dans `radar-catalog-persistence.js` reste la source de vérité pour l'export. `radar-catalog-adapter.js` conserve uniquement sa projection et le statut de la révision sélectionnée. `radar-revision-session.js` reste responsable des snapshots Cytoscape et du maintien des positions. Le menu W2UI (`item2`) réaffiche le nouveau statut ; les groupes historiques ASD/SSR restent inchangés. Aucun fichier disque n'est enregistré automatiquement : utiliser **Fichiers → Sauvegarder le catalogue JSON** après chaque transition.

## Garde-fous et limites
- Import d'un seul catalogue ; refus de transitions en dehors de cette portée.
- Validation stricte des champs des blips par `toBlips`; une donnée Cytoscape non mappée bloque la publication sans changement de statut.
- Le contrôle de lecture seule du code historique demeure une défense applicative ; la protection contre des mutations arbitraires via console n'est pas un mécanisme de sécurité cryptographique.
- La version affichée (`version`) n'est pas incrémentée automatiquement. Les conventions de publication, de versionnement et d'audit n'ont pas encore été arbitrées ; l'horodatage, la signature et le workflow d'approbation restent hors périmètre.
- Le fichier JSON n'est persistant qu'après téléchargement explicite. La connexion SDO, les éditions ISO et les modifications de notices déjà référencées restent ouverts.
- Validation de conservation des positions, du statut à l'export, de l'archivage et de la filiation : tests S13. Il reste à vérifier import/export intégral et comportements visuels navigateur.

## Suivi
Les tests S13 se trouvent dans `tests/radar-revision-lifecycle.test.mjs`. Les scénarios négatifs couvrent les transitions interdites et une altération de snapshot publié. `S12-R1` reste une anomalie fonctionnelle distincte : un standard réutilisé peut encore être projeté plusieurs fois, et ses métadonnées de référence ne sont pas affichées dans l'éditeur générique de blips.
