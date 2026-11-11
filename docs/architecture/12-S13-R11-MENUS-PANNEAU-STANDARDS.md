# S13-R11 — Menus et panneau inférieur des standards

## Correction effective
Le clic sur un menu parent w2ui (identifiant sans deux-points) est une navigation et n'est jamais traité comme une mutation, y compris sur une révision published ou archived. L'autorisation reste contrôlée au niveau de chaque action fille. L'archivage et le sélecteur de révisions restent accessibles.

## Nouvelle vue tabulaire
Le panneau inférieur w2ui accueille une grille w2grid des références du **catalogue existant** avec recherche locale, actualisation et sélection pour projection vers un blip dans le draft actif. Aucun registre parallèle et aucune connexion SDO prétendue. Le formulaire historique de déclaration locale reste disponible dans le module de registre, mais son ouverture n'est plus l'action principale de consultation.

## Cible S14 ISO (non implémentée ici)
Recherche numéro/titre/scope, classification ICS par code et libellé (multivaluée), TC/SC par identifiant et libellé, WG selon couverture effectivement vérifiée, stade d'avancement, édition, filtres combinables et pagination. Synchronisation ISO Open Data, provenance et licences explicites. Les futurs SDO doivent utiliser des adaptateurs distincts.

## Hors périmètre
Le renommage des radars publiés, les corrections versionnées (patch), le catalogue ISO réel et le mapping WG complet demandent des modifications métier/persistance supplémentaires. Rien de cela n'est revendiqué comme livré dans R11. DEC-009/010/016/017/018 restent OPEN, S12-R1 ouvert.
