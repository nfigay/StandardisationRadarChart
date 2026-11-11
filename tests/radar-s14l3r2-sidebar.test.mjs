import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../js/',import.meta.url);
const modelCode=fs.readFileSync(new URL('radar-iso-sidebar-index.js',root),'utf8');
const panelCode=fs.readFileSync(new URL('radar-standards-panel.js',root),'utf8');
function model(ics,committees,standards){const context={};context.window=context;vm.runInNewContext(modelCode,context);return context.__radarIsoSidebarIndex.create(ics,committees,standards);}
const ics=[{identifier:'25',parent:'',titleFr:'Fabrication'},{identifier:'25.040',parent:'25',titleFr:'Systèmes'},{identifier:'25.040.40',parent:'25.040',titleFr:'Contrôle'},{identifier:'01',parent:'',titleFr:'Généralités'}];
const committees=[{id:'tc',reference:'ISO/TC 184',titleI18n:{fr:'Automatisation'}},{id:'sc',parentId:'tc',reference:'ISO/TC 184/SC 4',titleI18n:{fr:'Données'}}];
const docs=[{id:'a',icsCodes:['25.040','25.040.40'],ownerCommittee:'ISO/TC 184/SC 4'},{id:'b',icsCodes:['25.040.40'],ownerCommittee:'ISO/TC 184/SC 4'},{id:'c',icsCodes:['25'],ownerCommittee:'ISO/TC 184'},{id:'d',icsCodes:['88.88'],ownerCommittee:'INCONNU'}];
test('compteurs uniques par branche ICS, descendants compris',()=>{const m=model(ics,committees,docs);const n=m.sidebar('ics');const top=n.find(x=>x.id==='ics:25');assert.equal(top.count,3);assert.equal(top.nodes[0].count,2);assert.equal(top.nodes[0].nodes[0].count,2);assert.equal(n.find(x=>x.id==='ics:__unclassified__').count,1);});
test('compteurs TC/SC et icônes natives distinctes',()=>{const m=model(ics,committees,docs);const n=m.sidebar('committees');const tc=n.find(x=>x.id==='committees:tc');assert.equal(tc.count,3);assert.equal(tc.nodes[0].count,2);assert.notEqual(tc.icon.text,tc.nodes[0].icon.text);assert.equal(n.find(x=>x.id==='committees:__unclassified__').count,1);});
test('menu et double clic w2sidebar natifs, sans délégation DOM',()=>{assert.match(panelCode,/onDblClick:openNodeDetails/);assert.match(panelCode,/onMenuClick\(event\)/);assert.match(panelCode,/menu:\[\{id:'details'/);assert.doesNotMatch(panelCode,/data-iso-nav-eye|function openEye/);});
test('langues du menu contextuel',()=>{assert.match(panelCode,/"showStandards":"Afficher les normes"/);assert.match(panelCode,/"showStandards":"Show standards"/);});
test('recherche et sélection de normes préservées',()=>{const m=model(ics,committees,docs);assert.equal(m.list('ics','25').length,3);assert.equal(m.list('committees','tc').length,3);});
test('catalogue 81 768 références : aucun plafond des compteurs',()=>{const many=Array.from({length:81768},(_,i)=>({id:String(i),icsCodes:['25.040.40'],ownerCommittee:'ISO/TC 184/SC 4'}));const m=model(ics,committees,many);assert.equal(m.sidebar('ics').find(x=>x.id==='ics:25').count,81768);assert.equal(m.sidebar('committees').find(x=>x.id==='committees:tc').count,81768);});
