# 117 — S16 : retour d’expérience de livraison et exigences S17

**Statut : consolidation documentaire post-S16 — proposition S16-DOC-R1, à vérifier et versionner après autorisation explicite.**

## 1. Constat factuel — historique et livraison finale

Lors d’une étape antérieure de S16, le commit `73c6a6ca1fdd5c4644c40e00f41fd8b8d238f113` a été poussé sur `main` et la procédure de publication a été exécutée avec succès, selon le rapport `S16-PUBLICATION-RESUME-R2`. Le rapport post-déploiement `S16-POSTDEPLOY-READONLY` confirme 14 contrôles HTTP/Git réussis, sans échec ; la recette graphique du Creator reste une étape distincte.

Cette campagne intermédiaire de tests applicatifs a donné 762/762. La première orchestration a échoué sur un répertoire déjà existant (`.radarchart-build/pages-multiproduct`) non pris en charge lors de la sauvegarde des artefacts précédents. La reprise a ensuite échoué sur une comparaison trop stricte entre un identifiant Git complet et son préfixe de sept caractères dans le manifeste `dist/site-manifest.json`. La troisième exécution a atteint la publication. Les deux défauts étaient situés dans l'orchestration, malgré des builds applicatifs validés.

### 1.1 Qualification finale S16 (constat de recette communiqué le 17 novembre 2026)

La référence de livraison finale S16 est `c92fbe5a9120b93051407b1c5ec9c3590db7efa2`, sur `main`. Les éléments communiqués pour la clôture indiquent **764 tests Node validés** et un GitHub Pages publié avec Creator et Viewer HTML autonome fonctionnels. La recette utilisateur finale a validé le bouton d'export HTML, le téléchargement, l'ouverture hors ligne, le contenu et les références. Les sources ISO, OMG, RFC/IETF et W3C ont été vérifiées dans le Creator. Ces faits de livraison finale ne doivent pas être confondus avec les mesures de la campagne intermédiaire 762/762 ni avec ses 14 contrôles distants.

L'audit local en lecture seule du 17 novembre 2026 constate `main` et `HEAD` exactement à `c92fbe5a9120b93051407b1c5ec9c3590db7efa2`. Il identifie ce document comme non suivi, ainsi que des caches ISO et une sauvegarde de test, à exclure d'un éventuel staging documentaire. Les rapports et preuves originaux restent la source primaire des validations effectuées ; le présent document ne prétend pas réexécuter leurs contrôles.

## 2. Décisions de méthode

1. **Un orchestrateur de livraison maintenu dans le dépôt** : ne plus inventer une procédure entière pour chaque release. Séparer les phases `qualify`, `build`, `stage`, `commit`, `publish`, `verify-remote` et `resume` avec contrats d'entrée/sortie et états persistants.
2. **Tests du pipeline, pas seulement de l'application** : inclure builds préexistants, répertoire final occupé, suppression interdite, redémarrage après interruption, divergences distantes, échec réseau et de publication, double lancement, manifestes en SHA court/long, provenance propre et artefacts absents.
3. **Idempotence / reprise** : chaque phase doit identifier les artefacts déjà prouvés, les valider et éviter toute nouvelle mutation inutile ; archivage avant remplacement ; jamais de `rm -rf` hors des destinations explicitement autorisées.
4. **Publication transactionnelle au mieux** : contrôles Git distants juste avant push ; refuser tout `force push` ; journaliser la première mutation distante et les compensations *manuelles* possibles, sans promettre un rollback automatique de Pages.
5. **Garde-fou données privées** : staging à partir d'un inventaire positif ; exclusion des caches privés, fichiers de sauvegarde et artefacts non autorisés ; contrôle d'absence de fuite dans le produit.
6. **Provenance normalisée** : stocker le SHA complet de 40 caractères dans les nouveaux manifestes ; accepter un SHA abrégé unique et validé dans les manifestes historiques ; vérifier les checksums et contenus des produits générés.
7. **Évidence reproductible** : journaux, empreintes, rapport machine-readable, phase/état, causes d'arrêt, comparaison entre artefacts locaux et ressources HTTP publiées ; copie automatique du bilan dans le presse-papiers sur macOS.
8. **Deux qualifications distinctes** : tests Node/HTTP/API d'une part, recette utilisateur dans le Creator (clics, navigation, éditions, publication) d'autre part. Ne jamais déclarer l'une équivalente à l'autre.
9. **Décision humaine** : toutes les questions de droit et de redistribution relèvent de la gouvernance humaine ; le logiciel ne contient pas de bloqueur ni de message de décision juridique.

