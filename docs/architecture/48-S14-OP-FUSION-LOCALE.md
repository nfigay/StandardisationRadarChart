# 48 — S14-OP : intégration cumulative sur les sources réelles

## Périmètre

Cette livraison fusionne S14-O (fenêtrage ICS et TC/SC) et S14-P (index hiérarchique persistant), en partant précisément des deux sources transmises par l'utilisateur le 11 novembre 2026. Les fonctionnalités locales RSS (S14-H), journal des évolutions (S14-J), chargement ISO local, mode références et variantes ICS (S14-L4) sont conservées ; aucune substitution par les anciens panneaux S14-O/P n'est effectuée.

## Données et compatibilité

- Base `standardisation-radar-iso-windowed` : passage schéma 1 → 2, ajout du store `groupLinks`. Le store des notices, des liens élémentaires et `meta` est préservé.
- Génération active : les relations hiérarchiques sont construites par transactions de 300 notices. La génération active demeure inchangée. Le marqueur `groups:<generation>` n'est positionné à `ready` qu'après la fin de la construction.
- En cas d'arrêt de l'indexation, aucun marqueur `ready` n'est posé. La construction peut être relancée, et les liens écrits avec `put()` sont idempotents.
- Si `ready` est vrai, les groupes parents ICS et TC/SC accèdent directement à `groupLinks`; sinon, repli S14-O sur curseur borné en mémoire.
- Les vues ICS, TC/SC et Normes ISO ne matérialisent que des fenêtres de 100 normes lorsque la génération fenêtrée est active ; 810 métadonnées de comités environ sont toujours utilisées pour construire la sidebar. Les catégories ICS proviennent toujours de `ICS.csv` séparé.
- Les modes `RSS`, `Évolutions ISO` et `Références locales` demeurent tels qu'ils existent dans la branche locale, sans migration de leur stockage.
- Les anciens caches ISO ne sont pas supprimés. Les opérations d'import manuel anciennes restent disponibles et doivent être migrées ultérieurement vers l'ingestion en flux pour garantir une mémoire bornée en toute circonstance.

## Installation et validations

L'installateur reconnaît uniquement les empreintes exactes des fichiers transmis ou celles de la présente fusion. Il ne modifie pas une variante inconnue. Sauvegardes préalables `.s14-op-backups/` et réinstallation idempotente. Les tests du moteur S14-O/P sont portés sans remplacement des tests existants.

## Limites et suites

- Mesurer temps et occupation mémoire dans Chrome pour les 81 768 notices après construction des index ; les tests unitaires n'ont pas accès au navigateur utilisateur.
- Mesurer la volumétrie de `groupLinks`, surveiller les quotas IndexedDB et compléter les scénarios d'interruption/reprise.
- La recherche textuelle sans index plein texte peut toujours parcourir des enregistrements par curseur (mais non les matérialiser intégralement).
- La migration de la nomenclature ICS vers le manifeste distribué est encore ouverte.
- Conserver le contrat de diagnostic JSON copié au presse-papiers, avec repli explicite si `copy()` n'est pas défini.
