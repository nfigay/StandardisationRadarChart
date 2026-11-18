import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {executePipeline, PLAN} from '../scripts/project-pipeline.mjs';
const SHA='a'.repeat(40);
function env(){const base=fs.mkdtempSync(path.join(os.tmpdir(),'radar-pipeline-test-'));const state={runs:[],output:false,fail:null,branch:'main',sha:SHA,tracked:'',proof:'digest-a'};const adapters={git:()=>state.sha,branch:()=>state.branch,tracked:()=>state.tracked,exists:()=>state.output,verify:()=>({code:0,output:'ok'}),fingerprint:()=>state.proof,run:s=>{state.runs.push(s);if(state.fail===s)return {code:7,output:'simulated error'};if(s==='build-local')state.output=true;return {code:0,output:'ok'};}};return {base,state,adapters,run:(mode='qualify',resume=false)=>executePipeline({mode,auditDir:base,resume,adapters})};}
test('canonical phase plans stable',()=>{assert.deepEqual(PLAN.qualify,['tests','sources']);assert.deepEqual(PLAN['build-local'],['tests','sources','build-local','verify-local']);});
test('qualification creates durable state and records phases',()=>{const e=env();assert.equal(e.run().phase,'complete');assert.deepEqual(e.state.runs,['tests','sources']);assert.equal(JSON.parse(fs.readFileSync(path.join(e.base,'result.json'))).ok,true);});
test('phase failure survives and resumes without rerunning proven phases',()=>{const e=env();e.state.fail='sources';assert.throws(()=>e.run(),/sources échouée/);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(e.base,'pipeline-state.json'))).completed,['tests']);e.state.fail=null;e.run('qualify',true);assert.deepEqual(e.state.runs,['tests','sources','sources']);});
test('rerun requires resume; resume requires state',()=>{const e=env();assert.throws(()=>e.run('qualify',true),/état absent/);e.run();assert.throws(()=>e.run(),/État existant/);});
test('occupied destination is refused without deletion',()=>{const e=env();e.state.output=true;assert.throws(()=>e.run('build-local'),/Sortie occupée/);assert.equal(e.state.output,true);assert.ok(!e.state.runs.includes('build-local'));});
test('different Git SHA and dirty tracked tree rejected',()=>{const e=env();e.run();e.state.sha='b'.repeat(40);assert.throws(()=>e.run('qualify',true),/provenance incompatible/);const f=env();f.state.tracked=' M README.md';assert.throws(()=>f.run(),/Modifications suivies/);});
test('completed build requires consistent digest when resuming',()=>{const e=env();e.run('build-local');e.state.proof='digest-b';assert.throws(()=>e.run('build-local',true),/empreinte de build différente/);});
test('no destructive or remote phases are available',()=>{assert.deepEqual(Object.keys(PLAN).sort(),['build-local','qualify']);});
