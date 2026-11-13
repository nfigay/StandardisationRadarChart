# 80 — S14.3-A8.1 : premiers profils du socle commun

## Références

- Architecture 79 et DEC-019.
- Baseline documentaire efffba3.
- Exigences CPV-02, CPV-03 et CPV-11.
- Guidelines G01, G04, G06, G07 et G08.

## Périmètre

Cette étape introduit les profils dans l'application
historique radar.html.

Elle ne crée pas de nouvelle application Viewer.

Le Creator et le Publisher constituent une seule
famille fonctionnelle.

## Bootstrap transitoire

Le module radar-application-profile.js est chargé
synchroniquement avant les scripts classiques.

Cette adaptation est nécessaire pendant la migration
des dépendances globales et de l'initialisation HTML.

Le registre de capacités est indépendant des libellés UI.

La migration vers un point d'entrée ES6 commun
reste un objectif des travaux de composition.

## Profils

radar.html conserve le profil Creator par défaut.

radar.html?profile=viewer active le profil Viewer.

Une configuration inconnue ou ambiguë refuse les
capacités par défaut.

Le paramètre URL est réservé à cette étape de
développement. Il ne constitue ni une authentification,
ni un contrôle d'accès à des données distribuées.

## Composants conservés

- Layout et menus W2UI.
- Radar SVG/D3.
- Graphe interactif Cytoscape.
- Adaptateur catalogue natif.
- Explorateur du workspace.
- Formulaire de détail des blips.
- Session de révisions.
- Synchronisation du viewport existante.

Aucun moteur de présentation alternatif n'est ajouté.

## Contrat de données

Le Viewer commun ouvre le catalogue natif 1.0.0,
directement ou via l'enveloppe existante.

Cette première étape exige des révisions publiées.

Le catalogue doit être préparé en amont.

Cette validation ne réalise pas encore la projection
sélective des attributs ou des autres connaissances.

Le format experimental v2 n'est pas le contrat
natif du Viewer commun.

## Contrôle des capacités

Les menus sont filtrés avant la création du toolbar.

Les commandes legacy vérifient le profil avant
leurs protections de révision existantes.

Les services de création, persistance, administration,
transition et suppression vérifient les capacités.

Le Viewer n'offre pas la dérivation d'un brouillon.

Les blips sont non déplaçables.

Le formulaire de détail est réutilisé avec un record
copié, des champs désactivés et sans action Save.

Le Viewer ne capture pas les mutations du graphe
courant dans les snapshots de session.

## Catalogue ISO

L'administration ISO et son initialisation sont
désactivées dans cette première configuration Viewer.

Les composants de consultation des références locales
devront être rendus configurables lors de la suite A8.2.

## Cycle de vie

La confirmation beforeunload existante est conservée.

L'ouverture utilise le sélecteur de fichier historique.

Un catalogue déjà ouvert conserve les protections
existantes contre le remplacement implicite.

Le service partagé de fermeture de workspace
reste à compléter dans A8.2.

## Limites

Cette étape ne constitue pas la distribution finale.

Le code legacy d'édition reste physiquement présent.

La sélection de modules et la projection des données
sont traitées dans les lots ultérieurs.

Les protections applicatives ne constituent pas
une frontière de sécurité contre les DevTools ou
la modification volontaire du code par le destinataire.

La couverture de tous les chemins legacy doit être
complétée par la recette et la revue de A8.2.

Les exigences CPV-02, CPV-03 et CPV-11 ne sont
pas déclarées entièrement satisfaites.

## Validation

Les tests doivent exercer les vrais services,
les profils, la sélection de révisions,
les refus de mutation et le formulaire partagé.

Le Creator doit conserver les comportements
historiques et réussir la suite de non-régression.

La qualification navigateur reste nécessaire.

## Suite

A8.2 complète la consultation des références,
la navigation, les dialogues et le cycle de vie.

