# S14.3-A6/A7 — Trois distributions Client

<!-- S14.3-A8.0-COMMON-ARCHITECTURE -->

## Statut révisé — S14.3-A8.0

Ce document décrit les réalisations historiques A6/A7.

Les trois variantes techniques et leurs tests constituent
des acquis, mais leur moteur de présentation spécifique
n'est pas l'architecture cible du Viewer.

L'application client.html et le module roadmap-client.mjs
constituent un prototype expérimental minimal.

Le développement fonctionnel spécifique de ce prototype
est gelé au profit de la convergence vers le socle commun.

La projection experimental v2 reste une référence
d'échange minimale et de validation.

Elle ne constitue pas le modèle natif de publication
des futurs espaces de consultation.

Les Viewers cibles seront produits depuis l'application
unique Creator/Publisher, avec les composants communs.

Voir :

- [Architecture 79](79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md)
- [Guidelines](../governance/GUIDELINES-CREATOR-PUBLISHER-VIEWER.md)
- [Plan de convergence](../governance/PLAN-REALISATION-S14-3-CREATOR-PUBLISHER-VIEWER.md)

Les résultats historiques de construction et de
publication décrits ci-dessous restent inchangés.

Les contrôles HTTP positifs sur 19 ressources ont
également été validés.

La qualification navigateur complète reste ouverte.


## Contexte

La livraison R3, issue du commit 2a17678,
a etabli la separation entre les sources main
et les distributions gh-pages.

La recette HTTP publique R3 a confirme
l'integrite des seize ressources principales,
sans anomalie.

A6/A7 realise les trois distributions Client,
sans changement du contrat metier de roadmap.

## Architecture retenue

Le Client utilise les memes sources dans les
trois modes :

- client.html : structure et styles.
- js/roadmap-client.mjs : validation et rendu.
- src/domain/roadmap-published-projection.mjs :
  projection des revisions publiees.

Le contrat experimental v2 est conserve.

Les positions restent exprimees dans le repere
800 x 800 du Createur.

Les trois variantes ne sont pas trois moteurs
independants.

Aucun catalogue ISO global, service d'edition
ou service de persistance Createur n'est inclus.

## Distribution standalone

Point d'entree :

client/standalone/radar-client.html

Un seul fichier HTML contient les styles et
le bundle JavaScript de l'application.

Le polyfill Vite modulepreload est desactive.

Le bundle est execute dans une fonction
isolee en mode strict.

Le generateur refuse les imports dynamiques,
les ressources externes et les dependances
reseau detectees.

L'utilisateur ouvre un paquet de roadmap
publiee depuis son systeme de fichiers.

L'objectif est une utilisation sous file://,
sans serveur et hors ligne.

La construction validee produit un fichier
de 9262 octets.

La recette navigateur sous file:// reste
necessaire pour qualifier son fonctionnement.

## Distribution packagee

Points d'entree :

client/bundled/index.html
client/bundled/radar-client.js

Le JavaScript est identique au bundle Vite
du point d'entree historique.

La variante contient exactement un HTML et
un fichier JavaScript, avec des noms stables.

Les chemins sont relatifs.

Cette distribution est destinee a un serveur
HTTP statique.

## Distribution ES6 native

Points d'entree :

client/modules/index.html
client/modules/js/roadmap-client.mjs
client/modules/src/domain/roadmap-published-projection.mjs

Les modules sont copies sans transformation.

Le generateur verifie la fermeture actuelle
des imports.

Aucun bundling n'est applique.

Les imports relatifs d'origine sont conserves.

Le serveur HTTP doit fournir un type MIME
JavaScript valide pour les fichiers .mjs.

## Compatibilite historique

client/client.html et son bundle Vite
restent disponibles.

Les trois nouvelles variantes sont produites
avant le calcul du manifeste Client.

Le verificateur historique reste compatible
avec les anciennes fixtures simples.

Le verificateur du site exige les trois
variantes Client completes.

Le radar PLM historique et les entrees
Createur restent accessibles.

## Construction

La chaine execute :

1. Build Vite Client.
2. Generation des trois variantes.
3. Generation du manifeste Client.
4. Verification du Client.
5. Assemblage multi-produits.
6. Preparation du site intermediaire.
7. Construction et verification de dist/.

Le manifeste Client couvre huit fichiers.

Le produit Client contient neuf fichiers
en comptant son manifeste.

Le contrat distributions.json declare les
trois modes Client disponibles.

Les trois modes Createur restent planifies.

Le portail est genere a partir du contrat.

## Hygiene de distribution

Les ressources historiques sont filtrees
avant le calcul des manifestes.

Les fichiers .DS_Store, les sauvegardes
.s14-*-backup et les fichiers .bak ne sont
plus copies dans les distributions.

Le verificateur du site refuse ces fichiers.

Les sauvegardes et caches de developpement
restent intacts.

La validation A6/A7-R2-A a produit :

- Createur : 179 fichiers.
- Client : 9 fichiers.
- Site : 372 fichiers inventories,
  hors site-manifest.json.

## Tests et qualification

La suite complete comporte 464 tests.

Les 17 tests cibles A6/A7 ont reussi.

Les cinq nouveaux tests portent sur :

- build Vite reel et generation des variantes ;
- execution du standalone et du bundle ;
- integrite et equivalence des modules ES6 ;
- detection des artefacts modifies ou manquants ;
- inventaire strict et protection des builds.

Les tests utilisent la fixture metier
historique mutualisee dans tests/fixtures.

Le test DOM simule execute les vrais bundles,
charge une roadmap publiee et controle
le titre, les positions, les anneaux,
la selection du blip et les details de norme.

Les paquets non publies sont refuses.

Le test natif importe les modules distribues
et compare leurs vues aux vues des sources.

La validation DOM simulee ne remplace pas
la recette dans un navigateur reel.

## Publication reutilisable

scripts/publish-web-distribution.sh

Commande npm :

npm run publish:dist

La publication exige une distribution
verifiee dont les trois manifestes
correspondent au commit HEAD.

Le script utilise un depot temporaire
distinct du repertoire de developpement.

Il conserve l'historique gh-pages.

Les fichiers enregistres dans Git sont
extraits et verifies avant publication.

Les branches distantes sont controlees
pour detecter les publications concurrentes.

Le push atomique publie main et gh-pages
ensemble ou refuse l'ensemble de l'operation.

Aucun push force n'est utilise.

La configuration GitHub Pages reste
gh-pages / root.

## Recette finale

La qualification navigateur utilise
un meme paquet exporte depuis le Createur.

Les trois modes doivent afficher les
memes informations et la meme geometrie.

Le standalone doit etre teste sous file://
apres coupure du reseau.

Les variantes HTTP doivent fonctionner
sous le prefixe GitHub Pages.

La recette doit egalement verifier
le Createur, son catalogue ISO et
l'absence de regression du viewport.

## Suite

S14.3-A8/A9 : trois distributions Createur.

Les travaux portent sur les scripts classiques,
la modularisation, les bibliotheques tierces,
l'abstraction des ressources et la persistance.

Le catalogue ISO devra etre disponible dans
le Createur autonome, sans serveur.

La separation metier Createur / Client et
le contrat de roadmap publiee sont conserves.
