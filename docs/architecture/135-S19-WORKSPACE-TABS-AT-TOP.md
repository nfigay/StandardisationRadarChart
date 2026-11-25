# S19 R11 — Navigation en tête du panneau Workspace

## Constat

Le composant S19 crée déjà `#s19-tabs` avant les panneaux Propriétés et Dossier stratégique, mais la règle CSS historique positionne les onglets en bas du conteneur. Cela rend la navigation difficile sur les dossiers longs.

## Décision

Conserver la structure HTML et le composant W2UI existants. Replacer `#s19-tabs` en haut par `position:absolute;top:0`, et décaler les deux surfaces défilantes de 31 px avec `margin-top:31px`. Les deux surfaces conservent leur défilement indépendant et leur hauteur utile réduite du même montant.

## Invariants

- Aucune mutation du modèle de révision, du dossier, du standard ou du blip.
- Aucun changement du gestionnaire d'onglets `w2tabs`, du traitement `killEditor`/`refresh` ni des règles de création des dossiers.
- Les onglets restent hors du contenu défilant. Compatibilité du mode plein écran à vérifier dans Chrome.
- Conserver l'ergonomie FR/EN et le CSS limité au panneau S19.

## Validation

Tests automatisés de position et d'isolation CSS. Recette manuelle : naviguer entre les deux onglets en haut, ouvrir un long dossier, défiler sans faire disparaître les onglets, revenir aux propriétés, puis tester le plein écran et le changement de blip. Vérifier qu'aucune modification non sollicitée n'est enregistrée.