A8.3/A8.4 intègre les objets de publication et
la projection configurable du modèle natif.

## Validation A8.1-A-R1

<!-- A8.1-A-R1-VALIDATION -->

La première intégration A8.1-A a réussi sept
nouveaux tests du socle applicatif commun.

Quinze tests historiques de menus ont échoué
car leurs environnements VM ne chargeaient pas
le nouveau bootstrap de profil.

La correction R1 adapte les environnements de
test pour charger le véritable registre de
capacités de l'application.

Les assertions historiques sont conservées.

Cinq tests complémentaires couvrent :

- le bootstrap Creator ;
- la conservation du profil Viewer ;
- le garde du contrôleur HTML ;
- la politique de commandes Creator ;
- le refus des capacités pour un profil inconnu.

La suite complète a été exécutée avec succès :
476 tests réussis, aucun échec.

Les contrôles applicatifs introduits par A8.1-A
restent inchangés.

Le test du garde HTML ne constitue pas une
qualification exhaustive des menus W2UI.

Deux catalogues natifs de recette sont préparés :
deux révisions publiées, puis une variante
négative contenant un brouillon.

La recette navigateur reste nécessaire.

Les exigences CPV-02, CPV-03 et CPV-11 restent
partiellement couvertes.

Le prototype Client A6/A7 et sa distribution
publique restent inchangés.

## Qualification navigateur et clôture A8.1

<!-- S14.3-A8.1-CLOSURE -->

### Baseline

- Baseline de développement : efffba3.
- Suite automatisée : 476 tests réussis.
- Vérification Git : aucune anomalie.
- Distribution historique vérifiée : source 6b969f3.

### Rapport navigateur initial

Référence : A8.1-VIEWER-SMOKE.

Le Viewer est initialisé à partir de radar.html
avec le paramètre de développement profile=viewer.

Le rapport confirme la présence de W2UI,
du layout historique, de Cytoscape, du SVG,
des services catalogue et de l'explorateur.

Deux révisions natives sont enregistrées.

La révision active contient le blip b2,
aux coordonnées 500,300, non déplaçable.

### Rapport navigateur consolidé

Référence : A8.1-VIEWER-CONSOLIDATED.

Environnement : Chrome, serveur Vite local,
port 5174.

Catalogue : catalogue-publie.json, contenant
deux normes et deux révisions publiées.

| Groupe | Blip | Position | Navigation | Verrouillage |
|---|---|---|---|---|
| CATALOG_REVISION_0 | b1 | 310,325 | OK | OK |
| CATALOG_REVISION_1 | b2 | 500,300 | OK | OK |

Les deux navigations sont réussies.

La révision initiale CATALOG_REVISION_1
est restaurée.

Le rapport ne contient aucune erreur.

Les composants W2UI, SVG, Cytoscape et
le service de synchronisation du viewport
sont présents.

### Formulaire commun

Le formulaire W2UI blipForm est réellement
présent dans le navigateur.

Ses 14 champs sont désactivés :

id, label, ring, quadrant, name, hasBlip,
description, Priority, Status Version,
Responsible, specialisation, type,
working_group et radarchart.

Le formulaire ne contient aucune action.

La toolbar associée est vide.

### Menus inspectés

Le menu principal contient exclusivement :

- Fichiers : Ouvrir un catalogue JSON ;
- Outils du radar : Sélectionner une révision ;
- Langage : Français et English.

La toolbar de révisions contient les deux
révisions natives.

Aucun contrôle de mutation n'est présent
dans les menus et toolbars inspectés.

### Capacités

Les capacités suivantes sont autorisées :

- catalog.open ;
- radar.navigate ;
- radar.consult.

Les huit capacités suivantes sont refusées
par le registre lors de la recette :

- catalog.create ;
- catalog.admin ;
- radar.edit ;
- radar.createBlip ;
- revision.create ;
- revision.publish ;
- workspace.remove ;
- publication.create.

