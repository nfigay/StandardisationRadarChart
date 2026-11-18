# S17 — Fiche documentaire : commande commune à toutes les SDO

## Besoin métier

Dans le Creator, quel que soit le fournisseur documentaire sélectionné (ISO Open Data, OMG, RFC Editor/IETF, W3C), la fiche d'une norme ou d'une spécification se consulte par la commande **Fiche documentaire** de la barre d'outils w2UI, après sélection d'une ligne. Les prochaines sources doivent respecter ce même contrat.

## Réalisation R1

- Réutilisation du `w2toolbar` et de son action existante `details` dans `js/radar-standards-panel.js`.
- ISO : commande disponible en vues **Normes ISO**, **ICS et normes** et **Comités TC/SC** ; suppression des colonnes `Fiche` et des boutons par ligne `Détails`.
- Références natives : même commande, avec résolution de l'instantané ISO conservé ou de la fiche de référence locale, suivant la notice sélectionnée.
- OMG, RFC Editor/IETF, W3C : l'action existante `details` et la présentation documentaire sont préservées ; le registre des sources et les adaptations par source restent inchangés.
- Une fiche n'est accessible qu'après sélection d'une ligne ; le bouton est désactivé en l'absence de sélection.
- Les pages ISO fenêtrées résolvent la notice par ID, et ignorent un résultat tardif si le mode ou la sélection ont changé.
- Les modes ISO RSS et journal des évolutions ne sont pas des listes de normes : ils n'exposent pas cette commande.

## Frontières

Le changement concerne **l'accès à la fiche**, non l'uniformisation de toutes les métadonnées. La fiche ISO utilise encore son composant `w2form` de consultation dans un élément HTML `dialog`, alors que les fiches documentaires externes utilisent `w2popup` avec `w2form`. La migration de l'enveloppe ISO vers `w2popup` est une évolution distincte, nécessitant une recette graphique spécifique. Il serait incorrect de déclarer les deux dialogues identiques à ce stade.

Pas de modification des mécanismes d'acquisition, des données, des identités métier, de la publication ou des règles de gouvernance humaine.

## Qualification et recette

1. ISO (liste, ICS, TC/SC) : sélectionner une norme, activer **Fiche documentaire**, vérifier son contenu, fermer ; vérifier absence de colonne `Fiche`.
2. Références natives : ouvrir une notice ISO conservée puis une notice déclarée ; vérifier l'affichage de leurs données respectives.
3. OMG, RFC Editor/IETF et W3C : sélectionner chaque source et une notice, ouvrir la fiche, vérifier qu'aucun comportement existant n'a régressé.
4. Vérifier l'état désactivé sans sélection, l'annulation, le changement de sélection, la pagination, FR/EN et les sources vides.
5. Exécuter la suite Node complète et une recette Creator dans le navigateur avant toute livraison.

Les tests Node couvrent les contrats de routage et de structure ; ils ne remplacent pas la recette navigateur.

## R2 — Tests historiques et parcours Viewer

- Les tests historiques S15-A utilisent désormais la commande réelle de la barre w2UI Creator ; ils contrôlent toujours les valeurs de la fiche et les restrictions de publication.
- Dans le Viewer (sans barre d'outils Creator), le double-clic sur une ligne consultable ouvre la fiche en lecture seule. Aucune colonne « Fiche » n'est réintroduite.
- La résolution de la référence native s'effectue sur la notice métier complète autorisée, et non uniquement sur les colonnes de la grille.
- Le test isolé de fenêtrage S14.1 modélise l'actualisation de la barre w2UI ; l'algorithme de pagination reste inchangé.
- Tests Node et recette navigateur à exécuter sur le dépôt utilisateur avant commit.

## Complément S17-R4 — fenêtre ISO w2UI

La fiche ISO et les références natives sont désormais rendues dans `w2popup`, avec
le `w2form` de consultation existant, au lieu d'un `<dialog>` HTML dédié.
Le popup est monté après l'événement d'ouverture de w2UI, les onglets, les champs,
les métadonnées et les actions métier restant inchangés. La fiche et le formulaire
sont nettoyés à la fermeture et lors du remplacement de la fiche. Le mécanisme
S17-R3 d'auto-dimensionnement des `textarea` est notifié après montage.
Les dialogues de recherche avancée et d'éditions liées sont distincts et ne sont
pas convertis dans ce lot. Aucun flux de données ni stockage n'est modifié.

### S17-R4 corrigé — qualification de la migration des fiches ISO

Les tests historiques restent exécutés et conservent leurs assertions métier. La simulation de la fenêtre principale ISO utilise désormais le cycle `w2popup` (`onOpen` / `onComplete`, montage du `w2form`, `onClose` / `onComplete`) plutôt que l'ancien `<dialog>`. Les tests de rapprochement des relations ISO isolent leur séquence de mise à jour en se fondant sur la fin réelle de `showDetail`, sans rechercher l'ancien écouteur `dialog.close`. Les restrictions Viewer, la provenance et la fermeture asynchrone restent couvertes.

La fenêtre secondaire de consultation des éditions reste native dans ce lot ; son éventuelle migration nécessite une qualification distincte. Les tests Node ne remplacent pas la recette navigateur.
