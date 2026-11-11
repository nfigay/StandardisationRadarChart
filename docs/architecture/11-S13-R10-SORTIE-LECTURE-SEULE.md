# S13-R10 — Sortie explicite de lecture seule

## Défaut observé
Après publication, l’interface affichait une alerte « This revision is read-only. Create or open a draft. » sans proposer de chemin direct pour poursuivre. Le moteur protégeait correctement la publication, mais les utilisateurs percevaient les menus comme bloqués.

## Correction
Les gardes W2UI d’édition pour les révisions `published` et `archived` proposent désormais explicitement de créer ou d’ouvrir un `draft` depuis la révision active. L’opération exige une confirmation positive et réutilise `handleCreateOrOpenDraft()` et `radar-catalog-ui.createOrOpenDraft()` ; aucun nouveau mécanisme de révision n’est ajouté. Après refus, aucune mutation n’a lieu et la commande initiale reste annulée. Le clic initial ne déclenche pas automatiquement sa mutation après la dérivation ; l’utilisateur doit la relancer dans le draft.

## Invariants
L’état `published` / `archived` ne devient jamais éditable ; `draft` seul peut muter le graphe. `imports[]` reste la seule persistance de catalogue. La publication, l’export explicite et le snapshot Cytoscape gardent leurs contrats. Le comportement de dérivation de révision archivée demeure conforme au moteur actuel et reste un sujet de gouvernance à arbitrer.

## Limites et validation
Tests automatisés de l’offre de dérivation après refus d’édition, annulation sans mutation et absence de régression sur les autorisations d’export/import. Validation du parcours navigateur toujours nécessaire ; les données en mémoire doivent être exportées sur disque.

S12-R1 et les décisions DEC-009, DEC-010, DEC-016, DEC-017, DEC-018 restent `OPEN`.
