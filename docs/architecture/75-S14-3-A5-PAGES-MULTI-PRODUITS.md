# S14.3-A5-R2 — Publication GitHub Pages multi-produits

## Objectif

Publier deux produits séparés dans un même site :

- `/radar.html` : entrée historique du Créateur ;
- `/author/radar.html` : entrée explicite du Créateur ;
- `/client/client.html` : Client isolé ;
- `/release-manifest.json` : provenance et empreintes.

## Processus

GitHub Actions exécute :

1. Build Pages historique avec catalogue ISO.
2. Création du redirect index.html existant.
3. Build Client isolé.
4. Assemblage author/client avec manifeste SHA-256.
5. Création d'une arborescence Pages distincte.
6. Vérification du site final.
7. Publication de cette arborescence via GitHub Pages.

## Protection

Le build historique `.radarchart-build/pages` n'est pas
modifié par le préparateur multi-produits.

Le dossier final `.radarchart-build/pages-multiproduct`
n'est jamais écrasé.

Le Client n'embarque pas le catalogue ISO global.

Le manifeste est vérifié dans l'arborescence finale.

Les caches locaux, IndexedDB et sauvegardes ne sont
jamais impliqués dans la publication.

## Limites

Le Créateur sous `/author/` utilise encore certaines
ressources absolues à la racine du site.

Cette variante n'est donc pas encore un déploiement
Créateur indépendant sur un domaine quelconque.

La véritable version standalone hors ligne et la
distribution modulaire restent à construire.

La vérification du build est statique. Après déploiement,
une recette HTTP et navigateur doit contrôler
les chargements de ressources et les opérations.

## Recette

- `/radar.html` reste fonctionnel ;
- `/author/radar.html` ouvre le Créateur ;
- `/client/client.html` ouvre le Client ;
- aucune requête du Client vers le catalogue global ;
- le manifeste correspond aux fichiers déployés ;
- la sélection d'une roadmap publiée fonctionne.

## Correction R1 — Index local facultatif

Le build Vite historique ne génère pas lui-même
`index.html`. Ce fichier est habituellement créé par
une étape ultérieure du workflow GitHub Pages.

Le préparateur réutilise le fichier s'il existe et
produit, sinon, la redirection historique dans la
seule arborescence finale.

Le build d'origine reste inchangé et un test couvre
explicitement ce cas.
