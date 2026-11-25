# S19 — Dossier stratégique : rendu documentaire et contrat de persistance

## Décision (R6)

Le Creator conserve les onglets W2UI `Propriétés` / `Dossier stratégique` en bas du panneau droit. L'édition se fait par rubrique dans Tiptap. La visualisation affiche la **fiche HTML complète**, rendue par `js/radar-rationale-renderer.js`, sans dépendance Tiptap. Le rendu utilise un document HTML autonome, avec CSS intégré et échappement systématique du texte.

Le Viewer devra consommer exactement le même module de rendu, à partir d'un **dossier figé de la révision publiée**. Le présent R6 n'effectue **pas encore** cette injection dans le pipeline de publication.

## Séparation des responsabilités

- Norme, sources, organisations et provenance : contrats S17 déjà existants.
- Dossier : justification organisationnelle, contenu de rubriques JSON Tiptap, gouvernance et lien explicite à la norme.
- Blip : référence à une norme et à un dossier ; ne contient pas le contenu rédactionnel en copie.
- Révision de radar : instantané ou référence versionnée immuable au dossier publié.
- Viewer : lecture seule, aucun moteur Tiptap.

## Critères d'acceptation du raccordement R7

1. Inspecter `__radarCatalogPersistence`, `__radarCatalogAdapter`, les schémas de révision et la publication HTML déjà installés.
2. Définir une extension métier **sans écraser** les extensions existantes (`radarGeometry`, références S17).
3. Ne modifier que le brouillon actif ; aucune écriture dans une révision publiée.
4. Enregistrer et rouvrir un catalogue contenant le dossier ; vérifier l'intégrité du contenu Tiptap JSON.
5. Garantir la présence du dossier figé dans le HTML Viewer, sans scripts Tiptap.
6. Ajouter des tests import/export, isolement entre organisations, changement de révision et régression sur les 805 tests S18/S17.
7. Aucun stockage permanent de fiches exclusivement dans le Map JS, aucun téléchargement JSON obligatoire pour sauvegarder le radar.

## Limitations connues de R6

Les dossiers sont encore tenus en mémoire et l'import/export JSON reste un moyen de test. Le présent R6 vérifie la parité de rendu **à l'intérieur du Creator**, mais pas la persistance avec le radar ni le chemin de publication Viewer. Ces sujets exigent le relevé des contrats réels avant toute écriture.
