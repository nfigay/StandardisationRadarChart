import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoadmapPackage,
  readRoadmapPackage,
  validateRoadmapPackage
} from '../src/domain/roadmap-publication.mjs';

function fixture() {
  return {
    roadmapId: 'roadmap-a',
    title: 'Roadmap A',
    revisionId: 'published-r1',
    catalogRelease: '2026-11-09',
    graph: {
      nodes: [
        {data:{
          id:'a',label:'ISO example',standardId:'iso-a',
          description:'Used by this roadmap',
          internalDraftNote:'must not be exported'
        },position:{x:10,y:20}},
        {data:{id:'b',label:'Related blip'}}
      ],
      edges: [{data:{id:'e1',source:'a',target:'b'}}]
    },
    standards: {
      'iso-a':{
        reference:'ISO example',title:'Relevant standard',
        internalCatalogData:'must not be exported'
      },
      'iso-b':{
        reference:'ISO unrelated',title:'Unrelated standard'
      }
    }
  };
}

test('publishes one explicit revision',()=>{
  const result=createRoadmapPackage(fixture());
  assert.equal(result.roadmap.publishedRevisionId,'published-r1');
  assert.equal(result.graph.nodes.length,2);
});

test('contains only standards referenced by the roadmap',()=>{
  const result=createRoadmapPackage(fixture());
  assert.deepEqual(Object.keys(result.catalog.standards),['iso-a']);
  assert.equal(JSON.stringify(result).includes('iso-b'),false);
});

test('does not leak undeclared graph or catalogue attributes',()=>{
  const result=createRoadmapPackage(fixture());
  const json=JSON.stringify(result);
  assert.equal(json.includes('internalDraftNote'),false);
  assert.equal(json.includes('internalCatalogData'),false);
});

test('rejects missing required ISO records',()=>{
  const input=fixture();
  delete input.standards['iso-a'];
  assert.throws(()=>createRoadmapPackage(input),/missing ISO record/);
});

test('rejects edges escaping the published graph',()=>{
  const input=fixture();
  input.graph.edges[0].data.target='another-roadmap';
  assert.throws(()=>createRoadmapPackage(input),/external node/);
});

test('client can read the package without ISO services',()=>{
  const result=createRoadmapPackage(fixture());
  const restored=readRoadmapPackage(JSON.stringify(result));
  assert.deepEqual(restored,result);
});

test('rejects an accidental full catalogue append',()=>{
  const result=createRoadmapPackage(fixture());
  result.catalog.standards['iso-b']={title:'unrelated'};
  assert.throws(
    ()=>validateRoadmapPackage(result),
    /does not match roadmap references/
  );
});

test('rejects unknown package sections',()=>{
  const result=createRoadmapPackage(fixture());
  result.isoCompleteCatalog={records:[]};
  assert.throws(
    ()=>readRoadmapPackage(result),
    /unexpected package section/
  );
});
