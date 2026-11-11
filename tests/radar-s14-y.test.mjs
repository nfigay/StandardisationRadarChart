import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const testsDir=dirname(fileURLToPath(import.meta.url));
// The installed test lives in <repo>/tests; the distribution archive keeps payload/js.
const installedJs=resolve(testsDir,'../js');
const bundledJs=resolve(testsDir,'../payload/js');
const base=existsSync(resolve(installedJs,'radar-iso-advanced-query.js')) ? installedJs : bundledJs;
const script=readFileSync(resolve(base,'radar-iso-advanced-query.js'),'utf8');
const root={};root.window=root;runInNewContext(script,root);
const {validate,matches}=root.__radarIsoAdvancedQuery;
const ast={id:1,operator:'AND',negated:false,children:[{id:2,field:'title',comparison:'contains',value:'risque'},{id:3,operator:'OR',negated:false,children:[{id:4,field:'ics',comparison:'prefix',value:'03'},{id:5,field:'committee',comparison:'equals',value:'ISO/TC 262'}]},{id:6,operator:'AND',negated:true,children:[{id:7,field:'stage',comparison:'equals',value:'9093'}]}]};
const row=(title,ics,committee,stage)=>({reference:'ISO 42:2026',titleI18n:{fr:title,en:'Risk management'},icsCodes:ics,ownerCommittee:committee,currentStage:stage});
test('validates supplied nested AND / OR / NOT AST',()=>assert.equal(validate(ast),ast));
test('accepts ICS branch with positive title and non-excluded stage',()=>assert.equal(matches(row('Gestion des risques',['03.100.01'],'ISO/TC 111','6060'),ast),true));
test('accepts committee branch independently of ICS',()=>assert.equal(matches(row('Analyse du risque',['07.020'],'ISO/TC 262','6060'),ast),true));
test('rejects nonmatching title even when other branch matches',()=>assert.equal(matches(row('Analyse mécanique',['03.100.01'],'ISO/TC 262','6060'),ast),false));
test('negated group excludes stage 9093',()=>assert.equal(matches(row('Gestion des risques',['03.100.01'],'ISO/TC 262','9093'),ast),false));
test('accent, case and multi-valued ICS normalization',()=>assert.equal(matches(row('RISQUÉ',['07.020','03.100.01'],'ISO/TC 111','6060'),ast),true));
test('equals compares whole value, not substring',()=>assert.equal(matches(row('risque',['07'],'ISO/TC 262/SC 4','6060'),ast),false));
test('missing field does not satisfy positive condition',()=>assert.equal(matches({icsCodes:['03.100.01'],currentStage:'6060'},ast),false));
test('invalid empty group, unknown operator and empty condition fail',()=>{
 assert.throws(()=>validate({operator:'AND',negated:false,children:[]}));
 assert.throws(()=>validate({operator:'XOR',negated:false,children:[ast]}));
 assert.throws(()=>validate({field:'title',comparison:'contains',value:' '}));
});
test('deep nesting limit rejects runaway expression',()=>{
 let x={field:'title',comparison:'contains',value:'x'};
 for(let i=0;i<15;i++)x={operator:'AND',negated:false,children:[x]};
 assert.throws(()=>validate(x));
});
test('server-side cursor predicate and tree projection share AST',()=>{
 const db=readFileSync(resolve(base,'radar-iso-windowed-db.js'),'utf8');
 const tree=readFileSync(resolve(base,'radar-iso-tree-filter.js'),'utf8');
 const panel=readFileSync(resolve(base,'radar-standards-panel.js'),'utf8');
 assert.match(db,/engine\.matches\(item,advancedQuery\)/);
 assert.match(db,/engine\.validate\(advancedQuery\)/);
 assert.match(tree,/after:cursor,search:query,advancedQuery,icsFilter/);
 assert.match(panel,/advancedQuery:advancedCurrent\(\)/);
 assert.match(panel,/advancedRevision/);
 assert.match(panel,/advancedButton\.textContent='Recherche avancée…'/);
 assert.doesNotMatch(panel,/^import\s/m);
});
