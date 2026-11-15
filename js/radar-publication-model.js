/* S14.3-A8.3 — native publication definitions and release records.
 * Pure validation/resolution: no DOM, graph, storage, or network dependencies.
 * Synchronous classic entry to share the native workspace on file:// and HTTP.
 */
(function(root){
  'use strict';
  const VERSION=1;
  const MODES=Object.freeze(['standalone','bundled','modules']);
  // Only the capabilities already available to the common Viewer. Further
  // capabilities require an explicit contract extension, not a permissive flag.
  const CAPABILITIES=Object.freeze(['catalog.open','radar.navigate','radar.consult']);
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const clone=x=>JSON.parse(JSON.stringify(x));
  function fail(message){throw Error('Publication model: '+message);}
  function object(x,label,keys){
    if(!x||typeof x!=='object'||Array.isArray(x)||Object.keys(x).length!==keys.length||keys.some(k=>!own(x,k)))fail('invalid '+label+' fields');
    return x;
  }
  function text(x,label,max=200,empty=false){
    if(typeof x!=='string'||x.length>max||x!==x.trim()||(!empty&&!x))fail('invalid '+label);
    return x;
  }
  function integer(x,label){if(!Number.isSafeInteger(x)||x<1)fail('invalid '+label);return x;}
  function timestamp(x,label){
    if(typeof x!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)||!Number.isFinite(Date.parse(x))||new Date(x).toISOString()!==x)fail('invalid '+label);
  }
  function array(x,label,limit=10000){if(!Array.isArray(x)||x.length>limit)fail('invalid '+label);return x;}
  function strings(x,label,allowed){
    const seen=new Set();
    for(const value of array(x,label)){
      text(value,label,300);
      if(seen.has(value)||(allowed&&!allowed.includes(value)))fail('invalid or duplicate '+label+': '+value);
      seen.add(value);
    }
    return x;
  }
  function digest(x,label){if(typeof x!=='string'||!(/^[a-f0-9]{64}$/).test(x))fail('invalid '+label);}
  function choice(x,label,values){if(!values.includes(x))fail('invalid '+label);}
  function bool(x,label){if(typeof x!=='boolean')fail('invalid '+label);}
  function configuration(x){
    object(x,'configuration',['name','description','audience','scope','capabilities','presentation','packaging','dataPolicy']);
    text(x.name,'name',120);text(x.description,'description',4000,true);
    object(x.audience,'audience',['label','organizationIds']);
    text(x.audience.label,'audience label',200);strings(x.audience.organizationIds,'audience organizationIds');
    object(x.scope,'scope',['selection','revisionIds','radarIds','organizationIds','portfolioIds']);
    choice(x.scope.selection,'selection',['explicit','allPublishedForRadars']);
    for(const key of ['revisionIds','radarIds','organizationIds','portfolioIds'])strings(x.scope[key],key);
    if(x.scope.selection==='explicit'&&(!x.scope.revisionIds.length||x.scope.radarIds.length))fail('explicit scope requires revisionIds only');
    if(x.scope.selection==='allPublishedForRadars'&&(!x.scope.radarIds.length||x.scope.revisionIds.length))fail('radar scope requires radarIds only');
    strings(x.capabilities,'capabilities',CAPABILITIES);
    if(CAPABILITIES.some(c=>!x.capabilities.includes(c)))fail('common Viewer baseline capabilities required');
    object(x.presentation,'presentation',['title','language','references']);
    text(x.presentation.title,'presentation title',200);choice(x.presentation.language,'language',['fr','en']);bool(x.presentation.references,'references');
    object(x.packaging,'packaging',['modes','data']);
    strings(x.packaging.modes,'modes',MODES);if(!x.packaging.modes.length)fail('at least one distribution mode required');
    choice(x.packaging.data,'data packaging',['embedded','external']);
    object(x.dataPolicy,'dataPolicy',['isoDocument','assessments','extensions']);
    bool(x.dataPolicy.isoDocument,'isoDocument');bool(x.dataPolicy.assessments,'assessments');
    // Unknown/private extensions must never be implicitly distributed.
    choice(x.dataPolicy.extensions,'extensions policy',['allowlist']);
    return clone(x);
  }
  function definition(x){
    object(x,'definition',['definitionId','version','status','createdAt','updatedAt','configuration']);
    text(x.definitionId,'definitionId',300);integer(x.version,'definition version');
    choice(x.status,'definition status',['active','archived']);timestamp(x.createdAt,'createdAt');timestamp(x.updatedAt,'updatedAt');
    if(x.updatedAt<x.createdAt)fail('definition timestamp order');
    configuration(x.configuration);return clone(x);
  }
  function lookup(records,key,id){
    if(!Array.isArray(records))fail('missing catalog array '+key);
    const matches=records.filter(r=>r?.[key]===id);
    if(matches.length!==1)fail('unresolved or ambiguous '+key+': '+id);
    return matches[0];
  }
  // Resolves membership only. A8.4 still needs closure, attribute policy and
  // conflict checks for all linked entities; do not treat this as a projection.
  function resolve(catalog,config){
    const c=configuration(config),s=c.scope;
    if(!catalog||catalog.schemaVersion!=='1.0.0'||!Array.isArray(catalog.radarRevisions))fail('native catalog required');
    for(const id of [...s.organizationIds,...c.audience.organizationIds])lookup(catalog.organizations,'organizationId',id);
    for(const id of s.portfolioIds)lookup(catalog.portfolios,'portfolioId',id);
    const matches=r=>(!s.organizationIds.length||s.organizationIds.includes(r.ownerOrganizationId))&&(!s.portfolioIds.length||s.portfolioIds.includes(r.portfolioId));
    let revisions;
    if(s.selection==='explicit')revisions=s.revisionIds.map(id=>lookup(catalog.radarRevisions,'revisionId',id));
    else {
      revisions=[];
      for(const id of s.radarIds){
        const selected=catalog.radarRevisions.filter(r=>r.radarId===id&&r.status==='published'&&matches(r));
        if(!selected.length)fail('no eligible published revision for radar '+id);
        revisions.push(...selected);
      }
    }
    const ids=new Set();
    for(const r of revisions){
      text(r.revisionId,'revisionId',300);text(r.radarId,'radarId',300);
      lookup(catalog.radarRevisions,'revisionId',r.revisionId);
      if(ids.has(r.revisionId)||r.status!=='published'||!matches(r))fail('revision outside published scope: '+r.revisionId);
      ids.add(r.revisionId);
      const org=lookup(catalog.organizations,'organizationId',r.ownerOrganizationId);
      const portfolio=lookup(catalog.portfolios,'portfolioId',r.portfolioId);
      if(portfolio.ownerOrganizationId!==org.organizationId)fail('organization / portfolio mismatch: '+r.revisionId);
    }
    return [...ids].sort();
  }
  function release(x){
    object(x,'release',['releaseId','createdAt','definition','source','resolvedRevisionIds','resolvedRevisions','mode','modules','artifacts','validation',...(own(x,'reason')?['reason']:[])]);
    if(own(x,'reason'))text(x.reason,'release reason',1000);
    text(x.releaseId,'releaseId',300);timestamp(x.createdAt,'release createdAt');
    const d=definition(x.definition);
    if(d.status!=='active'||x.createdAt<d.updatedAt)fail('invalid release definition snapshot');
    object(x.source,'source',['catalogId','catalogDigest','codeCommit']);
    text(x.source.catalogId,'catalogId',300);digest(x.source.catalogDigest,'catalogDigest');
    if(typeof x.source.codeCommit!=='string'||!/^[a-f0-9]{40}$/.test(x.source.codeCommit))fail('full source code commit required');
    strings(x.resolvedRevisionIds,'resolvedRevisionIds');
    if(!x.resolvedRevisionIds.length)fail('empty release scope');
    if(d.configuration.scope.selection==='explicit'&&JSON.stringify([...d.configuration.scope.revisionIds].sort())!==JSON.stringify([...x.resolvedRevisionIds].sort()))fail('release explicit scope mismatch');
    const records=array(x.resolvedRevisions,'resolved revisions');
    for(const r of records){
      object(r,'resolved revision',['revisionId','radarId','version','ownerOrganizationId','portfolioId']);
      for(const key of ['revisionId','radarId','ownerOrganizationId','portfolioId'])text(r[key],key,300);
      if(r.version!==null)text(r.version,'revision version',300);
      const scope=d.configuration.scope;
      if(scope.selection==='allPublishedForRadars'&&!scope.radarIds.includes(r.radarId))fail('release radar scope mismatch');
      if((scope.organizationIds.length&&!scope.organizationIds.includes(r.ownerOrganizationId))||(scope.portfolioIds.length&&!scope.portfolioIds.includes(r.portfolioId)))fail('release organization / portfolio scope mismatch');
    }
    if(JSON.stringify(records.map(r=>r.revisionId))!==JSON.stringify(x.resolvedRevisionIds))fail('release revision records mismatch');
    choice(x.mode,'mode',d.configuration.packaging.modes);
    strings(x.modules,'modules');if(!x.modules.length)fail('empty module inventory');
    const paths=new Set();
    for(const a of array(x.artifacts,'artifacts',1000)){
      object(a,'artifact',['path','sha256','bytes']);text(a.path,'artifact path',300);
      if(!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(a.path)||a.path.split('/').some(p=>p==='.'||p==='..')||paths.has(a.path))fail('invalid or duplicate artifact path');
      paths.add(a.path);digest(a.sha256,'artifact sha256');integer(a.bytes,'artifact bytes');
    }
    if(!paths.size)fail('empty artifacts');
    object(x.validation,'validation',['status','checks']);
    // Evidence reported by a future generator, not proof that bytes were checked here.
    choice(x.validation.status,'validation status',['reported-passed']);
    strings(x.validation.checks,'validation checks');if(!x.validation.checks.length)fail('empty validation checks');
    return clone(x);
  }
  function empty(){return {schemaVersion:VERSION,definitions:[],releases:[]};}
  function hasState(catalog){return !!catalog?.extensions&&own(catalog.extensions,'publications');}
  function canonical(x){return JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);}
  function state(catalog){
    if(!hasState(catalog))return empty();
    const s=catalog.extensions.publications;
    object(s,'publication state',['schemaVersion','definitions','releases']);
    if(s.schemaVersion!==VERSION)fail('unsupported publication schema version');
    const defs=new Map(),ids=new Set(),snapshots=new Map();
    for(const entry of array(s.definitions,'definitions')){
      const d=definition(entry);
      if(defs.has(d.definitionId))fail('duplicate definitionId');
      if(d.status==='active')resolve(catalog,d.configuration);
      defs.set(d.definitionId,d);
    }
    for(const entry of array(s.releases,'releases')){
      const r=release(entry),d=defs.get(r.definition.definitionId);
      if(ids.has(r.releaseId)||!d||r.definition.version>d.version||r.definition.createdAt!==d.createdAt||r.definition.updatedAt>d.updatedAt)fail('invalid release history');
      if(r.definition.version===d.version&&canonical(r.definition)!==canonical(d))fail('release definition snapshot mismatch');
      const key=JSON.stringify([r.definition.definitionId,r.definition.version]),snapshot=canonical(r.definition);
      if(snapshots.has(key)&&snapshots.get(key)!==snapshot)fail('conflicting historical definition snapshots');
      snapshots.set(key,snapshot);
      ids.add(r.releaseId);
    }
    return clone(s);
  }
  root.__radarPublicationModel=Object.freeze({configuration,definition,release,resolve,state,hasState,canonical});
})(window);
