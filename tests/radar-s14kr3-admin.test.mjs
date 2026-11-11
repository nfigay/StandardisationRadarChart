import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
const base=new URL('../',import.meta.url);
const code=(file)=>readFileSync(new URL(file,base),'utf8');
function context(extra={}){const root={...extra};root.window=root;vm.runInNewContext(code('js/radar-radar-admin.js'),root);return root;}
test('administrative dialog is a w2popup + w2form, not native dialog',()=>{
 const src=code('js/radar-radar-admin.js');
 assert.match(src,/w2popup\.open/);assert.match(src,/new root\.w2form/);
 assert.doesNotMatch(src,/createElement\(['"]dialog/);
});
test('revision picker mounts w2form after w2popup opens',()=>{
 const src=code('js/radar-revision-dialogs.js');
 assert.match(src,/w2popup\.open/);assert.match(src,/event\.onComplete/);assert.match(src,/focus:-1/);
 assert.doesNotMatch(src,/createElement\(['"]dialog/);
});
test('rename remains available while selected revision is published',()=>{
 const root=context({__radarRevisionSession:{status:()=>({activeGroup:'g1'})},__radarCatalogAdapter:{getRevision:()=>({radarId:'radar-1',revisionId:'rev-1',status:'published',title:'Before'})},__radarCatalogPersistence:{renameRadar(){},renameRevisionLabel(){},getRadarName(){return null},getRevisionLabel(){return null}},w2popup:{open(){}},w2form:function(){}});
 assert.doesNotThrow(()=>root.__radarRadarAdmin.open('radar'));
});
test('popup does not change published revision data automatically',()=>{
 const revision={revisionId:'r1',radarId:'radar1',title:'Original',status:'published'};
 const root=context({__radarRevisionSession:{status:()=>({activeGroup:'g'})},__radarCatalogAdapter:{getRevision:()=>revision},__radarCatalogPersistence:{renameRadar(){throw Error('must not be called until submit')},renameRevisionLabel(){},getRadarName(){return null},getRevisionLabel(){return null}},w2popup:{open(){}},w2form:function(){}});
 root.__radarRadarAdmin.open('radar');assert.equal(revision.title,'Original');
});

test('selection labels include administrative revision label without internal IDs',()=>{
 const root={i18next:{language:'fr'},__radarCatalogPersistence:{getRevisionLabel:()=> 'Correction 2026'}};
 root.window=root;vm.runInNewContext(code('js/radar-revision-dialogs.js'),root);
 const actual=root.__radarRevisionDialogs.label({revisionId:'revision-uuid:draft:local',version:'0.1.0-draft-local',status:'draft'},0);
 assert.equal(actual,'r1 — Correction 2026 — 0.1.0 — Brouillon');
});

test('persistence rename is administrative and exported without editing published snapshot',()=>{
 const src=code('js/radar-catalog-persistence.js');
 const root={crypto:{randomUUID:()=> 'test'},__radarRevisionSession:{exportGroup:()=>null}};root.window=root;vm.runInNewContext(src,root);
 const revision={revisionId:'rev1',radarId:'rad1',title:'Radar initial',status:'published',blips:[]};
 const catalog={schemaVersion:'1.0.0',title:'Catalogue',organizations:[],portfolios:[],standards:[],radarRevisions:[revision]};
 root.__radarCatalogPersistence.remember(catalog,{revisions:[{revisionId:'rev1',group:'g1'}]});
 root.__radarCatalogPersistence.renameRadar('rad1','Radar renommé');
 root.__radarCatalogPersistence.renameRevisionLabel('rev1','Publication originale');
 const exported=root.__radarCatalogPersistence.build({});
 assert.equal(exported.radarRevisions[0].title,'Radar initial');
 assert.equal(exported.extensions.administration.radarNames.rad1,'Radar renommé');
 assert.equal(exported.extensions.administration.revisionLabels.rev1,'Publication originale');
 assert.equal(exported.extensions.administration.nameHistory.length,2);
});
