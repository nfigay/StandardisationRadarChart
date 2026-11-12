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
  function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function remember(catalog, summary, manifest, importDigest) {
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
    imports.push({source: clone(catalog), mapping: clone(summary.revisions), manifest:sourceManifest, importDigest:importDigest||null});
    return imports.length;
  }
  // Explicit draft creation is part of the same imported catalog, not a parallel store.
  function registerDraft(sourceRevisionId, group, draft) {
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
        verification:r.verification||'unknown',origin:r.origin||'legacy'};
    });
  }
  // A locally declared record is NOT a verified SDO publication.
  // No revision/blip is created or modified by this operation.
  function declareLocalReference(standard) {
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
      b.context=clone(r.context || {}); b.extensions=clone(r.extensions || {});
      return b;
    });
  }
  function build(graph) {
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
  async function buildArtifact(graph) {
    if(imports.length!==1)fail('exactly one catalog required');
    var integrity=root.__radarArtifactIntegrity;
    if(!integrity)fail('artifact integrity module missing');
    return integrity.wrap(build(graph),imports[0].manifest);
  }
  async function download(graph) {
    var data=await buildArtifact(graph), json=JSON.stringify(data,null,2)+'\n';
    var blob=new Blob([json],{type:'application/json;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    try {
      var a=document.createElement('a'); a.href=url; a.download='radar-catalog-edited.json';
      document.body.appendChild(a); a.click(); a.remove();
    } finally { setTimeout(function(){URL.revokeObjectURL(url);},1000); }
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
    if(typeof value!=='string'||!value.trim()||value.trim().length>120)fail('invalid display name');
    var c=sourceFor(kind,id),admin=metadata(c),key=kind==='radar'?'radarNames':'revisionLabels';
    admin[key]=admin[key]||{};
    var old=admin[key][id]||c.radarRevisions.find(function(r){return (kind==='radar'?r.radarId:r.revisionId)===id;})?.title||null;
    if(old===value.trim())return {id,name:old,changed:false};
    admin[key][id]=value.trim();
    admin.nameHistory=admin.nameHistory||[];
    admin.nameHistory.push({kind:kind,id:id,previous:old,current:value.trim(),changedAt:new Date().toISOString()});
    return {id:id,name:value.trim(),changed:true};
  }
  function renameRadar(id,value){return rename('radar',id,value);}
  function renameRevisionLabel(id,value){return rename('revision',id,value);}
  function getRadarName(id){return getDisplay('radar',id);}
  function getRevisionLabel(id){return getDisplay('revision',id);}
  root.__radarCatalogPersistence=Object.freeze({renameRadar:renameRadar,renameRevisionLabel:renameRevisionLabel,getRadarName:getRadarName,getRevisionLabel:getRevisionLabel,remember:remember,build:build,buildArtifact:buildArtifact,download:download,
    registerDraft:registerDraft,removeGroup:removeGroup, ownsRevision:ownsRevision, transitionRevision:transitionRevision,
    validateCreation:validateCreation,commitCreation:commitCreation,
    listStandardsForDraft:listStandardsForDraft, listReferenceRecords:listReferenceRecords, declareLocalReference:declareLocalReference, status:function(){return {importedCatalogs:imports.length,
    catalogId:imports.length===1?imports[0].manifest.catalogId:null,
    importDigest:imports.length===1?imports[0].importDigest:null};}});
})(window);
