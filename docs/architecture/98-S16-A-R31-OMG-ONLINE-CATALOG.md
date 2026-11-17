# S16-A-R3.1 — Actualisation du catalogue OMG depuis le Creator

Statut : candidat de réalisation ; qualification réelle en attente.

## Contexte et décision

R3 est installé sur Mac (74 tests ciblés, 673 tests Node réussis). Le corpus réel n'a pas été préparé : aucune entrée locale n'était disponible. Le retour utilisateur demande une acquisition en ligne, de préférence depuis l'éditeur, sans formulaire juridique ou téléchargement manuel de HTML. R3.1 remplace la restriction R3 de collecte uniquement externe pour le seul index bibliographique public. Les autres collectes restent séparées.

## Parcours

Standards → OMG → Sources de standardisation → Actualiser OMG en ligne. Sur le serveur local, le Creator peut également charger le corpus préparé par le collecteur. La sélection d'une source ne déclenche pas de réseau externe. Une acquisition réussie remplace atomiquement la génération documentaire ; un échec conserve le corpus précédent. Le cache navigateur persiste dans IndexedDB par origine ; l'effacement du cache navigateur ne supprime pas le corpus préparé sur disque. Aucun changement des références métier, organisations, portefeuilles, évaluations ou révisions.

## Contrat documentaire

Une lecture explicite de https://www.omg.org/spec/ : GET HTTPS, sans identifiants ni redirections, délai borné, limite 8 Mio, réponse HTML UTF-8, empreinte SHA-256 des octets lorsque disponible. Seules les métadonnées bibliographiques normalisées sont conservées. Pas de stockage du HTML brut, pas de parcours récursif, pas de téléchargement de textes normatifs. Les tables d'index courant/récent et d'adoptions ISO sont distinctes. Le contrôle de couverture exige leur présence, aucune ligne rejetée, cohérence des compteurs et totaux annoncés. Les imports manuels peuvent demeurer partiels et sont identifiés comme locaux non vérifiés. Les identités FIBO à segments multiples (EDMC-FIBO/BE/1.1 notamment) sont préservées sans assimilation à une autre édition. Les relations d'adoption ne fusionnent aucune identité.

L'index officiel consultable publiquement pendant l'étude montrait 282 entrées principales et 16 lignes d'adoption ; ces nombres observés ne sont pas des constantes de validation. Le HTML brut n'a pas pu être téléchargé dans l'environnement de réalisation : aucun corpus officiel n'est livré ni présumé qualifié.

## Relais local et distribution

`tools/radar-omg-local-bridge.mjs` fournit un middleware Vite de développement, installé par `vite.omg.config.mjs` qui compose la configuration existante. `npm run dev` utilise ce wrapper ; les commandes de construction ne changent pas. Les deux routes POST `/__radar-omg/catalog/current` et `/__radar-omg/catalog/refresh` ne sont accessibles qu'en boucle locale, avec origine identique et en-tête `X-Radar-Documentary: omg-index-v1`, sans corps ni URL paramétrable. L'actualisation est sérialisée et limitée à une tentative par 15 secondes. Le serveur ne relaie aucun autre hôte, aucune redirection, aucun contenu arbitraire. Le corpus normalisé est écrit atomiquement, en fichier privé, hors dépôt : `~/Documents/StandardizationRadarChart-Audits/S16-OMG-Current.json`. Le collecteur `--collect-public-index --out` produit également un exemplaire d'audit. Le démarrage du serveur ne collecte rien.

Sur GitHub Pages, le relais n'existe pas : l'accès direct dépend de CORS et du réseau ; l'import local reste disponible. Le Creator autonome ne doit pas supposer un relais. Le Viewer reste exclu de l'acquisition. Le corpus n'est ni embarqué dans les builds, ni publié sur GitHub. Les origines local-unverified, official-fetch, local-relay et local-prepared décrivent le parcours documentaire, pas une signature cryptographique du producteur ni une autorisation juridique.

## Droits et limites

La lecture ponctuelle de l'index bibliographique public est demandée par le responsable du projet ; cela ne constitue pas une licence générale Open Data. Les conditions OMG restent applicables. La réutilisation massive, redistribution et collecte de ressources supplémentaires (RDF/JSON-LD, modèles, historiques) restent soumises à revue et au mécanisme de droits externe R1/R3. Aucun formulaire de droits dans le Creator. Le corpus reste privé. L'intégration métier OMG est hors périmètre, réservée à R4.

## Qualification

25 tests documentaires, incluant un relais HTTP réel avec réponse amont simulée ; deux nouveaux scénarios de contrôleur W2UI. La suite complète Mac doit atteindre 683 tests, les ciblés 84. L'installateur vérifie le chargement effectif de la configuration Vite et peut déclencher une première collecte publique unique ; le résultat d'acquisition est indépendant du succès des tests d'installation. Recette navigateur : actualiser, vérifier compteurs et FIBO/adoptions, recharger la même origine, tester conservation en cas d'échec. Ne pas qualifier le corpus si l'extracteur ne reconnaît pas la réponse réelle.

## Correctif de qualification R3.1-R1 — chemins canoniques

Le rapport Mac R3.1 indique 83/84 tests ciblés, avec un échec du test de collecte privée ; la collecte réelle et la suite complète ne sont pas exécutées. Le test comparait le chemin fourni à un chemin retourné après résolution par `realpath`. L'environnement macOS peut exposer les répertoires temporaires sous un alias symbolique (`/var` vers `/private/var`). Le même échec est reproduit sous Linux avec `TMPDIR` pointant vers un lien symbolique. Le test compare désormais les chemins canoniques et exerce explicitement un alias du dossier d'audit. Les contrôles de sécurité, permissions 0600, contenu, empreinte, conservation du corpus après réponse partielle et nettoyage des fichiers temporaires sont maintenus. Aucun changement du collecteur ni des composants applicatifs. Les 25 tests documentaires réussissent sous Node 22.16.0 avec un TMPDIR ordinaire et avec un alias symbolique. La confirmation sur Mac (84 tests ciblés, 683 au total) et la collecte réelle restent obligatoires. Le correctif reprend le candidat R3.1 déjà appliqué, sans réinstallation, commit ni publication.
