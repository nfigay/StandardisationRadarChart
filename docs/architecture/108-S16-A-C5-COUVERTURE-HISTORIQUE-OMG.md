# 108 — S16-A-C5 : couverture historique OMG par famille

## Objectif
Élargir les 11 éditions UML déjà validées à d'autres familles OMG, sans confondre les 286 publications du catalogue principal avec les éditions historiques et sans attribuer un statut d'inapplicabilité aux anciennes éditions.

## Contrat
- Entrée : instantané OMG `private-only`, couverture officiellement déclarée complète, contrôlé par `validateOmgOnlineSnapshot` de S16.
- Sélection explicite d'une à vingt familles appartenant au catalogue validé. Pas d'aspiration implicite des 286 entrées.
- Consultation séquentielle des pages officielles `https://www.omg.org/spec/<famille>/` avec délai, temporisation, contrôle de type MIME, URL de réponse, taille maximale et rejet des tables non reconnues.
- Parser S16 `parseOmgHistory` **inchangé**, conservation de toutes les éditions formelles distinctes via `sourceKey` et provenance URL/date/SHA256.
- Sortie strictement privée : instantanés par famille et rapport de couverture dans le dossier d'audit hors dépôt. La présence historique ne définit pas l'applicabilité à une configuration ni la recommandation du radar.
- Une famille non résolue signifie « absence de preuve collectée » (page indisponible / format différent / erreur), et **non** « aucune ancienne édition ».
- Publication : aucune. Le passage ultérieur à `public-links-only` reste soumis à validation et à autorisation explicite, via l'outil C4 déjà existant. Ne publier ni HTML, ni PDF, ni instantanés `private-only`.

## Suite S16
C5 couvre la collecte multi-familles et l'audit; C6 devra intégrer les historiques approuvés dans `catalog-distribution/omg-public/histories/` avec un manifeste de couverture versionné et une recette Pages vierge sur plusieurs familles (UML et une autre au minimum). L'accès aux autres SDO reste un critère de clôture séparé de S16.

## Recette
- Tester UML et FUML (ou autre famille officiellement reconnue) sur un premier petit lot.
- Vérifier la liste des éditions, des états résolus/non résolus et les preuves de provenance.
- Vérifier qu'aucune publication Git, modification du catalogue métier ou suppression des éditions anciennes n'est réalisée.
- Après approbation des données minimales, vérifier les mêmes historiques sur Pages en session vierge, sans import local.
