# S14-Z — Gestion simplifiée des sources et publication GitHub Pages

## Architecture implémentée

La présentation **Catalogue ISO** masque l'ancien dialogue « Gérer les sources » sans supprimer les commandes du panneau. Une commande principale demande au client installé de synchroniser le **catalogue distribué** et utilise son résultat structuré `window.__radarLastCatalogSync` ; un résultat `unchanged` n'est pas interprété comme une modification. Les commandes de chargement local, JSONLines, journal, RSS et reconstruction de vues sont conservées dans la partie *Administration avancée*. Toutes les données non fiables sont rendues avec `textContent`.

Ce lot ajoute une couche de présentation en script classique ; il ne modifie ni le stockage IndexedDB ni la sémantique des imports existants. Il ne corrige pas les insuffisances intrinsèques des anciens imports. Il ne transforme pas Vite en producteur de catalogues.

## Publication GitHub Pages

`vite.config.js` configure déjà `base: '/StandardisationRadarChart/'` en mode pages. `npm run build:pages` écrit `.radarchart-build/pages/`, puis `npm run verify:pages` vérifie des ressources statiques. Le workflow `.github/workflows/radar-pages.yml` reconstruit cet artefact dans GitHub Actions et le publie via l'API Pages **uniquement sur déclenchement manuel**. La validation stricte refuse la publication si `ICS.csv` manque ou si aucun catalogue public HTTPS n'est configuré, afin de ne pas supprimer la source ICS actuellement hébergée sur ce même site. Aucune collecte ISO ne s'exécute dans ce workflow.

**Attention :** l'artefact applicatif n'inclut pas automatiquement `catalog-distribution/releases`. Il faut fournir une URL de catalogue HTTPS dans `radar-catalog-config.json` et déployer une release de catalogue séparément, ou ne publier qu'une démonstration sans initialisation ISO. Les droits de redistribution ISO/ICS sont à contrôler par le producteur avant publication ; la présence sur GitHub Pages n'est pas une autorisation.

## Traçabilité et validations

- **Validé dans les versions précédentes** : 81 768 normes et 810 comités dans IndexedDB, requêtes fenêtrées, filtrage et tri global, groupes booléens testés par Node.
- **À valider pour S14-Z** : nouvelle fenêtre de sources dans Chrome, déclenchement de synchronisation, cas `unchanged`, `not-published` et erreur.
- **À valider pour Pages** : build de la version exacte du dépôt, action GitHub, paths relatifs, configuration réseau, CORS et onboarding d'un navigateur vierge.
- **Non réalisé** : déploiement d'un service de catalogue public, résolution de la provenance et des droits du CSV ICS, journal d'évolutions réel et intégration ISO-standard-blip.

Les décisions `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017` et `DEC-018` restent ouvertes. Ne pas assimiler une livraison du dialogue à une clôture de ces décisions.
