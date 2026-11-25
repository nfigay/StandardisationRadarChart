# S19-R7 — Fondations de persistance native du dossier stratégique

## Décision
Le dossier stratégique est stocké dans les extensions d'une révision de radar, jamais comme fichier métier séparé. Extension candidate : `revision.extensions.radarRationales = {schemaVersion:'s19-revision-rationales-v1',items:[...]}`. Le catalogue reste le conteneur durable ; une sauvegarde standard du radar doit inclure cette extension.

## Garanties déjà testées dans la fondation
- Un ajout/modification exige la confirmation explicite du **brouillon actif** par l'adaptateur existant.
- La création n'écrase pas un dossier préexistant.
- La révision passée en entrée n'est pas mutée ; les extensions S18 et S17 sont conservées.
- Un dossier identifie explicitement un standard et une organisation ; aucun rapprochement par libellé.
- Suppression et remplacement sont des opérations explicites.
- Aucune bibliothèque JSON indépendante ne constitue une sauvegarde normale.

## À connecter après lecture des contrats réels
1. Résolution de la révision active / propriétaire via `__radarCatalogPersistence` et `__radarCatalogAdapter`.
2. Écriture validée par la méthode métier existante (ne pas seulement modifier une copie de révision retournée).
3. Chargement des dossiers lors du changement de radar/révision et récupération de la même extension à l'export du catalogue.
4. Publication : figer le dossier de la révision via le renderer commun et le placer dans le Viewer HTML autonome, sans Tiptap.
5. Suppression des actions d'export standalone de la fiche après validation du cycle complet.

## Limite
Ce module de fondation n'est **pas encore relié** à l'adaptateur du Creator. Sa seule installation ne modifie pas le comportement de sauvegarde R6.
