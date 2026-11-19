/* S18-A1: parameterized geometry. Browser global and CommonJS for Node tests.
 * Angles use D3 pointRadial convention: 0 north, positive clockwise.
 * No dependency on Cytoscape or D3 for business classification.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.__radarGeometry = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';
  const TAU = Math.PI * 2;
  const LEGACY = Object.freeze({
    id: 'ASD_SSG_4X3',
    center: { x: 400, y: 400 },
    zones: [
      { id: 'Adopted', label: 'Adopted', minRadius: 0, maxRadius: 150 },
      { id: 'Candidate', label: 'Candidate', minRadius: 150, maxRadius: 250 },
      { id: 'Track', label: 'Track', minRadius: 250, maxRadius: 350 }
    ],
    quarters: [
      { id: 'Available', label: 'Available External Standards', startAngle: -Math.PI / 2, endAngle: 0 },
      { id: 'Monitored', label: 'Monitored External Development', startAngle: 0, endAngle: Math.PI / 2 },
      { id: 'Participated', label: 'Participate in External Development', startAngle: Math.PI / 2, endAngle: Math.PI },
      { id: 'Developed', label: 'ASD Development', startAngle: Math.PI, endAngle: 3 * Math.PI / 2 }
    ]
  });
  let active = null; // null retains the historical implementation untouched.
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function finite(n) { return typeof n === 'number' && Number.isFinite(n); }
  function verify(config) {
    if (!config || typeof config !== 'object') throw Error('Geometry configuration required');
    if (!config.center || !finite(config.center.x) || !finite(config.center.y)) throw Error('Invalid center');
    if (!Array.isArray(config.zones) || !config.zones.length || config.zones.length > 32) throw Error('Invalid zones');
    if (!Array.isArray(config.quarters) || config.quarters.length < 2 || config.quarters.length > 32) throw Error('Invalid quarters');
    const ids = new Set();
    let last = 0;
    config.zones.forEach((z, i) => {
      if (!z || typeof z.id !== 'string' || !z.id.trim() || ids.has('z:'+z.id)) throw Error('Invalid or duplicate zone id');
      ids.add('z:'+z.id);
      if (!finite(z.minRadius) || !finite(z.maxRadius) || z.maxRadius <= z.minRadius || z.minRadius < 0) throw Error('Invalid zone radii');
      if (Math.abs(z.minRadius - last) > 1e-8) throw Error('Non-contiguous zones at '+i);
      last = z.maxRadius;
    });
    const start = config.quarters[0]?.startAngle;
    if (!finite(start)) throw Error('Invalid start angle');
    last = start;
    config.quarters.forEach((q, i) => {
      if (!q || typeof q.id !== 'string' || !q.id.trim() || ids.has('q:'+q.id)) throw Error('Invalid or duplicate quarter id');
      ids.add('q:'+q.id);
      if (!finite(q.startAngle) || !finite(q.endAngle) || q.endAngle <= q.startAngle || q.endAngle - q.startAngle > TAU) throw Error('Invalid quarter angle');
      if (Math.abs(q.startAngle - last) > 1e-8) throw Error('Non-contiguous quarters at '+i);
      last = q.endAngle;
    });
    if (Math.abs(last - start - TAU) > 1e-8) throw Error('Quarters must cover exactly one revolution');
    return true;
  }
  function uniform(options) {
    const { quarters = 4, zones = 3, radius = 350, center = {x:400,y:400}, startAngle = -Math.PI / 2 } = options || {};
    if (!Number.isInteger(quarters) || quarters < 2 || quarters > 32 || !Number.isInteger(zones) || zones < 1 || zones > 32 || !finite(radius) || radius <= 0 || !finite(startAngle)) throw Error('Invalid uniform geometry');
    const out = {id:'CUSTOM_'+quarters+'X'+zones,center:clone(center),zones:[],quarters:[]};
    for (let i=0;i<zones;i++) out.zones.push({id:'zone-'+(i+1),label:'Zone '+(i+1),minRadius:i*radius/zones,maxRadius:(i+1)*radius/zones});
    for (let i=0;i<quarters;i++) out.quarters.push({id:'quarter-'+(i+1),label:'Quartier '+(i+1),startAngle:startAngle+i*TAU/quarters,endAngle:startAngle+(i+1)*TAU/quarters});
    verify(out); return out;
  }
  function activeConfig() { return clone(active || LEGACY); }
  function setActive(config) { verify(config); active = clone(config); return activeConfig(); }
  function reset() { active = null; return activeConfig(); }
  function isCustomActive() { return !!active; }
  function sector(zoneId, quarterId, config = active || LEGACY) {
    verify(config);
    const z=config.zones.find(v=>v.id===zoneId),q=config.quarters.find(v=>v.id===quarterId);
    if (!z || !q) throw Error('Unknown zone or quarter: '+zoneId+' / '+quarterId);
    return {zone:z,quarter:q,center:config.center};
  }
  function point(zoneId,quarterId,u=.5,v=.5,config=active||LEGACY) {
    if (!finite(u) || !finite(v) || u<0 || u>1 || v<0 || v>1) throw Error('Invalid normalized coordinates');
    const {zone:z,quarter:q,center:c}=sector(zoneId,quarterId,config);
    const theta=q.startAngle+(q.endAngle-q.startAngle)*v;
    const r=Math.sqrt(z.minRadius*z.minRadius+u*(z.maxRadius*z.maxRadius-z.minRadius*z.minRadius));
    return {x:c.x+r*Math.sin(theta),y:c.y-r*Math.cos(theta),radius:r,angle:theta};
  }
  function locate(x,y,config=active||LEGACY) {
    verify(config);
    if (!finite(x)||!finite(y)) throw Error('Invalid point');
    const dx=x-config.center.x,dy=y-config.center.y;
    const r=Math.hypot(dx,dy);
    const z=config.zones.find((item,i)=>r>=item.minRadius && (r<item.maxRadius || i===config.zones.length-1 && r<=item.maxRadius+1e-8));
    if (!z) return null;
    const start=config.quarters[0].startAngle;
    let angle=(Math.atan2(dx,-dy)-start)%TAU;
    if(angle<0)angle+=TAU;
    const theta=start+angle;
    const q=config.quarters.find((item,i)=>theta>=item.startAngle-1e-10 && (theta<item.endAngle-1e-10 || i===config.quarters.length-1));
    return q?{zoneId:z.id,quarterId:q.id,radius:r,angle:theta}:null;
  }
  function hash(value) {
    let h=2166136261;
    const s=String(value);
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function position(blip,config=active||LEGACY) {
    const key=blip.standardId || blip.id || blip.label || blip.name;
    if (!key) throw Error('Blip stable identifier required');
    const h1=hash('radius:'+key),h2=hash('angle:'+key);
    // Margin avoids SVG axes and ring boundaries. Rendering/collision comes in S18-B.
    return point(blip.ring,blip.quadrant,.12+.76*h1/4294967296,.10+.80*h2/4294967296,config);
  }
  function drawSVG(d3,document) {
    if (!active) throw Error('Custom geometry not active');
    const config=activeConfig();
    const container=d3.select('#svg-container');
    if(container.empty()) throw Error('Missing #svg-container');
    const el=container.node();
    container.select('svg').remove();
    const svg=container.append('svg').attr('width',el.clientWidth).attr('height',el.clientHeight).attr('viewBox','0 0 800 800').attr('preserveAspectRatio','xMidYMid meet');
    const group=svg.append('g').attr('transform','translate('+config.center.x+','+config.center.y+')');
    group.append('text').attr('id','svgTitle').attr('x',-200).attr('y',-370).attr('font-size','25px').attr('fill','black').text('Standards Radar Chart '+new Date().toLocaleDateString());
    config.zones.slice().reverse().forEach(z=>group.append('circle').attr('r',z.maxRadius).attr('fill','white').attr('stroke','black').attr('stroke-width',2));
    const radius=config.zones[config.zones.length-1].maxRadius;
    config.quarters.forEach(q=>{
      const a=q.startAngle;
      group.append('line').attr('x1',0).attr('y1',0).attr('x2',radius*Math.sin(a)).attr('y2',-radius*Math.cos(a)).attr('stroke','#888').attr('stroke-width',2);
      const m=(q.startAngle+q.endAngle)/2;
      const labelRadius=radius+18;
      group.append('text').attr('x',labelRadius*Math.sin(m)).attr('y',-labelRadius*Math.cos(m)).attr('font-size','13px').attr('fill','black').attr('text-anchor','middle').text(q.label || q.id);
    });
    config.zones.forEach(z=>group.append('text').attr('x',-(z.minRadius+z.maxRadius)/2).attr('y',0).attr('font-size','13px').attr('text-anchor','middle').attr('fill','black').text(z.label||z.id));
    return svg.node();
  }
  return Object.freeze({legacy:()=>clone(LEGACY),uniform,verify,activeConfig,setActive,reset,isCustomActive,sector,point,locate,position,drawSVG});
});
