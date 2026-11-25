(function(root) {
'use strict';

const TAU = 2 * Math.PI;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));

function project(n,geo,c,r) {
  const s = geo.sector(n.ring,n.quadrant,c);
  const z = s.zone;
  const q = s.quarter;
  const center = s.center;
  const arc = q.endAngle-q.startAngle;

  const angularMargin = 0.0001;
  const safeHalf = Math.min(Math.PI/2,arc/2-angularMargin);
  if (!(safeHalf>0)) {
    return {valid:false,reason:"angular capacity"};
  }
  const lower = Math.max(
    z.minRadius+r+0.001,
    r/Math.sin(safeHalf)+0.001
  );
  const upper = z.maxRadius-r-0.0001;

  if (!(upper>lower)) {
    return {valid:false,reason:'radial capacity'};
  }

  const finite=Number.isFinite(n.x)&&Number.isFinite(n.y);
  const dx=finite?n.x-center.x:0;
  const dy=finite?n.y-center.y:0;
  const radius=finite
    ? clamp(Math.hypot(dx,dy),lower,upper)
    : (lower+upper)/2;
  const pad=Math.asin(Math.min(.9999,r/radius))+0.00001;

  if (2*pad>=arc) {
    return {valid:false,reason:'angular capacity'};
  }

  let angle=finite
    ? (Math.atan2(dx,-dy)-q.startAngle)%TAU
    : arc/2;
  if(angle<0) angle+=TAU;
  if(angle>arc) angle=(angle-arc<TAU-angle)?arc:0;

  angle=q.startAngle+clamp(angle,pad,arc-pad);

  return {
    valid:true,
    x:center.x+radius*Math.sin(angle),
    y:center.y-radius*Math.cos(angle)
  };
}

function layout(blips,geo,d3,{
  config=geo.activeConfig(),
  markerRadius=9,
  iterations=240,
  randomize=false
}={}) {
  geo.verify(config);

  if(typeof d3?.forceSimulation!=='function' ||
     typeof d3?.forceCollide!=='function') {
    throw Error('D3 force indisponible');
  }

  if(!(markerRadius>0) ||
     !Number.isInteger(iterations) ||
     iterations<1 || iterations>2000) {
    throw Error('Paramètres invalides');
  }

  const ids=new Set();

  // Échantillonnage aléatoire uniforme en surface.
  // L’algorithme conserve un disque entier dans
  // les limites du secteur annulaire.
  const placed=new Map();

  function randomPoint(b) {
    const sector=geo.sector(b.ring,b.quadrant,config);
    const z=sector.zone;
    const q=sector.quarter;
    const center=sector.center;
    const arc=q.endAngle-q.startAngle;

    const clearance=0.0002;
    const half=arc/2-clearance;

    if (!(half>0)) {
      throw Error("Secteur angulaire trop étroit : "+b.id);
    }

    const lo=Math.max(
      z.minRadius+markerRadius+0.01,
      markerRadius/Math.sin(half)+0.01
    );
    const hi=z.maxRadius-markerRadius-0.01;

    if (!(hi>lo)) {
      throw Error("Secteur sans capacité : "+b.id);
    }

    const peers=placed.get(
      String(b.ring)+"|"+String(b.quadrant)
    ) || [];

    let best=null;
    let bestScore=-Infinity;

    for(let k=0;k<64;k++) {
      const radius=Math.sqrt(
        lo*lo+Math.random()*(hi*hi-lo*lo)
      );

      const pad=Math.asin(
        Math.min(1,markerRadius/radius)
      )+clearance;

      if(2*pad>=arc) continue;

      const angle=q.startAngle+pad+
        Math.random()*(arc-2*pad);

      const candidate={
        ring:b.ring,
        quadrant:b.quadrant,
        x:center.x+radius*Math.sin(angle),
        y:center.y-radius*Math.cos(angle)
      };

      const valid=project(
        candidate,geo,config,markerRadius
      );

      if(!valid.valid) continue;

      let score=Infinity;

      for(const peer of peers) {
        score=Math.min(
          score,
          Math.hypot(
            valid.x-peer.x,
            valid.y-peer.y
          )
        );
      }

      if(score>bestScore) {
        best=valid;
        bestScore=score;
      }
    }

    if(!best) {
      throw Error("Aucune position admissible : "+b.id);
    }

    const key=String(b.ring)+"|"+String(b.quadrant);
    if(!placed.has(key)) placed.set(key,[]);
    placed.get(key).push(best);

    return best;
  }

  const nodes=blips.map(b=>{
    const id=String(b.id||'');

    if(!id || ids.has(id)) {
      throw Error('Identifiant de blip manquant ou dupliqué');
    }

    ids.add(id);

    const p=randomize
      ? randomPoint(b)
      : geo.position(b,config);
    const n={
      id,
      ring:b.ring,
      quadrant:b.quadrant,
      x:p.x,
      y:p.y
    };

    const v=project(n,geo,config,markerRadius);

    if(!v.valid) {
      throw Error('Secteur trop étroit : '+id);
    }

    n.x=v.x;
    n.y=v.y;
    return n;
  });

  const targets=new Map(
    nodes.map(n=>[n.id,{x:n.x,y:n.y}])
  );

  const sim=d3.forceSimulation(nodes).stop()
    .force('collision',
      d3.forceCollide(markerRadius).strength(1).iterations(3))
    .force('x',
      d3.forceX(n=>targets.get(n.id).x).strength(.065))
    .force('y',
      d3.forceY(n=>targets.get(n.id).y).strength(.065));

  if(typeof sim.randomSource==='function') {
    let seed=2166136261;

    for(const n of nodes) {
      for(const ch of n.id) {
        seed^=ch.charCodeAt(0);
        seed=Math.imul(seed,16777619);
      }
    }

    sim.randomSource(()=>{
      seed=(Math.imul(1664525,seed)+1013904223)>>>0;
      return seed/4294967296;
    });
  }

  for(let i=0;i<iterations;i++) {
    sim.tick();

    for(const n of nodes) {
      const p=project(n,geo,config,markerRadius);

      if(!p.valid) throw Error('Secteur invalide');

      n.x=p.x;
      n.y=p.y;
      n.vx=0;
      n.vy=0;
    }
  }

  sim.stop();

  let overlaps=0;

  for(let i=0;i<nodes.length;i++) {
    for(let j=i+1;j<nodes.length;j++) {
      if(Math.hypot(
        nodes[i].x-nodes[j].x,
        nodes[i].y-nodes[j].y
      )<2*markerRadius-.05) {
        overlaps++;
      }
    }
  }

  return {
    positions:nodes.map(({id,x,y,ring,quadrant})=>({
      id,x,y,ring,quadrant
    })),
    report:{count:nodes.length,overlaps}
  };
}

