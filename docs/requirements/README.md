# Matrice de traçabilité

Le fichier [`requirements.csv`](requirements.csv) est l'index de suivi. Il comporte **61 exigences** reliées aux chapitres de l'analyse, aux décisions, aux composants à créer ou modifier et aux tests.

## États

- `approval`: `proposed` → `approved` / `rejected` / `deferred`.
- `implementation`: `not_started` → `in_progress` → `implemented` / `blocked`.
- `verification`: `not_run` → `pass` / `fail` / `blocked`.
- `evidence_commit`: commit Git ou référence d'audit/test, jamais une promesse.

Ne pas passer `implementation` à `implemented` sans identifier le changement. Ne pas passer `verification` à `pass` sans un résultat de test observable. Une case vide indique une preuve absente.

---

<!-- S14.3-A8.0-COMMON-ARCHITECTURE -->

## Exigences complémentaires S14.3-A8.0

Les exigences de convergence CPV-01 à CPV-12 sont définies
dans la section 20 de
[l'architecture 79](../architecture/79-S14-3-COMMON-CREATOR-PUBLISHER-VIEWER.md).

Elles couvrent le produit commun Creator/Publisher,
les Viewers configurés, les publications persistantes,
la projection des données et la composition logicielle.

Leur traçabilité vers les lots et preuves attendues est
définie dans le
[plan de réalisation](../governance/PLAN-REALISATION-S14-3-CREATOR-PUBLISHER-VIEWER.md).

Ces exigences complètent le registre existant.

Les douze exigences CPV sont désormais
intégrées dans requirements.csv.

Les 49 exigences historiques sont conservées.

La décision de référence est DEC-019.

Les nouvelles exigences sont approuvées au niveau
de leur cible fonctionnelle et architecturale.

Leur statut initial d'implémentation est not_started.
Leur statut initial de vérification est not_run.

Le champ evidence_commit reste vide tant qu'une
preuve d'implémentation ou de validation n'a pas
été enregistrée.

Les identifiants VER-CPV-01 à VER-CPV-12
désignent les vérifications à réaliser.

L'attribution d'un identifiant de vérification
ne constitue pas une réussite de test.

<!-- S14.3-A8.0-R2-CONSOLIDATION -->

## Mise à jour de convergence — 14 novembre 2026

Les statuts courants sont ceux de `requirements.csv`, pas les statuts initiaux
ci-dessus. A8.2 est publique, A8.3 est consolidée et A8.4 a réussi ses tests et
sa recette navigateur. CPV-06/12 disposent d'une preuve partielle A8.4 ; leur
qualification finale dépend encore des contrats non couverts et des artefacts.
A8.5/A8.6 distinguent l'interface, la prévisualisation, le candidat HTML et la
livraison qualifiée. CPV-10 vise explicitement la génération dans le Creator
sans outil de développement et l'ouverture directe du Viewer préchargé.
Voir [preuve 05](../evidence/05-A84-CREATOR-VIEWER-VALIDATION.md) et le plan.
Les lignes historiques REQ restent conservées.
