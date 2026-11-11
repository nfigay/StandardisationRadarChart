# S14-Q-R1 — Correction du harnais d'exécution Node

## Constat
Le contrat de `radar-s14-q-diagnostic.js` est un module IIFE compatible navigateur, qui renseigne `window.__radarS14Q` ou `globalThis.__radarS14Q`. L'export `module.exports={run}` n'est activé que dans une exécution CommonJS où `module` existe.

Le test Node utilisait `createRequire()` et `require()` puis déstructurait `run`; sous une résolution ES Module, ce résultat ne fournit pas nécessairement `run`. Les sept tests pouvaient donc échouer avant même l'appel métier.

## Décision
Les tests importent le diagnostic pour ses effets (`await import(...)`) et lisent le contrat public `globalThis.__radarS14Q.run`. L'application reste inchangée. Vérification automatique dans les deux contextes de résolution Node (`package.json` avec et sans `type: module`).

## Portée
Cette correction prouve uniquement la compatibilité du harnais de test. Elle ne constitue pas une validation des performances ou de la consommation mémoire du navigateur. Les mesures S14-Q doivent toujours être exécutées dans Chrome.
