# S14.1 — Démarrage automatique du catalogue ISO

## Constat

IndexedDB est isolée par origine navigateur.
La base locale de développement n'est pas partagée
avec l'application distribuée sur GitHub Pages.

## Décision

Après le chargement du catalogue existant :

1. Si une génération ISO active est présente,
   la réutiliser.
2. Sinon, déclencher automatiquement la commande
   de synchronisation du catalogue distribué.
3. Actualiser les vues avec les données installées.
4. Conserver la synchronisation manuelle pour les
   mises à jour ultérieures.

## Sécurité des données

- Aucun effacement global d'IndexedDB.
- Aucune suppression de données de radar ou de brouillon.
- Import des catalogues par le mécanisme S14 existant.
- Nettoyage des anciennes générations différé.
- Une erreur d'installation ne doit pas supprimer
  une génération active.

## Distribution

Vite construit le site statique.
Le workflow GitHub Actions publie sur push vers main
et permet également un déclenchement manuel.

## Limites de validation

Les tests Node vérifient les contrats d'intégration.
Le build contrôle les ressources statiques.

La première installation reste à vérifier dans un
navigateur neuf, sans données IndexedDB préexistantes.

## Travaux S14.1 suivants

- Gestion explicite des sources optionnelles absentes.
- Chargement et navigation continus des normes ISO.
- Nettoyage sélectif des générations obsolètes.

## Construction reproductible

La commande `npm run build:pages` appelle
`scripts/build-pages-complete.mjs`.

Elle effectue dans cet ordre :

1. Contrôle des manifestes et fichiers ISO.
2. Construction Vite avec le script sécurisé existant.
3. Inclusion de la configuration et du catalogue distribué.
4. Contrôle strict du résultat GitHub Pages.

L'artefact existant n'est jamais écrasé automatiquement.
Le workflow GitHub Actions utilise cette même commande.
