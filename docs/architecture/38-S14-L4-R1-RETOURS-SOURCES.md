# S14-L4-R1 — Retours observables des commandes de sources

- L4 fermait immédiatement la fenêtre après `click()` sur un bouton caché ; ce déclenchement n'atteste ni réussite ni échec.
- R1 conserve la fenêtre ouverte, indique l'opération lancée, capte les évolutions du composant `role=status` via `MutationObserver` et montre le retour original sans l'interpréter comme succès certain.
- Le formulaire donne une aide explicite : « Charger les données ISO locales » lit les fichiers servis localement ; seul « Importer un fichier JSONL » ouvre le sélecteur de fichiers.
- Les commandes existantes et leurs effets restent propriétaires des modules d'origine ; aucune synchronisation, modification IndexedDB ou import ne sont introduits ici.
- Limite : une commande qui ne modifie pas le statut source n'a pas de résultat confirmable. Un contrat d'opération asynchrone `{status, counts, error}` sera nécessaire pour une confirmation fiable de bout en bout.
- Les statuts et boutons du panneau sont internationalisés FR/EN via l'instance `i18next` existante.
