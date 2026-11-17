# 95 — S16 : OMG, ressources documentaires, acquisition et droits

État : candidat de découverte, non publié. OMG est une cible prioritaire de la fédération [94](94-S16-FEDERATED-STANDARDIZATION-KNOWLEDGE.md). Aucun corpus OMG n'est incorporé au catalogue natif ou à une distribution. Revue des ressources publiques effectuée le 16 novembre 2026 ; les pages peuvent évoluer.

## 1. Ressources identifiées

| Ressource | Accès officiel | Information et limites |
|---|---|---|
| Catalogue | https://www.omg.org/spec/ | Table de spécifications avec titre, acronyme, version, statut, mois de publication ; table d'adoptions ISO ; couverture des versions listées, pas de tout l'historique |
| Fiche versionnée | https://www.omg.org/spec/SysML/1.4 | Catégories, organisations contributrices, documents, historique, liens RDF et JSON-LD ; une organisation contributrice n'est pas une preuve d'adoption ou d'affiliation |
| JSON-LD versionné | https://www.omg.org/spec/SysML/1.4/About-SysML.jsonld | Lien annoncé dans la fiche ; syntaxe et vocabulaire du contenu brut à confirmer |
| JSON-LD variante beta | https://www.omg.org/spec/C2MS/1.2/Beta1/About-C2MS.jsonld | Lien annoncé dans https://www.omg.org/spec/C2MS/1.2/Beta1 ; variante distincte d'une publication formelle |
| RDF versionné | https://www.omg.org/spec/SysML/1.4/About-SysML.rdf | Lien annoncé ; pas encore analysé |
| Documents normatifs | https://www.omg.org/spec/XMI | PDF, XMI, XSD ; ne pas moissonner les modèles ni les documents intégraux dans ce lot |
| Métamodèles / vocabulaires | https://www.omg.org/spec/API4KP/ ; https://www.omg.org/spec/Commons ; https://www.omg.org/spec/MVF/1.0/About-MVF | Ressources sémantiques potentielles pour le futur noyau ; pas de dépendance technique décidée |
| Accès juridique | https://www.omg.org/legal/ ; https://www.omg.org/robots.txt | Portée des droits à documenter par ressource ; robots.txt n'accorde pas de licence |

L'index public observé comporte environ 286 lignes selon l'instantané et 16 lignes de correspondances ISO ; les chiffres varient et ne constituent pas un inventaire qualifié. L'index liste notamment SysML et ses publications ; la fiche SysML 1.4 documente l'adoption ISO/IEC 19514:2017 et un historique de versions. La table ISO mentionne aussi UAF 1.1 avec deux désignations ISO et UML 2.4.1 avec deux parties. Préserver les publications distinctes ; pas de relation d'équivalence automatique. Les variantes beta doivent conserver l'identité de l'URL complète. La version courante (URL sans version) n'est pas une identité de publication.

La présence de liens RDF/JSON-LD dans certaines fiches ne prouve pas leur disponibilité pour toutes les spécifications. L'environnement de réalisation n'a pas pu télécharger les réponses brutes (DNS/accès outil). Aucun schéma JSON-LD n'est donc supposé. Ne pas confondre fichier de description de publication, ontologie normative et modèle XMI. L'outillage permet d'inventorier les clés, types et contextes sans expansion distante, pour construire ensuite une cartographie sur données réellement observées.

## 2. Conditions d'accès et politique de réalisation

Les notices légales OMG/EDMA autorisent, sauf indication contraire, une copie à titre strictement personnel et non commercial avec conservation des mentions de propriété. Elles exigent en général une permission écrite pour les autres reproductions et redistributions. Le site explique aussi la disponibilité gratuite des spécifications et leur mise en œuvre : https://www.omg.org/gettingstarted/overview.htm. La liberté de mise en œuvre n'est pas une licence générale de réutilisation du catalogue ni de ses métadonnées.

Le robots.txt observé ne bloque pas `/spec/`, mais cela ne vaut ni autorisation contractuelle ni licence. Pas de contournement des zones membres, login, interdictions techniques ou restrictions. Demander à OMG/EDMA une permission explicite ou une licence spécifique pour l'extraction automatisée, conservation/normalisation, mise à jour et redistribution des métadonnées et liens (y compris conditions d'attribution et volumes). Distinguer licence du texte normatif, licence des modèles, licence des métadonnées, et conditions du site. Le responsable de projet a indiqué pouvoir négocier directement avec OMG ; aucune autorisation n'est présumée acquise.

Dans l'intervalle, analyse bibliographique ponctuelle des pages publiques et développement sur fixtures synthétiques. Toute acquisition réseau du candidat exige un fondement documenté et une liste explicite d'URL ; une copie personnelle non commerciale ne peut pas servir de fondement à une exploitation de projet/commerciale. Aucun fichier brut ou dérivé OMG dans Git, les distributions, les Viewers ou le catalogue métier. Les droits éventuels sont contrôlés avant toute intégration produit. Le contrôle logiciel n'est pas une validation juridique de l'autorisation déclarée.

