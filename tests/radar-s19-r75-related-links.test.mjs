
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const __dirname=import.meta.dirname;
const base=path.resolve(__dirname,'../js');
const context=vm.createContext({console});
context.window=context;

for(const name of [
 'radar-rationale-links',
 'radar-rationale-revision',
 'radar-rationale-renderer'
]){
 vm.runInContext(
  fs.readFileSync(path.join(base,name+'.js'),'utf8'),
  context,{filename:name+'.js'}
 );
}

const links=context.__radarRationaleLinks;
const rev=context.__radarRationaleRevision;
const renderer=context.__radarRationaleRenderer;

const revision={radarId:'r1',revisionId:'v1',ownerOrganizationId:'org1',blips:[{blipId:'b1',standardId:'s1',label:'Standard 1'},{blipId:'b2',standardId:'s2'}]};
const doc={rationaleId:'d1',standard:{id:'s1'},organization:{id:'org1'},sections:{abstract:{type:'doc',content:[]}}};
test('four active reference types, four legacy types and scoped resolution',()=>{assert.equal(links.TYPES.length,4);assert.equal(links.LEGACY_TYPES.length,4);assert.deepEqual(Array.from(links.TYPES),['blip','standard','source','url']);for(const x of [{type:'blip',id:'b1',label:'B',standardId:'s1'},{type:'standard',id:'s1',label:'S'},{type:'radar',id:'r1',label:'R'},{type:'revision',id:'v1',label:'V',radarId:'r1'},{type:'organization',id:'org1',label:'O'},{type:'dossier',id:'d1',label:'D'},{type:'url',id:'https://example.org',label:'U'}])assert(links.resolve(x,revision,doc));assert.equal(links.resolve({type:'source',id:'iso-id',label:'ISO',provider:'ISO'},revision,doc),null);});
test('no guessing across revisions and duplicates',()=>{const a={type:'blip',id:'b1',standardId:'s1',label:'B'};assert.equal(links.resolve({...a,standardId:'s2'},revision,doc),null);assert.equal(links.resolve(a,{...revision,blips:[...revision.blips,revision.blips[0]]},doc),null);const d=links.add(doc,a);assert.equal(links.list(d).length,1);assert.equal(links.list(doc).length,0);assert.throws(()=>links.add(d,a),/duplicate/);assert.equal(links.remove(d,0).relatedReferences.length,0);});
test('bad URL and source data rejected',()=>{for(const u of ['javascript:alert(1)','data:text/html,x','https://bad.test/<script>'])assert.throws(()=>links.validate({type:'url',id:u,label:'bad'}));assert.throws(()=>links.validate({type:'source',id:'x',label:'x'}));});
test('revision persistence validates structured links',()=>{const d=links.add(doc,{type:'standard',id:'s1',label:'S'});assert(rev.checkRecord(d));const result=rev.put(revision,d,{draft:true});assert.equal(rev.list(result)[0].relatedReferences[0].id,'s1');assert.deepEqual(revision.blips.length,2);assert.throws(()=>rev.checkRecord({...d,relatedReferences:[{type:'url',id:'javascript:x',label:'x'}]}));});
test('renderer escapes labels and includes localized related section',()=>{const d=links.add(doc,{type:'standard',id:'s1',label:'<img src=x onerror=1>'});const html=renderer.renderDocument(d,{lang:'fr'});assert(html.includes('Références associées'));assert(html.includes('&lt;img'));assert(!html.includes('<img'));assert(renderer.renderDocument(d,{lang:'en'}).includes('Related references'));});
test('editor uses grouped ribbon and separate section',()=>{const panel=fs.readFileSync(path.join(base,'radar-rationale-panel.js'),'utf8');assert(panel.includes('setupRibbon()'));assert(panel.includes('s19-related'));assert(panel.includes("mode!=='edit'"));assert(!panel.includes('id="s19-reference-select"'));});
test('integrator requires links before revision',()=>{const htmlPath=fs.existsSync(path.resolve(__dirname,'../html-integration.txt'))?'../html-integration.txt':'../radar.html';const html=fs.readFileSync(path.resolve(__dirname,htmlPath),'utf8');assert(html.indexOf('radar-rationale-links.js')<html.indexOf('radar-rationale-revision.js'));});


test('historical reference types remain readable but cannot be added',()=>{
 const legacy={type:'radar',id:'r1',label:'Legacy radar'};
 assert.equal(links.list({...doc,relatedReferences:[legacy]})[0].id,'r1');
 assert.throws(()=>links.add(doc,legacy),/no longer available/);
});
