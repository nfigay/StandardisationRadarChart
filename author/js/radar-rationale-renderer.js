/* S19-A4-R6 — Safe, dependency-free strategic dossier HTML renderer.
 * Shared by Creator preview and the future published Viewer.
 * No DOM access, network or Tiptap dependency.
 */
(function (root) {
  'use strict';
  const SECTION_KEYS = ['abstract','businessJustification','businessBenefits','stakeholders','activities','actionPlan','adoptionStatement','recommendation','supportingMaterial'];
  const TITLES = {
    fr: {abstract:'Résumé',businessJustification:'Justification métier',businessBenefits:'Bénéfices métier',stakeholders:'Parties prenantes et gouvernance',activities:'Activités et livrables',actionPlan:"Plan d’action",adoptionStatement:"Déclaration d’adoption",recommendation:'Recommandation',supportingMaterial:'Références et documentation'},
    en: {abstract:'Abstract',businessJustification:'Business justification',businessBenefits:'Business benefits',stakeholders:'Stakeholders and governance',activities:'Activities and deliverables',actionPlan:'Action plan',adoptionStatement:'Adoption statement',recommendation:'Recommendation',supportingMaterial:'References and supporting material'}
  };
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  // Only canonical #RRGGBB is accepted: JSON data never becomes arbitrary CSS.
  function safeColor(value) {return typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)?value.toLowerCase():null;}
  function layoutAttrs(node) {
    const attrs=node?.attrs||{};
    const rules=[];
    if(['center','right','justify'].includes(attrs.textAlign))rules.push('text-align:'+attrs.textAlign);
    if(Number.isInteger(attrs.s19Indent)&&attrs.s19Indent>0&&attrs.s19Indent<=6)rules.push('margin-left:'+(attrs.s19Indent*24)+'px');
    if(node?.type==='paragraph'){
      const bg=safeColor(attrs.backgroundColor);
      if(bg)rules.push('background-color:'+bg,'padding:5px 8px','border-radius:3px');
    }
    return rules.length?' style="'+rules.join(';')+'"':'';
  }
  function safeHref(url) { const s=String(url||'').trim(); return /^https?:\/\/[^\s<>"']+$/i.test(s) ? s : null; }
  function children(node) { return (Array.isArray(node?.content)?node.content:[]).map(renderNode).join(''); }
  function reference(attrs) {
    if (!attrs || !['blipId','standardId'].every(k=>typeof attrs[k]==='string' && attrs[k].trim())) return null;
    return {blipId:attrs.blipId,standardId:attrs.standardId,label:typeof attrs.label==='string'?attrs.label:attrs.standardId};
  }
  function resolveReference(attrs,revision) {
    const ref=reference(attrs);if(!ref||!Array.isArray(revision?.blips))return null;
    const matches=revision.blips.filter(b=>b.blipId===ref.blipId&&b.standardId===ref.standardId);
    return matches.length===1?matches[0]:null;
  }
  function listIndent(node){const v=node.attrs?.s19Indent;return Number.isInteger(v)&&v>0&&v<=6?' data-s19-indent="'+v+'"':'';}
  function spanAttr(name,value){return Number.isInteger(value)&&value>1&&value<=100?' '+name+'="'+value+'"':'';}
  function renderNode(node) {
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'text') {
      let out=esc(node.text);
      for (const mark of Array.isArray(node.marks)?node.marks:[]) {
        if (!mark||typeof mark!=='object')continue;
        if (mark.type==='bold')out='<strong>'+out+'</strong>';
        else if (mark.type==='italic')out='<em>'+out+'</em>';
        else if (mark.type==='strike')out='<s>'+out+'</s>';
        else if (mark.type==='underline')out='<u>'+out+'</u>';
        else if (mark.type==='highlight'){const clr=safeColor(mark.attrs?.color);out='<mark'+(clr?' style="background-color:'+clr+'"':'')+'>'+out+'</mark>';}
        else if (mark.type==='textStyle'){const clr=safeColor(mark.attrs?.color);if(clr)out='<span style="color:'+clr+'">'+out+'</span>';}
        else if (mark.type==='code')out='<code>'+out+'</code>';
        else if (mark.type==='link') {const href=safeHref(mark.attrs?.href);if(href)out='<a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+out+'</a>';}
      }
      return out;
    }
    const wrap=(tag)=>'<'+tag+'>'+children(node)+'</'+tag+'>';
    switch(node.type) {
      case 'doc':return children(node);
      case 'paragraph':return '<p'+layoutAttrs(node)+'>'+children(node)+'</p>';
      case 'heading':{const lvl=Math.min(6,Math.max(1,Math.trunc(Number(node.attrs?.level)||2)));return '<h'+lvl+layoutAttrs(node)+'>'+children(node)+'</h'+lvl+'>';}
      case 'bulletList':{const types=['disc','circle','square'];const v=node.attrs?.s19ListStyle;
       return '<ul'+(types.includes(v)?' style="list-style-type:'+v+'"':'')+listIndent(node)+'>'+children(node)+'</ul>'; }
      case 'orderedList':{const start=node.attrs?.start;const styles=['decimal','lower-alpha','upper-alpha','lower-roman','upper-roman'];const style=styles.includes(node.attrs?.s19ListStyle)?' style="list-style-type:'+node.attrs.s19ListStyle+'"':'';
       return '<ol'+(Number.isSafeInteger(start)&&start!==1?' start="'+start+'"':'')+style+listIndent(node)+'>'+children(node)+'</ol>';}
      case 'taskList':return '<ul class="s19-tasks">'+children(node)+'</ul>';
      case 'taskItem':return '<li class="s19-task"><span aria-hidden="true">'+(node.attrs?.checked===true?'☑':'☐')+'</span>'+children(node)+'</li>';
      case 'table':{
       // Tiptap persists colwidth in pixels. Convert complete logical-column
       // widths to a proportional colgroup only when producing static HTML.
       // This never rewrites existing dossier JSON or destroys native sizing.
       const first=(node.content||[]).find(r=>r.type==='tableRow');
       const widths=[];let valid=!!first?.content?.length;
       for(const c of first?.content||[]){
        const span=Number.isInteger(c.attrs?.colspan)&&c.attrs.colspan>0&&c.attrs.colspan<=100?c.attrs.colspan:1;
        const cw=c.attrs?.colwidth;
        if(!Array.isArray(cw)||cw.length!==span||!cw.every(w=>Number.isInteger(w)&&w>=45&&w<=2000)){valid=false;break;}
        widths.push(...cw);
       }
       const sum=widths.reduce((n,w)=>n+w,0);
       let colgroup='';
       if(valid&&sum>0){
        let used=0;const cols=widths.map((w,i)=>{
         const share=i===widths.length-1?100-used:Math.round(w/sum*10000)/100;
         used+=share;
         return '<col style="width:'+share.toFixed(2)+'%">';
        });
        colgroup='<colgroup>'+cols.join('')+'</colgroup>';
       }
       return '<div class="s19-table-wrap"><table class="s19-responsive-table">'+colgroup+'<tbody>'+children(node)+'</tbody></table></div>';
      }
      case 'tableRow':{const h=node.attrs?.s19MinHeight;
       return '<tr'+(Number.isInteger(h)&&h>=24&&h<=800?' style="height:'+h+'px;--s19-row-height:'+h+'px"':'')+'>'+children(node)+'</tr>'; }
      case 'tableHeader':case 'tableCell':{
       const tag=node.type==='tableHeader'?'th':'td';
       return '<'+tag+spanAttr('colspan',node.attrs?.colspan)+spanAttr('rowspan',node.attrs?.rowspan)+'>'+children(node)+'</'+tag+'>';
      }
      case 'radarReference':{const ref=reference(node.attrs);return ref?'<button type="button" class="s19-reference" data-blip-id="'+esc(ref.blipId)+'" data-standard-id="'+esc(ref.standardId)+'">'+esc(ref.label)+'</button>':esc(node.attrs?.label||'');}
      case 'listItem':return wrap('li');
      case 'blockquote':return wrap('blockquote');
      case 'codeBlock':return '<pre><code>'+children(node)+'</code></pre>';
      case 'hardBreak':return '<br>';
      case 'horizontalRule':return '<hr>';
      default:return children(node); // unknown/unsupported embedded features never become executable HTML
    }
  }
  function renderDocument(record, opts={}) {
    const lang=String(opts.lang||'fr').toLowerCase().startsWith('en')?'en':'fr';
    const standard=record?.standard||{};
    const title=standard.designation||standard.title||record?.rationaleId||'';
    const org=record?.organization?.name||'';
    const sections=SECTION_KEYS.map((key,i)=>{
      const body=renderNode(record?.sections?.[key]||{type:'doc'});
      if (!body.trim())return '';
      return '<section id="dossier-'+key+'"><h2>'+esc(TITLES[lang][key])+'</h2>'+body+'</section>';
    }).join('\n');
    const typeTitles={fr:{blip:'Blip',standard:'Standard',radar:'Radar',revision:'Révision',organization:'Organisation',dossier:'Dossier',source:'Source documentaire',url:'Lien externe'},en:{blip:'Blip',standard:'Standard',radar:'Radar',revision:'Revision',organization:'Organization',dossier:'Dossier',source:'Documentary source',url:'External link'}};
    const associated=Array.isArray(record?.relatedReferences)?record.relatedReferences.filter(x=>x&&typeof x.id==='string'&&typeof x.label==='string'&&['blip','standard','source','url'].includes(x.type)).map(x=>'<li><span>'+esc(typeTitles[lang][x.type])+'</span> <button type="button" class="s19-related-ref" data-related-type="'+esc(x.type)+'" data-related-id="'+esc(x.id)+'">'+esc(x.label)+'</button></li>').join(''):'';
    const related=opts.includeRelated===false?'':associated?'<section><h2>'+(lang==='en'?'Related references':'Références associées')+'</h2><ul>'+associated+'</ul></section>':'';
    const css="/* S19-R74-R7 static HTML preview only; no script permissions needed. */\nul.s19-tasks{list-style:none;padding-left:0;margin:12px 0}\nli.s19-task{display:flex;align-items:flex-start;gap:9px;margin:7px 0}\nli.s19-task > span{flex:0 0 auto;line-height:1.55}\nli.s19-task > p{flex:1 1 auto;min-width:0;margin:0}\nblockquote{margin:14px 0;padding:8px 14px;border-left:4px solid #71839c;border-radius:0 4px 4px 0;background:#f2f5f9;color:#38485e}\nblockquote p{margin:4px 0}\npre{margin:14px 0;padding:13px 15px;border:1px solid #d7dee8;border-radius:6px;background:#f1f4f8;color:#243247;white-space:pre;overflow-x:auto;tab-size:2}\npre code{background:transparent;color:inherit;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:inherit}\n:not(pre)>code{background:#edf1f5;border-radius:3px;padding:1px 4px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}\n" + '.s19-related-ref{font:inherit;color:#1864ab;background:#edf4ff;border:1px solid #a8c5e8;border-radius:4px;cursor:pointer}.s19-reference{font:inherit;color:#1864ab;background:#edf4ff;border:1px solid #a8c5e8;border-radius:4px;cursor:pointer}.s19-table-wrap{overflow:auto}ul[data-s19-indent="1"],ol[data-s19-indent="1"]{margin-left:24px}ul[data-s19-indent="2"],ol[data-s19-indent="2"]{margin-left:48px}ul[data-s19-indent="3"],ol[data-s19-indent="3"]{margin-left:72px}ul[data-s19-indent="4"],ol[data-s19-indent="4"]{margin-left:96px}ul[data-s19-indent="5"],ol[data-s19-indent="5"]{margin-left:120px}ul[data-s19-indent="6"],ol[data-s19-indent="6"]{margin-left:144px}ul:not(.s19-tasks),ol{padding-inline-start:2.1em;list-style-position:outside}table{border-collapse:collapse;width:100%;table-layout:fixed}.s19-table-wrap{max-width:100%;overflow-x:auto}.s19-responsive-table{min-width:0}tr[style*="--s19-row-height"] > td,tr[style*="--s19-row-height"] > th{height:var(--s19-row-height)}td,th{border:1px solid #c6ccd4;padding:6px;text-align:left}th{background:#f0f3f7}:root{color-scheme:light}body{font:15px/1.65 system-ui,Arial,sans-serif;color:#253044;background:#fff;margin:0}main{max-width:880px;margin:auto;padding:26px 24px 64px}h1{font-size:1.8rem;margin:0}h2{font-size:1.17rem;margin:30px 0 10px;border-bottom:1px solid #e3e7ec;padding-bottom:8px}h3{font-size:1rem}p{margin:10px 0}ul,ol{padding-left:26px}a{color:#1864ab;overflow-wrap:anywhere}.meta{color:#667085;margin:6px 0 28px}section{break-inside:avoid-page}';
    return '<!doctype html><html lang="'+lang+'"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; base-uri \'none\'; form-action \'none\'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+'</title><style>'+css+'</style></head><body><main><header><h1>'+esc(title)+'</h1><div class="meta">'+esc(org)+'</div></header>'+sections+related+'</main></body></html>';
  }
  const api=Object.freeze({renderDocument,renderNode,resolveReference,escapeHtml:esc,sectionKeys:Object.freeze([...SECTION_KEYS])});
  if (typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.__radarRationaleRenderer=api;
})(typeof window==='object'?window:undefined);
