/* A8.4 — native, positive-selection publication projection.
 * Only the supported native v1 contract is projected. No graph, DOM or I/O.
 */
(function(root){
  'use strict';
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const fail=s=>{throw Error('Publication projection: '+s);};
  const text=(x,k)=>{if(typeof x!=='string'||!x.trim())fail('invalid '+k);return x;};
  const optional=(x,k)=>{if(x!==null&&typeof x!=='string')fail('invalid '+k);return x;};
  function fields(record,required,optionalFields=[]){
    if(!object(record))fail('invalid record');
    const out={};
    for(const k of required)out[k]=text(record[k],k);
    for(const k of optionalFields)if(own(record,k))out[k]=optional(record[k],k);
    return out;
  }
  function lookup(records,key,id){
    if(!Array.isArray(records))fail('missing '+key+' array');
    const found=records.filter(r=>r?.[key]===id);
    if(found.length!==1)fail('unresolved or ambiguous '+key+': '+id);
    return found[0];
  }
  function stringArray(value,key){
    if(!Array.isArray(value)||value.some(x=>typeof x!=='string'))fail('invalid '+key);
    return value.slice();
  }
  function languages(value,key){
    if(!object(value))fail('invalid '+key);
    const pairs=Object.entries(value);
    for(const [lang,v] of pairs)if(!/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{2,8})*$/.test(lang)||typeof v!=='string')fail('invalid '+key);
    return Object.fromEntries(pairs.sort(([a],[b])=>a<b?-1:a>b?1:0));
  }
  function isoDocument(doc){
    if(!object(doc)||doc.schemaVersion!==1||doc.source!=='ISO Open Data')fail('unsupported ISO snapshot');
    const out={schemaVersion:1,...fields(doc,['source','release','id','reference'],['title','scope','ownerCommittee','currentStage','edition','publicationDate','deliverableType','supplementType','pages'])};
    for(const key of ['titleI18n','scopeI18n'])if(own(doc,key))out[key]=languages(doc[key],key);
    for(const key of ['icsCodes','languages','replaces','replacedBy'])if(own(doc,key))out[key]=stringArray(doc[key],key);
    return out;
  }
  function standard(record,policy){
    const out=fields(record,['standardId','name']),ext={};
    const declaration=record.extensions?.referenceDeclaration;
    if(declaration!=null)ext.referenceDeclaration=fields(declaration,['issuer','designation'],['editionDesignation','sourceName','origin','verification']);
    // Source URL and declaredAt are not approved publication attributes in v1.
    if(policy.isoDocument&&record.extensions?.isoDocument!=null)ext.isoDocument=isoDocument(record.extensions.isoDocument);
    if(Object.keys(ext).length)out.extensions=ext;
    return out;
  }
  // S19-R34: export the *selected revision's* strategic dossiers only.
  // The allowlist deliberately excludes governance, internal contacts, document
  // provenance, arbitrary extensions and unknown fields from the public payload.
  function rationales(revision,visibleBlips){
    const extension=revision.extensions?.radarRationales;
    if(extension===undefined)return null;
    if(!object(extension)||extension.schemaVersion!=='s19-revision-rationales-v1'||!Array.isArray(extension.items))fail('invalid strategic dossiers extension');
    const allowed=new Set(visibleBlips.map(b=>b.standardId));
    const ids=new Set(),pairs=new Set(),items=[];
    for(const record of extension.items){
      if(!object(record))fail('invalid strategic dossier');
      const id=text(record.rationaleId,'rationaleId');
      const standardId=text(record.standard?.id,'rationale standard.id');
      const organizationId=text(record.organization?.id,'rationale organization.id');
      if(organizationId!==revision.ownerOrganizationId)fail('rationale organization mismatch');
      if(!allowed.has(standardId))continue; // Only dossiers associated with projected blips.
      const pair=organizationId+'\0'+standardId;
      if(ids.has(id)||pairs.has(pair))fail('duplicate published strategic dossier');
      ids.add(id);pairs.add(pair);
      if(!object(record.sections))fail('invalid rationale sections');
      const sections={};
      for(const key of ['abstract','businessJustification','businessBenefits','stakeholders','activities','actionPlan','adoptionStatement','recommendation','supportingMaterial']){
        if(!own(record.sections,key))continue;
        const value=record.sections[key];
        if(!object(value)||value.type!=='doc'||(value.content!==undefined&&!Array.isArray(value.content)))fail('invalid rationale section '+key);
        // JSON clone strips no unknown keys inside Tiptap; those keys are data
        // rendered by the existing S19 safe renderer, never executable HTML.
        sections[key]=JSON.parse(JSON.stringify(value));
      }
      const out={rationaleId:id,organization:{id:organizationId,name:typeof record.organization.name==='string'?record.organization.name:organizationId},standard:{id:standardId,designation:typeof record.standard.designation==='string'?record.standard.designation:standardId,title:typeof record.standard.title==='string'?record.standard.title:standardId},sections};
      if(Array.isArray(record.relatedReferences)){
        out.relatedReferences=record.relatedReferences.filter(ref=>object(ref)&&['blip','standard','source','url'].includes(ref.type)&&typeof ref.id==='string'&&typeof ref.label==='string').filter(ref=>{
          if(ref.type==='blip')return visibleBlips.some(b=>b.blipId===ref.id&&(!ref.standardId||b.standardId===ref.standardId));
          if(ref.type==='standard')return allowed.has(ref.id);
          if(ref.type==='url')return /^https?:\/\/[^\s<>"']+$/i.test(ref.id);
          if(ref.type==='source')return typeof ref.provider==='string'&&!!ref.provider.trim();
          return false;
        }).slice(0,100).map(ref=>({type:ref.type,id:ref.id,label:ref.label,...(ref.type==='blip'&&typeof ref.standardId==='string'?{standardId:ref.standardId}:{}),...(ref.type==='source'?{provider:ref.provider}:{})}));
      }
      items.push(out);
    }
    return {schemaVersion:'s19-revision-rationales-v1',items};
  }
  const sorted=map=>[...map.keys()].sort().map(id=>map.get(id));
  function project(source,configuration){
    const model=root.__radarPublicationModel;
    if(!model)fail('publication model unavailable');
    const c=model.configuration(configuration),ids=model.resolve(source,c);
    const orgs=new Map(),ports=new Map(),standards=new Map(),assessments=new Map(),radars=new Set();
    let detachedAssessments=0,omittedContexts=0,omittedBlipExtensions=0;
    const revisions=ids.map(id=>{
      const r=lookup(source.radarRevisions,'revisionId',id);
      if(r.schemaVersion!=='1.0.0'||r.status!=='published'||!Array.isArray(r.blips))fail('invalid published revision '+id);
      const projected={schemaVersion:'1.0.0',...fields(r,['revisionId','radarId','ownerOrganizationId','portfolioId'],['title','version']),status:'published',blips:[]};
      const org=lookup(source.organizations,'organizationId',r.ownerOrganizationId),port=lookup(source.portfolios,'portfolioId',r.portfolioId);
      if(port.ownerOrganizationId!==org.organizationId)fail('organization / portfolio mismatch');
      orgs.set(org.organizationId,fields(org,['organizationId'],['name']));
      ports.set(port.portfolioId,fields(port,['portfolioId','ownerOrganizationId'],['name']));
      radars.add(r.radarId);
      const seen=new Set();
      projected.blips=r.blips.map(b=>{
        const out=fields(b,['blipId','standardId','label','ring','quadrant']);
        if(seen.has(out.blipId))fail('duplicate blipId '+out.blipId);seen.add(out.blipId);
        if(!Number.isFinite(b.position?.x)||!Number.isFinite(b.position?.y))fail('invalid blip position '+out.blipId);
        out.position={x:b.position.x,y:b.position.y};
        if(!standards.has(out.standardId))standards.set(out.standardId,standard(lookup(source.standards,'standardId',out.standardId),c.dataPolicy));
        if(b.assessmentId!=null){
          const assessmentId=text(b.assessmentId,'assessmentId');
          // Even an omitted reference must resolve in the source; malformed input is not silently repaired.
          const assessment=lookup(source.assessments,'assessmentId',assessmentId);
          if(own(assessment,'standardId')&&assessment.standardId!==out.standardId)fail('assessment / standard mismatch');
          if(c.dataPolicy.assessments){
            const a=fields(assessment,['assessmentId'],['name','title']);
            if(own(assessment,'standardId'))a.standardId=out.standardId;
            assessments.set(assessmentId,a);out.assessmentId=assessmentId;
          }else detachedAssessments++;
        }
        if(b.context!=null)omittedContexts++;
        if(b.extensions!=null)omittedBlipExtensions++;
        return out;
      });
      const dossiers=rationales(r,projected.blips);
      if(dossiers?.items.length)projected.extensions={radarRationales:dossiers};
      return projected;
    });
    const rationaleCount=revisions.reduce((sum,r)=>sum+(r.extensions?.radarRationales?.items.length||0),0);
    const catalog={schemaVersion:'1.0.0',title:c.presentation.title,organizations:sorted(orgs),portfolios:sorted(ports),standards:sorted(standards),assessments:sorted(assessments),radarRevisions:revisions};
    // Preserve only the public display labels of selected radars/revisions,
    // never the authoring name history or other administration properties.
    const admin=source.extensions?.administration,labels={};
    for(const [key,allowed] of [['radarNames',radars],['revisionLabels',new Set(ids)]]){
      const map=admin?.[key];
      if(map!=null){
        if(!object(map))fail('invalid '+key);
        const pairs=[...allowed].sort().filter(id=>own(map,id)).map(id=>[id,text(map[id],key)]);
        if(pairs.length)labels[key]=Object.fromEntries(pairs);
      }
    }
    if(Object.keys(labels).length)catalog.extensions={administration:labels};
    const report={revisionIds:ids,radarCount:radars.size,organizationCount:orgs.size,portfolioCount:ports.size,standardCount:standards.size,assessmentCount:assessments.size,blipCount:revisions.reduce((n,r)=>n+r.blips.length,0),rationaleCount,isoDocumentCount:catalog.standards.filter(s=>s.extensions?.isoDocument).length,detachedAssessments,omittedContexts,omittedBlipExtensions,policy:'native-v1-positive-allowlist',limitations:['free-context-and-unknown-extensions-excluded','no-native-relationship-contract','assessment-summary-only','presentation-and-packaging-not-applied']};
    return {catalog,report};
  }
  function verify(source,configuration,candidate){
    const expected=project(source,configuration);
    if(root.__radarPublicationModel.canonical(expected.catalog)!==root.__radarPublicationModel.canonical(candidate))fail('projection differs from approved scope and attribute policy');
    return true;
  }
  root.__radarPublicationProjection=Object.freeze({project,verify});
})(window);
