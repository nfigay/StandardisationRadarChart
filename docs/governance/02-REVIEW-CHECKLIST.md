# Revue de la baseline — check-list de validation

## Périmètre produit

- [ ] Les acteurs et cas d'usage reflètent bien le scénario consortium ASD SSG + entreprise + experts + architecture.
- [ ] « Standard », « standard edition », « assessment », « blip », « radar revision » ont des sens indépendants et approuvés.
- [ ] Les scénarios ISO incluent recherche, catalogue filtrable, sélection multiple, panier et création de blips dans une draft.
- [ ] Les fiches contextuelles multi-objets sont comprises et priorisées.
- [ ] Le périmètre de comparaisons et analyses a été fixé (MVP vs plus tard).

## Architecture et qualité

- [ ] W2UI-first et navigateur/offline-first sont explicitement confirmés.
- [ ] Les limites audit/source sont acceptées; les lacunes de preuve restent ouvertes.
- [ ] Le schéma existant `1.0.0` et les contraintes published/draft sont pris en compte.
- [ ] Les choix ISO identity/édition, UI navigation, multi-catalogues et EA ont des responsables.
- [ ] Les critères E2E et le plan de migration protègent les usages existants.

## Décision de baseline

- [ ] Version de documentation et date approuvées.
- [ ] Revue des décisions `PROPOSED` et `OPEN` consignée.
- [ ] Commit documentaire dans le projet Git autorisé séparément.
- [ ] Chantiers logiciels autorisés séparément (aucune autorisation par défaut).

---

<!-- S14.3-A8.0-COMMON-ARCHITECTURE -->

## Revue complémentaire S14.3-A8.0

Référence :
[Guidelines Creator/Publisher et Viewer](GUIDELINES-CREATOR-PUBLISHER-VIEWER.md).

Pour chaque lot concerné, vérifier :

- [ ] Creator et Publisher restent une seule application.
- [ ] Les composants existants ont été examinés avant ajout.
- [ ] Aucun moteur de présentation redondant n'est introduit.
- [ ] Les capacités sont explicites et testées.
- [ ] Le masquage UI est distinct du contrôle d'exécution.
- [ ] Les mutations interdites sont refusées dans les services.
- [ ] Le modèle natif et les identités sont préservés.
- [ ] Le cycle de vie des révisions reste protégé.
- [ ] Les composants communs conservent leur comportement.
- [ ] Les données sont filtrées avant distribution.
- [ ] La fermeture des références est vérifiée.
- [ ] Les données hors périmètre sont absentes des artefacts.
- [ ] Les modules exclus sont effectivement absents.
- [ ] Les dépendances legacy restantes sont identifiées.
- [ ] Les modes techniques ne modifient pas la sémantique.
- [ ] Les standalone sont qualifiés réellement hors ligne.
- [ ] La persistance et les sauvegardes sont vérifiées.
- [ ] La prévisualisation utilise les données projetées.
- [ ] Les manifestes et la provenance sont vérifiés.
- [ ] Les données privées ne sont pas publiées sur Pages.
- [ ] Les régressions historiques sont couvertes.
- [ ] Les limites de qualification sont explicites.
- [ ] Le document d'architecture du lot est mis à jour.
- [ ] Le plan de réalisation reflète le résultat réel.

Un contrôle non applicable doit être justifié.

Une étape transitoire ne doit pas être déclarée conforme
à une exigence de distribution finale non encore réalisée.
