import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {apply,oldBlock,newBlock} from '../tools/radar-s14l3-r1-patch.mjs';
const src=fs.readFileSync(new URL('./fixtures/radar-standards-panel-s14l3.js',import.meta.url),'utf8');
test('patch ciblé et idempotent',()=>{const after=apply(src);assert.ok(after.includes(newBlock));assert.equal(apply(after),after);assert.ok(!after.includes(oldBlock));});
test('refuse une structure inconnue',()=>assert.throws(()=>apply('other source'),/absent ou ambigu/));
test('capture la souris avant le rerender w2ui et supporte le clavier',async()=>{
 const fragment=newBlock.slice(newBlock.indexOf('     function openEye'),newBlock.length);
 const listeners={};const calls=[];const eye={getAttribute:()=>encodeURIComponent('committees:abc')};
 const target={contains:e=>e===eye};const root={document:{addEventListener:(type,fn,capture)=>{listeners[type]=fn;assert.equal(capture,true);}}};
 const showGroupDetails=(...args)=>calls.push(args);
 vm.runInNewContext(fragment,{root,target,showGroupDetails,Promise});
 function event(type,detail=1){return {type,detail,target:{closest:()=>eye},preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}};}
 listeners.pointerdown(event('pointerdown'));await Promise.resolve();assert.equal(JSON.stringify(calls),JSON.stringify([['committees','abc']]));
 listeners.click(event('click'));await Promise.resolve();assert.equal(calls.length,1);
 listeners.click(event('click',0));await Promise.resolve();assert.equal(calls.length,2);
});
