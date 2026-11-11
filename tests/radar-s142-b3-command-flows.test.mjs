import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(
  new URL('../js/radar-s14-z-sources.js',import.meta.url),
  'utf8'
);

const start=source.indexOf('const COMMAND_FLOWS={');
const end=source.indexOf(
  'function renderVisualGuide(panel,operation)',start
);
assert.ok(start>=0 && end>start);

const sandbox={};
vm.createContext(sandbox);
vm.runInContext(
  source.slice(start,end)+
  '\nglobalThis.flows=COMMAND_FLOWS;',
  sandbox
);
const flows=sandbox.flows;

const operations=[
  'distributedSync','sync','import',
  'changesLoad','rssSync','refresh'
];
const fields=[
  'title','description','origin','originPlace',
  'processing','transfer','destination',
  'destinationPlace','impact','condition'
];

test('six contrats de flux bilingues complets',()=>{
  for(const language of ['fr','en']){
    assert.deepEqual(
      Object.keys(flows[language]).sort(),
      [...operations].sort()
    );
    for(const op of operations){
      for(const field of fields){
        assert.ok(
          typeof flows[language][op][field]==='string' &&
          flows[language][op][field].trim(),
          language+'/'+op+'/'+field
        );
      }
    }
  }
});

test('distribution GitHub Pages et IndexedDB local distingués',()=>{
  const f=flows.fr.distributedSync;
  assert.match(f.originPlace,/Internet/);
  assert.match(f.destinationPlace,/navigateur/);
  assert.match(f.destination,/IndexedDB/);
  assert.match(f.transfer,/HTTP/);
});

test('import JSONL distingue disque utilisateur et déploiement',()=>{
  assert.match(flows.fr.import.origin,/Disque/);
  assert.match(flows.fr.import.transfer,/sélecteur/);
  assert.match(flows.fr.sync.condition,/Ne choisit pas un fichier/);
});

test('journal et RSS sont facultatifs',()=>{
  assert.match(flows.fr.changesLoad.condition,/absent/);
  assert.match(flows.fr.rssSync.condition,/configurée/);
});

test('reconstruction des vues ne prétend pas télécharger',()=>{
  assert.match(flows.fr.refresh.transfer,/pas de téléchargement/);
  assert.match(flows.fr.refresh.destinationPlace,/Interface/);
});

test('les impacts sont visibles et distincts du succès réel',()=>{
  const section=source.slice(end,
    source.indexOf('function renderDataExplanation(dialog)',end));
  assert.match(section,/flow\.impact/);
  assert.match(section,/flow\.transfer/);
  assert.match(section,/flow\.originPlace/);
  assert.match(section,/flow\.destinationPlace/);
  assert.doesNotMatch(section,/activateCommand/);
});

test('les commandes et leur suivi métier sont inchangés',()=>{
  assert.match(source,/activateCommand\('distributedSync'\)/);
  assert.match(source,/activateCommand\(op\)/);
  assert.match(source,/const poll=\(\)=>/);
  assert.match(source,/void renderStatus\(summary\)/);
  assert.match(source,/renderDataExplanation\(dialog\)/);
});
