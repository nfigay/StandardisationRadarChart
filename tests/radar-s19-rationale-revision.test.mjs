import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInThisContext} from 'node:vm';
// Browser script, not a CommonJS module in a package with type=module.
// Evaluate in the same VM realm to preserve deepStrictEqual semantics.
const source = readFileSync(new URL('../js/radar-rationale-revision.js', import.meta.url), 'utf8');
runInThisContext(source, {filename:'radar-rationale-revision.js'});
const api = globalThis.__radarRationaleRevision;
assert.equal(typeof api?.put, 'function', 'browser API should expose put');
const base=()=>({id:'draft-1',extensions:{radarGeometry:{rings:4},sourceRegistry:{entries:[]}}});
const record=(id='r1',org='asd-ssg')=>({rationaleId:id,standard:{id:'archimate'},organization:{id:org},sections:{abstract:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'test'}]}]}}});
test('new dossier is part of revision extensions',()=>{const r=api.put(base(),record(),{draft:true});assert.equal(api.get(r,'r1').standard.id,'archimate');});
test('existing S18/S17 extensions are untouched',()=>{const r=api.put(base(),record(),{draft:true});assert.deepEqual(r.extensions.radarGeometry,{rings:4});assert.deepEqual(r.extensions.sourceRegistry,{entries:[]});});
test('input revision is never mutated',()=>{const r=base(),b=JSON.stringify(r);api.put(r,record(),{draft:true});assert.equal(JSON.stringify(r),b);});
test('draft approval is mandatory',()=>assert.throws(()=>api.put(base(),record(),{}),/active-draft/));
test('create cannot silently overwrite dossier',()=>{const r=api.put(base(),record(),{draft:true});assert.throws(()=>api.put(r,record(),{draft:true}),/existing dossier/);});
test('editing requires explicit replacement',()=>{const r=api.put(base(),record(),{draft:true});const edit=record();edit.sections.abstract.content[0].content[0].text='edited';assert.equal(api.get(api.put(r,edit,{draft:true,replace:true}),'r1').sections.abstract.content[0].content[0].text,'edited');});
test('rebind between organizations is forbidden',()=>{const r=api.put(base(),record(),{draft:true});assert.throws(()=>api.put(r,record('r1','other'),{draft:true,replace:true}),/rebind/);});
test('same standard in different organizations is allowed',()=>{let r=api.put(base(),record(),{draft:true});r=api.put(r,record('r2','other'),{draft:true});assert.equal(api.list(r).length,2);});
test('duplicate standard + organization is blocked',()=>{const r=api.put(base(),record(),{draft:true});assert.throws(()=>api.put(r,record('r2'),{draft:true}),/already exists/);});
test('unknown extension formats are never overwritten',()=>{const r=base();r.extensions.radarRationales={schemaVersion:'future-v2',items:[]};assert.throws(()=>api.put(r,record(),{draft:true}),/unknown/);});
test('delete requires confirmation and draft',()=>{const r=api.put(base(),record(),{draft:true});assert.throws(()=>api.remove(r,'r1',{draft:true}),/confirmation/);assert.equal(api.list(api.remove(r,'r1',{draft:true,confirm:true})).length,0);});
test('invalid documents and missing registry linkage are rejected',()=>{const a=record();a.standard.id='';assert.throws(()=>api.put(base(),a,{draft:true}),/standard.id/);const b=record();b.sections.abstract={type:'html',content:'x'};assert.throws(()=>api.put(base(),b,{draft:true}),/invalid Tiptap/);});
