# Guidelines — Creator/Publisher et Viewers

## Statut

Référentiel de développement applicable à partir de S14.3-A8.0.

Ces guidelines complètent les règles de gouvernance existantes.

Références :

- [Architecture 79](../architecture/79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md)
- [Plan de réalisation](PLAN-REALISATION-S14-3-CREATOR-PUBLISHER-VIEWER.md)
- [Checklist de revue](02-REVIEW-CHECKLIST.md)

Les termes DOIT et NE DOIT PAS expriment des exigences.
DEVRAIT exprime une règle dont la dérogation doit être justifiée.

## G01 — Un seul socle applicatif

Le développement DOIT favoriser les composants communs.

Le Creator/Publisher et les Viewers NE DOIVENT PAS
maintenir deux moteurs équivalents pour une même fonction.

Toute duplication transitoire DOIT être identifiée,
motivée et accompagnée d'un plan de convergence.

Le prototype Client A6/A7 est gelé fonctionnellement.

## G02 — Réutilisation avant réimplémentation

Avant de créer un composant, identifier les composants
existants qui répondent à la responsabilité recherchée.

Examiner leurs contrats, dépendances, événements,
états, styles, traductions et tests.

Extraire ou configurer le composant existant en priorité.

Un remplacement nécessite une justification technique,
une stratégie de compatibilité et des tests de parité.

Le nombre de lignes nouvelles n'est pas un indicateur
suffisant de progrès architectural.

## G03 — Une application Creator/Publisher

Les fonctions de publication DOIVENT être intégrées
au workspace, à la navigation et aux services existants.

Ne pas créer une application Publisher indépendante.

Ne pas imposer un profil Publisher distinct aux acteurs
chargés de créer et de publier les connaissances.

Les services de publication peuvent être modulaires
sans constituer une application séparée.

## G04 — Séparer responsabilités et profils

Séparer :

- logique métier ;
- services applicatifs ;
- composants de présentation ;
- actions et capacités ;
- accès aux ressources et persistance ;
- composition de distribution.

Le comportement du profil ne doit pas être dispersé
en conditions ad hoc dans tous les composants.

Privilégier une configuration résolue et des commandes
déclarées avec leurs dépendances et capacités.

## G05 — Préserver le modèle métier natif

Conserver les identités, relations et contrats existants.

Les projections de publication sont dérivées du modèle
natif et ne deviennent pas des sources métier parallèles.

Les adaptations de données appartiennent à des frontières
explicites, versionnées et testées.

Les migrations doivent préserver la compatibilité des
workspaces existants ou documenter leurs conditions.

Une révision publiée ne doit pas être modifiée
implicitement par une opération de distribution.

## G06 — Contrôler les capacités à l'exécution

Une commande non autorisée NE DOIT PAS être exécutable
simplement parce que son composant UI est masqué.

Les services métier doivent refuser les mutations
interdites par le profil et par le cycle de vie.

Les contrôles doivent couvrir les menus, raccourcis,
événements, appels programmatiques et déplacements
de blips.

L'édition d'un brouillon par le Creator et la protection
des révisions publiées doivent rester indépendantes
de la configuration Viewer.

Les capacités de lecture et de mutation doivent être
distinguées.

Les capacités inconnues doivent être refusées ou
traitées par une règle explicite et validée.

## G07 — Réutiliser l'interface historique

Le radar Cytoscape, les panneaux W2UI, les dialogues,
les menus et la navigation sont les références à
réutiliser dans la migration.

Conserver la sémantique des anneaux, quadrants,
sélections et positions.

Ne pas redéfinir les mêmes éléments de présentation
dans un second moteur SVG spécifique au Viewer.

La réduction de l'interface doit provenir du profil.

Les traductions et libellés doivent rester communs.

Le comportement de consultation ne doit pas diverger
sans une justification liée aux capacités autorisées.

## G08 — Cycle de vie partagé

Les services communs couvrent :

- ouverture et fermeture ;
- remplacement de contexte ;
- gestion de session ;
- confirmations ;
- modifications non enregistrées ;
- erreurs et préférences.

Les dialogues de confirmation internes doivent être
réutilisés entre profils.

Les restrictions du navigateur sur beforeunload
doivent être respectées.

Ne pas prétendre garantir une confirmation personnalisée
pour chaque fermeture d'onglet.

## G09 — Projection explicite des connaissances

Une publication doit définir les objets, relations,
attributs et révisions distribuables.

La sélection est exécutée avant l'assemblage final.

Les références nécessaires doivent être résolues.

Une référence nécessaire mais interdite est une erreur
de composition ou nécessite une règle explicite.

Les données privées, brouillons et extensions inconnues
ne doivent pas être inclus automatiquement.

Les tests doivent vérifier les exclusions, pas uniquement
la présence des données attendues.

## G10 — Confidentialité

Ne jamais considérer l'interface comme une frontière
de confidentialité pour des données déjà embarquées.

Les métadonnées, manifestes, caches, fichiers auxiliaires
et dépendances doivent également respecter le périmètre.

Les données confidentielles ne doivent pas être envoyées
sur le site GitHub Pages public.

Les contrôles d'intégrité ne remplacent ni
l'authentification ni le chiffrement.

Les contraintes de licence et de redistribution des
données ou bibliothèques doivent être vérifiées.

## G11 — Composition sélective du code

Les capacités déterminent les modules nécessaires.

La fermeture des dépendances est calculée et contrôlée.