## 3. Critères d'acceptation pour S17

Les critères ci-dessous sont des **contrats de réalisation futurs**, et non des capacités de pipeline déjà démontrées.

- Tests d'orchestration exécutés sur fixtures jetables sans opération Git distante, y compris les scénarios d'échec et de reprise.
- Une publication interrompue après commit reprend au même SHA, sans réécriture d'histoire, sans reconstruction évitable.
- Les destinations de build sont explicitement inventoriées, archivées ou remises à disposition avant reconstruction.
- Un manifeste abrégé ne provoque pas d'erreur de provenance si sa résolution Git est univoque et exacte.
- Toutes les phases produisent un rapport d'audit horodaté et une version courte copiée dans le presse-papiers.
- La livraison ne passe au statut « déployée et vérifiée » qu'après contrôle des ressources servies, avec les limites de recette graphique explicites.

## 4. Statut de S16

**Clôture fonctionnelle : S16 validée sur la référence finale `c92fbe5a9120b93051407b1c5ec9c3590db7efa2`.** Les résultats ci-dessous décrivent uniquement une étape technique antérieure et sont conservés pour le retour d’expérience.

Cette étape était publiée selon le rapport `S16-PUBLICATION-RESUME-R2` et vérifiée techniquement à distance selon `S16-POSTDEPLOY-READONLY` (14 contrôles, 0 échec ; `main` à `73c6a6ca1fdd5c4644c40e00f41fd8b8d238f113`, `gh-pages` à `0b856acc3291f7570d872b4997aa1ff3bb301cb4`). L’interface graphique du Creator et les services SDO externes n’ont pas été testés dans cette campagne : ils constituent des limites documentées et non des validations implicites. Cette limite de la campagne intermédiaire ne remet pas en cause la recette utilisateur finale décrite en section 1.1. Aucune réouverture fonctionnelle de S16 n’est nécessaire.

## 5. Contrats de mise en version documentaire

- Précondition : dépôt sur `main` au commit S16 de référence, avec aucune modification suivie préexistante ; vérifier le contenu et l'empreinte du document avant toute substitution.
- Ne jamais intégrer par `git add .` les caches ISO, les sauvegardes de test ou d'autres fichiers non autorisés. Prévoir un staging positif limité au document validé.
- Une installation documentaire locale **n'autorise pas** le commit, le push ni la publication ; chacun requiert une autorisation humaine explicite.
- Conserver une copie horodatée préalable dans le dossier d'audit et produire le SHA-256 avant et après l'installation ; copier le bilan dans le presse-papiers sous macOS.
- En cas d'échec : laisser le dépôt et le document d'origine inchangés ; ne pas poursuivre la livraison.

## 6. Cadrage initial S17-R1 — sans réouverture de S16

**Objectif :** fiabiliser les dialogues et interactions de gestion des révisions, groupes et blips, avec adoption progressive de véritables composants w2UI, libellés métier et validations explicites, sans déplacement des invariants métier vers la vue.

**Éléments actuellement constatés :** `js/radar-revision-dialogs.js` utilise `w2popup` et `w2form` ; `js/radar-standard-source-dialog.js` construit un élément HTML natif `dialog` ; `js/working-groups-classic.js` et `src/domain/working-groups.mjs` exposent des projections de groupes. Le fichier `js/blips.js` apparaît surtout comme corpus de données ; il ne prouve pas l'existence d'une API de suppression. Les signatures seules ne permettent pas de conclure sur le comportement complet ou les invariants des suppressions.

**Travaux groupés proposés :** (a) cartographier les dialogues et les API métier effectives ; (b) sélectionner une tranche fonctionnelle cohérente de dialogues à migrer vers w2UI ; (c) expliciter les confirmations, erreurs, libellés et conséquences des suppressions de groupes/blips ; (d) compléter tests applicatifs et tests d'orchestration sur fixtures jetables ; (e) actualiser la documentation d'architecture et les preuves de recette.

**Portes de validation :** aucun changement silencieux de modèle, de portée d'une suppression ou de publication ; aucune régression des exports et sources S16 ; audit machine-readable et rapport copié dans le presse-papiers ; décision explicite pour toute étape Git distante.

**Points à instruire avant conception détaillée :** définition réelle de « groupe », distinction groupe de travail / groupe de révision / regroupement de normes, localisation des opérations métier sur blips, portée de la suppression (association, révision active, entité), politique de restauration, commande canonique de la campagne des 764 tests et comportement exact des scripts de livraison. Ces points ne sont pas résolus par le seul inventaire de signatures.

