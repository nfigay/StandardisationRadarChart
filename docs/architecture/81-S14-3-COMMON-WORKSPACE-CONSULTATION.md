# A8.2 — Cycle de vie commun et consultation native

## Référence et périmètre

Base qualifiée : `fde5dc0a966e3e477fe9dd9c817e96d4240caca5`, release `pilot-a81-r5`. Ce lot contribue au socle commun Creator/Publisher/Viewer, notamment CPV-02, CPV-03 et CPV-11. Il ne crée aucun modèle métier parallèle ni nouvelle application.

## Séparation des responsabilités

Le catalogue métier natif JSON demeure la représentation portable et durable du travail. Le corpus ISO installé dans IndexedDB reste une infrastructure documentaire indépendante : fermer ou remplacer un catalogue métier ne supprime ni le corpus ISO ni ses index. Aucun autosave du workspace dans IndexedDB n'est ajouté.

## Contrat de fermeture et de remplacement

`radar-catalog-ui` coordonne les services existants. `closeCatalog(graph, decision, confirmExport)` libère le catalogue natif complet : adaptateur, snapshots de session, graphe actif, registre et menu des révisions, persistance métier, explorateur. La sélection et la recherche du panneau documentaire sont réinitialisées. Les identifiants de groupes ne sont pas réutilisés. Les correspondances entre services sont vérifiées avant la fermeture.

Décisions : `close` (état propre), `cancel` (aucun changement), `discard` (abandon explicite), `save` (export puis confirmation de l'utilisateur). Une erreur d'export ne doit pas entraîner de fermeture. Le navigateur ne fournit pas d'accusé de réception garantissant l'écriture physique d'un téléchargement ; l'utilisateur confirme l'enregistrement avant la fermeture. L'export normal établit une référence de contenu exporté, pas une preuve de sauvegarde sur disque.

Le remplacement sélectionné par la commande dédiée vérifie d'abord le format, l'intégrité, le profil et les références du catalogue entrant ; l'ouverture ordinaire historique conserve son comportement de refus en présence d'un catalogue ouvert. La fermeture est une libération de session, pas une suppression de révision : elle est permise au Viewer par `catalog.open`, sans lui accorder `workspace.remove`, `catalog.export` ni les droits d'édition.

## Détection des modifications

La comparaison canonique utilise `build(graph)` et le dernier contenu importé ou exporté ; elle inclut les positions et les métadonnées métier mais non la sélection graphique. Un catalogue neuf ou non exportable est considéré modifié. Le Creator seul avertit pour les modifications natives non exportées. Les révisions publiées restent protégées par les invariants R2/R3. Les anciens gestionnaires de fermeture sont conservés pour le workspace historique lorsque leurs points d'intégration sont reconnus.

## Consultation commune

Le panneau existant `radar-standards-panel` et sa grille W2UI sont réutilisés. Le Creator conserve ISO, ICS, comités et références locales. Le Viewer utilise les seules références du catalogue natif livré, sans déclencher l'installation du corpus global, le RSS ni le journal des évolutions depuis ce panneau. L'accès Viewer ne dépend pas d'une éventuelle base ISO déjà présente dans le navigateur. Les commandes techniques et de création ne sont pas présentées dans cette vue.

## Correction R2 — isolation des démarrages

La première installation a obtenu 14/14 tests ciblés, puis 507/508 sur le dépôt R5 réel. Le test historique S14.1-B2 des sources facultatives s’arrêtait sur le nouveau retour anticipé Viewer. R2 isole la préparation de la consultation publiée avant le bloc de démarrage Creator, qui conserve les appels de sources de R5. Le test historique est maintenu intact. Le test ciblé vérifie également la séparation des branches et le chargement RSS côté Creator.

## Vérification et livraison

Tests fonctionnels sur les services avec doubles de navigateur : import, état propre/modifié, création, sauvegarde, annulation, fermeture, réouverture, remplacement invalide, Viewer et consultation native. Le script de déploiement du package exige les tests existants et nouveaux, contrôle le build Pages et produit deux HTML candidats avec provenance `fde5dc0+A8.2-R2-working-tree`. Le tag R5 et le site publié restent inchangés. La recette réelle Chrome est requise avant commit et publication.

## Limites et suites

- Le remplacement prévalide les erreurs prévisibles ; il ne garantit pas un rollback atomique d'une panne W2UI/Cytoscape inattendue après fermeture.
- La confirmation de téléchargement ne constitue pas une preuve de persistance. Le JSON exporté reste à conserver par l'utilisateur.
- La navigation ICS/TC/SC des sous-ensembles publiés nécessite un contrat de données complémentaire ; seules les références natives sont exposées ici.
- Les espaces historiques ASD/SSR, l'amélioration de progression ISO, le repli linguistique des titres et l'harmonisation du portail ne sont pas refondus dans ce lot.
- L'intégration réelle du panneau inférieur et des commandes de fermeture, l'état des formulaires ouverts et les comportements `beforeunload` doivent être validés dans Chrome.
- La réduction physique des modules Viewer et la projection configurable restent dans les lots suivants. Le profil ne constitue pas une frontière de sécurité pour des informations livrées.

## Consolidation du lot A8.2 R2

- Validation sur le dépôt réel le 14 novembre 2026 : 508/508 tests, dont 14 nouveaux tests A8.2.
- Build Pages et contrôle strict de disponibilité : réussite, sans erreur ni avertissement du contrôleur. Les avertissements connus des bundlers sur les scripts classiques et les modules mixtes ne bloquent pas ce build.
- Deux HTML autonomes construits : Creator 30 584 460 octets (corpus ISO embarqué), Viewer 7 937 172 octets (sans corpus ISO global). Les empreintes SHA-256, la provenance de travail et le périmètre des ressources ont été contrôlés.
- Première recette Chrome Creator : retour utilisateur positif (« semble fonctionner ») sur le scénario de cycle de vie. Pour le Viewer, retour « ok » à la proposition de recette, sans compte rendu détaillé. Ces retours ne constituent pas une qualification exhaustive des dialogues, de la sauvegarde physique ou de tous les comportements d'interface.
- Consolidation locale uniquement ; release `pilot-a81-r5` et GitHub Pages publics inchangés. Le candidat de recette porte une provenance de working tree et devra être reconstruit à partir d'un commit avant une nouvelle publication.

Le premier lot A8.2 est intégré. A8.2 reste ouvert pour la qualification détaillée, l'ergonomie de consultation et la définition du périmètre documentaire publié ; CPV-02/03/11 ne sont pas déclarées intégralement satisfaites par ce lot.
