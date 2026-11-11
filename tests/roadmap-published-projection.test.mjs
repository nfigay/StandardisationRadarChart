import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPublishedRoadmapProjection as project,
  readPublishedRoadmapProjection as read
} from '../src/domain/roadmap-published-projection.mjs';

function catalog() {
  return {
    organizations: [
      {organizationId:'org-1',name:'Organisation',private:'secret'}
    ],
    portfolios: [
      {portfolioId:'port-1',ownerOrganizationId:'org-1',
        name:'Portfolio'}
    ],
    standards: [
      {standardId:'iso-1',name:'ISO selected',private:'secret'},
      {standardId:'iso-2',name:'ISO unrelated'}
    ],
    assessments: [
      {assessmentId:'assessment-1',name:'Assessment selected'},
      {assessmentId:'assessment-2',name:'Assessment unrelated'}
    ],
    radarRevisions: [
      {
        schemaVersion:'1.0.0',
        revisionId:'rev-1',
        radarId:'radar-1',
        ownerOrganizationId:'org-1',
        portfolioId:'port-1',
        status:'published',
        title:'Published roadmap',
        version:'1.0.0',
        blips:[{
          blipId:'blip-1',
          standardId:'iso-1',
          assessmentId:'assessment-1',
          label:'Selected standard',
          ring:'adopt',quadrant:'tools',
          position:{x:20,y:30},
          internalDraftNote:'not for client'
        }]
      },
      {
        revisionId:'rev-draft',
        status:'draft',
        blips:[]
      }
    ]
  };
}

test('projects only a published revision', () => {
  const result=project(catalog(),'rev-1');
  assert.equal(result.lifecycle,'published');
  assert.equal(result.roadmap.revisionId,'rev-1');
  assert.equal(result.blips.length,1);
});

test('rejects draft and archived revisions', () => {
  const input=catalog();
  assert.throws(
    ()=>project(input,'rev-draft'),/only published/
  );
  input.radarRevisions[0].status='archived';
  assert.throws(
    ()=>project(input,'rev-1'),/only published/
  );
});

test('includes only referenced standards and assessments', () => {
  const result=project(catalog(),'rev-1');
  assert.deepEqual(
    result.standards.map(x=>x.standardId),['iso-1']
  );
  assert.deepEqual(
    result.assessments.map(x=>x.assessmentId),['assessment-1']
  );
});

test('rejects missing references', () => {
  const input=catalog();
  input.standards=[];
  assert.throws(()=>project(input,'rev-1'),/unresolved/);
});

test('preserves visual positions, rings and quadrants', () => {
  const result=project(catalog(),'rev-1');
  assert.deepEqual(result.blips[0].position,{x:20,y:30});
  assert.equal(result.blips[0].ring,'adopt');
  assert.equal(result.blips[0].quadrant,'tools');
});

test('excludes unrelated revisions and private attributes', () => {
  const json=JSON.stringify(project(catalog(),'rev-1'));
  assert.ok(!json.includes('rev-draft'));
  assert.ok(!json.includes('iso-2'));
  assert.ok(!json.includes('assessment-2'));
  assert.ok(!json.includes('secret'));
  assert.ok(!json.includes('internalDraftNote'));
});

test('client can read without ISO catalogue services', () => {
  const result=project(catalog(),'rev-1');
  assert.deepEqual(read(JSON.stringify(result)),result);
});

test('client rejects additional unresolved references', () => {
  const result=project(catalog(),'rev-1');
  result.blips[0].standardId='unknown';
  assert.throws(()=>read(result),/unresolved/);
});
