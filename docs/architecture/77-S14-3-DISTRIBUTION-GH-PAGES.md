# S14.3-A5-R3 — Distribution Web et branche gh-pages

<!-- S14.3-A8.0-COMMON-ARCHITECTURE -->

## Complément S14.3-A8.0 — portée de l'infrastructure

L'infrastructure main / gh-pages, les manifestes et la
publication logicielle restent valides.

La séparation technique author / client ne doit pas
être interprétée comme une séparation de deux moteurs
applicatifs indépendants.

L'architecture cible est définie dans
[le document 79](79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md).

Le produit author devient le Creator/Publisher.

Les distributions client convergeront vers des Viewers
issus du même socle applicatif.

La publication du logiciel sur GitHub Pages est distincte
de la génération des publications métier depuis le Creator.

Une publication métier destinée à des acteurs spécifiques
peut contenir des données non publiques et ne doit pas
être publiée automatiquement sur GitHub Pages.

Les statuts du contrat de distribution et du portail
doivent distinguer les prototypes et les variantes cibles
effectivement qualifiées.


## Objectif

Produire et publier des distributions executables
distinctes du depot de developpement.

La branche main conserve les sources, les tests,
les scripts de construction et l'architecture.

Le repertoire .radarchart-build/ contient les
constructions intermediaires.

Le repertoire dist/ contient le site final verifie.
Il n'est pas versionne sur main.

La branche gh-pages contient uniquement la
distribution Web finale, a sa racine.

## Deux produits et trois modes

Le Createur assure l'edition, la gestion du catalogue
ISO, des revisions et la publication des roadmaps.

Le Client assure la consultation en lecture seule
d'une roadmap publiee, sans catalogue ISO global.

Chaque produit sera distribue en trois modes :

1. HTML standalone, utilisable directement sous
   file://, sans serveur ni connexion obligatoire.
2. HTML et un unique bundle JavaScript applicatif,
   servis par HTTP.
3. HTML et modules ES6 natifs .mjs non packages,
   servis par HTTP.

Les modes serveur peuvent conserver des ressources
de donnees, de styles ou d'images separees.

Le standalone doit embarquer ses dependances
necessaires au fonctionnement hors ligne.

Le standalone Createur devra notamment embarquer
le catalogue ISO et permettre les sauvegardes
et restaurations par fichiers.

## Etat de la livraison R3

Le Client package satisfait statiquement le
contrat d'un unique bundle JavaScript.

Le Createur Web historique est conserve, sans
etre presente comme un JavaScript unique.

Les cinq autres variantes sont planifiees.

distributions.json decrit les six variantes,
leurs contraintes et leurs points d'entree.

Les variantes planifiees n'exposent pas de faux
executables.

## Compatibilite

La page PLM index.html est conservee a l'identique.

Le portail est disponible dans distributions.html.

Les URLs radar.html, author/radar.html et
client/client.html sont maintenues.

Le Createur sous author/ utilise encore certaines
ressources communes a la racine du site.

Le module de projection des roadmaps publiees
est explicitement inclus dans le build Createur.

Le correctif viewport de l'architecture 76 est
maintenu. Les coordonnees metier ne sont pas
modifiees par les distributions.

## Manifestes

release-manifest.json garantit l'integrite des
deux produits construits.

distributions.json decrit les six variantes.

site-manifest.json couvre tous les fichiers du
site, sauf le manifeste lui-meme, avec leur
taille et leur empreinte SHA-256.

Les octets des fichiers versionnes dans gh-pages
doivent correspondre aux artefacts construits.

## Construction reproductible

Node.js 22.23.5 constitue la reference de
construction locale et CI.

Le fichier .nvmrc fixe cette version.

package.json declare la plage Node.js compatible.

Les prerequis sont controles avant construction.

La chaine construit et verifie le Createur et
le Client, puis assemble les produits, prepare
le site multi-produits et construit dist/.

Les anciens artefacts locaux sont sauvegardes.

## Publication

Le workflow GitHub Actions construit, teste et
archive dist/.

Il ne declenche plus de deploiement Pages direct
et ne modifie pas la branche gh-pages.

La publication initiale est effectuee depuis
un depot temporaire local, avec l'authentification
Git habituelle.

Aucun changement de branche de travail main
et aucun push force ne sont necessaires.

GitHub Pages sera configure sur gh-pages / root
apres verification de la branche distante.

Le fichier .nojekyll evite la transformation
Jekyll des ressources statiques.

Les caches ISO locaux, fichiers de sauvegarde,
tests et metadonnees de developpement ne sont
pas inclus dans les distributions.

## Limites et prochaines etapes

La validation statique des fichiers et des URL
ne remplace pas les essais dans le navigateur.

La recette apres publication couvre le PLM,
le Createur, le viewport, l'export de roadmap,
l'import Client et son isolation ISO.

Les distributions Client standalone et modules
seront implementees ensuite.

Les trois modes Createur necessiteront une
modularisation plus poussee, une abstraction
des ressources et un catalogue autonome.

Les verificateurs de produits devront evoluer
pour couvrir plusieurs modes dans chaque arbre
author et client.


## Correction R1 du contrat de construction

Les tests historiques S14.1 imposaient la publication
directe par actions/deploy-pages et la creation de
.nojekyll dans le build Pages intermediaire.

Ces responsabilites ont evolue avec la decision
de publier les distributions executables depuis
la branche gh-pages.

Les tests conservent les declenchements automatiques
et manuels, le build complet du catalogue ISO et
l'interdiction de recopier manuellement le catalogue
dans le workflow.

Ils exigent desormais :

- la construction et verification des deux produits ;
- l'assemblage dans le bon ordre ;
- le controle strict de preparation du catalogue ;
- la construction et verification de dist/ ;
- la creation de .nojekyll dans la distribution finale ;
- l'archivage de dist/, fichiers caches inclus ;
- l'absence de deploiement Pages concurrent.

Le generateur verifie egalement les ressources
HTML de la page PLM historique.

La presence du module dynamique d'export Client
dans le build Createur est exigee en CI.

La construction locale et la construction CI
utilisent le meme mecanisme de copie des ressources
Vite, sans correction manuelle des artefacts.
