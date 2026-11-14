/* Phase 10C: explicit durable JSON export of a single imported catalog.
 * Does NOT modify native composite .ssr, auto-save, or auto-load any files.
 * Published revisions are never edited in place: changed graphs become draft revisions.
 */
(function (root) {
  'use strict';
  var imports = [];
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  function fail(s) { throw Error('Catalog persistence: ' + s); }
  function canonical(value) {
    return JSON.stringify(value, function(key, item) {
      if (item && typeof item === 'object' && !Array.isArray(item))
        return Object.fromEntries(Object.keys(item).sort().map(function(k) {
          return [k, item[k]];
        }));
      return item;
    });
  }
  function eq(a, b) { return canonical(a) === canonical(b); }
  function remember(catalog, summary, manifest, importDigest) {
    root.__radarApplicationProfile?.assertCatalog(catalog);
    if (!catalog || !summary || !Array.isArray(summary.revisions) ||
        summary.revisions.length !== catalog.radarRevisions.length) fail('invalid import mapping');
    var ids = new Set();
    summary.revisions.forEach(function (entry, i) {
      if (entry.revisionId !== catalog.radarRevisions[i].revisionId ||
          typeof entry.group !== 'string' || ids.has(entry.group)) fail('invalid revision mapping');
      ids.add(entry.group);
    });
    // Stable catalog identity is assigned once and retained across exports.
    // Older catalogs without a manifest receive a new identity upon first import.
    var sourceManifest = manifest ? clone(manifest) : {
      format:'StandardisationRadarChart',schemaVersion:'1.0.0',
      catalogId:'catalog_'+root.crypto.randomUUID(),
      artifactId:'artifact_'+root.crypto.randomUUID(),
      origin:{system:'StandardisationRadarChart',organizationId:catalog.organizations?.[0]?.organizationId||null},
      lineage:{parentArtifactId:null}
    };
    imports.push({source:clone(catalog),mapping:clone(summary.revisions),manifest:sourceManifest,
      importDigest:importDigest||null,savedCanonical:canonical(catalog)});
    return imports.length;
  }
  // Explicit draft creation is part of the same imported catalog, not a parallel store.
  function registerDraft(sourceRevisionId, group, draft) {
    root.__radarApplicationProfile?.require("revision.create");
    if (imports.length !== 1) fail('exactly one imported catalog is required to create a draft');
    var imported = imports[0];
    if (!imported.source.radarRevisions.some(function(r) {return r.revisionId === sourceRevisionId;}))
      fail('source revision not found in imported catalog');
    if (imported.source.radarRevisions.some(function(r) {return r.revisionId === draft.revisionId;}))
      fail('draft revision already present');
    if (imported.mapping.some(function(m) {return m.group === group;}))
      fail('draft group already registered');
    if (draft.status !== 'draft' || draft.extensions?.lineage?.basedOnRevisionId !== sourceRevisionId)
      fail('invalid draft lineage');
    imported.source.radarRevisions.push(clone(draft));
    imported.mapping.push({group:group,revisionId:draft.revisionId});
    return {group:group,revisionId:draft.revisionId};
  }
  // Lot 1: the existing imports[] remains the only source of catalog standards.
  function activeTarget(group, revisionId) {
    if (imports.length !== 1) fail('exactly one catalog required for creation');
    var imported = imports[0];
    var at = imported.mapping.findIndex(function(m) {
      return m.group === group && m.revisionId === revisionId;
    });
    if (at < 0) fail('active revision not in imported catalog');
    var revision = imported.source.radarRevisions[at];
    if (!revision || revision.revisionId !== revisionId || revision.status !== 'draft')
      fail('creation target must be a matching draft');
    return {imported:imported,revision:revision,at:at};
  }
  function ownsRevision(group, revisionId) {
    if (imports.length !== 1) return false;
    return imports[0].mapping.some(function(m) {
      return m.group === group && m.revisionId === revisionId;
    });
  }
  // Lot 2: scoped read-only catalog standards. Never expose private imports[].
  function listStandardsForDraft(group, revisionId) {
    var target=activeTarget(group,revisionId);
    return clone(target.imported.source.standards).map(function(s) {
      return {standardId:s.standardId,name:s.name};
    }).sort(function(a,b){return a.name.localeCompare(b.name);});
  }
  // Reference registry reads the same imported standards[]; no parallel storage.
  function listReferenceRecords() {
    if(imports.length!==1) fail('exactly one imported catalog required');
    return clone(imports[0].source.standards).map(function(s){
      var r=s.extensions?.referenceDeclaration||{};
      return {standardId:s.standardId,name:s.name,issuer:r.issuer||null,
        designation:r.designation||null,editionDesignation:r.editionDesignation||null,
        sourceName:r.sourceName||null,sourceUrl:r.sourceUrl||null,
        verification:r.verification||'unknown',origin:r.origin||'legacy',
        ...(s.extensions?.isoDocument?{isoDocument:clone(s.extensions.isoDocument)}:{})};
    });
  }
  // A8.2 lot 2: explicit, portable snapshot of an installed ISO deliverable.
  // No source payload supplied by the caller; only the installed generation is trusted.
  function isoText(value){
    return typeof value==='string'?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):'';
  }
  function isoTexts(value){
    return Array.isArray(value)?Array.from(new Set(value.map(isoText).filter(Boolean))):[];
  }
  function isoLanguages(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    return Object.fromEntries(Object.entries(value).filter(([key,val])=>/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{2,8})*$/.test(key)&&typeof val==='string'&&val.trim()).map(([key,val])=>[key,val.trim()]));
  }
  function isoDesignation(value){return isoText(value).normalize('NFKC').replace(/\s+/g,' ').toUpperCase();}
  function isoSnapshot(item,id,release){
    var reference=isoText(item.reference);
    if(!reference)fail('ISO deliverable has no reference');
    var titles=isoLanguages(item.titleI18n),scopes=isoLanguages(item.scopeI18n);
    return {
      schemaVersion:1,source:'ISO Open Data',release:release,id:id,reference:reference,
      title:titles.fr||titles.en||isoText(item.title)||reference,
      titleI18n:titles,scopeI18n:scopes,scope:isoText(item.scope),
      icsCodes:isoTexts(item.icsCodes),ownerCommittee:isoText(item.ownerCommittee),
      currentStage:isoText(item.currentStage),edition:isoText(item.edition),
      publicationDate:isoText(item.publicationDate),deliverableType:isoText(item.deliverableType),
      supplementType:isoText(item.supplementType),languages:isoTexts(item.languages),
      pages:isoText(item.pages),replaces:isoTexts(item.replaces),replacedBy:isoTexts(item.replacedBy)
    };
  }
  async function importIsoReference(id){
    if(root.__radarApplicationProfile?.viewer)fail('Viewer cannot import ISO references');
    root.__radarApplicationProfile?.require('catalog.declareReference');
    if(imports.length!==1)fail('exactly one imported catalog required');
    if(typeof id!=='string'||!/^[a-zA-Z0-9._-]{1,160}$/.test(id))fail('invalid ISO deliverable identifier');
    var owner=imports[0],provider=root.__radarIsoWindowed;
    if(!provider?.current||!provider?.get)fail('installed ISO catalogue required');
    var active=await provider.current();
    var release=isoText(active?.summary?.release);
    if(!active?.generation||!release||!active.summary?.datasets?.deliverables)
      fail('installed ISO catalogue required');
    var item=await provider.get({type:'deliverables',id:id});
    var after=await provider.current();
    if(imports.length!==1||imports[0]!==owner)fail('workspace changed during ISO selection');
    if(after?.generation!==active.generation||after?.summary?.release!==active.summary.release)
      fail('ISO catalogue changed during selection; retry');
    if(!item||String(item.id)!==id||item.generation!==active.generation||item.type!=='deliverables')
      fail('ISO deliverable not found in active generation');
    var document=isoSnapshot(item,id,release),standards=owner.source.standards;
    if(!Array.isArray(standards))fail('missing standards array');
    var matches=standards.filter(s=>s.extensions?.isoDocument?.source==='ISO Open Data'&&s.extensions.isoDocument.id===id);
    if(matches.length>1)fail('ambiguous ISO identity in catalog');
    if(matches.length===1){
      // Never refresh a stored snapshot implicitly: published references may use it.
      return {action:'existing',standardId:matches[0].standardId,reference:matches[0].extensions.isoDocument.reference};
    }
    var key=isoDesignation(document.reference),standardId='iso-deliverable:'+id;
    if(standards.some(s=>s.standardId===standardId))fail('ISO standardId collision');
    // Exact designation collisions require explicit reconciliation, not silent promotion
    // of a manual declaration to an ISO-verified record.
    if(standards.some(s=>[s.extensions?.referenceDeclaration?.designation,s.extensions?.isoDocument?.reference,s.name].some(value=>isoDesignation(value)===key)))
      fail('same designation already exists; reconcile the existing reference before importing');
    var standard={standardId:standardId,name:document.reference,extensions:{
      referenceDeclaration:{issuer:'ISO',designation:document.reference,editionDesignation:document.edition||null,
        sourceName:'ISO Open Data',origin:'iso-open-data',verification:'source-verified'},
      isoDocument:document
    }};
    owner.source.standards=standards.concat([standard]);
    return {action:'imported',standardId:standardId,reference:document.reference};
  }
  // A locally declared record is NOT a verified SDO publication.
  // No revision/blip is created or modified by this operation.
  function declareLocalReference(standard) {
    root.__radarApplicationProfile?.require("catalog.declareReference");
    if(imports.length!==1) fail('exactly one imported catalog required');
    var source=imports[0].source;
    if(!Array.isArray(source.standards)) fail('missing standards array');
    var r=standard?.extensions?.referenceDeclaration;
    if(!standard || typeof standard.standardId!=='string' || !standard.standardId.trim() ||
       typeof standard.name!=='string' || !standard.name.trim() ||
       !r || typeof r.issuer!=='string' || !r.issuer.trim() ||
       typeof r.designation!=='string' || !r.designation.trim() ||
       r.origin!=='manual' || r.verification!=='unverified')
      fail('invalid unverified local reference');
    if(source.standards.some(function(s){return s.standardId===standard.standardId;}))
      fail('duplicate standardId');
    var record=clone({standardId:standard.standardId,name:standard.name,
      extensions:{referenceDeclaration:r}});
    source.standards=source.standards.concat([record]);
    return {standardId:record.standardId,declared:true,verification:'unverified'};
  }
  function validateCreation(request) {
    root.__radarApplicationProfile?.require("radar.createBlip");
    if (!request || !request.blip) fail('invalid creation request');
    var target = activeTarget(request.group,request.revisionId);
    var source = target.imported.source, revision = target.revision;
    if (!Array.isArray(source.standards) || !Array.isArray(revision.blips))
      fail('catalog lacks standards or revision blips');
    var b = request.blip, s = request.standard;
    if (typeof b.blipId !== 'string' || !b.blipId.trim() ||
        typeof b.standardId !== 'string' || !b.standardId.trim()) fail('invalid blip identity');
    if (revision.blips.some(function(x){return x.blipId === b.blipId;}))
      fail('duplicate blipId in active draft');
    if (source.radarRevisions.some(function(r){return r.blips.some(function(x){return x.blipId === b.blipId;});}))
      fail('blipId already exists in catalog');
    if (s !== null && s !== undefined) {
      if (typeof s.standardId !== 'string' || !s.standardId.trim() ||
          typeof s.name !== 'string' || !s.name.trim()) fail('invalid standard');
      if (s.standardId !== b.standardId) fail('standard/blip identity mismatch');
      if (source.standards.some(function(x){return x.standardId === s.standardId;}))
        fail('duplicate standardId');
    } else if (!source.standards.some(function(x){return x.standardId === b.standardId;}))
      fail('standardId not found in catalog');
    if (b.assessmentId && !(source.assessments || []).some(function(x){return x.assessmentId === b.assessmentId;}))
      fail('assessmentId not found in catalog');
    if (typeof b.label !== 'string' || !b.label.trim() ||
        typeof b.ring !== 'string' || !b.ring.trim() ||
        typeof b.quadrant !== 'string' || !b.quadrant.trim() ||
        !b.position || !Number.isFinite(b.position.x) || !Number.isFinite(b.position.y))
      fail('invalid blip visual/position');
    return target;
  }
  function commitCreation(request) {
    root.__radarApplicationProfile?.require("radar.createBlip");
    // Prepare clones first; publish neither array until every validation succeeded.
    var target = validateCreation(request);
    var source = target.imported.source;
    var nextStandards = request.standard == null ? null :
      source.standards.concat([clone(request.standard)]);
    var nextBlips = target.revision.blips.concat([clone(request.blip)]);
    if (nextStandards !== null) source.standards = nextStandards;
    target.revision.blips = nextBlips;
    return {blipId:request.blip.blipId,revisionId:request.revisionId};
  }
  // S13: publish the active draft from its live graph snapshot (no layout, no graph edits).
  // Only the already-owned imports[] catalog is authoritative for an export.
  function transitionRevision(graph, group, revisionId, action) {
    root.__radarApplicationProfile?.require("revision.publish");
    if (action !== 'publish' && action !== 'archive') fail('unsupported revision transition');
    if (imports.length !== 1) fail('exactly one catalog required');
    var imported = imports[0];
    var at = imported.mapping.findIndex(function(m) { return m.group === group && m.revisionId === revisionId; });
    if (at < 0) fail('revision not in catalog');
    var source = imported.source.radarRevisions[at];
    if (source.revisionId !== revisionId) fail('revision mapping mismatch');
    var required = action === 'publish' ? 'draft' : 'published';
    if (source.status !== required) fail(action + ' requires ' + required + ' revision');
    if (root.__radarRevisionSession?.status?.().activeGroup !== group)
      fail('select the revision before changing its lifecycle status');
    var adapter = root.__radarCatalogAdapter;
    if (!adapter || adapter.getRevision(group)?.status !== required ||
        typeof adapter.replaceRevision !== 'function') fail('adapter revision mismatch');
    // Resolve ALL conversion/validation errors before a single write.
    var next = clone(source);
    if (action === 'publish') {
      var snapshot = root.__radarRevisionSession.exportGroup(graph, group);
      next.blips = toBlips(source, snapshot, group);
    } else {
      // Do not allow an altered published snapshot to be archived.
      if (!eq(toBlips(source, root.__radarRevisionSession.exportGroup(graph, group), group), source.blips))
        fail('published snapshot differs from immutable revision');
    }
    next.status = action === 'publish' ? 'published' : 'archived';
    // Adapter replacement is validated first and reversible if a later error occurs.
    adapter.replaceRevision(group, next, required);
    imported.source.radarRevisions[at] = next;
    return {group:group,revisionId:revisionId,previousStatus:required,status:next.status,
      blips:next.blips.length};
  }
  function removeGroup(group) {
    root.__radarApplicationProfile?.require("workspace.remove");
    if(imports.length!==1)fail('exactly one imported catalog required');
    var imported=imports[0];
    var at=imported.mapping.findIndex(function(m){return m.group===group;});
    if(at<0)fail('unknown catalog revision group: '+group);
    if(imported.mapping.length===1)fail('cannot export empty catalog');
    // Keep index mapping and revision arrays aligned; build() depends on this.
    imported.mapping.splice(at,1);
    imported.source.radarRevisions.splice(at,1);
    return {group:group,remaining:imported.mapping.length};
  }
  function toBlips(original, snapshot, group) {
    if (!snapshot || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges))
      fail('invalid session snapshot for ' + group);
    if (snapshot.edges.length) fail('edges cannot be represented by catalog blips: ' + group);
    var originals = new Map(original.blips.map(function (b) { return [b.blipId, b]; }));
    var ids = new Set();
    return snapshot.nodes.map(function (node) {
      var d = node.data || {}, r = d.radarchart || {}, id = d.id;
      if (!id || ids.has(id) || d.working_group !== group || d.type !== 'business-object')
        fail('unsupported node identity/type/group in ' + group);
      ids.add(id);
      if (r.blipId !== id || r.revisionId !== original.revisionId ||
          r.radarId !== original.radarId || r.ownerOrganizationId !== original.ownerOrganizationId ||
          r.portfolioId !== original.portfolioId || !r.standardId)
        fail('missing/inconsistent catalog references for node ' + id);
      if (!Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y))
        fail('missing position for ' + id);
      if (typeof d.label !== 'string' || !d.label.trim() ||
          typeof d.ring !== 'string' || !d.ring.trim() ||
          typeof d.quadrant !== 'string' || !d.quadrant.trim()) fail('invalid visual metadata for ' + id);
      var accepted = new Set(['id','label','ring','quadrant','working_group','type','radarchart']);
      if (Object.keys(d).some(function (key) { return !accepted.has(key); }))
        fail('unmapped Cytoscape data properties for ' + id);
      var b = originals.has(id) ? clone(originals.get(id)) : {
        blipId:id, standardId:r.standardId, assessmentId:r.assessmentId || null,
        context:clone(r.context || {}), extensions:clone(r.extensions || {})
      };
      b.blipId=id; b.standardId=r.standardId;
      if (own(b,'assessmentId') || r.assessmentId) b.assessmentId=r.assessmentId || null;
      b.label=d.label; b.ring=d.ring; b.quadrant=d.quadrant;
      b.position={x:node.position.x,y:node.position.y};
      // Cytoscape supplies empty defaults for optional native metadata.
      // Do not turn absent (or null) metadata into a business change.
      ['context','extensions'].forEach(function(key) {
        var value=clone(r[key] || {});
        if (!originals.has(id) || Object.keys(value).length ||
            (own(b,key) && b[key] !== null)) b[key]=value;
      });
      return b;
    });
  }
  function build(graph) {
    root.__radarApplicationProfile?.require("catalog.export");
    if (imports.length !== 1) fail(imports.length ?
      'multiple catalogs loaded; export separately is not yet supported' : 'no catalog loaded');
    if (!root.__radarRevisionSession || typeof root.__radarRevisionSession.exportGroup !== 'function')
      fail('session snapshot export unavailable');
    var imported=imports[0], result=clone(imported.source), additions=[];
    var revisions=new Set(result.radarRevisions.map(function (r) {return r.revisionId;}));
    imported.mapping.forEach(function (m, i) {
      var original=imported.source.radarRevisions[i];
      var snapshot=root.__radarRevisionSession.exportGroup(graph,m.group);
      if (snapshot===null) return; // Never selected: retain original revision exactly.
      var blips=toBlips(original,snapshot,m.group);
      if (eq(blips, original.blips)) return;
      if (original.status === 'draft') {
        result.radarRevisions[i].blips=blips;
      } else {
        // Published/archived revisions remain immutable; export a new draft lineage.
        var derived=clone(original);
        derived.revisionId=original.revisionId + ':draft:local';
        if (revisions.has(derived.revisionId)) fail('draft revisionId collision: '+derived.revisionId);
        revisions.add(derived.revisionId);
        derived.extensions=clone(derived.extensions || {});
        derived.extensions.lineage={basedOnRevisionId:original.revisionId};
        derived.version=String(original.version||'1.0.0').replace(/(?:-draft-local)+$/g,'')+'-draft-local';
        derived.status='draft'; derived.blips=blips;
        additions.push(derived);
      }
    });
    result.radarRevisions.push.apply(result.radarRevisions,additions);
    return result;
  }
  // A8.2: compare portable business state, not selection/viewport state.
  function isDirty(graph){
    if(root.__radarApplicationProfile?.viewer || !imports.length)return false;
    if(imports.length!==1 || imports[0].savedCanonical===null)return true;
    try{return canonical(build(graph))!==imports[0].savedCanonical;}
    catch(_){return true;}
  }
  function markNew(){
    root.__radarApplicationProfile?.require('catalog.create');
    if(imports.length!==1)fail('exactly one catalog required');
    imports[0].savedCanonical=null;
  }
  function closeCatalog(){
    root.__radarApplicationProfile?.require('catalog.open');
    if(imports.length!==1)fail('exactly one catalog required');
    imports.length=0;
  }
  async function buildArtifact(graph) {
    if(imports.length!==1)fail('exactly one catalog required');
    var integrity=root.__radarArtifactIntegrity;
    if(!integrity)fail('artifact integrity module missing');
    return integrity.wrap(build(graph),imports[0].manifest);
  }
  async function download(graph) {
    var owner=imports[0];
    var data=await buildArtifact(graph), json=JSON.stringify(data,null,2)+'\n';
    var blob=new Blob([json],{type:'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    try {
      var a=document.createElement('a'); a.href=url; a.download='radar-catalog-edited.json';
      document.body.appendChild(a); a.click(); a.remove();
    } finally { setTimeout(function(){URL.revokeObjectURL(url);},1000); }
    // Download dispatched, not a filesystem receipt. Compare the exact exported
    // snapshot: concurrent changes remain dirty.
    if(imports[0]===owner)owner.savedCanonical=canonical(data.artifact.data);
    return {revisions:data.artifact.data.radarRevisions.length,bytes:blob.size,digest:data.proof.digest};
  }
  /* S14-K-R3 administrative metadata */
  function sourceFor(kind,id){
    if(imports.length!==1)fail('exactly one catalog required');
    var record=imports[0].source;
    if(!record.radarRevisions.some(function(r){return (kind==='radar'?r.radarId:r.revisionId)===id;}))fail('unknown '+kind+' identity');
    return record;
  }
  function metadata(record){
    if(!record.extensions||typeof record.extensions!=='object'||Array.isArray(record.extensions))record.extensions={};
    if(!record.extensions.administration)record.extensions.administration={};
    return record.extensions.administration;
  }
  function getDisplay(kind,id){
    if(imports.length!==1)return null;
    var c=imports[0].source, admin=c.extensions?.administration;
    return (kind==='radar'?admin?.radarNames:admin?.revisionLabels)?.[id]||null;
  }
  function rename(kind,id,value){
    root.__radarApplicationProfile?.require("radar.rename");
    if(typeof value!=='string'||!value.trim()||value.trim().length>120)fail('invalid display name');
    var c=sourceFor(kind,id);
    var key=kind==='radar'?'radarNames':'revisionLabels';
    var index=c.radarRevisions.findIndex(function(r){
      return (kind==='radar'?r.radarId:r.revisionId)===id;
    });
    var revision=c.radarRevisions[index];
    var current=getDisplay(kind,id);
    var old=current||(kind==='revision'?'r'+(index+1):revision.title)||null;
    var next=value.trim();
    if(old===next)return {id,name:old,changed:false};

    if(kind==='revision'){
      var duplicate=c.radarRevisions.some(function(r,i){
        if(r.revisionId===id||r.radarId!==revision.radarId)return false;
        var name=getDisplay('revision',r.revisionId)||'r'+(i+1);
        return name.toLowerCase()===next.toLowerCase();
      });
      if(duplicate)fail('revision label already used in this radar: '+next);
    }

    var admin=metadata(c);
    admin[key]=admin[key]||{};
    admin[key][id]=value.trim();
    admin.nameHistory=admin.nameHistory||[];
    admin.nameHistory.push({kind:kind,id:id,previous:old,current:value.trim(),changedAt:new Date().toISOString()});
    return {id:id,name:value.trim(),changed:true};
  }
  function renameRadar(id,value){return rename('radar',id,value);}
  function renameRevisionLabel(id,value){return rename('revision',id,value);}
  function getRadarName(id){return getDisplay('radar',id);}
  function getRevisionLabel(id){return getDisplay('revision',id);}
  root.__radarCatalogPersistence=Object.freeze({
    isDirty:isDirty,markNew:markNew,closeCatalog:closeCatalog,importIsoReference:importIsoReference,renameRadar:renameRadar,renameRevisionLabel:renameRevisionLabel,getRadarName:getRadarName,getRevisionLabel:getRevisionLabel,remember:remember,build:build,buildArtifact:buildArtifact,download:download,
    registerDraft:registerDraft,removeGroup:removeGroup, ownsRevision:ownsRevision, transitionRevision:transitionRevision,
    validateCreation:validateCreation,commitCreation:commitCreation,
    listStandardsForDraft:listStandardsForDraft, listReferenceRecords:listReferenceRecords, declareLocalReference:declareLocalReference, status:function(){return {importedCatalogs:imports.length,
    catalogId:imports.length===1?imports[0].manifest.catalogId:null,
    importDigest:imports.length===1?imports[0].importDigest:null};}});
})(window);