Un module d'édition ne doit pas être livré dans un Viewer
final lorsque ses responsabilités ne sont pas nécessaires.

Une dépendance commune peut rester nécessaire même
si certaines de ses fonctions ne sont pas utilisées.

Les exclusions physiques doivent être vérifiées sur
l'artefact et son graphe de dépendances.

Une simple absence de bouton ou de chaîne de caractères
n'est pas une preuve suffisante d'exclusion logicielle.

Les adaptateurs legacy temporaires doivent être identifiés.

## G12 — Indépendance des modes techniques

Les mêmes profils et connaissances doivent fonctionner
dans les trois modes.

Ne pas introduire de logique métier spécifique au bundle,
au standalone ou aux modules natifs.

Le bundle HTTP contient un seul JavaScript applicatif.

Le mode natif conserve les modules sans bundling.

Le standalone ne dépend pas d'un serveur ou d'Internet
pour les opérations prévues par sa configuration.

Les chemins relatifs et les types MIME doivent être
qualifiés sous le préfixe GitHub Pages.

## G13 — Ressources et fonctionnement hors ligne

Les ressources sont accessibles via des fournisseurs
ou adaptateurs explicites lorsque nécessaire.

Distinguer ressources HTTP et ressources embarquées.

Préserver l'accès aux catalogues et aux recherches
sans charger inutilement les données complètes en mémoire.

Les mécanismes de stockage sous file:// doivent être
testés dans les navigateurs cibles.

Les sauvegardes/restaurations par fichiers doivent
permettre un repli lorsque le stockage local est limité.

Aucun démarrage réseau implicite ne doit être nécessaire
pour un Viewer autonome.

## G14 — Publication reproductible et traçable

Une livraison conserve la configuration résolue,
les références des données, la provenance logicielle,
le mode et les empreintes des fichiers.

La génération ne modifie pas les révisions sources.

Les définitions de publication restent modifiables.
Les livraisons précédemment produites restent stables.

Ne pas confondre génération reproductible au sens métier
et identité binaire garantie si des horodatages ou outils
non déterministes sont utilisés.

Les conditions de reproductibilité doivent être précisées.

## G15 — Prévisualisation fidèle

La prévisualisation utilise le socle commun et les
mêmes données projetées que la publication.

Elle ne doit pas substituer des données du workspace
qui seraient absentes de la livraison.

Le contexte Creator doit être préservé.

Un bouton de retour en édition appartient au contexte
Creator, pas à l'artefact Viewer distribué.

La prévisualisation n'exonère pas de tester l'artefact.

## G16 — Publication depuis le Creator

Les utilisateurs ne doivent pas avoir à utiliser
Git, Node.js ou Vite pour générer un Viewer.

La construction de composants logiciels et leur
assemblage métier sont des responsabilités distinctes.

La génération peut utiliser des ressources
préconstruites et versionnées.

Le Creator autonome doit embarquer les ressources
nécessaires aux publications qu'il sait produire.

La stratégie exacte doit être validée sans promettre
une compilation arbitraire de modules dans le navigateur.

## G17 — Tests de non-régression et parité

Chaque lot de développement apporte des tests adaptés.

Les tests unitaires couvrent les services et contrats.

Les tests d'intégration couvrent les composants,
les capacités et les dépendances.

Les tests navigateur couvrent les parcours réels.

La réussite d'un build, d'une importation de module
ou d'une simulation DOM ne suffit pas à qualifier
le fonctionnement dans le navigateur.

Un test de lecture seule doit vérifier que les données
métier restent inchangées après une tentative de mutation.

Les tests Creator et Viewer doivent utiliser des
fixtures métier communes lorsque pertinent.

Les coordonnées du radar doivent rester stables.

## G18 — Infrastructures de distribution

Conserver la chaîne existante :

- construction ;
- assemblage ;
- vérification ;
- manifestes ;
- publication atomique.

Les nouvelles distributions doivent être intégrées au
contrat et au portail avec leur statut réel.

Un prototype ou une distribution transitoire ne doit
pas être présenté comme une variante cible qualifiée.

Les manifestes doivent couvrir les artefacts effectivement
distribués.

Le radar PLM historique et les URL compatibles sont
préservés tant que leur migration n'est pas qualifiée.

## G19 — Organisation du développement

Les lots doivent être fonctionnellement cohérents.

Éviter les suites de micro-modifications sans
résultat utilisable ou vérifiable.

Un lot comporte normalement :

1. Une responsabilité et des critères d'acceptation.
2. Une modification de code cohérente.
3. Les tests et la validation.
4. La contribution architecturale correspondante.
5. La revue de l'impact sur le modèle et les distributions.
6. La mise à jour du plan et des exigences concernées.

Les scripts de modification doivent vérifier leurs
préconditions et préserver les données de travail.

Les sauvegardes locales ne doivent pas être supprimées
pour simplifier une construction.

Les changements de trajectoire doivent être documentés.

## G20 — Conformité et dérogations

Toute dérogation à une guideline importante doit être
enregistrée dans le document d'architecture du lot.

La dérogation précise :

- justification ;
- portée ;
- risques ;
- tests compensatoires ;
- conditions de suppression ou de révision.

Les limitations historiques ne doivent pas devenir
implicitement l'architecture cible.

La revue doit distinguer ce qui est :

- décidé ;
- implémenté ;
- testé ;
- publié ;
- qualifié dans les parcours utilisateurs.

Une affirmation de validation doit correspondre
à une preuve effectivement disponible.