Les tests automatisés couvrent également
des appels directs aux services de mutation.

### Portée de la validation

A8.1 établit une première réutilisation
effective de l'application historique.

Les exigences CPV-02, CPV-03 et CPV-11
sont en cours de réalisation.

Les preuves obtenues ne couvrent pas
intégralement leurs critères d'acceptation.

Restent à qualifier dans A8.2 :

- le comportement complet du Creator ;
- le refus d'un brouillon via le sélecteur
  de fichiers réel ;
- le redimensionnement interactif ;
- la confirmation de fermeture ;
- la consultation des références distribuées ;
- la fermeture et le remplacement du workspace.

La présence du service de viewport ne prouve
pas à elle seule l'alignement graphique
lors d'un redimensionnement.

La recette des menus inspectés ne constitue
pas une preuve exhaustive de tous les chemins
legacy possibles.

Le Viewer reste un profil de développement.

La projection sélective des connaissances et
l'exclusion physique des modules sont hors
du périmètre A8.1.

### Décision de clôture

A8.1 est clôturé au niveau de son périmètre
d'intégration initial.

La suite porte sur A8.2 : consultation
commune et cycle de vie applicatif.

Les distributions publiques historiques
restent inchangées jusqu'à une publication
explicitement qualifiée.

## Qualification pilote : fidélité de la persistance

<!-- A8.1-RELEASE-2-R2-PERSISTENCE -->

### Anomalie constatée

La recette du Creator autonome a révélé
une multiplication des brouillons lors
de la sauvegarde d'un radar modifié.

Une collision a également été observée :

Catalog persistence: draft revisionId
collision: rev-2:draft:local.

### Cause identifiée

Le modèle natif autorise des blips sans
propriétés context et extensions.

La projection Cytoscape représente ces
propriétés par des objets vides.

La conversion inverse ajoutait ces valeurs
au blip natif même si celui-ci n'avait
subi aucune modification métier.

La comparaison par JSON.stringify
considérait alors une révision publiée
inchangée comme modifiée.

Le mécanisme historique de dérivation
automatique pouvait créer un brouillon
superflu ou entrer en collision avec
un brouillon explicitement créé.

### Contrat de persistance

- Un brouillon existant conserve son identité
  lors de la modification et de la sauvegarde.
- Une révision publiée inchangée reste intacte.
- Une projection graphique ne doit pas créer
  de modification métier artificielle.
- L'absence ou la valeur nulle des métadonnées
  facultatives est préservée lorsque le graphe
  ne contient que leur valeur vide par défaut.
- L'ordre des propriétés des objets JSON
  n'est pas significatif pour la comparaison.
- L'ordre des tableaux reste significatif.
- Les modifications réelles des données
  restent détectées.
- Les contrôles de collision restent actifs.

La correction est portée par le service
commun radar-catalog-persistence.js.

Aucun service spécifique au standalone
n'est introduit.

### Non-régression

Sept tests supplémentaires couvrent :

1. La révision publiée inchangée.
2. Les sauvegardes répétées du brouillon.
3. La suppression et la recréation du brouillon.
4. La sauvegarde et la réouverture JSON.
5. Les métadonnées facultatives et l'ordre
   des propriétés.
6. Les véritables modifications et collisions.
7. L'archivage d'une révision inchangée.

Avant correction : six échecs, un succès.

Après correction : sept succès.

Suite complète : 483 tests réussis.

### Limites

Les nouveaux tests utilisent les véritables
services applicatifs et des doubles de test
pour le graphe et les composants W2UI.

La recette navigateur de la sauvegarde réelle,
de l'intégrité de l'artefact téléchargé et
de sa réouverture reste nécessaire.

Le générateur HTML autonome est toujours
un outil de construction pilote.

Sa consolidation dans les sources et la
publication des artefacts qualifiés restent
à effectuer.

