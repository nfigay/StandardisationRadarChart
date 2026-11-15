# S15-C — Cycle de vie contrôlé des références

Baseline réelle attendue : `eb214da42c7533210daf0a2d6487be5f4231a0a0` (S15-B/R1/R2 consolidé). A8.6 demeure la release publique. Le candidat conserve le catalogue 1.0.0, le registre natif et les adaptateurs existants. DEC-009 et DEC-010 restent OPEN : ces protections ne tranchent pas l'identité ISO de famille/partie/édition ni un futur modèle générique de relations.

## Services métier et sécurité des dépendances

Le propriétaire de la mutation est toujours `__radarCatalogPersistence` et son `imports[]` privé. Quatre commandes sont ajoutées ; toutes sont réservées au Creator et à un catalogue unique.

| Contrat | Comportement |
|---|---|
| `referenceImpact(graph, standardId)` | Retourne une copie de `standardId`, `name`, `dependencies`, `unused` et un `token` opaque identifiant le catalogue et la notice courante. Aucun changement. |
| `removeUnusedReference(graph, standardId, expectedToken)` | Recalcule l'impact, vérifie le token et supprime uniquement une notice sans dépendance ; résultat `{action:'removed',standardId}`. |
| `sourceLifecyclePlan(graph, sourceId, key, generation)` | Résout une notice dans la génération active, détermine `new`, `existing`, `refresh`, `reconcile` ou `conflict`. Lorsque pertinent : identifiant, token, différences champ par champ, dépendances, `canApply`, `reason`. |
| `applySourceLifecycle(graph, request)` | Exige `sourceId`, `key`, `generation`, `standardId`, `action` (`refresh`/`reconcile`) et `token` issus du plan. Recalcule le plan avant mutation. Conserve le `standardId`; aucune mutation de révision ni de blip. |

`referenceImpact` examine l'union conservatrice du catalogue stocké et de `build(graph)`, qui intègre les snapshots des groupes et protège les révisions publiées. Un blip est identifié par (revisionId, blipId), les évaluations par assessmentId ; les liens explicites supplémentaires `standardId`/`standardIds` sont détectés dans les objets métiers et extensions, hors identité de la notice elle-même. Les éléments non typés qui ne suivent pas ce contrat ne sont pas interprétés. Toute erreur d'inspection est bloquante. Une dépendance encore présente dans une révision stockée reste bloquante même si le blip a été retiré du brouillon courant : exporter puis rouvrir le catalogue actualisé peut lever ce blocage. Aucune suppression en cascade.

## Comparaison et réconciliation

La sélection d'une publication dans Sources de standardisation permet une comparaison avec la notice native portant la même identité documentaire ou avec une déclaration locale potentiellement correspondante. Les différences affichées concernent titre, organisme, désignation, édition, statut, flux et URL ; une date d'acquisition différente seule n'est pas un changement métier.

- RFC : identité par numéro ; W3C : shortname et publication datée. Une nouvelle édition est intégrée séparément, sans migration automatique des blips.
- Actualisation : même identité documentaire et même triplet organisme/désignation/édition, aucune collision et aucune dépendance. L'utilisateur confirme explicitement. Les références utilisées, y compris dans un brouillon, restent inchangées ; la différence reste consultable.
- Réconciliation : uniquement une déclaration manuelle non vérifiée, sans snapshot ISO/externe, exactement compatible sur organisme, désignation et édition non vide, sans ambiguïté, collision ni dépendance. Les rapprochements approximatifs, les éditions inconnues et les réaffectations de blips sont exclus.
- Une réconciliation conserve le `standardId` local, remplace les métadonnées affichées par celles de la publication sélectionnée, enregistre `externalDocument` et la provenance officielle, et conserve le nom et la déclaration manuelle d'origine dans `extensions.referenceReconciliation` (voir le [contrat v1](schemas/reference-reconciliation-v1.schema.json)). Une importation ultérieure de la même publication réutilise cet identifiant local. Aucun alias ni deuxième registre.
- Le token lie le plan à l'identité du catalogue et à la notice exacte ; le jeton de génération source protège des sélections obsolètes. Le service ne prend aucune métadonnée officielle librement fournie par le formulaire.

La projection A8.6 est conservée : `referenceDeclaration` reste filtrée par la liste blanche, `externalDocument` et `referenceReconciliation` ne sont pas publiés. L'historique de provenance locale peut être sensible ; il reste dans le catalogue auteur. Le registre natif continue à être exporté via le mécanisme JSON existant. Pas d'auto-enregistrement.

## Interface et limites

Dans Références du catalogue, sélectionner une ligne puis « Cycle de vie ». Le dialogue FR/EN présente les dépendances (radar, révision, état, blip ; évaluations ; autres liens). La suppression exige une case de confirmation. « Comparer avec les sources / consulter les éditions » ouvre le gestionnaire existant avec source et recherche préremplies lorsque connues. Pour ISO, délégation au parcours documentaire ISO existant ; aucune mutation de snapshot ISO dans ce lot. RFC/W3C : la sélection d'une publication montre la comparaison et les commandes permises. Une référence utilisée ou une identité ambiguë reste protégée ; une réconciliation ou actualisation possible exige une confirmation distincte. Les contrôles d'auteur sont absents du Viewer et le service refuse leurs appels directs.

S15-C n'implémente ni édition générique du modèle de référence, ni migration de dépendances, ni résolution de collisions sur notices déjà utilisées, ni suivi automatique de la nouvelle version, ni arbitrage DEC-009. Le cycle de vie ISO au-delà de la consultation et suppression protégée est reporté. Le statut documentaire est celui de la source, sans déduire une équivalence ou une certification normative. La qualification intégrale des distributions et du parcours Creator/Publisher/Viewer reste S15-D.
