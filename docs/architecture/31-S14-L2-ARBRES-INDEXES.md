# S14-L2 — Arborescences ISO indexées et chargement progressif

## Objet

Supprimer le plafond historique de 1 800 normes dans les vues **ICS et normes** et **Comités TC/SC**, tout en préservant la virtualisation native de `w2grid` et la capacité de recherche sur les 81 768 références en cache.

## Contrat de projection

- Le catalogue ISO officiel reste indépendant du registre métier et des blips.
- La première version de l'index est reconstruite **en mémoire après `IndexedDB.readAll()`**. Ce lot n'implémente pas encore de pagination native par curseur IndexedDB. Il supprime néanmoins l'exclusion du catalogue au-delà de la 1 800e norme.
- Les tableaux d'appartenance `byIcs` et `byCommittee` référencent les mêmes objets de norme ; aucune duplication persistée n'est réalisée.
- Les branches TC/SC sont établies d'après `parentId` et `ownerCommittee`. Les branches ICS suivent `parent`.
- Une branche comporte un enfant « Afficher les normes » lorsque des références sont associées. Chaque clic charge au plus 100 feuilles supplémentaires. Ce chargement n'exécute aucune modification de données.
- La recherche est appliquée à la collection complète avant matérialisation des feuilles ; aucune norme n'est exclue en raison de sa position initiale dans le catalogue.
- La ligne « Afficher les normes » est un nœud de commande et ne peut jamais être confondue avec un standard sélectionnable.

## Limites / étape suivante

Les recherches textuelles sur 81 768 descriptions ne sont pas encore indexées en plein texte et sont effectuées en mémoire. Le coût mémoire du `readAll` d'IndexedDB reste inchangé. Un futur fournisseur de requêtes IndexedDB (index/curseurs, voire index texte spécifique) permettra des lots plus légers. Le rendu exact et les interactions de développement/repli des arbres w2ui restent à vérifier dans le navigateur avec le jeu complet.

## Décisions ouvertes

Les décisions `DEC-009`, `DEC-010`, `DEC-016`, `DEC-017` et `DEC-018` restent OPEN. Aucun contrat d'identité ISO/radar/blip n'est adopté par cette livraison.
