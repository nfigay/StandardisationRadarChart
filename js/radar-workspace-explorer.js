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
  var serial=0;
  var hooks=null;
  var owns=Object.prototype.hasOwnProperty;
  function fail(s) { throw Error('Workspace explorer: '+s); }
  function tr(key, fallback) { var v=root.i18next?.t?.('menu.'+key); return !v || v==='menu.'+key ? fallback : v; }
  function safe(v) { return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function entry(source,group) {return source.radars.find(r=>r.group===group)||null;}
  function getSource(id) { return sources.find(s=>s.id===id)||null; }
  function find(group) { for(var s of sources) { var r=entry(s,group); if(r)return {source:s,radar:r}; } return null; }
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
    tree=new root.w2sidebar({box:mount,name:'radarWorkspaceTree',nodes:[],onClick:function(e){
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
    refresh();return tree;
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
      var custom=root.__radarCatalogPersistence?.getRevisionLabel?.(revision.revisionId);
      var number=custom&&/^r[0-9]+(?:|$)/i.test(custom)?null:'r'+(index+1);
      var version=String(revision.version||'').replace(/(?:-draft-local)+$/g,''); // presentation only
      var language=String(root.i18next?.language||'fr').toLowerCase().startsWith('fr')?'fr':'en';
      var statuses=language==='fr'?{draft:'Brouillon',published:'Publiée',archived:'Archivée'}:{draft:'Draft',published:'Published',archived:'Archived'};
      radar.label=[number,custom&&custom!==number?custom:null,version||null,statuses[revision.status]||revision.status].filter(Boolean).join(' — ');
    }
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
    tree.nodes=[]; tree.add(nextNodes);tree.refresh();
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
    var radars=summary.revisions.map(function(m,i){
      var r=catalog.radarRevisions[i],org=orgs.get(r.ownerOrganizationId);
      return {key:m.group.replace(/[^a-zA-Z0-9_-]/g,'_'),group:m.group,
        label:(r.title||r.radarId)+' — '+r.status+' '+(r.version||''),status:r.status,
        orgId:r.ownerOrganizationId,orgLabel:org?.name||org?.title||r.ownerOrganizationId};
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
    hooks.select(group);
    active=group;
    if(tree){var selected=tree.get('radar_'+hit.radar.key);if(selected)tree.select(selected.id);}
    return {group:group};
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
    if(root.w2confirm)root.w2confirm(tr('removeConfirm','Delete selected in-memory content?')).yes(()=>remove(sourceId,group));
    else remove(sourceId,group);
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
  root.__radarWorkspaceExplorer=Object.freeze({initialize,loadASD,addCatalog,draftAdded,activate,remove,refresh,
    status:function(){return {activeGroup:active,sources:sources.map(s=>({id:s.id,kind:s.kind,groups:s.radars.map(r=>r.group),unassignedCount:s.unassignedCount||0}))};}});
})(window);
