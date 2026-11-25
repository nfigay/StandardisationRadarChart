/* Phase 10G-B1: W2UI projection of explicitly loaded session sources.
 * The session/adapter/persistence remain authoritative, not the tree.
 * This module never changes imported files or bundled ASD_SSG_Blips.
 */
(function(root) {
  'use strict';
  var sources=[];
  var active=null;
  var tree=null;
  var mount=null;
  var treeHost=null, publishedPanel=null;
  var serial=0;
  var hooks=null;
  var owns=Object.prototype.hasOwnProperty;
  function fail(s) { throw Error('Workspace explorer: '+s); }
  function tr(key, fallback) { var v=root.i18next?.t?.('menu.'+key); return !v || v==='menu.'+key ? fallback : v; }
  function safe(v) { return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function entry(source,group) {return source.radars.find(r=>r.group===group)||null;}
  function getSource(id) { return sources.find(s=>s.id===id)||null; }
  function find(group) { for(var s of sources) { var r=entry(s,group); if(r)return {source:s,radar:r}; } return null; }
  var workspaceLabels={
    fr:{workspaceOpenReplace:'Ouvrir / Remplacer',workspaceClose:'Fermer',workspaceReferences:'Références',workspacePublications:'Publications'},
    en:{workspaceOpenReplace:'Open / Replace',workspaceClose:'Close',workspaceReferences:'References',workspacePublications:'Publications'}
  };
  function registerWorkspaceI18n(){
    for(var lang of ['fr','en'])root.i18next?.addResourceBundle?.(lang,'translation',{menu:workspaceLabels[lang]},true,true);
  }
  function workspaceCommands(){
    if(root.__radarApplicationProfile?.allows('catalog.open')===false)return '';
    var buttons=[['open','workspaceOpenReplace'],['close','workspaceClose']];
    if(root.__radarPublishedPresentation?.references!==false)buttons.push(['references','workspaceReferences']);
    if(root.__radarApplicationProfile?.allows('publication.create')&&root.__radarPublicationUI)buttons.push(['publications','workspacePublications']);
    return '<div style="display:flex;flex-wrap:wrap;gap:4px;padding:6px;border-bottom:1px solid #ddd">'+buttons.map(function(pair){
      return '<button type="button" class="w2ui-btn" data-workspace-action="'+pair[0]+'" data-workspace-i18n="'+pair[1]+'">'+safe(tr(pair[1],workspaceLabels.fr[pair[1]]))+'</button>';
    }).join('')+'</div>';
  }
  function updateWorkspaceLabels(){
    if(root.__radarApplicationProfile?.published){renderPublishedPanel();return;}
    if(!tree)return;
    tree.topHTML=workspaceCommands();
    for(var button of mount?.querySelectorAll?.('[data-workspace-i18n]')||[]){
      var key=button.dataset.workspaceI18n;
      button.textContent=tr(key,workspaceLabels.fr[key]);
    }
  }
  function initialize(args) {
    if(tree)fail('already initialized');
    if(!args || !args.mount || typeof args.select!=='function' || typeof args.graph!=='function')fail('missing hooks');
    if(typeof root.w2sidebar!=='function')fail('W2UI sidebar unavailable');
    hooks=args; mount=args.mount;
    // Cancel only the native browser menu inside the workspace explorer.
    // Do not stop propagation: W2UI still needs its contextmenu event.
    if(typeof mount.addEventListener==='function') {
      mount.addEventListener('contextmenu',function(nativeEvent){
        nativeEvent.preventDefault();
      },true);
    }
    // A8.2: use the shared i18next menu bundle for workspace commands.
    registerWorkspaceI18n();
    var commands=workspaceCommands();
    mount.addEventListener?.('click',function(event){
      var button=event.target?.closest?.('[data-workspace-action]');
      if(!button)return;
      event.preventDefault();
      var action=button.dataset.workspaceAction,api=root.__radarCatalogUI;
      try{
        if(action==='open')api.openFile({replace:true});
        if(action==='close')Promise.resolve(api.requestClose(hooks.graph())).catch(err=>root.w2alert(err.message));
        if(action==='references')root.__radarStandardsPanel.openReferences();
        if(action==='publications')root.__radarPublicationUI.open(hooks.graph());
      }catch(err){root.w2alert(err.message);}
    });
    // W2UI owns only its dedicated child; its refresh cannot overwrite the
    // published metadata panel. Keep the original layout/mount unchanged.
    if(mount.appendChild && root.document?.createElement){
      treeHost=root.document.createElement('div');
      Object.assign(treeHost.style,{width:'100%',height:'100%'});
      mount.appendChild(treeHost);
      publishedPanel=root.document.createElement('section');
      publishedPanel.id='radar-published-radar-panel';publishedPanel.hidden=true;
      Object.assign(publishedPanel.style,{height:'100%',overflow:'auto',boxSizing:'border-box',padding:'12px',fontFamily:'system-ui,sans-serif',fontSize:'13px',overflowWrap:'anywhere'});
      mount.appendChild(publishedPanel);
    }
    tree=new root.w2sidebar({box:treeHost||mount,name:'radarWorkspaceTree',topHTML:commands,nodes:[],onClick:function(e){
      var id=e.target||e.detail?.target;
      var node=tree.get(id);
      if(!node || !node.workspaceGroup)return; // folder clicks only expand/collapse
      activate(node.workspaceGroup);
    },onContextMenu:function(e){
      var id=e.target||e.detail?.target;
      var node=tree.get(id);
      if(!node || !node.workspaceSource)return;
      e.preventDefault?.();
      var original=e.detail?.originalEvent;
      // Browser-native event is used only to position the context menu.
      showRemovalMenu(node.workspaceSource,node.workspaceGroup||null,original);
    }});
    root.i18next?.on?.('languageChanged',()=>{updateWorkspaceLabels();root.__radarTitle?.refresh?.();});
    refresh();return tree;
  }
  function renderPublishedPanel(){
    if(!publishedPanel)return;
    const published=!!root.__radarApplicationProfile?.published;
    treeHost.hidden=published;treeHost.style.display=published?'none':'';publishedPanel.hidden=!published;
    if(!published)return;
    const d=root.document,fr=String(root.i18next?.language||'fr').toLowerCase().startsWith('fr');
    const t=(a,b)=>fr?a:b;
    const add=(parent,tag,text)=>{const n=d.createElement(tag);if(text!==undefined)n.textContent=String(text);parent.appendChild(n);return n;};
    const list=sources.flatMap(s=>s.radars);
    const hit=find(active)|| (list.length?find(list[0].group):null);
    publishedPanel.replaceChildren();
    const title=add(publishedPanel,'p',root.__radarPublishedPresentation?.title||t('Publication','Publication'));
    title.style.fontWeight='600';
    if(!hit){add(publishedPanel,'p',t('Chargement de la publication…','Loading publication…'));return;}
    const name=r=>{const rev=root.__radarCatalogAdapter.getRevision(r.group);return root.__radarCatalogPersistence?.getRadarName?.(rev.radarId)||rev.title||rev.radarId;};
    if(list.length>1){
      const label=add(publishedPanel,'label',t('Radar à consulter','Radar to consult'));
      const select=add(label,'select');select.id='radar-published-selector';select.setAttribute('aria-label',t('Radar à consulter','Radar to consult'));
      Object.assign(select.style,{display:'block',width:'100%',height:'auto',margin:'5px 0 12px'});
      for(const r of list){const o=add(select,'option',name(r)+' — '+r.orgLabel);o.value=r.group;}
      select.value=hit.radar.group;select.addEventListener('change',()=>activate(select.value));
    }
    const r=root.__radarCatalogAdapter.getRevision(hit.radar.group);
    const radarName=name(hit.radar);
    const svgTitle=d.getElementById('svgTitle');
    if(svgTitle)root.__radarTitle?.refresh?.();
    const heading=add(publishedPanel,'h2',radarName);Object.assign(heading.style,{fontSize:'17px',margin:'10px 0'});
    const dl=add(publishedPanel,'dl');
    function field(label,value){if(value==null||value==='')return;const dt=add(dl,'dt',label);dt.style.fontWeight='600';const dd=add(dl,'dd',value);Object.assign(dd.style,{margin:'3px 0 12px',whiteSpace:'pre-wrap'});}
    field(t('Organisation','Organization'),hit.radar.orgLabel);
    field(t('Portefeuille','Portfolio'),hit.radar.portfolioLabel);
    field(t('Version publiée','Published version'),r.version);
    field(t('Révision','Revision'),root.__radarCatalogPersistence?.getRevisionLabel?.(r.revisionId)||r.revisionId);
    field(t('Références positionnées','Positioned references'),new Set(r.blips.map(b=>b.standardId)).size);
    if(root.__radarPublishedPresentation?.references!==false){
      const b=add(publishedPanel,'button',t('Références du radar','Radar references'));b.type='button';b.className='w2ui-btn';
      b.addEventListener('click',()=>root.__radarStandardsPanel.openReferences());
    }
  }
  function nodes() {
    return sources.map(function(s) {
      var orgs=[];
      if(s.kind==='catalog') {
        for(var r of s.radars) {
          var org=orgs.find(o=>o.orgId===r.orgId);
          if(!org) {org={id:'org_'+s.id+'_'+orgs.length,text:safe(r.orgLabel||r.orgId||'Organization'),expanded:true,nodes:[],orgId:r.orgId};orgs.push(org);}
          // S14-K-R4: the radar owns its name; revisions carry only revision metadata.
          var revision=root.__radarCatalogAdapter?.getRevision?.(r.group);
          var radarId=revision?.radarId||r.group;
          var radarNode=org.nodes.find(function(n){return n.workspaceRadarId===radarId;});
          if(!radarNode){
            var radarName=root.__radarCatalogPersistence?.getRadarName?.(radarId)||revision?.title||radarId;
            radarNode={id:'radar_root_'+s.id+'_'+org.nodes.length,text:safe(radarName),icon:'fa fa-bullseye',expanded:true,nodes:[],workspaceRadarId:radarId};
            org.nodes.push(radarNode);
          }
          radarNode.nodes.push({id:'radar_'+r.key,text:safe(r.label),icon:r.status==='draft'?'fa fa-pencil':'fa fa-lock',workspaceSource:s.id,workspaceGroup:r.group});
        }
      }
      return {id:s.id,text:safe(s.label),expanded:true,icon:'fa fa-folder-open',workspaceSource:s.id,
        nodes:s.kind==='catalog'?orgs:s.radars.map(function(r){return {id:'radar_'+r.key,text:safe(r.label),icon:'fa fa-bullseye',workspaceSource:s.id,workspaceGroup:r.group};}).concat(s.unassignedCount?[{id:'asd_unassigned_info',text:safe(tr('asdUnassigned','Unassigned')+' ('+s.unassignedCount+')'),icon:'fa fa-info-circle',disabled:true}]:[])};
    });
  }
  function refresh() {
    // Status and label are projections of the adapter, never independent state.
    for (var source of sources) if(source.kind==='catalog') for(var radar of source.radars) {
      var revision=root.__radarCatalogAdapter?.getRevision?.(radar.group);
      if(!revision)continue;
      radar.status=revision.status;
      var index=source.radars.indexOf(radar);
      var sharedLabel=root.__radarRevisionDialogs?.label;
      if(sharedLabel){
        radar.label=sharedLabel(revision,index);
        continue;
      }
      // Compatibility for isolated legacy environments.
      var custom=root.__radarCatalogPersistence?.getRevisionLabel?.(revision.revisionId);
      var number=custom&&/^r[0-9]+(?:|$)/i.test(custom)?null:'r'+(index+1);
      var version=String(revision.version||'').replace(/(?:-draft-local)+$/g,''); // presentation only
      var language=String(root.i18next?.language||'fr').toLowerCase().startsWith('fr')?'fr':'en';
      var statuses=language==='fr'?{draft:'Brouillon',published:'Publiée',archived:'Archivée'}:{draft:'Draft',published:'Published',archived:'Archived'};
      radar.label=[number,custom&&custom!==number?custom:null,version||null,statuses[revision.status]||revision.status].filter(Boolean).join(' — ');
    }
    if(root.__radarApplicationProfile?.published){renderPublishedPanel();return;}
    if(!tree)return;
    // The previous selected node may have been deleted from the workspace.
    // Clear stale W2UI selection before rebuilding, rather than retaining
    // an id that no longer exists after tree.add().
    var oldSelection=tree.selected;
    var nextNodes=nodes();
    function exists(id,list) {
      for(var n of list) {if(n.id===id||exists(id,n.nodes||[]))return true;}
      return false;
    }
    if(oldSelection && !exists(oldSelection,nextNodes)) {
      if(typeof tree.unselect==='function')tree.unselect(oldSelection);
      // W2UI versions can retain selected even after unselecting a removed node.
      if(tree.selected===oldSelection)tree.selected=null;
    }
    tree.topHTML=workspaceCommands();
    tree.nodes=[]; tree.add(nextNodes);tree.refresh();
    updateWorkspaceLabels();
    if(active){ var selected=tree.get('radar_'+active.replace(/[^a-zA-Z0-9_-]/g,'_'));if(selected)tree.select(selected.id); }
  }
  function loadASD(groups) {
    root.__radarApplicationProfile?.require("workspace.loadLegacy");
    if(getSource('asd2019'))fail('ASD SSG 2019 already loaded; explicit reload is not automatic');
    if(!Array.isArray(groups)||!groups.length)fail('working groups are required');
    var distinct=new Set(),radars=[],unassignedCount=0;
    // The real historical API returns {text,count}, not {id,count}.
    // An empty text represents four unassigned source records, not a radar ID.
    // Validate every record before committing the source to the workspace.
    for(var g of groups) {
      var id=typeof g==='string'?g:(g && typeof g.text==='string'?g.text:g?.id);
      if(typeof id!=='string')fail('invalid ASD working group');
      if(!id.trim()) {
        if(typeof g!=='object'||!Number.isInteger(g.count)||g.count<0||unassignedCount!==0)
          fail('invalid or duplicate unassigned ASD group');
        unassignedCount=g.count;
        continue;
      }
      if(id!==id.trim()||distinct.has(id))fail('invalid or duplicate ASD working group');
      distinct.add(id);
      radars.push({key:id,group:id,label:id,status:'working'});
    }
    if(!radars.length)fail('no named ASD working groups');
    sources.push({id:'asd2019',kind:'asd',label:'ASD SSG 2019',radars:radars,unassignedCount:unassignedCount});
    refresh();return {loaded:radars.length,unassignedCount:unassignedCount};
  }
  function addCatalog(catalog,summary) {
    root.__radarApplicationProfile?.assertCatalog(catalog);
    if(!catalog||!Array.isArray(catalog.radarRevisions)||!summary||!Array.isArray(summary.revisions)||summary.revisions.length!==catalog.radarRevisions.length)fail('invalid catalog mapping');
    var id='catalog_'+(++serial);
    var orgs=new Map((catalog.organizations||[]).map(o=>[o.organizationId,o]));
    var portfolios=new Map((catalog.portfolios||[]).map(p=>[p.portfolioId,p]));
    var radars=summary.revisions.map(function(m,i){
      var r=catalog.radarRevisions[i],org=orgs.get(r.ownerOrganizationId);
      return {key:m.group.replace(/[^a-zA-Z0-9_-]/g,'_'),group:m.group,
        label:(r.title||r.radarId)+' — '+r.status+' '+(r.version||''),status:r.status,
        orgId:r.ownerOrganizationId,orgLabel:org?.name||org?.title||r.ownerOrganizationId,portfolioLabel:portfolios.get(r.portfolioId)?.name||r.portfolioId};
    });
    sources.push({id:id,kind:'catalog',label:catalog.title||catalog.name||'JSON catalog '+serial,radars:radars});
    refresh();return id;
  }
  function draftAdded(group) {
    root.__radarApplicationProfile?.require("revision.create");
    var revision=root.__radarCatalogAdapter?.getRevision?.(group);
    if(!revision)fail('draft not registered');
    var original=revision.extensions?.lineage?.basedOnRevisionId;
    var pair=null;
    for(var s of sources)if(s.kind==='catalog')for(var r of s.radars){
      if(root.__radarCatalogAdapter.getRevision(r.group)?.revisionId===original)pair={source:s,radar:r};
    }
    if(!pair)fail('draft parent not in workspace');
    pair.source.radars.push({key:group,group:group,label:(revision.title||revision.radarId)+' — working '+(revision.version||''),
      status:'draft',orgId:revision.ownerOrganizationId,orgLabel:pair.radar.orgLabel});
    refresh();
  }
  function activate(group) {
    var hit=find(group);
    if(!hit)fail('radar is not loaded in workspace');
    const changed=active!==group;
    hooks.select(group);
    active=group;
    root.__radarTitle?.refresh?.();
    if(root.__radarApplicationProfile?.published){
      renderPublishedPanel();
      if(changed){
        // Do not leave the previous radar's blip form or ISO detail visible.
        root.w2ui?.blipForm?.destroy?.();
        root.w2ui?.mainLayout?.html?.('right','');
        if(root.__radarStandardsPanel?.resetWorkspace)root.__radarStandardsPanel.resetWorkspace();
        else root.__radarStandardsPanel?.refresh?.();
      }
    }
    else if(tree){var selected=tree.get('radar_'+hit.radar.key);if(selected)tree.select(selected.id);}
    return {group:group};
  }
  // S19-R75-R5: exact navigation for currently loaded catalog objects only.
  // Never infer a version from a label, or silently choose between revisions.
  function navigateRelatedObject(ref) {
    if (!ref || !['radar','revision','organization'].includes(ref.type) ||
        typeof ref.id!=='string' || !ref.id.trim()) return {ok:false,reason:'invalid-reference'};
    const candidates=[];
    for (const source of sources) {
      if(source.kind!=='catalog')continue;
      for(const radar of source.radars) {
        const revision=root.__radarCatalogAdapter?.getRevision?.(radar.group);
        if(!revision)continue;
        const match=ref.type==='radar'?revision.radarId===ref.id:
          ref.type==='revision'?revision.revisionId===ref.id&&revision.radarId===ref.radarId:
          revision.ownerOrganizationId===ref.id;
        if(match)candidates.push({source,radar,revision});
      }
    }
    if(!candidates.length)return {ok:false,reason:'not-loaded'};
    const nodeMatches=(property,value)=>{
      const found=[];
      function scan(nodes){for(const n of nodes||[]){if(n[property]===value)found.push(n);scan(n.nodes);}}
      scan(tree?.nodes);return found;
    };
    const choose=()=>{
      if(ref.type==='revision')return candidates.length===1?candidates[0]:null;
      const activeCandidate=candidates.find(c=>c.radar.group===active);
      return activeCandidate || (candidates.length===1?candidates[0]:null);
    };
    const selected=choose();
    if(ref.type==='organization') {
      const orgNodes=nodeMatches('orgId',ref.id);
      if(orgNodes.length!==1)return {ok:false,reason:'ambiguous-organization'};
      if(selected)activate(selected.radar.group);
      tree?.select?.(orgNodes[0].id);
      return selected?{ok:true,group:selected.radar.group,selectedType:'organization',radarActivated:true}:
        {ok:false,reason:'organization-selected-radar-ambiguous',selectedType:'organization'};
    }
    if(!selected)return {ok:false,reason:'ambiguous-revision'};
    activate(selected.radar.group); // Existing selection hook refreshes the SVG radar.
    if(ref.type==='radar') {
      const radarNodes=nodeMatches('workspaceRadarId',ref.id);
      if(radarNodes.length!==1)return {ok:false,reason:'radar-activated-tree-ambiguous',group:selected.radar.group};
      tree?.select?.(radarNodes[0].id);
    }
    return {ok:true,group:selected.radar.group,selectedType:ref.type,radarActivated:true};
  }
  function showRemovalMenu(sourceId,group,mouse) {
    if(root.__radarApplicationProfile?.allows('workspace.remove')===false)return;
    // W2UI context menu. No DOM mutation when the user dismisses the menu.
    if(!root.w2menu?.show || !mouse) {
      if(root.w2confirm)root.w2confirm(tr('removeConfirm','Remove selected content from memory?')).yes(()=>remove(sourceId,group));
      return;
    }
    var anchor=mouse.target;
    root.w2menu.show({anchor:anchor,items:[{id:'remove',text:tr('removeWorkspace','Remove from workspace'),icon:'fa fa-trash'}]})
      .select(function(ev){if((ev.detail?.item?.id||ev.detail?.id)==='remove')confirmRemove(sourceId,group);});
  }
  function confirmRemove(sourceId,group) {
    function confirmed(){
      try{return remove(sourceId,group);}catch(error){
        if(error.code!=='PUBLICATION_SCOPE_CONFLICT')throw error;
        root.console?.error?.('Publication scope conflict:',error);
        root.w2alert(root.__radarRevisionDialogs.t('publicationScopeConflict'));
      }
    }
    if(root.w2confirm)root.w2confirm(tr('removeConfirm','Delete selected in-memory content?')).yes(confirmed);
    else confirmed();
  }
  function remove(sourceId,group) {
    root.__radarApplicationProfile?.require("workspace.remove");
    var s=getSource(sourceId);if(!s)fail('source does not exist');
    var targets=group?[entry(s,group)].filter(Boolean):s.radars.slice();
    if(!targets.length)fail('radar does not exist');
    // Safe fail-closed: the current exporter cannot serialize multiple catalogs or
    // a catalog with no remaining revisions. No partial mutation on that case.
    if(s.kind==='catalog'&&targets.length===s.radars.length)
      fail('removing an entire imported catalog requires the workspace exporter (next integration step)');
    if(s.kind==='catalog') {
      // A revision cannot be removed if another retained draft references it.
      var removedIds=new Set(targets.map(r=>root.__radarCatalogAdapter?.getRevision?.(r.group)?.revisionId));
      var dependent=s.radars.filter(r=>!targets.includes(r) &&
        removedIds.has(root.__radarCatalogAdapter?.getRevision?.(r.group)?.extensions?.lineage?.basedOnRevisionId));
      if(dependent.length)fail('dependent drafts exist; remove drafts first');
    }
    if(s.kind==='catalog'&&root.__radarCatalogPersistence?.status?.().importedCatalogs!==1)
      fail('catalog removal requires a single imported catalog');
    if(!root.__radarRevisionSession?.removeGroup)fail('session removal not installed');
    if(s.kind==='catalog'&&(!root.__radarCatalogPersistence?.removeGroup||!root.__radarCatalogUI?.unregister))
      fail('catalog removal hooks unavailable');
    if(s.kind==='catalog')root.__radarCatalogPersistence.assertCanRemoveGroups?.(targets.map(r=>r.group));
    // Each group is removed from model, persistence, catalog UI, and session.
    for(var r of targets) {
      if(s.kind==='catalog'){
        root.__radarCatalogPersistence.removeGroup(r.group);
        root.__radarCatalogUI.unregister(r.group);
        root.__radarCatalogAdapter.unregister(r.group);
      }
      root.__radarRevisionSession.removeGroup(hooks.graph(),r.group);
      s.radars=s.radars.filter(x=>x.group!==r.group);
      if(active===r.group)active=null;
    }
    if(!s.radars.length)sources=sources.filter(x=>x!==s);
    refresh();return {removed:targets.map(x=>x.group)};
  }
  function releaseCatalog(groups){
    root.__radarApplicationProfile?.require('catalog.open');
    var catalogs=sources.filter(x=>x.kind==='catalog');
    if(catalogs.length!==1||JSON.stringify(catalogs[0].radars.map(x=>x.group).sort())!==JSON.stringify(groups.slice().sort()))
      fail('catalog release mapping mismatch');
    sources=sources.filter(x=>x!==catalogs[0]);
    if(groups.includes(active))active=null;
    refresh();
  }
  root.__radarWorkspaceExplorer=Object.freeze({
    describeActive:function(){const hit=find(active);if(!hit)return null;return {organization:hit.radar.orgLabel||null,radar:hit.radar.label||null,group:active};},
    graph:function(){return hooks?.graph?.()||null;},releaseCatalog:releaseCatalog,initialize,loadASD,addCatalog,draftAdded,activate,navigateRelatedObject,remove,refresh,
    status:function(){return {activeGroup:active,sources:sources.map(s=>({id:s.id,kind:s.kind,groups:s.radars.map(r=>r.group),unassignedCount:s.unassignedCount||0}))};}});
})(window);
