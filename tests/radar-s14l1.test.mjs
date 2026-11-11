import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const vm=require('node:vm');
const win={};
const gridSource=fs.readFileSync(
  path.join(import.meta.dirname,'..','js','radar-iso-full-grid.js'),
  'utf8'
);
vm.runInNewContext(gridSource,{window:win});
const api=win.__radarIsoFullGrid;

test('81 768 records returned, no truncation',()=>{const rows=Array.from({length:81768},(_,i)=>({id:String(i),reference:'ISO '+i,title:'Test '+i,icsCodes:['25.040.40'],ownerCommittee:'ISO/TC 184/SC 4',currentStage:'60.60'}));const result=api.project(rows);assert.equal(result.length,81768);assert.equal(result[81767].isoId,'81767');});
test('search across catalogue includes last element and scope',()=>{const rows=Array.from({length:81768},(_,i)=>({id:String(i),reference:'ISO '+i,title:'Standard '+i,scope:i===81767?'special needle in description':'',titleI18n:{en:'Technical record'},icsCodes:[]}));const result=api.project(rows,'needle');assert.equal(result.length,1);assert.equal(result[0].isoId,'81767');});
test('source remains unmodified and EN/ICS query supported',()=>{const sample=Object.freeze({id:'42',reference:'ISO 42',title:'Essai',titleI18n:Object.freeze({en:'Flight control'}),icsCodes:Object.freeze(['49.020']),ownerCommittee:'TC 20'});assert.equal(api.project([sample],'flight').length,1);assert.equal(api.project([sample],'49.020').length,1);assert.equal(sample.title,'Essai');});
test('installed panel uses full ISO projection',()=>{const file=path.join(import.meta.dirname,'..','js','radar-standards-panel.js');if(!fs.existsSync(file))return;const panel=fs.readFileSync(file,'utf8');assert.match(panel,/S14-L1 FULL ISO GRID/);assert.match(panel,/fullGrid\.project\(isoDeliverables,term\)/);assert.doesNotMatch(panel,/filtered\.slice\(0,MAX_ROWS\)/);assert.doesNotMatch(panel,/eligible\.slice\(0,MAX_ROWS\)/);});
