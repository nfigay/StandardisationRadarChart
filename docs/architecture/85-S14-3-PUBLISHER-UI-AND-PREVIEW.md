# 85 — S14.3-A8.5 : Publisher intégré et première composition Viewer

## Statut

Lot candidat fondé sur A8.4 qualifiée (568 tests, preuve 05). A8.2 reste la
version publique. Cette livraison implémente le dialogue métier, une
prévisualisation réelle et la composition d'un premier HTML candidat ; la
qualification navigateur complète et la livraison traçable A8.6 restent ouvertes.
DEC-019 et architecture 79 restent normatifs. Aucun troisième produit Publisher.

## 1. Interface et état

`radar-publication-ui.js` expose `__radarPublicationUI.open(graph)` et s'intègre
au bouton Publications de l'explorateur, uniquement avec `publication.create`.
Le dialogue natif est un composant modal au sein du workspace W2UI (pas un
second layout). Il utilise les services de persistance A8.3/A8.4 : création,
édition optimiste, archivage/réactivation, suppression sans historique,
consultation de l'historique, vérification et export JSON. Aucun stockage
parallèle. Enregistrer la définition modifie le catalogue métier ; son export
natif est toujours nécessaire pour la sauvegarde durable.

Les sélections sont dérivées des révisions publiées et des organisations et
portefeuilles de `build(graph)` ; les identifiants sont stables. Une sélection
archivée devenue indisponible est affichée par son identifiant, pas supprimée
silencieusement. La règle choisie détermine les identifiants pertinents.
Les capacités Viewer de base sont fixes, les options futures non inventées.
Tous les nouveaux libellés utilisent le namespace `menu.publisher` i18next
FR/EN ; un changement de langue actualise les textes, pas les contrôles.
Les erreurs techniques sont journalisées, les messages utilisateur localisés.
Les opérations asynchrones vérifient l'identité du catalogue et les versions ;
la fermeture avec saisie non enregistrée demande d'enregistrer ou annuler.

## 2. Projection et prévisualisation

Le bouton Vérifier utilise `preparePublicationProjection` et affiche périmètre,
compteurs, empreinte, limites et avertissement de relecture. Le bouton Exporter
utilise le service JSON A8.4, sans créer de livraison. La prévisualisation
recalcule la projection puis transmet seulement une enveloppe minimale
`{schemaVersion:1,presentation,catalog,projectionDigest}`. La présentation
contient titre, langue initiale, visibilité du panneau de références.
Aucune définition, historique, audience, description privée, digest source ou
rapport d'auteur n'est transmis au Viewer.

`radar-publication-viewer.js` réutilise `CatalogUI.load`, `remember`,
`WorkspaceExplorer.addCatalog/activate` et le véritable radar W2UI/Cytoscape.
Il valide le profil Viewer, l'enveloppe, l'empreinte canonique et l'absence de
workspace avant le chargement ; il applique la langue, le titre et la visibilité
des références, puis sélectionne la première révision. Pas de mutation de la
source. Les deux espaces de travail sont distincts.

- En HTTP(S), un iframe charge le même point d'entrée avec `profile=viewer`
  et `publicationPreview=1`. Le parent transmet la projection seulement après
  un message de disponibilité de cette fenêtre et vérification de l'origine.
  Le Viewer répond sur succès/échec ; fermeture supprime l'iframe et l'écouteur.
- En standalone, le modèle Viewer est fourni par la construction, et l'iframe
  `srcdoc` reçoit le HTML composé et la même enveloppe. Le bootstrap de
  ressources gère l'URL `about:srcdoc` avec sa base virtuelle.

L'iframe est sandboxée scripts/same-origin pour compatibilité du socle. Ce
n'est **pas** une frontière de sécurité contre du code même origine malveillant ;
la non-divulgation repose sur la projection et les ressources réellement
transmises, non sur le sandbox. Le panneau de références désactivé ne supprime
pas les données éventuellement autorisées par la politique documentaire.

## 3. Première composition HTML (préparation A8.6)

