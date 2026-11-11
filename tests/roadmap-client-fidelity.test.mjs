import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createPublishedRoadmapProjection
} from '../src/domain/roadmap-published-projection.mjs';
import {createClientView} from '../js/roadmap-client.mjs';

const html=readFileSync(
  new URL('../radar.html',import.meta.url),'utf8'
);
const clientHtml=readFileSync(
  new URL('../client.html',import.meta.url),'utf8'
);
const clientCode=readFileSync(
  new URL('../js/roadmap-client.mjs',import.meta.url),'utf8'
);

function fixture(status='published'){
  return {
    organizations:[{organizationId:'o',name:'Organisation'}],
    portfolios:[{
      portfolioId:'p',ownerOrganizationId:'o',name:'Portefeuille'
    }],
    standards:[
      {standardId:'s1',name:'Norme 1'},
      {standardId:'s2',name:'Norme 2'},
      {standardId:'unused',name:'Norme non utilisée'}
    ],
    assessments:[],
    radarRevisions:[{
      revisionId:'r1',radarId:'radar1',
      ownerOrganizationId:'o',portfolioId:'p',
      status,title:'Roadmap publiée',
      blips:[
        {blipId:'b1',standardId:'s1',label:'B1',
          ring:'Adopted',quadrant:'Available',
          position:{x:180,y:260}},
        {blipId:'b2',standardId:'s2',label:'B2',
          ring:'Candidate',quadrant:'Monitored',
          position:{x:630,y:490}}
      ]
    }]
  };
}

test('conserve les coordonnées publiées sans normalisation',()=>{
  const view=createClientView(
    createPublishedRoadmapProjection(fixture(),'r1')
  );
  assert.deepEqual(view.items.map(x=>[x.x,x.y]),[
    [180,260],[630,490]
  ]);
});

test('une seule position ne se recentre pas artificiellement',()=>{
  const source=fixture();
  source.radarRevisions[0].blips.pop();
  const view=createClientView(
    createPublishedRoadmapProjection(source,'r1')
  );
  assert.equal(view.items[0].x,180);
  assert.equal(view.items[0].y,260);
});

test('conserve les informations de placement du Créateur',()=>{
  const view=createClientView(
    createPublishedRoadmapProjection(fixture(),'r1')
  );
  assert.equal(view.items[0].ring,'Adopted');
  assert.equal(view.items[0].quadrant,'Available');
  assert.equal(view.items[1].ring,'Candidate');
});

test('repère 800x800 et rayons du Créateur',()=>{
  assert.match(clientHtml,/viewBox="0 0 800 800"/);
  assert.match(clientCode,/\[350, 250, 150\]/);
  assert.match(clientCode,/cx:400, cy:400/);
  assert.match(clientCode,/x1:60,y1:400,x2:740,y2:400/);
});

test('export accessible depuis Outils du radar',()=>{
  assert.match(html,
    /id:'exportclientroadmap',text:i18next\.t/);
  assert.match(html,
    /case 'radartools:exportclientroadmap'/);
  assert.match(html,
    /exportclientroadmap: "Exporter la roadmap publiée/);
});

test('export seulement published et sans catalogue global',()=>{
  assert.match(html,/revision\.status!=='published'/);
  assert.match(html,/createPublishedRoadmapProjection\(/);
  assert.match(html,/revision\.revisionId/);
  assert.match(html,/persistence\.build\(cy\)/);

  const pkg=createPublishedRoadmapProjection(fixture(),'r1');
  assert.deepEqual(
    pkg.standards.map(s=>s.standardId),['s1','s2']
  );
});

test('les brouillons sont toujours refusés par la projection',()=>{
  assert.throws(
    ()=>createPublishedRoadmapProjection(
      fixture('draft'),'r1'
    ),
    /only published/
  );
});

test('aucun gestionnaire ISO chargé par le Client',()=>{
  assert.doesNotMatch(clientHtml,
    /radar-catalog-persistence|radar-iso-toolbar/);
  assert.doesNotMatch(clientCode,
    /\bfetch\s*\(|\bindexedDB\b/);
});
