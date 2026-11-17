# 112 — S16-A-C6-R1 : qualification reproductible des historiques OMG dans Pages

## Décision et périmètre

C6 (754/754 tests, 264/264 fichiers contrôlés, build Pages 451 fichiers) est la base de qualification. Ce lot **ne modifie pas** les connecteurs, les fichiers historiques ni l'interface. Il fournit une vérification intégrée en lecture seule, distincte de l'installation et de la publication.

## Protocole

L'outil `tools/qualify-s16-c6-pages.mjs` vérifie le manifeste C6, l'intégrité des 264 fichiers de la **distribution construite**, les 270 familles et leurs états, et les chemins hiérarchiques. Il démarre temporairement un serveur HTTP Node **sur 127.0.0.1 et un port éphémère**, le ferme automatiquement et n'utilise ni Python ni Vite. Il interroge les endpoints réels et charge le fichier JS livré par Pages dans un contexte `vm` neuf, puis appelle l'API Creator existante pour charger le catalogue OMG sans import JSON et sélectionner précisément les éditions anciennes UML 2.4.1, BPMN 2.0, BMM 1.0, EDMC-FIBO/BE 1.0. Il s'assure que UML 2.5.1 et 2.4.1 restent distinctes.

UTP2 reste `unresolved`. Ni les versions in-process ni une filiation UTP/UTP2 ne deviennent des versions formelles. Aucun instantané privé n'est projeté ou copié.

## Limites et phase restante

Ce protocole réalise une qualification HTTP/API avec le JS réel du build, **mais ne clique pas dans le navigateur graphique** : il ne prouve donc pas l'affichage W2UI, l'ergonomie, ni l'intégration d'un blip. Le test statique de raccordement au panneau n'est pas un test E2E. Les fournisseurs ISO, RFC et W3C ne sont pas interrogés à distance : leur recette transverse reste distincte. Ces limites doivent figurer dans le rapport final, et la publication reste interdite tant que les contrôles de distribution, les droits documentaires et la recette E2E n'ont pas été approuvés.

## Gouvernance

L'installateur vérifie branche et HEAD, copie seulement les deux fichiers du lot, calcule les empreintes, exécute les tests Node et écrit un audit. L'installation ne lance ni build, ni serveur ni publication. La qualification est une **commande séparée** avec copie automatique du JSON par `pbcopy`. Aucun `git add`, commit, push, build ou déploiement.
