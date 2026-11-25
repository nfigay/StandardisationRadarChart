# S19-R74 — R12-R1 : taxonomie des commandes de rédaction

## Décision

Le menu W2UI de l'éditeur Tiptap distingue les catégories documentaires des actions techniques. Le choix utilisateur est prioritaire : **Gras** et **Italique** font partie du menu **Texte**, avec Souligné, Barré, Surligner et Effacer la mise en forme. Aucun bouton isolé Gras / Italique n'occupe la barre principale.

Le menu **Styles** rassemble Paragraphe, Titres 1–4, Citation et un sous-menu **Code**. Ce dernier propose **Code en ligne** (marqueur sur une sélection, ProseMirror `code`) et **Bloc de code** (nœud `codeBlock`, paragraphe entier). Ces commandes ne sont pas des doublons dans le modèle Tiptap, mais ne doivent pas apparaître deux fois comme catégories de premier niveau. Chacune est accessible une seule fois dans les menus.

Conserver Listes, Tableau (Lignes / Colonnes), Insérer et Historique (Annuler / Rétablir). Le code ne touche ni aux données de dossiers, ni à la validation des références, ni au renderer, ni à la géométrie. Le regroupement est identique pour les langues FR et EN.

## Préconditions et régression

Le correctif accepte les états vérifiés : panneau R9 avec empreinte CSS R11 exacte (ajoute uniquement les règles W2UI R12 au CSS existant), ou panneau R12 avec empreinte de panneau exacte et marqueurs CSS R11/R12 présents (CSS préservé). Rejet des structures non reconnues. Sauvegarde de chaque fichier modifié et aucune opération Git automatique.

Tests Node : arborescence réelle de `s19EditorItems`, unicité des deux commandes de code, cohérence FR/EN, préservation du dispatch Tiptap et des sous-menus W2UI. Un contrôle navigateur est requis pour valider la conservation de la sélection et le rendu des menus, notamment le sous-menu Code.

## Suite prévue

Couleur du texte, surlignage multicolore et fond du paragraphe restent un développement distinct car ils nécessitent des extensions Tiptap, une persistance du schéma et une restitution du renderer. Ils ne sont pas annoncés comme livrés dans R12-R1.
