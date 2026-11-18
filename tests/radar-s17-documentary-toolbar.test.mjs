import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/radar-standards-panel.js', import.meta.url), 'utf8');

test('S17 : la commande Fiche documentaire s affiche pour toutes les vues de normes et SDO', () => {
  assert.match(source, /\['ics','committees','iso-list'\]\.includes\(mode\)\?\['details'\]/);
  assert.match(source, /native\?\['details','declare'/);
  assert.match(source, /ext\?\['details','openSource'/);
  assert.match(source, /omg\?\['details','openSource'/);
  assert.match(source, /resourceDetails:'Fiche documentaire'/);
  assert.match(source, /resourceDetails:'Document details'/);
});

test('S17 : disparition des accès ISO Détails propres aux lignes de grille', () => {
  assert.doesNotMatch(source, /data-iso-detail|data-native-iso-detail|nativeIsoDetailColumn|const detailColumn=/);
  assert.match(source, /if\(action==='details'\)\{void openSelectedDocumentaryRecord\(\);return;\}/);
  assert.match(source, /if\(action==='details'\)\{if\(!row\)throw Error\(tr\('resourceSelect'\)\);showDocumentaryDetail\(row\);return;\}/);
});

test('S17 : garde de sélection, résolution ISO fenêtrée et conservation des fiches natives', () => {
  assert.match(source, /if\(!row\|\|!\['ics','committees','iso-list','references'\]\.includes\(mode\)\)return/);
  assert.match(source, /if\(record\.isoDocument\)showDetail\(/);
  assert.match(source, /else showDetail\(\{kind:'local',localReference:record,nativeReference:true\}\)/);
  assert.match(source, /referenceRows\('', 'all'\)\.find/);
  assert.match(source, /onDblClick\(event\)/);
  assert.match(source, /root\.__radarIsoWindowed\.get\(\{type:'deliverables',id:isoId\}\)/);
  assert.match(source, /selectedDocument\(\)\?\.isoId===isoId/);
  assert.match(source, /if\(!row\)\{for\(const id of \['details'/);
});

test('S17 : la projection ISO ne porte plus de colonne Fiche', () => {
  const block = source.slice(source.indexOf(' function refresh(){'), source.indexOf(' function refresh(){') + 9000);
  assert.ok(block.includes("{field:'stage',text:tr('colStage'),size:'80px'}"));
  assert.ok(block.includes("{field:'stage',text:tr('colStage'),size:'75px'}"));
  assert.doesNotMatch(block,/detailColumn|nativeIsoDetailColumn/);
});

test('S17 : script du panneau syntaxiquement chargeable, sans exécution réseau', () => {
  new vm.Script(source, {filename:'radar-standards-panel.js'});
});
