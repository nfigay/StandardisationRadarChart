# 08 — A8.6-R2 : candidat Publisher, recette obligatoire

Baseline R1 `824eb7e771efcca8d6b1d22637f4e6d09a054dac`. Preuve utilisateur R1 : 600 tests réussis ; `A86-R1-RETRY-DELIVERY-CHECK` : before=4, after=4, downloaded=true, message="Download requested", historyUnchanged=true, ok=true. Les générations antérieures étaient demandées par le bouton de génération. Le défaut ISO reste signalé dans l'iframe de prévisualisation, pas dans le Viewer livré.

## Vérification en environnement d'analyse

Node 22.16.0 : Publisher 31/31, dont deux nouveaux cas R2 et adaptation du test de prévisualisation. Suite disponible hors client-variants : 597 réussites, aucun échec de test exécuté. Le fichier client-variants ne charge pas faute de Vite (un échec de chargement, cinq tests historiques non exécutés). Suite complète attendue sur Mac : 602. Aucune reconstruction Pages/standalone ni validation navigateur réelle effectuée ici. Le package impose les tests complets avant commit et reconstruit les distributions ensuite.

## Recette du candidat

1. Charger `catalogue-publications-a86-r1.json` dans le Creator autonome reconstruit. Vérifier le catalogue et les publications existantes.
2. Radar unique : Prévisualiser dans le Viewer puis cliquer Ouvrir la prévisualisation dans un nouvel onglet. Vérifier démarrage sans arbre/édition, fiche A, Références du radar, notice ISO synthétique et Détails. Vérifier titre, portée, FR/EN. Fermer l'onglet, puis prévisualisation dans le Creator. Aucune livraison ajoutée.
3. Collection : même parcours, A puis B puis A ; références du radar actif uniquement, ISO A consultable. Comparer au Viewer HTML candidat et au Viewer extrait du ZIP, hors connexion. Si l'onglet Blob ne démarre pas, relever navigateur, console et URL ; ne pas qualifier sur la seule base du candidat téléchargé.
4. Générer une première livraison avec motif « Première diffusion de test ». Déplier L001 : UUID, révisions, commit, empreintes, ZIP, motif. Retélécharger dans le même dialogue ; comparer les SHA-256 des ZIP et le nombre d'entrées.
5. Demander une seconde génération identique, refuser la confirmation : aucune entrée. Recommencer et confirmer avec motif « Régénération volontaire » : L002, nouvel UUID, Viewer identique, même hash HTML, ZIP distinct. Modifier la présentation (titre) via la définition, sauvegarder, générer : L003, définition modifiée, Viewer différent. Aucun changement artificiel du contenu métier.
6. Exporter le catalogue JSON sous un nouveau nom, fermer puis rouvrir ; fiches, motifs et différences conservés. Aucun bouton de retéléchargement d'anciennes livraisons sans Blob. Charger aussi un catalogue R1 existant sans motif : historique lisible, motif non renseigné.
7. Vérifier le Viewer générique, le Creator, les deux langues, le parcours HTTP en iframe si disponible, l'absence de motif privé dans le payload/manifeste, et la provenance du pilote. Relever commit, navigateur, contrôles, anomalies. Pas de push/tag automatique.

Statut : candidat à qualifier, pas release publique. Workspace reporté. Voir architecture 86-R2.