function optimize(graph,root) {
  if(root.__radarApplicationProfile?.viewer ||
     root.__radarCatalogUI?.isReadOnly?.()) {
    throw Error('Viewer ou catalogue en lecture seule');
  }

  const group=root.__radarRevisionSession?.status?.().activeGroup;
  const adapter=root.__radarCatalogAdapter;
  const persist=root.__radarCatalogPersistence;
  const rev=adapter?.getRevision?.(group);

  if(!group || !rev || rev.status!=='draft' ||
     !persist?.ownsRevision?.(group,rev.revisionId)) {
    throw Error('Brouillon de catalogue ouvert requis');
  }

  const geo=root.__radarGeometry;
  const cfg=rev.extensions?.radarGeometry || geo?.legacy?.();

  if(!geo || !cfg) {
    throw Error('Géométrie personnalisée requise');
  }

  const graphIds=new Set(graph.nodes().map(n=>n.id()));

  if(graphIds.size!==rev.blips.length ||
     rev.blips.some(b=>!graphIds.has(b.blipId))) {
    throw Error('Graphe et révision non synchronisés');
  }

  if(!rev.blips.length) {
    throw Error('Aucun blip');
  }

  const result=layout(
    rev.blips.map(b=>({
      id:b.blipId,
      ring:b.ring,
      quadrant:b.quadrant
    })),
    geo,
    root.d3,
    {config:cfg,randomize:true}
  );

  if(result.report.overlaps) {
    throw Error(
      'Secteurs surchargés : '+result.report.overlaps+
      ' collisions. Aucun déplacement enregistré.'
    );
  }

  const positions=result.positions.map(p=>({
    id:p.id,
    p:{x:p.x,y:p.y}
  }));

  persist.setDraftGeometry(group,rev.revisionId,cfg,positions);
  adapter.setDraftGeometry(group,rev.revisionId,cfg,positions);

  graph.elements().remove();

  const projected=adapter.project(group);
  graph.add(projected.nodes.concat(projected.edges));
  graph.nodes().ungrabify();

  root.__radarViewportSync?.();

  return result.report;
}

root.__radarPlacement=Object.freeze({
  project,layout,optimize
});

})(typeof window!=='undefined'?window:globalThis);