Le générateur de développement construit d'abord le Viewer commun autonome,
avec son point d'insertion unique `RADAR-PUBLICATION-PAYLOAD`. Il embarque les
**octets** de ce modèle (base64, bloc non exécutable) uniquement dans le Creator.
Le Viewer générique ne contient pas cette ressource ni le corpus ISO global.
Le navigateur assemble une copie du modèle avec l'enveloppe encodée UTF-8/base64
(non exécutable, pas d'interpolation de données dans le JavaScript ou HTML).
Le modèle est généré depuis les mêmes sources et la même provenance que le
Creator candidat. Le fichier téléchargé s'ouvre directement, vérifie le digest
canonique et charge le catalogue projeté. L'option est proposée uniquement pour
standalone + embedded dans un Creator disposant du modèle. Le téléchargement
est un candidat, aucun enregistrement PublicationRelease automatique.

Coût : le Creator autonome augmente d'environ la taille base64 du Viewer ;
à mesurer dans la construction locale. Les scripts d'administration et les
ressources historiques du Viewer commun (ICS.csv, lib/dataset.json, données
legacy publiques) ne sont pas encore exclus physiquement. Aucun catalogue
d'auteur ne doit être ajouté. Le code et les données livrés restent inspectables.

## 4. Qualification et limites

Tests de contrat : lecture et configuration, FR/EN, édition/archivage, périmètre,
isolement, enveloppe, Unicode et fermeture HTML, digest, chargement du vrai
service Viewer, transport de prévisualisation et composition. Le test complet
du navigateur et du générateur autonome nécessite les dépendances locales et
la recette Chrome. L'HTML préchargé est un premier candidat fonctionnel, pas
une garantie de livraison finale, de parité graphique ou de fonctionnement
hors ligne déjà qualifiés. La vérification des octets, le manifeste et le
registre des livraisons effectives sont A8.6. Exclusion physique et modes
bundled/modules : A9. Les contextes libres, relations génériques et évaluations
complètes restent hors contrat A8.4. Le catalogue exemple contient un instantané
ISO explicitement synthétique pour tester la consultation sans prétendre fournir
une notice officielle. Les sources ISO réelles restent à qualifier séparément.

## 5. Traçabilité

CPV-01/04 : interface candidate, modèle déjà qualifié ; CPV-07/10 : première
implémentation, parité et génération réelle à vérifier ; CPV-05/08/09/12 :
portes de livraison encore ouvertes. Voir plan de réalisation et registre
des exigences, preuve 05 et qualité 02. Les baselines historiques sont conservées.

### Validation préparatoire

15 nouveaux tests de contrat réussis ; 578 tests exécutables réussis sur
l'instantané. Cinq tests Client dépendant de Vite non exécutés ici, soit
583 tests attendus sur le dépôt réel. Le navigateur de l'environnement de
préparation refuse les navigations locales : aucun succès Chrome de ce lot
n'est déclaré. Le build Pages et la génération avec esbuild sont à réaliser
par l'installateur, puis la recette sur le Mac.

### A8.5-R1 — contrat de démarrage et preuve distincte de la navigation

La recette Chrome du 14 novembre 2026 confirme le chargement automatique
du catalogue projeté (digest `c866884873a79a06ec4e48f7a3f04e63b4c7c867bf7442c9fa2c123c2a8aa31c`),
deux groupes, le profil Viewer, le titre et la langue FR, un graphe actif,
l'absence du corpus ISO global et le refus d'administration. Le rapport
montre cependant `rev-3` active et non `rev-1`. Le second rapport confirme
la cohérence session/explorateur/graphe, mais ne permet pas de déterminer
si la navigation a eu lieu pendant le démarrage ou après une interaction.
Aucune cause liée à i18next ou W2UI n'est affirmée sans reproduction.

R1 fait de la sélection initiale la dernière opération du chargement, après
les actualisations de présentation. `__radarPublicationViewer.startupStatus()`
renvoie une copie détachée de la preuve enregistrée à cet instant : digest,
groupe et révision attendus, groupes actifs session/explorateur, révision
effective et résultat. `null` avant démarrage. Une divergence à cet instant
fait échouer le chargement. La preuve ne change pas lors de la navigation
ultérieure ; l'état courant reste fourni par la session et l'explorateur.
Ce n'est ni une signature cryptographique ni une preuve de fonctionnement
hors connexion. Le test de régression simule une sélection intervenant
pendant les actualisations et vérifie la sélection finale ; un second test
contrôle la preuve après navigation et sa copie détachée. Le lot A8.5 reste
candidat jusqu'à recette du Publisher et du Viewer généré dans Chrome.

### Qualification A8.5-R1 — 14 novembre 2026

585/585 tests et recette Chrome Publisher 9/9 sans anomalie signalée. Le démarrage en rev-1 et la consultation ISO synthétique du Viewer généré sont confirmés. Voir [preuve 06](../evidence/06-A85-R1-PUBLISHER-VALIDATION.md). Qualification limitée au parcours décrit ; fonctionnement physiquement hors connexion, contrôle des octets livrés et registre des livraisons restent ouverts.
