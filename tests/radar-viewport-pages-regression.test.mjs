import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

import {
  computeRadarViewport
} from '../src/domain/radar-viewport.mjs';

const html = readFileSync(
  new URL('../radar.html',import.meta.url),
  'utf8'
);

function viewportImport(){
  const match=html.match(
    /import\s*\{\s*computeRadarViewport\s*\}\s*from\s*['"]([^'"]+)['"]/
  );

  assert.ok(match,
    'Creator viewport module import missing');

  return match[1];
}

test('viewport : import compatible GitHub Pages et sous-repertoire',()=>{
  const specifier=viewportImport();

  assert.equal(
    specifier,
    './src/domain/radar-viewport.mjs'
  );

  const base=
    'https://nfigay.github.io/StandardisationRadarChart/radar.html';

  assert.equal(
    new URL(specifier,base).href,
    'https://nfigay.github.io/StandardisationRadarChart/src/domain/radar-viewport.mjs'
  );

  assert.ok(existsSync(
    new URL('../src/domain/radar-viewport.mjs',import.meta.url)
  ));
});

test('viewport : le repere Cytoscape reste centre sur le SVG',()=>{
  const dimensions=[
    {width:800,height:800},
    {width:960,height:640},
    {width:640,height:960},
    {width:1200,height:700},
    {width:500,height:500}
  ];

  for(const {width,height} of dimensions){
    const {zoom,pan}=computeRadarViewport({
      width,height
    });

    assert.ok(
      Math.abs(400*zoom+pan.x-width/2)<1e-9
    );

    assert.ok(
      Math.abs(400*zoom+pan.y-height/2)<1e-9
    );

    const radius=350*zoom;

    assert.ok(width/2-radius>=0);
    assert.ok(height/2-radius>=0);
  }
});

test('viewport : alignement des blips pour plusieurs tailles',()=>{
  const points=[
    {x:400,y:400},
    {x:150,y:250},
    {x:650,y:250},
    {x:150,y:550},
    {x:650,y:550},
    {x:50,y:400},
    {x:750,y:400}
  ];

  for(const [width,height] of [
    [960,640],
    [640,960],
    [1075,533],
    [800,800]
  ]){
    const camera=computeRadarViewport({
      width,height
    });

    // Independent SVG xMidYMid meet transform.
    const scale=Math.min(width/800,height/800);
    const offsetX=(width-800*scale)/2;
    const offsetY=(height-800*scale)/2;

    for(const point of points){
      const graphX=point.x*camera.zoom+camera.pan.x;
      const graphY=point.y*camera.zoom+camera.pan.y;

      const svgX=point.x*scale+offsetX;
      const svgY=point.y*scale+offsetY;

      assert.ok(Math.abs(graphX-svgX)<1e-9);
      assert.ok(Math.abs(graphY-svgY)<1e-9);
    }
  }
});
