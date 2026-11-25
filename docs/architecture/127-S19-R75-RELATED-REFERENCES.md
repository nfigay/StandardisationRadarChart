# 127 — S19-R75-R3: références associées et navigation documentaire

## Décision

Conserver les contenus Tiptap (`sections`) et les références métier structurées (`relatedReferences`) dans **le même dossier de justification** de l'extension `radarRationales` de la révision active. Aucun nouveau store, aucun changement de géométrie S18. Les anciens nœuds `radarReference` insérés dans le texte restent lisibles.

## Contrat documentaire

`relatedReferences?: Array<{type,id,label,standardId?,radarId?,provider?}>`. Types : `blip`, `standard`, `radar`, `revision`, `organization`, `dossier`, `source`, `url`. Maximum 100 liens. `standardId` requis pour `blip`, `radarId` pour `revision`, `provider` pour `source`. Identifiant exact, étiquette descriptive non identifiante. Édition uniquement en brouillon dans l'API de persistance existante ; copies détachées, pas de modification de cibles.

## Interface

Ruban Tiptap organisé en Texte, Paragraphes, Tableau, Historique. Section FR « Références associées » / EN « Related references » séparée du corps du texte. Recherche/choix parmi les blips, standards et contexte courant vérifiables ; saisie explicite pour liens externes ou sources, car aucun registre fédéré ne peut être inféré. En visualisation, la section est incluse dans le HTML `srcdoc` sandboxé et ses activations sont reçues par le panneau parent.

## Navigation

- `blip`: vérification du couple (`blipId`, `standardId`) dans la révision active et le graphe ; surlignage temporaire DOM sans mutation Cytoscape.
- `radar`/`revision`: activation du groupe actif uniquement, sans sélection implicite d'autres révisions.
- `standard`: ouverture du registre natif lorsqu'il existe ; **sélection exacte non prise en charge** par son API publique actuelle, l'utilisateur en est informé.
- `dossier`: dossier actuel uniquement.
- `organization`: identité vérifiée mais **pas de navigation exacte** exposée.
- `source`: conservée, non résolue faute d'un service de résolution typé et borné, aucune acquisition réseau automatique.
- `url`: seuls HTTP(S), ouverture externe avec `noopener,noreferrer`.

Une cible absente, ambiguë, hors contexte ou non autorisée est signalée, jamais approximée. Les droits Creator/Viewer sont respectés ; les révisions publiées restent non modifiables.

## Limites / prochaine qualification

Cette livraison est un **candidat de recette**, non un dispositif multi-panneaux complet. Ajouter les adaptateurs de navigation exacte `standard`, `organization`, `source`, et éventuellement la navigation inter-révisions, uniquement après identification des API publiques et des règles de publication correspondantes. Tester visuellement la distribution Creator, puis Viewer et export. La suite Node fournie ne remplace pas la recette navigateur ni la suite globale du dépôt.
