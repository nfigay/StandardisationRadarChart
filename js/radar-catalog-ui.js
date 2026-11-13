/* Phase 10B: user-initiated JSON catalog loader integrated into existing W2UI group menu.
 * No repository writes, no automatic imports, no automatic group selection.
 */
(function (root) {
  'use strict';
  var registry = Object.create(null);
  var count = 0;
  var LIMIT_BYTES = 10 * 1024 * 1024;
  var has = function(obj,key) { return Object.prototype.hasOwnProperty.call(obj,key); };
  function error(message) { throw new Error('Catalog UI: ' + message); }
  function str(x) { return typeof x === 'string' && !!x.trim(); }
  function escapeHTML(x) { return String(x).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function prepare(catalog, state) {
    root.__radarApplicationProfile?.assertCatalog(catalog);
    if (!catalog || !Array.isArray(catalog.radarRevisions) || !catalog.radarRevisions.length) error('radarRevisions must be a nonempty array');
    if (!Array.isArray(catalog.organizations) || !Array.isArray(catalog.standards) || !Array.isArray(catalog.portfolios)) error('organizations, standards and portfolios arrays required');
    var orgs = new Set(catalog.organizations.map(function(o) { return o.organizationId; }));
    var standards = new Set(catalog.standards.map(function(s) { return s.standardId; }));
    var portfolios = new Set(catalog.portfolios.map(function(p) { return p.portfolioId; }));
    var assessments = new Set((catalog.assessments || []).map(function(a) { return a.assessmentId; }));
    var seen = new Set();
    var existing = new Set(state.registered.concat(state.initialised));
    var prepared = catalog.radarRevisions.map(function(revision, i) {
      if (!revision || revision.schemaVersion !== '1.0.0' || !str(revision.revisionId) || !str(revision.radarId) ||
          !str(revision.ownerOrganizationId) || !str(revision.portfolioId) || !Array.isArray(revision.blips) ||
          !['draft','published','archived'].includes(revision.status)) error('invalid revision metadata at index ' + i);
      if (!orgs.has(revision.ownerOrganizationId) || !portfolios.has(revision.portfolioId)) error('unresolved organization or portfolio at index ' + i);
      if (seen.has(revision.revisionId)) error('duplicate revisionId: ' + revision.revisionId);
      seen.add(revision.revisionId);
      var group = 'CATALOG_REVISION_' + (state.nextIndex + i);
      if (existing.has(group)) error('group already in use: ' + group);
      var ids = new Set();
      revision.blips.forEach(function(b) {
        if (!b || !str(b.blipId) || !str(b.standardId) || !str(b.label) || !str(b.ring) || !str(b.quadrant) ||
            !b.position || !Number.isFinite(b.position.x) || !Number.isFinite(b.position.y)) error('invalid blip in ' + revision.revisionId);
        if (!standards.has(b.standardId)) error('unresolved standardId in ' + revision.revisionId);
        if (b.assessmentId && !assessments.has(b.assessmentId)) error('unresolved assessmentId in ' + revision.revisionId);
        if (ids.has(b.blipId)) error('duplicate blipId: ' + b.blipId);
        ids.add(b.blipId);
      });
      return {
        group: group, menuId: 'catrev_' + (state.nextIndex + i), revision: JSON.parse(JSON.stringify(revision)),
        display: escapeHTML(revision.title || revision.radarId) + ' — ' + escapeHTML(revision.revisionId) + ' [' + escapeHTML(revision.status) + ']'
      };
    });
    return prepared;
  }
  function load(catalog, toolbar) {
    var adapter = root.__radarCatalogAdapter;
    var session = root.__radarRevisionSession;
    if (!adapter || !session || !toolbar || typeof toolbar.get !== 'function' || typeof toolbar.set !== 'function') error('app not ready');
    var item = toolbar.get('item2');
    if (!item || !Array.isArray(item.items)) error('existing W2UI workgroup menu unavailable');
    var presentIds = new Set(item.items.map(function(i) { return i.id; }));
    var candidates = prepare(catalog, {registered: adapter.status(), initialised: session.status().groups, nextIndex: count});
    candidates.forEach(function(c) {
      if (presentIds.has(c.menuId) || adapter.has(c.group) || has(registry, c.menuId)) error('menu id collision: ' + c.menuId);
    });
    // All predictable validation is performed before the first registration.
    candidates.forEach(function(c) { adapter.register(c.group, c.revision); });
    candidates.forEach(function(c) { registry[c.menuId] = c.group; });
    count += candidates.length;
    var extended = item.items.concat(candidates.map(function(c) {return { id:c.menuId, text:c.display };}));
    toolbar.set('item2', { items:extended });
    toolbar.refresh('item2');
    return { registered:candidates.length, total:count, revisions:candidates.map(function(c) { return {group:c.group, revisionId:c.revision.revisionId, menuId:c.menuId}; }) };
  }
  // Published and archived catalog revisions are read-only in the UI.
  function activeRevision() {
    var group = root.__radarRevisionSession?.status?.().activeGroup;
    return root.__radarCatalogAdapter?.getRevision?.(group) || null;
  }
  function isReadOnly() {
    if(root.__radarApplicationProfile?.viewer)return true;
    var r=activeRevision();
    return !!r && r.status !== 'draft';
  }
  function afterSelect(group, graph) {
    if(root.__radarApplicationProfile?.viewer){
      root.__radarApplicationProfile.assertRevision(
        root.__radarCatalogAdapter?.getRevision?.(group)
      );
      graph?.nodes().ungrabify();
      return;
    }
    var r=root.__radarCatalogAdapter?.getRevision?.(group);
    if (!r || !graph) return; // Historical groups retain their existing interaction policy.
    var mode=root.w2ui?.toolbar?.get('item4');
    if (r.status !== 'draft') {
      graph.nodes().ungrabify();
      if (mode) { root.w2ui.toolbar.set('item4',{selected:'locked'}); root.w2ui.toolbar.refresh('item4'); }
    } else {
      // A prior published revision leaves the toolbar in locked mode and nodes
      // ungrabbable. On entering a catalog draft, restore its editable mode.
      graph.nodes().grabify();
      if (mode) { root.w2ui.toolbar.set('item4',{selected:'grabon'}); root.w2ui.toolbar.refresh('item4'); }
    }
  }
  function createOrOpenDraft(toolbar, graph, selectGroup) {
    root.__radarApplicationProfile?.require("revision.create");
    var adapter=root.__radarCatalogAdapter, session=root.__radarRevisionSession;
    if (!adapter || !session || !toolbar || typeof selectGroup !== 'function') error('app not ready');
    var active=session.status().activeGroup, original=adapter.getRevision(active);
    if (!original) error('select an imported catalog revision');
    if (original.status === 'draft') return {action:'already-draft',group:active};
    if (root.__radarCatalogPersistence?.status?.().importedCatalogs !== 1)
      error('exactly one imported catalog required');
    var draftId=original.revisionId+':draft:local';
    // Open the imported/created draft rather than producing a second copy.
    var prior=Object.keys(registry).map(function(k){return registry[k];}).find(function(g){
      return adapter.getRevision(g)?.revisionId===draftId;
    });
    if (prior) {
      var priorEntry=Object.keys(registry).find(function(k){return registry[k]===prior;});
      if (priorEntry) {toolbar.set('item2',{selected:priorEntry});toolbar.refresh('item2');}
      selectGroup(prior);return {action:'opened',group:prior};
    }
    var draft=JSON.parse(JSON.stringify(original));
    draft.revisionId=draftId;
    draft.version=String(original.version || '1.0.0').replace(/(?:-draft-local)+$/g,'')+'-draft-local';
    draft.status='draft';
    draft.extensions=draft.extensions || {};
    draft.extensions.lineage={basedOnRevisionId:original.revisionId};
    var item=toolbar.get('item2');
    if (!item || !Array.isArray(item.items)) error('workgroup menu missing');
    var group='CATALOG_REVISION_'+count, menuId='catrev_'+count;
    if (adapter.has(group) || session.status().groups.includes(group) || has(registry,menuId) ||
        item.items.some(function(x){return x.id===menuId;})) error('new draft menu collision');
    // Validate the projected draft before registering it in both existing stores.
    // No other save/export pathway is introduced.
    adapter.register(group,draft);
    root.__radarCatalogPersistence.registerDraft(original.revisionId,group,draft);
    registry[menuId]=group;count+=1;
    toolbar.set('item2',{items:item.items.concat([{id:menuId,
      text:escapeHTML(draft.title || draft.radarId)+' — '+escapeHTML(draftId)+' [draft]'}])});
    toolbar.set('item2',{selected:menuId});
    toolbar.refresh('item2');
    selectGroup(group);
    root.__radarWorkspaceExplorer?.draftAdded?.(group);
    root.__radarWorkspaceExplorer?.activate?.(group);
    return {action:'created',group:group,revisionId:draftId};
  }
  // S13: explicit lifecycle transition. The UI cannot mark a revision published
  // without first capturing its current Cytoscape representation into imports[].
  function transitionActiveRevision(action, toolbar, graph) {
    root.__radarApplicationProfile?.require("revision.publish");
    var group=root.__radarRevisionSession?.status?.().activeGroup;
    var revision=root.__radarCatalogAdapter?.getRevision?.(group);
    if (!revision || !group) error('select a catalog revision first');
    if (!root.__radarCatalogPersistence?.ownsRevision(group,revision.revisionId))
      error('revision is not owned by the imported catalog');
    var result=root.__radarCatalogPersistence.transitionRevision(graph,group,revision.revisionId,action);
    var item=toolbar?.get('item2');
    var key=Object.keys(registry).find(function(k){return registry[k]===group;});
    if(item && key) {
      var entries=item.items.map(function(x){
        if(x.id!==key)return x;
        return Object.assign({},x,{text:escapeHTML(revision.title||revision.radarId)+' — '+
          escapeHTML(revision.revisionId)+' ['+result.status+']'});
      });
      toolbar.set('item2',{items:entries});toolbar.refresh('item2');
    }
    afterSelect(group,graph);
    root.__radarWorkspaceExplorer?.refresh?.(); // Re-read authoritative adapter status.
    return result;
  }
  // Phase 10G-C1: create the first working radar and its catalog in memory.
  // No file access and no published snapshot are implied by this action.
  function createNewCatalog(fields, toolbar, graph, selectGroup) {
    root.__radarApplicationProfile?.require("catalog.create");
    var persistence=root.__radarCatalogPersistence;
    var explorer=root.__radarWorkspaceExplorer;
    var adapter=root.__radarCatalogAdapter;
    var session=root.__radarRevisionSession;
    if (!persistence || !explorer || !adapter || !session ||
        !toolbar || typeof selectGroup!=='function' || !graph)
      error('application not ready');
    if(persistence.status().importedCatalogs!==0)
      error('save or close the existing catalog before creating another');
    if(explorer.status().sources.some(function(s){return s.kind==='asd';}))
      error('remove historical ASD workspace before creating a JSON catalog');
    var names=['catalogTitle','organizationName','portfolioName','radarTitle'];
    if(!fields || names.some(function(k){return !str(fields[k]) || fields[k].trim().length>120;}))
      error('catalog, organization, portfolio and radar names are required (max 120 characters)');
    // Browser-generated IDs are isolated from human display names and stable in exports.
    if(!root.crypto || typeof root.crypto.randomUUID!=='function')
      error('secure UUID generation unavailable');
    var key=root.crypto.randomUUID();
    var org='org_'+key, portfolio='portfolio_'+key, radar='radar_'+key, revision='revision_'+key;
    var catalog={
      schemaVersion:'1.0.0', title:fields.catalogTitle.trim(),
      organizations:[{organizationId:org,name:fields.organizationName.trim()}],
      portfolios:[{portfolioId:portfolio,ownerOrganizationId:org,name:fields.portfolioName.trim()}],
      standards:[],assessments:[],
      radarRevisions:[{schemaVersion:'1.0.0',revisionId:revision,radarId:radar,
        ownerOrganizationId:org,portfolioId:portfolio,status:'draft',
        version:'0.1.0',title:fields.radarTitle.trim(),blips:[]}]
    };
    // All schema and collision checks are completed before registration.
    prepare(catalog,{registered:adapter.status(),initialised:session.status().groups,nextIndex:count});
    var summary=load(catalog,toolbar);
    persistence.remember(catalog,summary);
    explorer.addCatalog(catalog,summary);
    toolbar.set('item2',{selected:summary.revisions[0].menuId});
    toolbar.refresh('item2');
    explorer.activate(summary.revisions[0].group);
    return {action:'created-catalog',group:summary.revisions[0].group,
      revisionId:revision,radarId:radar,catalogTitle:catalog.title};
  }
  // Explicit, visible selection of imported revisions. Selection still routes
  // through the existing workspace/session hooks; no automatic activation.
  function openRevisionPicker() {
    var groups=root.__radarCatalogAdapter?.status?.() || [];
    if(!groups.length)error('no imported revision available');
    if(!root.__radarWorkspaceExplorer?.activate)error('workspace selection unavailable');
    if(!root.__radarRevisionDialogs?.openPicker)error('revision w2ui dialog unavailable');
    return root.__radarRevisionDialogs.openPicker(groups,function(group){
      root.__radarWorkspaceExplorer.activate(group);
      var toolbar=root.w2ui?.toolbar,selected=toolbar?.get('item2');
      var item=selected?.items?.find(function(i){return registry[i.id]===group;});
      if(item){toolbar.set('item2',{selected:item.id});toolbar.refresh('item2');}
    },function(group){return root.__radarCatalogAdapter.getRevision(group);});
  }
  function openFile() {
    root.__radarApplicationProfile?.require("catalog.open");
    var picker = document.createElement('input');
    picker.type = 'file'; picker.accept = '.json,application/json'; picker.style.display = 'none';
    document.body.appendChild(picker);
    picker.addEventListener('change', async function() {
      var file = picker.files && picker.files[0];
      picker.remove();
      if (!file) return;
      try {
        if (file.size > LIMIT_BYTES) error('file exceeds 10 MB');
        var text = await file.text();
        var catalog = JSON.parse(text.replace(/^\uFEFF/, ''));
        // Fail closed before load() mutates adapter, toolbar or workspace.
        var integrity = root.__radarArtifactIntegrity;
        if (!integrity) error('artifact verification module unavailable');
        var verified = await integrity.inspect(catalog);
        var current = root.__radarCatalogPersistence?.status?.();
        if (current?.importedCatalogs || root.__radarWorkspaceExplorer?.status?.().sources?.length) {
          if (current?.catalogId && verified.manifest?.catalogId === current.catalogId) {
            if (current.importDigest && verified.digest === current.importDigest)
              error('this artifact was already imported; workspace was not changed');
            error('same catalogId with a different artifact; comparison/merge is not available, workspace unchanged');
          }
          error('a workspace is already open; close it before importing a different catalog');
        }
        var summary = load(verified.catalog, root.w2ui.toolbar);
        root.__radarCatalogPersistence.remember(verified.catalog, summary, verified.manifest, verified.digest);
        refreshRadarLabels();
        root.__radarWorkspaceExplorer?.addCatalog?.(verified.catalog, summary);
        openRevisionPicker();
      } catch (e) {
        console.error('Catalog load rejected:', e);
        root.w2alert('Catalog rejected: ' + e.message);
      }
    }, {once:true});
    picker.click();
  }
  function unregister(group) {
    root.__radarApplicationProfile?.require("workspace.remove");
    var key=Object.keys(registry).find(function(k){return registry[k]===group;});
    if(!key)error('unknown registered group '+group);
    delete registry[key];
    var toolbar=root.w2ui?.toolbar;
    var item=toolbar?.get('item2');
    if(item && Array.isArray(item.items)) {
      toolbar.set('item2',{items:item.items.filter(function(i){return i.id!==key;})});
      if(item.selected===key)toolbar.set('item2',{selected:null});
      toolbar.refresh('item2');
    }
    // count is a monotonic allocation cursor; never reuse existing menu identities.
  }
  function refreshRadarLabels(){
    var item=root.w2ui?.toolbar?.get?.('item2');
    if(!item||!Array.isArray(item.items))return;
    var changed=false;
    var next=item.items.map(function(entry){
      var group=registry[entry.id];
      if(!group)return entry;
      var revision=root.__radarCatalogAdapter?.getRevision?.(group);
      if(!revision)return entry;
      var title=root.__radarCatalogPersistence?.getRadarName?.(revision.radarId)||revision.title||revision.radarId;
      var label=root.__radarCatalogPersistence?.getRevisionLabel?.(revision.revisionId)||String(revision.version||'').replace(/(?:-draft-local)+$/g,'');
      var french=String(root.i18next?.language||'fr').toLowerCase().startsWith('fr');
      var status=(french?{draft:'Brouillon',published:'Publiée',archived:'Archivée'}:{draft:'Draft',published:'Published',archived:'Archived'})[revision.status]||revision.status;
      changed=true;
      return Object.assign({},entry,{text:escapeHTML(title)+' — '+escapeHTML(label)+' ['+escapeHTML(status)+']'});
    });
    if(changed){root.w2ui.toolbar.set('item2',{items:next});root.w2ui.toolbar.refresh('item2');}
  }
  root.__radarCatalogUI = Object.freeze({ refreshRadarLabels:refreshRadarLabels,openRevisionPicker:openRevisionPicker, unregister:unregister, prepare:prepare, load:load, openFile:openFile,
    isReadOnly:isReadOnly, afterSelect:afterSelect, createOrOpenDraft:createOrOpenDraft, transitionActiveRevision:transitionActiveRevision, createNewCatalog:createNewCatalog,
    resolve:function(id) { return has(registry,id) ? registry[id] : null; },
    status:function() { return { count:Object.keys(registry).length, entries:Object.keys(registry).map(function(k){return {menuId:k,group:registry[k]};}) }; }
  });
})(window);
