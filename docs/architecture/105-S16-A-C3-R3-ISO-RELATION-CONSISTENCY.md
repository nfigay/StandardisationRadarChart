# S16-A-C3-R3 — Résolution cohérente des relations ISO dans la fiche

## Objet
La fiche ISO C3-R2 rend visibles les champs « Remplace / Remplacée par » mais les résout uniquement dans la petite liste `isoDeliverables` en mémoire ; la vue « Éditions et documents liés » résout les identifiants via `__radarIsoWindowed.get({type:'deliverables',id})`. AP242:2020 peut donc être présentée comme liée à des notices introuvables alors que la vue des éditions les trouve.

## Décision
- Réutiliser le **même accès par identifiant ISO** que la vue des éditions, y compris sur la fiche ordinaire et la copie documentaire ISO du catalogue.
- Afficher initialement les métadonnées disponibles ; compléter *uniquement les champs relationnels de la fiche* après lecture du cache local IndexedDB.
- Un résultat de cache doit avoir l'identifiant demandé et une référence non vide. Tout autre cas conserve « référence absente du cache » : ne jamais deviner le nom de la norme, la date, son statut ni la relation.
- Borne de 100 identifiants, sans réseau ni modification du catalogue. Les retours tardifs ne modifient pas une fiche fermée ou remplacée.
- Le Scope et les métadonnées originales ne sont pas modifiés ; le formulaire demeure en lecture seule. Les usages d'un chargeur isolé sans cache fenêtré restent pris en charge.

## Cas AP242
La fiche ISO 10303-242:2020 doit résoudre `57620` en ISO 10303-242:2014, `72059` en ISO 10303-242:2014/Cor 1:2016 et `84667` en ISO 10303-242:2022 lorsque les notices correspondantes sont présentes dans le cache. La vue des éditions reste la source d'exploration des quatre éditions, du rectificatif et du projet identifié ; elle ne confond pas références documentaires et recommandations du radar.

## Qualification
Quatre tests C3-R3 ajoutés ; conserver les tests C3-R2, A8.2, ISO/OMG et la régression intégrale. Le navigateur doit confirmer l'affichage après résolution asynchrone, et l'invariance du Scope après navigation. Aucune publication sans recette Pages.
