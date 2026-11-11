# Lot 2 — Révision du parcours création et sélection (S11)

## Constat utilisateur

L'import d'une révision aboutissait à `CATALOG_REVISION_0` dans l'adaptateur et l'explorateur, mais le message de notification demandait une sélection sans présenter de contrôle visible. Les formulaires acceptaient des chaînes libres pour ring/quadrant et proposaient une liste brute des standards. Un standard de référence ne porte **pas** lui-même de ring/quadrant : ces attributs appartiennent au blip d'une révision.

## Intégration

- L'import ouvre explicitement un sélecteur des révisions enregistrées ; aucun groupe n'est activé automatiquement. Une action « Sélectionner une révision » est également disponible depuis le menu Outils du radar. L'activation passe par `__radarWorkspaceExplorer.activate`, donc par la sélection de session existante. Cette UI ne crée aucun second registre.
- Le formulaire de blip possède une recherche locale insensible à la casse par nom et identifiant, avec un maximum de 50 résultats affichés. **Ce n'est pas une recherche dans le référentiel ISO mondial**. Les résultats sont issus exclusivement de `listStandardsForDraft` dans la persistance privée ; aucune prétention de vérification ISO n'est faite.
- Ring et quadrant sont des listes contrôlées correspondant à la géométrie actuellement supportée par `js/radar.js` : `Adopted`, `Candidate`, `Track` et `Available`, `Monitored`, `Participated`, `Developed`. Le moteur de création reçoit toujours ces attributs au niveau du **blip**, jamais du standard. Aucun `plotData` ni layout supplémentaire.
- La création manuelle d'un nouveau standard est conservée comme solution transitoire et signalée comme telle. L'architecture cible privilégie la recherche avancée dans un référentiel ISO vérifié, puis l'action « ajouter au radar » et la complétion des champs contextuels.

## Limites et décisions ouvertes

- Les listes géométriques reproduisent la géométrie héritée, qui n'est pas encore paramétrée par radar. Ne pas généraliser en configuration arbitraire sans arbitrage de modèle.
- Le registre ISO externe, son index, ses métadonnées de provenance et les liens entre éditions restent à concevoir. Aucune intégration à une API ISO n'est introduite ici.
- `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017`, `DEC-018` restent **OPEN**. Aucune décision n'est implicitement clôturée par ce correctif.
- L'activation via l'interface, la position réelle sur les anneaux, les protections published/archived et l'export/réimport doivent être vérifiés dans le navigateur et au Lot 3.

## Régression

Tests de la création existante, nouvelles vérifications des valeurs contrôlées, de la recherche bornée et des deux chemins de commande, contrôles de syntaxe, de source et d'intégrité Git. Installation soumise aux empreintes SHA-256 des fichiers post-Lot 2 afin de ne pas écraser une modification locale inattendue.
