# S14-Y-R1 — Portabilité des tests du moteur booléen avancé

## Incident
Le test `tests/radar-s14-y.test.mjs` cherchait le module métier sous `payload/js/`, un répertoire propre à l'archive de livraison, absent du dépôt installé. L'erreur `ENOENT` se produisait avant l'exécution des onze tests.

## Correction
Le test résout `../js/radar-iso-advanced-query.js` à partir de `import.meta.url` (répertoire `tests/` dans le dépôt installé). Un chemin alternatif `../payload/js` est conservé uniquement pour les dispositions de paquet. Les trois autres modules consultés par le test suivent la même base.

## Périmètre
Correctif **des tests uniquement**. Aucune modification de `radar-standards-panel.js`, des APIs IndexedDB, des données ISO, des filtres ICS/TC-SC ou du moteur logique. La validité fonctionnelle complète dans Chrome n'est pas démontrée par ces onze tests Node.

## Règle de conception
Les tests livrés doivent être exécutés après simulation de leur installation, à partir de l'arborescence réelle du dépôt. Le chemin `payload/` ne doit pas être requis par les tests installés.

## Vérification
`node --test tests/radar-s14-y.test.mjs` doit renvoyer `# pass 11` et `# fail 0`.
