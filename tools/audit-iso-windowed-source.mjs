#!/usr/bin/env node
// Static evidence, not a runtime proof. Read only.
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]||'.');
const result={operation:'S14-Q-STATIC-ACCESS-AUDIT',repository:root,checks:{},warnings:[],ok:false};
try{
 const panel=await readFile(join(root,'js/radar-standards-panel.js'),'utf8');
 const db=await readFile(join(root,'js/radar-iso-windowed-db.js'),'utf8');
 const slice=(start,end)=>{const a=panel.indexOf(start);const b=panel.indexOf(end,a+start.length);return a<0||b<a?'':panel.slice(a,b);};
 const load=slice('async function loadIsoCache(){','function referenceRows(');
 const windowPage=slice('async function windowPage(', 'function refresh(){');
 const refresh=slice('function refresh(){','/* S14-H RSS grid */');
 result.checks={
  activeBranchPresent:load.includes('if(windowedActive)'),
  activeBranchReadsCommitteesByPage:load.includes("windowed.page({type:'committees'"),
  legacyReadAllStillPresent:load.includes("provider.readAll('deliverables')"),
  activeBranchAvoidsLegacyReadAll:load.indexOf("provider.readAll('deliverables')")>load.indexOf('}else{'),
  groupWindowsPresent:windowPage.includes('options.groupKey'),
  gridProjectionUsesPage:windowPage.includes('project(result.records'),
  legacyAllRecordsGridProjection:refresh.includes('project(isoDeliverables,term)'),
  dbHasPersistentGroupLinks:db.includes("createObjectStore('groupLinks'"),
  dbIndexActivation:db.includes("'groups:'+generation,ready:true")
 };
 if(result.checks.legacyReadAllStillPresent)result.warnings.push('Historical fallback still contains readAll; active branch gating must be checked at runtime');
 if(result.checks.legacyAllRecordsGridProjection)result.warnings.push('Historical grid fallback still projects full deliverables');
 result.ok=['activeBranchPresent','activeBranchReadsCommitteesByPage','activeBranchAvoidsLegacyReadAll','groupWindowsPresent','gridProjectionUsesPage','dbHasPersistentGroupLinks','dbIndexActivation'].every(k=>result.checks[k]);
}catch(e){result.error=String(e.message||e);}
console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
