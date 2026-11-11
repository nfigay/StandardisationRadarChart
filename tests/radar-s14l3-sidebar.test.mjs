import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../js/radar-iso-sidebar-index.js',import.meta.url),'utf8');
const sandbox={};sandbox.window=sandbox;vm.runInNewContext(source,sandbox);
const ics=[{identifier:'25',titleFr:'Fabrication'},{identifier:'25.040',parent:'25',titleFr:'Automatisation'},{identifier:'35',titleFr:'Informatique'}];
const committees=[{id:'tc',reference:'ISO/TC 184',title:'Automation'},{id:'sc',parentId:'tc',reference:'ISO/TC 184/SC 4',title:'Industrial data'}];
const docs=[{id:'a',reference:'ISO A',icsCodes:['25','35'],ownerCommittee:'ISO/TC 184/SC 4',title:'Produit'},{id:'b',reference:'ISO B',icsCodes:['25.040'],ownerCommittee:'ISO/TC 184',titleI18n:{en:'Model-based engineering'}}];
const model=sandbox.__radarIsoSidebarIndex.create(ics,committees,docs);
test('ICS hierarchy includes descendant standards without duplicates',()=>{assert.deepEqual(Array.from(model.list('ics','25').map(x=>x.id)),['a','b']);assert.equal(model.list('ics','25', '',false).length,1);});
test('multi ICS association is a view, not duplicated data',()=>{assert.equal(model.list('ics','35')[0],docs[0]);assert.equal(model.count,2);});
test('committee navigation selects descendants',()=>{assert.deepEqual(Array.from(model.list('committees','tc').map(x=>x.id)),['b','a']);assert.equal(model.list('committees','sc').length,1);});
test('search is applied to full selected category',()=>{assert.equal(model.list('ics','25','model-based').length,1);});
test('sidebar is hierarchical and can show translated titles',()=>{const nodes=model.sidebar('committees','fr');assert.equal(nodes[0].nodes[0].id,'committees:sc');assert.equal(model.get('ics','25').title,'Fabrication');});
test('large catalogue includes last standard',()=>{const big=Array.from({length:81768},(_,i)=>({id:String(i),icsCodes:['25'],reference:'ISO '+i}));const model2=sandbox.__radarIsoSidebarIndex.create(ics,[],big);assert.equal(model2.list('ics','25').length,81768);assert.equal(model2.list('ics','25','ISO 81767').length,1);});

test('unknown ICS code remains browsable as unclassified',()=>{const model=sandbox.__radarIsoSidebarIndex.create([{identifier:'35',titleFr:'IT'}],[],[{id:'out',reference:'ISO X',icsCodes:['99.999']}]);assert.equal(model.list('ics','__unclassified__').length,1);});
