# S14-K-R4 — Présentation des radars et révisions

## Règles

- L'explorateur présente Source → Organisation → Radar → Révisions. Le radar porte le nom administratif courant, chaque révision possède son identifiant stable et ses métadonnées propres.
- Les statuts visibles sont traduits selon la langue active (français ou anglais). L'explorateur et le menu de sélection sont reconstruits au changement de langue.
- Les libellés personnalisés de révision sont conservés, y compris les numéros modifiés manuellement (par exemple `r10`). Aucun numéro historique n'est corrigé ou renuméroté.
- Les suffixes techniques `-draft-local` sont masqués dans les listes, mais restent intacts dans les révisions déjà présentes et les exports.
- Lors de la création d'une **nouvelle** dérivation, un suffixe `-draft-local` déjà présent n'est pas répété. Le moteur ne modifie pas les versions historiques existantes.
- La structure des catalogues JSON et les règles de publication restent inchangées.

## Tests et validation

`node --test tests/radar-s14kr4-explorer.test.mjs`

Valider après installation sur un ancien catalogue : hiérarchie Radar/révisions, nom modifié, statuts FR/EN, libellé manuel `r10`, sélection et export/réimport. Les opérations de renommage restent administratives, elles ne modifient pas les publications.

## Ouverts

Contrat d'identité ISO/Standard/Blip S12-R1 et décisions DEC-009/010/016/017/018.
