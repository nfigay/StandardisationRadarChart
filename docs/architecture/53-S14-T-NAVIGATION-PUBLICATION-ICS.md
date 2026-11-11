# DEC S14-T — Navigation complète sans catalogue intégral en mémoire

Le nombre **100** représente la taille de fenêtre initiale, jamais un plafond du catalogue. Le panneau propose **100 / 250 / 500** par fenêtre et une navigation par curseurs IndexedDB avec début, précédent, suivant. Le bouton suivant reste disponible tant que `page.next` existe. Le mode fenêtré conserve seulement la fenêtre courante et les jetons de pages déjà visitées.

La recherche et les groupes ICS/TC-SC sont maintenus entre les fenêtres. Un changement de taille, de recherche ou de sélection réinitialise les jetons. Cette première ergonomie ne fournit **pas de saut direct vers la page 500** : celui-ci requerrait un index de position/seek dédié pour éviter des centaines de scans.

La publication ICS est **administrateur uniquement**. Le script `tools/activate-local-ics-catalog.mjs` appelle l'outil S14-S de fabrication du paquet statique avec `ICS.csv`, conserve l'ancien catalogue, sauvegarde `radar-catalog-config.json`, puis pointe Vite vers la nouvelle publication locale. Il refuse une configuration distante personnalisée et un dossier déjà existant. Les droits de redistribution d'ICS.csv doivent être vérifiés **avant** de fournir l'option de reconnaissance explicite. Les serveurs publics HTTPS restent à déployer séparément.

Les 81 768 normes ne sont jamais réimportées par la seule modification du navigateur. Le paquet statique réutilise les releases ISO du 9 novembre. Le contrôle fonctionnel ICS/IndexedDB doit être fait dans Chrome.
