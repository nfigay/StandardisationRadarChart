# Matrice de traçabilité

Le fichier [`requirements.csv`](requirements.csv) est l'index de suivi. Il comporte **49 exigences** reliées aux chapitres de l'analyse, aux décisions, aux composants à créer ou modifier et aux tests.

## États

- `approval`: `proposed` → `approved` / `rejected` / `deferred`.
- `implementation`: `not_started` → `in_progress` → `implemented` / `blocked`.
- `verification`: `not_run` → `pass` / `fail` / `blocked`.
- `evidence_commit`: commit Git ou référence d'audit/test, jamais une promesse.

Ne pas passer `implementation` à `implemented` sans identifier le changement. Ne pas passer `verification` à `pass` sans un résultat de test observable. Une case vide indique une preuve absente.
