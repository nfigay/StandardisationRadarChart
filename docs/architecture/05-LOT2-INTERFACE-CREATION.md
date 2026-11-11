# Lot 2 — Interface de création

Deux actions de menu Radar tools : Ajouter un blip et Créer standard + blip. Elles utilisent le moteur transactionnel du Lot 1.

Lecture limitée du catalogue privé via listStandardsForDraft(group, revisionId), sans second catalogue ni modification de l'API UI existante.

Une révision draft de catalogue est requise. Refus published, archived, historiques et demandes incomplètes. Les formulaires permettent la sélection d'un standard existant ou la création d'un standard avec son blip, et la saisie du libellé, de l'anneau et du quadrant.

Placement : point initial libre dans la zone visible du graphe, sans appel plotData ni déplacement de blip existant. Il ne garantit pas encore l'alignement géométrique avec anneau/quadrant ; ajustement manuel possible, validation navigateur requise.

Tests : suite existante plus cinq tests de formulaire et placement. Les cas JSON, SSR, CSV, navigation sont réservés au Lot 3.

DEC-009, DEC-010, DEC-016, DEC-017 et DEC-018 restent OPEN. Hypothèses : un seul catalogue actif, standards lus via une projection copiée, anneaux/quadrants textuels tant que la nomenclature de chaque radar n'est pas formalisée.
