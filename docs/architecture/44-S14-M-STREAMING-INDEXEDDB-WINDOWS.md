# S14-M — Ingestion événementielle et consultation fenêtrée (pilote)

## Contexte et correction de trajectoire

Le catalogue ISO ne doit jamais être intégralement chargé en mémoire pour afficher une grille. La virtualisation de `w2grid` n'est pas une stratégie de stockage ; elle doit être couplée à des accès IndexedDB paginés.

## Contrats implémentés

- `__radarIsoStreamDistribution.importEndpoint(endpoint, {onProgress, signal})` : lit le pointeur et le manifeste de distribution S14-I, ouvre un seul jeu HTTP à la fois, ingère en flux.
- `__radarIsoStreamCore.ingestStream()` : détecte les octets gzip, décompresse si nécessaire, décode le JSONLines en UTF-8, parse un document par ligne et transmet des lots de 300 au stockage. Empreintes SHA-256 incrémentales sur le contenu brut et sur gzip quand reçu compressé, nombre et taille contrôlés avant activation.
- `__radarIsoWindowed.importRelease()` : écrit dans une génération IndexedDB inactive, puis change le pointeur `active` dans une transaction courte. Erreur de chargement ou d'intégrité : aucune activation.
- `__radarIsoWindowed.page({type, limit, after, dimension, value, search})` : lecture par curseur, limite 500 lignes ; `after` est une clé IndexedDB qui ne doit pas servir de lien sérialisé durable. Aucun `getAll()` du catalogue.
- `__radarIsoWindowed.current()` : version active ; `purgeGeneration()` : nettoyage explicite, interdit sur la version active.

## Séparation des stockages

Le pilote écrit dans une base **distincte** `standardisation-radar-iso-windowed`, afin de préserver la base historique `standardisation-radar-iso-cache`. Aucune modification des registres métier, blips, radars, révisions ou catalogues utilisateur. L'application actuelle continue d'utiliser son ancienne base tant que l'adaptateur `w2grid` n'a pas été migré et validé.

## Limites connues et engagements non encore tenus

- La connexion automatique des vues Sidebar/Grid/Form au nouveau fournisseur fenêtré **n'est pas encore faite**. Il faut adapter la recherche, le tri, les compteurs et la navigation ICS/TC-SC à la base paginée avant de supprimer `readAll()`.
- Recherche texte dans `page` : parcours en curseur (mémoire bornée, coût proportionnel à la base), non index plein texte. Prévoir un index inversé ou un service distant selon les mesures réelles.
- Les tests Node simulent 81 768 entrées et vérifient les lots, le hachage, les erreurs de contenu et le format gzip. La transaction IndexedDB réelle et le comportement de la grille restent à vérifier dans Chrome sur la publication du 9 novembre.
- Le stockage de deux générations peut temporairement nécessiter de l'espace supplémentaire. Les quotas sont à mesurer sur les cibles déployées. Un échec ne doit jamais effacer l'ancienne génération.
- Pour les futures SDO, isoler les profils de schémas ; `ics` et `ownerCommittee` sont spécifiques au profil ISO, pas imposés au contrat SDO général.
- Une édition RSS ou un journal d'évolutions reste une ressource séparée, sans modification des blips.

## Validation manuelle non destructive

Après installation et actualisation, depuis la console de Chrome sur la page du radar (répertoire `catalog-distribution` servi par Vite) :

```js
const result = await window.__radarIsoStreamDistribution.importEndpoint('/catalog-distribution/', {
  onProgress: p => console.log('ISO pilot', p)
});
console.log(result);
const first = await window.__radarIsoWindowed.page({limit:100});
const next = await window.__radarIsoWindowed.page({limit:100,after:first.next});
console.log({first:first.records.length,next:next.records.length,release:first.release});
```

Cette validation peuple uniquement le **nouveau cache pilote** et ne modifie pas les grilles historiques. Pour le connecter à w2ui, les réponses doivent être consommées comme fenêtres et non reconstruites avec un `getAll`.

## Décisions

Les décisions d'identité, de cycle de vie et de distribution ouvertes demeurent ouvertes. Le présent document décrit une implémentation candidate, pas une adoption définitive de l'API.
