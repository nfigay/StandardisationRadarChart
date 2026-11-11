# S14 — Publication GitHub Pages

## Objectif

Distribuer Standardisation Radar Chart avec les
fonctionnalités S13/S14 et les sources ISO disponibles.

## Architecture de distribution

- Vite prépare la distribution statique.
- radar.html reste le point d'entrée applicatif.
- index.html redirige vers radar.html.
- Les scripts JavaScript classiques sont conservés.
- catalog-distribution contient le catalogue ISO.
- radar-catalog-config.json définit la source ISO.
- ICS.csv préserve la compatibilité historique.

## Validation

- S14-Z : 5 tests réussis.
- Build Pages : validé.
- Vérification stricte : aucune erreur.
- Reproduction depuis l'index Git : validée.
- Vérification navigateur : requise après publication.

## Principes

Le catalogue distribué est distinct des caches locaux.
Les sauvegardes et les builds locaux ne sont pas publiés.
Les fonctionnalités métier existantes sont préservées.

## Suite

S15 : simplification de l'interface ISO, gestion des
sources et amélioration des interactions de groupes.