<!-- A8.1-R3-FINAL-VALIDATION -->

Validation finale R3 : 488 tests réussis.

L’assertion historique S14-K-R3 a été actualisée
pour refléter le nouveau contrat de présentation :
un libellé personnalisé remplace le numéro automatique.
Les identifiants techniques et les protections
des révisions restent inchangés.

La recette utilisateur R2 a confirmé la sauvegarde
et la réouverture des modifications d’un brouillon.

## Qualification pilote : ressources ICS autonomes

<!-- A8.1-RELEASE-2-R4-ICS -->

La recette R2/R3 confirme la sauvegarde,
le renommage et la réouverture des catalogues.

Le Creator autonome utilisait encore un téléchargement
PapaParse par XMLHttpRequest pour le CSV ICS.
Le protocole file:// bloquait cette requête.

R4 utilise le mécanisme fetch embarqué en standalone
puis analyse directement le contenu CSV.
Le téléchargement historique reste inchangé sur serveur.

Trois tests couvrent le mode autonome, le mode serveur
et le traitement des ressources manquantes.
Suite complète : 491 tests réussis.

La consultation effective du corpus ISO et ICS
reste à confirmer dans le navigateur hors ligne.

## Qualification pilote : installation ISO embarquée

<!-- A8.1-RELEASE-2-R5-ISO -->

La recette R4 confirme le chargement de la classification ICS.
Le catalogue ISO reste vide car le client refuse les URL file://.

R5 introduit une adresse virtuelle HTTPS réservée :

`https://standalone.invalid/StandardisationRadarChart/catalog-distribution/`

Cette adresse est résolue par le mécanisme fetch embarqué.
Elle ne désigne aucun serveur externe.

Le Creator autonome accepte uniquement son catalogue intégré.
Les validateurs historiques HTTP/HTTPS sont conservés sur serveur.

Le moteur streaming, les manifestes, les empreintes SHA-256,
la décompression et l’activation IndexedDB restent inchangés.

Trois tests complémentaires couvrent la validation des adresses,
la compatibilité serveur et le chemin client/importateur.

Suite complète : 494 tests réussis.

L’installation réelle et la consultation dans Chrome
restent à confirmer avant publication.

## Qualification et distribution pilote R5

<!-- A8.1-PILOT-R5-QUALIFICATION -->

La recette utilisateur confirme :

- Modification et sauvegarde des brouillons.
- Réouverture des catalogues modifiés.
- Renommage et conservation des libellés.
- Consultation du Viewer commun.
- Chargement autonome de la classification ICS.
- Installation des 81 768 notices ISO embarquées.
- Consultation du catalogue par fenêtres.
- Réutilisation du catalogue ISO après rechargement.

La suite automatisée comporte 494 tests réussis.

Le générateur des applications autonomes est
consolidé dans scripts/build-common-standalone.mjs.

La génération utilise le commit Git complet
comme provenance de chaque application.

Commande de reconstruction :

1. npm run build:pages
2. npm run verify:pages
3. PILOT_DIR=<dossier-existant> node scripts/build-common-standalone.mjs

Le dossier de sortie doit être vide pour les HTML.

Les deux applications autonomes sont destinées
à une GitHub Release pilote, avec les exemples
de catalogues et les empreintes SHA-256.

Les distributions historiques sont maintenues
sur GitHub Pages pendant la convergence.

Points de vigilance :

- Première installation ISO relativement longue.
- Cache navigateur dépendant du contexte local.
- Amélioration du suivi de progression.
- Repli sur le titre anglais à améliorer.
- Pas de qualification exhaustive réseau coupé.
- Publication configurable A8.2 et suivantes
  non encore réalisée.

Les profils communs constituent une séparation
fonctionnelle, non une frontière de sécurité.
La réduction physique des modules Viewer
reste prévue dans les lots suivants.

Cette version est destinée à la collecte
des besoins auprès des utilisateurs pilotes.
