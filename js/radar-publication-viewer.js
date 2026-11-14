/* A8.5 — shared Viewer loading of a resolved native publication.
 * The embedded envelope contains no authoring configuration or source catalog.
 */
(function(root){
  'use strict';
  const keys=(x,names)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===names.length&&names.every(k=>Object.prototype.hasOwnProperty.call(x,k));
  const clone=x=>JSON.parse(JSON.stringify(x));
  const marker='<'+'!--RADAR-PUBLICATION-PAYLOAD-->';
  let startup=null;
  function startupStatus(){return startup===null?null:clone(startup);}
  function fail(message){throw Error('Publication Viewer: '+message);}
  function payload(catalog,report,presentation){
    if(!keys(presentation,['title','language','references'])||typeof presentation.title!=='string'||!presentation.title.trim()||presentation.title.length>200||!['fr','en'].includes(presentation.language)||typeof presentation.references!=='boolean')fail('invalid presentation');
    if(!catalog||catalog.schemaVersion!=='1.0.0'||catalog.title!==presentation.title||!Array.isArray(catalog.radarRevisions)||!catalog.radarRevisions.length||catalog.radarRevisions.some(r=>r.status!=='published')||Object.prototype.hasOwnProperty.call(catalog.extensions||{},'publications'))fail('published native projection required');
    if(!/^[a-f0-9]{64}$/.test(report?.projectionDigest||''))fail('invalid projection digest');
    return clone({schemaVersion:1,presentation,catalog,projectionDigest:report.projectionDigest});
  }
  function validate(value){
    if(!keys(value,['schemaVersion','presentation','catalog','projectionDigest'])||value.schemaVersion!==1)fail('invalid payload');
    return payload(value.catalog,{projectionDigest:value.projectionDigest},value.presentation);
  }
  function encode(value){
    const bytes=new TextEncoder().encode(JSON.stringify(value));let binary='';
    for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
    return root.btoa(binary);
  }
  function decode(text){
    const bytes=Uint8Array.from(root.atob(text.trim()),c=>c.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }
  function compose(template,value){
    const normalized=validate(value);
    if(typeof template!=='string'||template.split(marker).length!==2||!template.includes('__radarStandalone')||!template.includes('const requested=["viewer"];'))fail('invalid Viewer template');
    return template.replace(marker,()=>'<script type="application/json" id="radar-publication-payload">'+encode(normalized)+'</'+'script>');
  }
  function template(){
    root.__radarApplicationProfile.require('publication.create');
    const node=root.document.getElementById('radar-viewer-template');
    if(!node)return null;
    const bytes=Uint8Array.from(root.atob(node.textContent.trim()),c=>c.charCodeAt(0));
    return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }
  async function load(value){
    const profile=root.__radarApplicationProfile;
    if(!profile?.viewer)fail('Viewer profile required');
    const p=root.__radarCatalogPersistence,ui=root.__radarCatalogUI,explorer=root.__radarWorkspaceExplorer;
    if(!p||!ui||!explorer||!explorer.graph()||!root.w2ui?.toolbar)fail('Viewer not ready');
    if(p.status().importedCatalogs||explorer.status().sources.length||root.__radarPublishedPresentation)fail('workspace already open');
    const data=validate(value);
    profile.assertCatalog(data.catalog);
    if(await root.__radarArtifactIntegrity.digest(data.catalog)!==data.projectionDigest)fail('projection digest mismatch');
    if(p.status().importedCatalogs||explorer.status().sources.length||root.__radarPublishedPresentation)fail('workspace changed');
    const summary=ui.load(data.catalog,root.w2ui.toolbar);
    p.remember(data.catalog,summary,{format:'StandardisationRadarChart',schemaVersion:'1.0.0',catalogId:'publication_'+data.projectionDigest,artifactId:'projection_'+data.projectionDigest,origin:{system:'StandardisationRadarChart',organizationId:data.catalog.organizations[0]?.organizationId||null},lineage:{parentArtifactId:null}},data.projectionDigest);
    Object.defineProperty(root,'__radarPublishedPresentation',{value:Object.freeze(clone(data.presentation)),writable:false,configurable:false});
    explorer.addCatalog(data.catalog,summary);
    ui.refreshRadarLabels();
    // A8.5-R1: presentation and all synchronous refreshes precede the final
    // initial selection. Record startup separately from later user navigation.
    await root.changeLanguage?.(data.presentation.language);
    root.document.title=data.presentation.title;
    root.__radarStandardsPanel?.refresh?.();
    const first=summary.revisions[0];
    explorer.activate(first.group);
    const sessionGroup=root.__radarRevisionSession.status().activeGroup;
    const explorerGroup=explorer.status().activeGroup;
    const activeRevisionId=root.__radarCatalogAdapter.getRevision(sessionGroup)?.revisionId||null;
    startup=Object.freeze({projectionDigest:data.projectionDigest,expectedGroup:first.group,expectedRevisionId:first.revisionId,sessionGroup,explorerGroup,activeRevisionId,ok:sessionGroup===first.group&&explorerGroup===first.group&&activeRevisionId===first.revisionId});
    if(!startup.ok)fail('initial revision selection mismatch');
    return {projectionDigest:data.projectionDigest,revisionIds:summary.revisions.map(r=>r.revisionId),profile:'viewer'};
  }
  function notify(result){if(root.parent&&root.parent!==root)root.parent.postMessage({type:'radar-publication-preview-result',...result},'*');}
  function showError(error){
    root.console?.error?.(error);
    const fr={title:'Impossible de charger la publication.'},en={title:'Unable to load the publication.'};
    const i=root.i18next;for(const [lang,labels] of Object.entries({fr,en}))i?.addResourceBundle?.(lang,'translation',{menu:{publicationViewer:labels}},true,true);
    const text=i?.t?.('menu.publicationViewer.title')||en.title;
    const node=root.document.createElement('p');node.setAttribute('role','alert');node.textContent=text;root.document.body.prepend(node);
    notify({ok:false});
  }
  function boot(){
    if(!root.__radarApplicationProfile?.viewer)return;
    const node=root.document.getElementById('radar-publication-payload');
    if(node){
      Promise.resolve().then(()=>load(decode(node.textContent))).then(result=>notify({ok:true,result}),showError);return;
    }
    if(root.parent===root||!root.parent||new root.URLSearchParams(root.location.search).get('publicationPreview')!=='1')return;
    const parentOrigin=root.location.origin;
    let accepted=false;
    root.addEventListener('message',event=>{
      if(accepted||event.source!==root.parent||event.origin!==parentOrigin||event.data?.type!=='radar-publication-preview-load')return;
      accepted=true;load(event.data.payload).then(result=>notify({ok:true,result}),showError);
    });
    root.parent.postMessage({type:'radar-publication-preview-ready'},parentOrigin);
  }
  root.__radarPublicationViewer=Object.freeze({payload,validate,compose,template,load,encode,decode,startupStatus});
  root.addEventListener?.('load',boot,{once:true});
})(window);