## 3. Outillage candidat

`tools/read-omg-metadata.mjs` (Node 22, aucune dépendance) :

- `--plan` : liste des ressources pilotes, aucune requête.
- `--inspect-catalog <html>` : inspection locale d'une copie déjà licitement détenue ; compte les publications et correspondances, sans écrire une autre copie.
- `--inspect-jsonld <url-versionnée> <file>` : inspection locale des clés, types, contextes, sans déréférencement externe ni normalisation sémantique arbitraire.
- `--acquire --rights <json> --out <dossier-privé-existant> --catalog --pilot` : acquisition du catalogue puis des deux JSON-LD pilotes, uniquement avec autorisation explicite correspondant aux URL et au but. Une liste de liens versionnés explicitement autorisés peut remplacer `--pilot`.

Contrat des droits : `schemaVersion:1`, `sourceId:"omg"`, `basis` (permission écrite, licence spécifique, ou copie personnelle non commerciale si réellement applicable), `reference`, `purpose`, `allowAcquisition:true`, `allowPrivateRetention:true`, `urls` exactes. Le fichier ne vaut pas autorisation en lui-même. Pour le projet, demander une autorisation/licence applicable ; ne pas activer artificiellement le cas personnel. Le catalogue normalisé est également une copie de travail soumise aux droits déclarés. La redistribution reste exclue même si une autorisation plus large existe : elle nécessite une autre porte de validation.

Le réseau est limité à HTTPS sur www.omg.org, au catalogue ou à un JSON-LD explicitement versionné, sans redirection, sans authentification, sans suivi récursif. Maximum 50 URL explicites par exécution, acquisition séquentielle espacée de deux secondes, 30 s et 8 Mio par réponse, validation de type MIME, arrêt à la première erreur réseau. Les réponses brutes et les rapports sont placés dans un dossier neuf et privé hors dépôt ; SHA-256 et dates d'acquisition sont calculés sur les octets effectivement reçus. Les erreurs d'analyse restent consignées et la couverture partielle est signalée. Les URL relatives et les variantes Beta sont traitées, les liens mutables et documents normatifs sont exclus.

L'extracteur HTML est volontairement restreint aux en-têtes des tables connues. Il ne constitue pas un parseur HTML général ; la forme brute réelle du catalogue reste à qualifier. Les lignes non reconnues sont signalées, les doublons d'identité exacts dédupliqués, les conflits de lignes signalés. Les relations `omg-reports-iso-adoption` conservent le sujet versionné et des listes de désignations ISO / identifiants de fichier OMG sans inventer de correspondance bijective. Les identités externes ne deviennent pas `standardId` et aucun acteur ne devient `organizationId` dans ce lot.

## 4. Porte de qualification et trajectoire

Tests synthétiques : identité versionnée et Beta ; liens étrangers/mutables/PDF refusés ; déduplication, relations ISO multi-parties ; couverture incomplète signalée ; inventaire JSON-LD sans expansion ; refus de requête hors autorisation ; acquisition privée séquentielle et empreintes ; arrêt sur HTTP 429. Ces tests ne qualifient pas encore le catalogue officiel brut ni la sémantique RDF. Après acquisition pilote autorisée sur Mac, inspecter les champs effectivement disponibles et leurs licences, confirmer le format réel des tables, puis construire un adaptateur de projection documenté et une recette navigateur. Les correspondances d'identités doivent être validées selon DEC-009/018 avant toute intégration native.

## R2 — Consultation Creator

Voir [96](96-S16-A-R2-FEDERATED-STANDARDS-UI.md) : parseur partagé navigateur/Node, import local marqué non vérifié, acquisition directe sur fondement documenté, corpus privé de session et vue adoptions ISO. Aucun corpus embarqué, aucune intégration métier OMG ni redistribution.

## R3 — Séparation du collecteur et de la consultation

Le contrat [97](97-S16-A-R3-OMG-CORPUS.md) remplace l'acquisition directe depuis le Creator. Le collecteur externe `tools/read-omg-metadata.mjs` reste responsable de l'acquisition réseau explicite sur fondement applicable et de la provenance. `--prepare-catalog <html> --out <répertoire privé>` permet de produire le même instantané JSON sans réseau à partir d'un fichier déjà détenu. L'interface n'exige aucune saisie de droits ; le corpus local est validé, conservé dans IndexedDB et rechargeable. Les droits de diffusion ne sont pas conférés par l'import.

R3.1 : voir [98](98-S16-A-R31-OMG-ONLINE-CATALOG.md). La lecture ponctuelle de l’index public est désormais possible depuis le Creator ; la collecte multiressource reste soumise au contrat externe.
