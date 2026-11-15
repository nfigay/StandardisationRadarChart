# Revue de couverture des exigences — A8.6

Revue documentaire des 66 lignes de la matrice existante, à partir des sources et preuves de la release. Aucune exigence supprimée, aucun arbitrage proposé transformé en approbation. Les états `pass` sont limités à des contrats ciblés dont une preuve existe (dont B1.4 historique) ; ils ne signifient pas que toute l’application a été requalifiée ici. `in_progress` décrit une couverture partielle, `not_run` l’absence de qualification complète pour le contrat cible (même si des tests partiels existent). `assessed` signifie revue documentaire, non fermeture du gap. Les références de commit désignent la baseline examinée ou une preuve datée, pas nécessairement le commit d’introduction. Pour les exigences historiques, les preuves citées sont des pistes de traçabilité à consolider par des recettes ciblées. La spécification demeure candidate pour les exigences non arbitrées.

| Exigence | Approbation | Implémentation | Vérification | Preuves et reste |
|---|---|---|---|---|
| REQ-BASE-01 | proposed | in_progress | not_run | 86/86-R2 ; preuve 09 — HTML locaux qualifiés ; hors connexion physique complète et autres modes non attestés |
| REQ-BASE-02 | proposed | in_progress | not_run | preuve 04 ; radar-viewport.test.mjs — W2UI propriétaire du layout ; qualification globale des vues à compléter |
| REQ-BASE-03 | proposed | in_progress | not_run | 08-S13 ; radar-revision-lifecycle.test.mjs — Protection révisions ; matrice des échanges et migration complète à qualifier |
| REQ-BASE-04 | proposed | in_progress | not_run | radar-a82-i18n.test.mjs ; preuve 09 — FR/EN parcours qualifiés ; exhaustivité des vues et labels métier à vérifier |
| REQ-UI-01 | proposed | in_progress | not_run | 81 ; 82 ; 86-R1 — Radar et consultation standards disponibles ; vue Analyses cible à réaliser |
| REQ-UI-02 | proposed | in_progress | not_run | 29-S14-L1 ; 45-S14-N ; 82 — Grilles ISO et explorateur ; disposition cible de la recherche exhaustive à confirmer |
| REQ-UI-03 | proposed | in_progress | not_run | 86-R1 ; 82 — Panneau contextuel et détails ISO ; exhaustivité des fiches EA/évaluation ouverte |
| REQ-UI-04 | proposed | in_progress | not_run | 34-S14-L3-R2 ; 55-S14-U — Navigation et synchronisation ciblées ; conservation exhaustive des filtres non attestée |
| REQ-UI-05 | proposed | in_progress | not_run | preuve 04 ; radar-viewport.test.mjs — Redimensionnement testé ; comportement de tous panneaux étroits à vérifier |
| REQ-UI-06 | proposed | in_progress | not_run | 08-S13 ; radar-revision-lifecycle.test.mjs — Protection lifecycle testée ; exhaustivité de tous parcours destructifs à vérifier |
| REQ-ISO-01 | proposed | in_progress | not_run | 22-S14-I ; 59-S14-Z ; 82 — Sources distribuées et natives ; couverture licence/version et toutes sources à vérifier |
| REQ-ISO-02 | proposed | in_progress | not_run | 29-S14-L1 ; 45-S14-N ; 82 — Grilles et index existants ; ensemble des filtres et multisélection à vérifier |
| REQ-ISO-03 | proposed | in_progress | not_run | 17-S14-D ; 03-CONTRAT-IDENTITE-ISO-CANDIDAT — Métadonnées et identité ; sémantique des éditions/remplacements à approfondir |
| REQ-ISO-04 | proposed | in_progress | not_run | 06-LOT2 ; 37-S14-L4 — Parcours sélection/création présents ; panier persistant transversal non attesté |
| REQ-ISO-05 | proposed | in_progress | not_run | 61-S14-1 ; 63-S14-1-B2 — Gestion chargement/sources facultatives ; exhaustivité des états d’erreur à vérifier |
| REQ-ISO-06 | proposed | in_progress | not_run | 44-S14-M ; 45-S14-N ; 49-S14-Q — Fenêtrage/index testés ; objectifs quantitatifs sur corpus et navigateurs à compléter |
| REQ-MOD-01 | proposed | in_progress | not_run | ARCHITECTURE-CATALOGUE-ETAT-COURANT ; 83 — Identités et révisions natives ; séparation complète évaluation/contexte à arbitrer |
| REQ-MOD-02 | proposed | in_progress | not_run | 04-LOT1 ; radar-standard-registry.test.mjs — Lien blip-standard présent ; contrat évaluation complet à vérifier |
| REQ-MOD-03 | proposed | not_started | not_run | 02-SPECIFICATION-CIBLE — Indépendance complète des évaluations contextuelles non démontrée |
| REQ-MOD-04 | proposed | in_progress | not_run | 03-CONTRAT-IDENTITE-ISO-CANDIDAT ; 82 — Réutilisation des identifiants ISO ; stabilité de toutes éditions à qualifier |
| REQ-MOD-05 | proposed | not_started | not_run | 03-CONTRAT-IDENTITE-ISO-CANDIDAT ; DEC-009 — Arbitrages d’identité et ambiguïté restent ouverts |
| REQ-BLP-01 | proposed | in_progress | not_run | 04-LOT1 ; 05-LOT2 ; 06-LOT2 — Création draft réalisée ; scénarios multisélection exhaustifs à qualifier |
| REQ-BLP-02 | proposed | in_progress | not_run | 04-LOT1 ; radar-zone.test.mjs — Anneaux/quadrants disponibles ; modèle d’évaluation explicite à enrichir |
| REQ-BLP-03 | proposed | in_progress | not_run | preuve 04 ; radar-viewport.test.mjs — Coordonnées préservées au resize ; tous chemins de redraw à vérifier |
| REQ-BLP-04 | proposed | in_progress | not_run | 08-S13 ; radar-revision-lifecycle.test.mjs — Cycle draft/published présent ; couverture exhaustive à vérifier |
| REQ-BLP-05 | proposed | in_progress | not_run | radar-standard-registry.test.mjs ; 04-LOT1 — Registre distinct des blips ; suppression/références dans tous cas à vérifier |
| REQ-VP-01 | proposed | implemented | pass | preuve 04 ; src/domain/radar-viewport.mjs — Repère commun 800×800 qualifié B1.4 |
| REQ-VP-02 | proposed | implemented | pass | preuve 04 ; radar-viewport.test.mjs — Calcul uniforme zoom/pan qualifié B1.4 |
| REQ-VP-03 | proposed | implemented | pass | preuve 04 ; radar-viewport.test.mjs — Resize sans mutation qualifié B1.4 |
| REQ-VP-04 | proposed | in_progress | not_run | preuve 04 ; radar-viewport-pages-regression.test.mjs — Caméra et fit ciblés ; contrat complet et gestes utilisateur à vérifier |
| REQ-VP-05 | proposed | in_progress | not_run | preuve 04 — Mesures navigateur historiques ; seuil <1px sur tous cas A8.6 non attesté |
| REQ-EXP-01 | proposed | in_progress | not_run | 73-S14-3-A4-FIDELITE-EXPORT — Travaux de fidélité existants ; infographic complète à qualifier |
| REQ-EXP-02 | proposed | in_progress | not_run | 73-S14-3-A4-FIDELITE-EXPORT — Formats/foreignObject et portabilité cible à auditer |
| REQ-CTX-01 | proposed | in_progress | not_run | 82 ; preuve 09 — Détails ISO consultables ; toutes fiches standard/édition à enrichir |
| REQ-CTX-02 | proposed | in_progress | not_run | 86-R1 ; preuve 07 — Consultation blips présente ; couverture du contrat cible à vérifier |
| REQ-CTX-03 | proposed | not_started | not_run | 02-SPECIFICATION-CIBLE — Fiche d’évaluation autonome cible non attestée |
| REQ-ANA-01 | proposed | not_started | not_run | 86-R2 — Comparaison configurations livrées, pas comparaison sémantique des révisions |
| REQ-ANA-02 | proposed | not_started | not_run | 02-SPECIFICATION-CIBLE — Indicateurs, dénominateurs et export d’analyse non attestés |
| REQ-EA-01 | proposed | not_started | not_run | 02-SPECIFICATION-CIBLE ; DEC-014 — Adaptateur EA cible non attesté |
| REQ-EA-02 | proposed | not_started | not_run | 02-SPECIFICATION-CIBLE ; DEC-002 — Distinction preuve adoption/recommandation à approfondir |
| REQ-DATA-01 | proposed | in_progress | not_run | ARCHITECTURE-CATALOGUE-ETAT-COURANT ; 83 ; 86-R2 — Validation native et compatibilité motif ; migrations générales à qualifier |
| REQ-DATA-02 | proposed | in_progress | not_run | 86 ; 86-R2 ; preuve 09 — Intégrité et registre immuable ; sauvegarde des artefacts historiques reportée |
| REQ-DATA-03 | proposed | in_progress | not_run | 73 ; 86-R2 — Compatibilité documentée par parcours ; matrice complète à établir |
| REQ-DATA-04 | proposed | in_progress | not_run | 82 ; 84 ; 86 — Références natives et projection filtrée ; Viewer sans corpus global |
| REQ-MIG-01 | proposed | not_started | not_run | 03-CONTRAT-IDENTITE-ISO-CANDIDAT ; DEC-015 — Mapping legacy exhaustif et arbitrages non démontrés |
| REQ-MIG-02 | proposed | not_started | not_run | 01-VALIDATION-MIGRATION — Stratégie de migration/rollback ; preuve métier exhaustive absente |
| REQ-ARCH-01 | proposed | in_progress | not_run | 79 ; src/domain/radar-viewport.mjs — Composants métier et adaptateurs ; architecture hybride encore présente |
| REQ-ARCH-02 | proposed | in_progress | not_run | 79 ; preuve 09 — Convergence incrémentale, tests et compatibilité ; totalité cible non attestée |
| REQ-ARCH-03 | proposed | in_progress | not_run | 00-START-HERE ; preuve 10 — Baseline et rapports vérifiés ; conformité exhaustive du processus non attestée |
| CPV-01 | approved | implemented | pass | Architecture 79/85 ; preuve 06 ; preuve 09 : Publisher intégré au Creator. |
| CPV-02 | approved | implemented | pass | Architecture 80/81/86-R1 ; tests profil et viewport ; preuve 09 : moteur commun et consultation. |
| CPV-03 | approved | implemented | pass | radar-application-profile.test.mjs ; radar-a85-publisher.test.mjs ; refus de mutations et import publié ; qualification du périmètre A8.6. |
| CPV-04 | approved | implemented | pass | radar-a83-publications.test.mjs ; radar-a85-publisher.test.mjs ; preuve 09 : réouverture JSON. |
| CPV-05 | approved | in_progress | not_run | 86/86-R2 ; preuve 09 : ZIP standalone, registre et motif validés ; modes A9 et archivage binaire non couverts. |
| CPV-06 | approved | in_progress | not_run | 84 ; radar-a84-projection.test.mjs ; preuve 09 : projection multiradar et références ; fermeture des types futurs à vérifier. |
| CPV-07 | approved | in_progress | not_run | 86-R2 ; preuve 09 : HTML candidat exact, ouverture locale ; iframe HTTP et prévisualisation temporaire exhaustive non qualifiées. |
| CPV-08 | approved | in_progress | not_run | 86 ; Viewer autonome sans corpus global et composants auteur ciblés exclus ; inventaire et fermeture complète A9 reportés. |
| CPV-09 | approved | not_started | not_run | 79 ; parité des six distributions non qualifiée ; les modes historiques ne valent pas qualification cible. |
| CPV-10 | approved | in_progress | not_run | 86/86-R2 ; preuve 09 : génération autonome et file:// validées ; recette physique hors connexion complète non attestée. |
| CPV-11 | approved | in_progress | not_run | 08-S13 ; radar-revision-lifecycle.test.mjs ; profils et révisions protégées ; qualification globale encore ouverte. |
| CPV-12 | approved | in_progress | not_run | 84/86 ; radar-a84-projection.test.mjs ; radar-a85-publisher.test.mjs : contrôles négatifs du périmètre et des métadonnées ; A9 non couverte. |
| CPV-13 | approved | implemented | pass | 86-R1 ; preuve 07 : périmètre publié et non-régression Viewer générique ; tests Publisher. |
| CPV-14 | approved | implemented | pass | 86-R1 ; preuve 07 : radar unique, collection et révision retenue ; preuve 09. |
| CPV-15 | approved | implemented | pass | 86-R1/86-R2 ; preuve 09 : synchronisation et références ISO. |
| CPV-16 | approved | implemented | pass | 86-R2 ; preuve 09 : historique détaillé, différences et motif persisté. |
| CPV-17 | approved | implemented | pass | 86-R2 ; preuve 09 : identité, annulation, retéléchargement sans mutation. |
