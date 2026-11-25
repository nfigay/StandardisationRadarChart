# 148 — S19 / Cohérence des dimensions des tableaux (R17-R1)

R17 écrivait `colwidth` uniquement dans la colonne sélectionnée. Tant que les autres largeurs restaient indéfinies, le moteur de mise en page pouvait étirer le tableau à 100% du panneau, donnant l'impression que la saisie numérique n'avait aucun effet.

R17-R1 remplit les largeurs des colonnes non renseignées (valeur initiale 140 px), puis écrit des `colwidth` cohérents dans toutes les lignes et cellules, y compris les cellules à `colspan`. Les futures modifications de largeur sont localisées à la colonne logique concernée. Le rendu HTML calcule la largeur globale de la table comme somme de la première ligne lorsque les attributs sont valides. Il respecte les largeurs explicites et ne force pas `width:100%`.

La hauteur R17 était posée uniquement sur le nœud `<tr>`. R17-R1 ajoute une variable CSS `--s19-row-height` sur la ligne et l'applique à ses cellules, en édition comme en export. La hauteur reste une valeur minimale effective : le contenu peut imposer davantage. Le mode « Hauteur automatique » supprime la variable.

La sortie HTML n'accepte que des entiers compris entre 45 et 2000 px pour les colonnes et entre 24 et 800 px pour les lignes. Aucun style arbitraire n'est injecté depuis le document. Les valeurs préexistantes sont respectées.

Les tests automatisés contrôlent la représentation JSON -> HTML et les règles associées. Une recette navigateur reste requise, notamment sur les cellules fusionnées et les styles W2UI du panneau.
