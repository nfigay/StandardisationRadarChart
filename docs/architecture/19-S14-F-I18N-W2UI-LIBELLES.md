# S14-F — Localisation du panneau ISO et lisibilité des libellés

## Portée

La grille w2grid et le formulaire w2form ISO doivent partager le mécanisme i18next de radar.html. La traduction concerne les intitulés de colonnes, vues, actions et champs de formulaire. Les textes des normes téléchargées restent des données métier multilingues, jamais des chaînes de l'interface à traduire.

## Implémentation

Le module radar-standards-panel.js enregistre sous `translation.isoPanel` des ressources FR/EN sur l'instance i18next existante. L'événement `languageChanged` déclenche l'actualisation des colonnes, boutons et, si elle est ouverte, de la fiche de consultation. Les données IndexedDB ne sont pas réimportées lors de cette opération.

Le formulaire en lecture seule repose toujours sur `w2form`. Les attributs de présentation sont modifiés pour éviter la troncature artificielle des libellés; les textes longs restent dans des zones de texte en lecture seule. La grille conserve des lignes compactes de 28 px.

## Limites et suite

Les messages d'état et d'erreur historiques de l'acquisition ISO ne sont pas tous localisés dans ce lot. Ils feront partie de l'harmonisation i18n transversale avec les autres modules existants. Le rendu final du formulaire doit être validé dans Chrome.

## Décisions

DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018 restent OPEN. Aucun changement du registre, du cycle de vie ou du contrat d'identité ISO.
