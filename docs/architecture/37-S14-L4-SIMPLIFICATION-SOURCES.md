# S14-L4 — Regroupement des actions de sources ISO

## Intention
Le panneau inférieur conserve la navigation ICS/TC-SC/Normes/RSS/Évolutions, la recherche et l'action métier « Ajouter au radar » (dans la vue des références locales). Les commandes techniques de rafraîchissement, import JSONL, chargement ISO, RSS, journal d'évolutions et distribution sont regroupées dans « Gérer les sources ».

## Implémentation
`js/radar-iso-toolbar.js` enveloppe l'initialisation du panneau existant sans modifier ses moteurs de synchronisation ni IndexedDB. Les boutons originaux restent dans le DOM, masqués, et leurs gestionnaires existants sont appelés par les actions du formulaire `w2form` affiché dans `w2popup`. Ainsi les traitements restent la source unique de vérité.

La liste d'opérations est découverte parmi les boutons réellement présents : les déploiements sans option RSS ou distribution n'affichent pas d'action factice. L'instance `i18next` existante traduit les commandes FR/EN. L'action « Ajouter au radar » n'est affichée que sur la vue des références locales ; son raccordement ISO reste soumis à S12-R1.

## Limitations et responsabilités
Cette étape n'établit pas de nouvelle synchronisation réseau, n'ajoute aucune source et n'affirme pas qu'une fonction absente est implémentée. Les messages d'état sont ceux du module existant. La compatibilité de la fermeture du popup pendant un sélecteur de fichiers devra être vérifiée sur Chrome. Les données et révisions ne sont pas modifiées.

## Validation
Tests : conservation des handlers, présence des commandes regroupées, i18n FR/EN, garde de l'action métier, aucun remplacement d'`radar-standards-panel.js`. Validation navigateur requise pour la grille et le formulaire.
