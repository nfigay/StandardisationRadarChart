/* S18-A2: draft-scoped geometry editor; preview never mutates a revision. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports) module.exports=api;
 if(root) root.__radarGeometryEditor=api;
})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 function compose(previous,input){
  const geo=root?.__radarGeometry || (typeof require==='function'?require('./radar-geometry.js'):null);
  if(!geo)throw Error('Geometry engine unavailable');
  const quarters=Number(input.quarters),zones=Number(input.zones);
  if(!Number.isInteger(quarters)||quarters<2||quarters>12||!Number.isInteger(zones)||zones<1||zones>8)throw Error('Nombre de quartiers/zones hors limites');
  const radius=Number(input.radius);
  if(!Number.isFinite(radius)||radius<100||radius>350)throw Error('Rayon : valeur entre 100 et 350');
  const start=Number(input.startAngle);
  if(!Number.isFinite(start)||start < -360||start > 360)throw Error('Orientation hors limites');
  const out=geo.uniform({quarters,zones,radius,startAngle:start*Math.PI/180});
  // Keep the legacy 150/250/350 boundaries when the number of zones remains unchanged.
  if(previous?.zones?.length===zones){
   const oldRadius=previous.zones.at(-1).maxRadius, scale=radius/oldRadius;
   out.zones=out.zones.map((z,i)=>({...z,minRadius:previous.zones[i].minRadius*scale,maxRadius:previous.zones[i].maxRadius*scale}));
  }
  const make=(value,index,prefix,old)=>({id:old?.id||prefix+'-'+(index+1),label:String(value?.label||old?.label||prefix+' '+(index+1)).trim(),description:String(value?.description||old?.description||'').trim()});
  out.zones=out.zones.map((item,i)=>({...item,...make(input.zoneData?.[i],i,'zone',previous?.zones?.[i] && previous.zones.length===zones?previous.zones[i]:null)}));
  out.quarters=out.quarters.map((item,i)=>({...item,...make(input.quarterData?.[i],i,'quarter',previous?.quarters?.[i] && previous.quarters.length===quarters?previous.quarters[i]:null)}));
  if(out.zones.some(x=>!x.label)||out.quarters.some(x=>!x.label))throw Error('Chaque catégorie doit avoir un libellé');
  geo.verify(out);return out;
 }
 function impact(config,blips){
  const zs=new Set(config.zones.map(x=>x.id)),qs=new Set(config.quarters.map(x=>x.id));
  const invalid=(blips||[]).filter(b=>!zs.has(b.ring)||!qs.has(b.quadrant)).map(b=>({id:b.blipId||b.id||'',label:b.label||'',ring:b.ring,quadrant:b.quadrant}));
  return {total:(blips||[]).length,invalid,canApply:invalid.length===0};
 }
 function drawPreview(node,config){
  const ns='http://www.w3.org/2000/svg';node.replaceChildren();
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 800 800');svg.style.width='100%';svg.style.maxHeight='280px';svg.setAttribute('role','img');svg.setAttribute('aria-label','Prévisualisation de la géométrie');
  const el=(tag,attrs,text)=>{const v=document.createElementNS(ns,tag);for(const [k,val] of Object.entries(attrs))v.setAttribute(k,String(val));if(text!==undefined)v.textContent=text;svg.appendChild(v);return v;};
  const c=config.center, max=config.zones.at(-1).maxRadius;
  for(const z of config.zones.slice().reverse())el('circle',{cx:c.x,cy:c.y,r:z.maxRadius,fill:'white',stroke:'#586575','stroke-width':2});
  for(const q of config.quarters){el('line',{x1:c.x,y1:c.y,x2:c.x+max*Math.sin(q.startAngle),y2:c.y-max*Math.cos(q.startAngle),stroke:'#85909b','stroke-width':2});const m=(q.startAngle+q.endAngle)/2;el('text',{x:c.x+(max+22)*Math.sin(m),y:c.y-(max+22)*Math.cos(m),'font-size':14,'text-anchor':'middle',fill:'#263746'},q.label);}
  node.appendChild(svg);
 }
 function active(){
  const group=root.__radarRevisionSession?.status?.().activeGroup;
  const revision=root.__radarCatalogAdapter?.getRevision?.(group);
  if(!group||!revision)throw Error('Sélectionnez une révision de catalogue');
  return {group,revision};
 }
 function open(graph){
  if(root.__radarApplicationProfile?.viewer)throw Error('Viewer en lecture seule');
  const {group,revision}=active();
  if(revision.status!=='draft'||root.__radarCatalogUI?.isReadOnly())throw Error('Créer ou ouvrir un radar de travail avant modification');
  if(!root.__radarCatalogPersistence?.ownsRevision?.(group,revision.revisionId))throw Error('Révision non rattachée au catalogue actif');
  if(!root.w2popup?.open)throw Error('w2popup indisponible');
  const engine=root.__radarGeometry;
  const initial=clone(revision.extensions?.radarGeometry || engine.legacy());engine.verify(initial);
  const blips=revision.blips||[];
  let candidate=clone(initial);
  const html=`<div id="s18-geometry-editor" style="padding:12px;overflow:auto;height:100%;box-sizing:border-box;font-size:13px">
  <div style="display:grid;grid-template-columns:repeat(3,minmax(100px,1fr));gap:10px;margin-bottom:10px">
  <label>Quartiers<input data-key="quarters" type="number" min="2" max="12" style="width:100%"></label>
  <label>Zones<input data-key="zones" type="number" min="1" max="8" style="width:100%"></label>
  <label>Rayon maximal<input data-key="radius" type="number" min="100" max="350" style="width:100%"></label>
  <label>Orientation (degrés)<input data-key="startAngle" type="number" min="-360" max="360" style="width:100%"></label>
  </div><div id="s18-categories" style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></div>
  <p id="s18-impact" aria-live="polite"></p><div id="s18-preview" style="max-width:320px;margin:auto"></div></div>`;
  let box=null;
  function field(key){return box.querySelector('[data-key="'+key+'"]');}
  function settings(){return {quarters:Number(field('quarters').value),zones:Number(field('zones').value),radius:Number(field('radius').value),startAngle:Number(field('startAngle').value),zoneData:[],quarterData:[]};}
  function readRows(s){for(const kind of ['zone','quarter']){const target=kind==='zone'?s.zoneData:s.quarterData;box.querySelectorAll('[data-kind="'+kind+'"]')?.forEach(r=>{target.push({label:r.querySelector('[data-field="label"]').value,description:r.querySelector('[data-field="description"]').value});});}return s;}
  function categories(){
   const s=settings(),target=box.querySelector('#s18-categories');target.replaceChildren();
   for(const kind of ['zone','quarter']){
    const count=kind==='zone'?s.zones:s.quarters;if(!Number.isInteger(count)||count<1||count>12)continue;
    const div=document.createElement('div');const head=document.createElement('strong');head.textContent=kind==='zone'?'Zones concentriques':'Quartiers angulaires';div.appendChild(head);
    for(let i=0;i<count;i++){
     const orig=(kind==='zone'?candidate.zones:candidate.quarters)[i];const row=document.createElement('div');row.dataset.kind=kind;row.style.margin='6px 0';
     const label=document.createElement('input');label.dataset.field='label';label.setAttribute('aria-label',kind+' '+(i+1)+' libellé');label.placeholder='Libellé '+(i+1);label.style.width='100%';label.value=orig?.label|| (kind==='zone'?'Zone ':'Quartier ')+(i+1);
     const desc=document.createElement('input');desc.dataset.field='description';desc.setAttribute('aria-label',kind+' '+(i+1)+' description');desc.placeholder='Description facultative';desc.style.width='100%';desc.value=orig?.description||'';
     row.append(label,desc);div.appendChild(row);
    }target.appendChild(div);
   }
  }
  function preview(){try{const next=compose(candidate,readRows(settings()));const info=impact(next,blips);drawPreview(box.querySelector('#s18-preview'),next);const msg=box.querySelector('#s18-impact');msg.textContent=next.quarters.length+' quartiers × '+next.zones.length+' zones · '+info.total+' blips · '+(info.canApply?'Catégories compatibles':'Application bloquée : '+info.invalid.length+' blips sans catégorie correspondante');msg.style.color=info.canApply?'#176637':'#a02020';candidate=next;return {next,info};}catch(e){box.querySelector('#s18-impact').textContent=e.message;throw e;}}
  function apply(){try{
   const {next,info}=preview();if(!info.canApply)throw Error('Migration explicite des catégories requise : '+info.invalid.map(x=>x.label||x.id).slice(0,6).join(', '));
   const fresh=active();if(fresh.group!==group||fresh.revision.revisionId!==revision.revisionId||fresh.revision.status!=='draft')throw Error('La révision active a changé');
   const graphIds=new Set(graph.nodes().map(n=>n.id()));
   if(graphIds.size!==blips.length||blips.some(b=>!graphIds.has(b.blipId)))throw Error('Graphe et révision désynchronisés : enregistrez ou rechargez le radar avant modification');
   const positions=blips.map(b=>({id:b.blipId,p:engine.position(b,next)}));
   const persistence=root.__radarCatalogPersistence;
   persistence.setDraftGeometry(group,revision.revisionId,next,positions);
   root.__radarCatalogAdapter.setDraftGeometry(group,revision.revisionId,next,positions);
   engine.setActive(next);root.drawSVG();
   graph.elements().remove();graph.add(root.__radarCatalogAdapter.project(group).nodes);root.__radarViewportSync?.();
   root.w2popup.close();root.w2alert?.('Géométrie appliquée à la révision de travail. Exportez le catalogue JSON pour la conserver.');
  }catch(e){root.w2alert?.(e.message);}}
  root.w2popup.open({title:'Configuration du radar — S18',width:860,height:760,modal:true,body:html,
   actions:{'Annuler':()=>root.w2popup.close(),'Prévisualiser':()=>{try{preview();}catch(_){ }},'Appliquer à la révision':apply},
   onOpen(event){event.onComplete=()=>{box=root.document.getElementById('s18-geometry-editor');if(!box)return;
    field('quarters').value=initial.quarters.length;field('zones').value=initial.zones.length;field('radius').value=initial.zones.at(-1).maxRadius;field('startAngle').value=(initial.quarters[0].startAngle*180/Math.PI).toFixed(2);
    categories();box.addEventListener('change',e=>{if(e.target?.dataset?.key==='quarters'||e.target?.dataset?.key==='zones')categories();});try{preview();}catch(_){ }
   };}
  });
 }
 return Object.freeze({compose,impact,open});
});
