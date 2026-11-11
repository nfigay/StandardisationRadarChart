import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../radar.html', import.meta.url), 'utf8');
const begin = html.indexOf('function offerDraftForReadOnlyAction() {');
const end = html.indexOf('        function handleMenuAction(event) {',begin);
assert.ok(begin >= 0 && end > begin);
const helper = html.slice(begin,end);
const preStart = end;
const preEnd = html.indexOf('            switch (event.target) {',preStart);
const preamble = html.slice(preStart,preEnd) + '\n return "allowed"; }';

function fixture({status='published',confirm=true}={}){
  let draftCalls=0,confirmCalls=0;const alerts=[],forwarded=[];
  const window={
    confirm:()=>{confirmCalls++;return confirm;},
    __radarRevisionSession:{status:()=>({activeGroup:'CATALOG_REVISION_0'})},
    __radarCatalogAdapter:{getRevision:()=>({status})},
    __radarCatalogUI:{isReadOnly:()=>status!=='draft'}
  };
  const ctx={window,w2alert:message=>alerts.push(message),
    w2ui:{toolbar:{onClick:event=>forwarded.push(event.target)}},
    i18next:{t:key=>key},handleCreateOrOpenDraft:()=>{draftCalls++;}};
  vm.runInNewContext(helper+preamble+'\nthis.run=handleMenuAction;',ctx);
  return {run:target=>ctx.run({target}),get draftCalls(){return draftCalls;},get confirmCalls(){return confirmCalls;},alerts,forwarded};
}
test('protected blip command offers draft only with confirmation',()=>{
  const x=fixture();x.run('radartools:createcatalogblip');
  assert.equal(x.confirmCalls,1);assert.equal(x.draftCalls,1);assert.equal(x.forwarded.length,0);
});
test('declining draft preserves published state without action',()=>{
  const x=fixture({confirm:false});x.run('radartools:createstandardblip');
  assert.equal(x.draftCalls,0);assert.equal(x.forwarded.length,0);
});
test('published export remains available without confirmation',()=>{
  const x=fixture();x.run('files:savecatalogjson');
  assert.deepEqual(x.forwarded,['savecatalogjson']);assert.equal(x.confirmCalls,0);
});
test('draft does not trigger a read-only prompt',()=>{
  const x=fixture({status:'draft'});x.run('files:loadgraphssr');
  assert.deepEqual(x.forwarded,['loadgraphssr']);assert.equal(x.confirmCalls,0);
});
test('protected file import does not get forwarded after draft offer',()=>{
  const x=fixture();x.run('files:loadgraphssr');
  assert.equal(x.confirmCalls,1);assert.deepEqual(x.forwarded,[]);
});
