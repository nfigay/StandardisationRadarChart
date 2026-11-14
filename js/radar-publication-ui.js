/* A8.5 — Creator-only management of persisted publication definitions.
 * No second workspace; all mutations and projections use the existing services.
 */
(function(root){
  'use strict';
  const labels={
    fr:{title:'Publications',close:'Fermer',new:'Nouvelle publication',edit:'Modifier',save:'Enregistrer la définition',cancel:'Annuler',archive:'Archiver',reactivate:'Réactiver',remove:'Supprimer',removeConfirm:'Supprimer cette définition sans historique ?',empty:'Aucune définition de publication.',noCatalog:'Ouvrir un catalogue métier avant de préparer une publication.',name:'Nom',description:'Description',audience:'Destinataires',audienceOrganizations:'Organisations destinataires',selection:'Règle de sélection',explicit:'Révisions publiées explicites',dynamic:'Toutes les révisions publiées des radars choisis',revisions:'Révisions publiées',radars:'Radars',organizations:'Filtre organisations',portfolios:'Filtre portefeuilles',noFilter:'Aucune sélection signifie aucun filtre.',titleField:'Titre du Viewer',language:'Langue initiale',french:'Français',english:'Anglais',references:'Afficher le panneau des références',iso:'Inclure les métadonnées ISO',assessments:'Inclure les résumés d’évaluation',modes:'Modes de distribution prévus',standalone:'HTML autonome',bundled:'Web bundlé',modules:'Web modulaire',data:'Conditionnement des données',embedded:'Embarquées',external:'Externes',baseline:'Capacités actuelles : ouverture, navigation et consultation. Les extensions inconnues sont exclues.',active:'Active',archived:'Archivée',version:'Version {{version}}',history:'Historique des livraisons',none:'Aucune livraison enregistrée.',prepare:'Vérifier le périmètre',preview:'Prévisualiser dans le Viewer',export:'Exporter le JSON projeté',candidate:'Télécharger le Viewer candidat',candidateHint:'HTML autonome avec données embarquées. Candidat de consultation, pas encore une livraison qualifiée.',candidateUnavailable:'Le modèle HTML autonome est disponible dans le Creator autonome. Les autres modes seront réalisés ensuite.',candidateMode:'Le téléchargement HTML exige le mode autonome et les données embarquées.',busy:'Opération en cours…',saved:'Définition enregistrée dans le catalogue. Pensez à exporter le catalogue métier.',removed:'Définition supprimée.',ready:'Projection vérifiée.',downloaded:'Téléchargement demandé.',previewReady:'Prévisualisation chargée.',previewError:'La prévisualisation n’a pas pu être chargée.',previewTimeout:'Le Viewer n’a pas confirmé son démarrage.',previewClose:'Fermer la prévisualisation',error:'Opération impossible. Vérifiez la sélection, les champs obligatoires et la version de la définition.',workspaceChanged:'Le catalogue actif a changé. Fermer et rouvrir Publications.',unsaved:'Enregistrer ou annuler les modifications du formulaire avant de continuer.',counts:'{{radars}} radars · {{revisions}} révisions · {{blips}} blips · {{standards}} standards · {{iso}} fiches ISO · {{assessments}} évaluations',limits:'Limites : contextes libres et relations génériques exclus ; évaluations résumées ; autres modes et exclusion physique du code non qualifiés.',digest:'Empreinte de la projection',historyItem:'{{id}} — version {{version}} — {{mode}} — {{date}}',review:'Relire les données publiables : une information confidentielle peut être présente dans un champ autorisé.'},
    en:{title:'Publications',close:'Close',new:'New publication',edit:'Edit',save:'Save definition',cancel:'Cancel',archive:'Archive',reactivate:'Reactivate',remove:'Delete',removeConfirm:'Delete this definition without release history?',empty:'No publication definitions.',noCatalog:'Open a business catalog before preparing a publication.',name:'Name',description:'Description',audience:'Audience',audienceOrganizations:'Audience organizations',selection:'Selection rule',explicit:'Explicit published revisions',dynamic:'All published revisions of selected radars',revisions:'Published revisions',radars:'Radars',organizations:'Organization filter',portfolios:'Portfolio filter',noFilter:'An empty selection means no filter.',titleField:'Viewer title',language:'Initial language',french:'French',english:'English',references:'Show the references panel',iso:'Include ISO metadata',assessments:'Include assessment summaries',modes:'Planned distribution modes',standalone:'Standalone HTML',bundled:'Bundled web',modules:'Modular web',data:'Data packaging',embedded:'Embedded',external:'External',baseline:'Current capabilities: open, navigate and consult. Unknown extensions are excluded.',active:'Active',archived:'Archived',version:'Version {{version}}',history:'Release history',none:'No recorded releases.',prepare:'Check scope',preview:'Preview in Viewer',export:'Export projected JSON',candidate:'Download candidate Viewer',candidateHint:'Standalone HTML with embedded data. Consultation candidate, not yet a qualified release.',candidateUnavailable:'The standalone HTML template is available in the standalone Creator. Other modes will follow.',candidateMode:'HTML download requires standalone mode and embedded data.',busy:'Operation in progress…',saved:'Definition saved in the catalog. Remember to export the business catalog.',removed:'Definition deleted.',ready:'Projection verified.',downloaded:'Download requested.',previewReady:'Preview loaded.',previewError:'The preview could not be loaded.',previewTimeout:'The Viewer did not confirm startup.',previewClose:'Close preview',error:'Operation failed. Check the selection, required fields and definition version.',workspaceChanged:'The active catalog changed. Close and reopen Publications.',unsaved:'Save or cancel the form changes before continuing.',counts:'{{radars}} radars · {{revisions}} revisions · {{blips}} blips · {{standards}} standards · {{iso}} ISO records · {{assessments}} assessments',limits:'Limits: free contexts and generic relationships excluded; assessment summaries only; other modes and physical code exclusion not qualified.',digest:'Projection digest',historyItem:'{{id}} — version {{version}} — {{mode}} — {{date}}',review:'Review the publishable data: an allowed field can contain confidential information.'}
  };
  const clone=x=>JSON.parse(JSON.stringify(x));
  function register(){for(const lang of ['fr','en'])root.i18next.addResourceBundle(lang,'translation',{menu:{publisher:labels[lang]}},true,true);}
  function t(key,values={}){return root.i18next.t('menu.publisher.'+key,values);}
  function defaultConfiguration(){return {name:'',description:'',audience:{label:'',organizationIds:[]},scope:{selection:'explicit',revisionIds:[],radarIds:[],organizationIds:[],portfolioIds:[]},capabilities:['catalog.open','radar.navigate','radar.consult'],presentation:{title:'',language:'fr',references:true},packaging:{modes:['standalone'],data:'embedded'},dataPolicy:{isoDocument:true,assessments:false,extensions:'allowlist'}};}
  function options(catalog){
    const revisions=catalog.radarRevisions.filter(r=>r.status==='published');
    const unique=new Map();for(const r of revisions)if(!unique.has(r.radarId))unique.set(r.radarId,{value:r.radarId,label:catalog.extensions?.administration?.radarNames?.[r.radarId]||r.title||r.radarId});
    return {revisions:revisions.map(r=>({value:r.revisionId,label:(catalog.extensions?.administration?.radarNames?.[r.radarId]||r.title||r.radarId)+' — '+(r.version||'')+' — '+r.revisionId})),radars:[...unique.values()],organizations:catalog.organizations.map(o=>({value:o.organizationId,label:o.name||o.organizationId})),portfolios:catalog.portfolios.map(p=>({value:p.portfolioId,label:p.name||p.portfolioId}))};
  }
  function readConfiguration(values){
    const c=defaultConfiguration();
    c.name=values.name.trim();c.description=values.description.trim();c.audience={label:values.audience.trim(),organizationIds:values.audienceOrganizations.slice()};
    c.scope={selection:values.selection,revisionIds:values.selection==='explicit'?values.revisions.slice():[],radarIds:values.selection==='allPublishedForRadars'?values.radars.slice():[],organizationIds:values.organizations.slice(),portfolioIds:values.portfolios.slice()};
    c.presentation={title:values.title.trim(),language:values.language,references:values.references};c.packaging={modes:values.modes.slice(),data:values.data};
    c.dataPolicy={isoDocument:values.iso,assessments:values.assessments,extensions:'allowlist'};
    return root.__radarPublicationModel.configuration(c);
  }
  function open(graph){
    root.__radarApplicationProfile.require('publication.create');register();
    const p=root.__radarCatalogPersistence,d=root.document,identity=p.status().catalogId;
    if(!identity||p.status().importedCatalogs!==1){root.w2alert(t('noCatalog'));return null;}
    const prior=d.getElementById('radar-publication-dialog');if(prior)return prior;
    const dialog=d.createElement('dialog');dialog.id='radar-publication-dialog';dialog.setAttribute('aria-label',t('title'));
    Object.assign(dialog.style,{width:'min(980px,92vw)',maxHeight:'90vh',overflow:'auto',border:'1px solid #888',borderRadius:'8px',padding:'18px',color:'#222',background:'#fff'});
    let selected=null,editing=false,dirty=false,busy=false,closed=false,previewCleanup=null,bindings=[],statusBinding=null;
    const append=(parent,tag,text)=>{const n=d.createElement(tag);if(text!==undefined)n.textContent=String(text);parent.appendChild(n);return n;};
    function localized(parent,tag,key,values={}){const n=append(parent,tag,t(key,values));bindings.push({node:n,update:()=>n.textContent=t(key,values)});return n;}
    function button(parent,key,action){const b=localized(parent,'button',key);b.type='button';b.className='w2ui-btn';b.addEventListener('click',()=>{if(!busy)void run(action);});return b;}
    function status(key,values={}){statusBinding={key,values};message.textContent=t(key,values);}
    function languageChanged(){dialog.setAttribute('aria-label',t('title'));bindings=bindings.filter(b=>b.node.isConnected);for(const b of bindings)b.update();if(statusBinding)message.textContent=t(statusBinding.key,statusBinding.values);}
    function assertWorkspace(){if(p.status().catalogId!==identity||p.status().importedCatalogs!==1){const e=Error('workspace changed');e.publisherKey='workspaceChanged';throw e;}}
    async function run(action){try{assertWorkspace();await action();}catch(e){root.console?.error?.('Publisher',e);status(e.publisherKey||'error');}finally{busy=false;}}
    function guard(){if(dirty){status('unsaved');return false;}return true;}
    const head=append(dialog,'div');Object.assign(head.style,{display:'flex',justifyContent:'space-between',alignItems:'center'});localized(head,'h2','title');
    const close=localized(head,'button','close');close.type='button';close.addEventListener('click',()=>{if(!busy&&guard())dialog.close();});
    const message=append(dialog,'p');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
    const body=append(dialog,'div');const preview=append(dialog,'section');
    const permanent=bindings.slice();
    function resetPreview(){if(previewCleanup){previewCleanup();previewCleanup=null;}preview.replaceChildren();}
    function state(){return p.publicationState();}
    function current(){return state().definitions.find(x=>x.definitionId===selected)||null;}
    function render(){
      resetPreview();body.replaceChildren();bindings=permanent.slice();editing=false;dirty=false;
      const s=state(),top=append(body,'div');Object.assign(top.style,{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'});
      button(top,'new',()=>editor(null));
      const list=append(body,'div');Object.assign(list.style,{display:'grid',gap:'6px',margin:'12px 0'});
      if(!s.definitions.length)localized(list,'p','empty');
      for(const item of s.definitions){
        const row=append(list,'div');Object.assign(row.style,{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap'});
        const pick=append(row,'button',item.configuration.name);pick.type='button';pick.className='w2ui-btn';pick.dataset.definitionId=item.definitionId;pick.setAttribute('aria-pressed',String(item.definitionId===selected));pick.addEventListener('click',()=>{if(!busy&&guard())void run(()=>{selected=item.definitionId;render();});});
        localized(row,'span',item.status);localized(row,'span','version',{version:item.version});
      }
      const item=current();if(!item)return;
      const block=append(body,'section');append(block,'h3',item.configuration.name);append(block,'p',item.configuration.description);append(block,'p',item.configuration.audience.label);
      const actions=append(block,'div');Object.assign(actions.style,{display:'flex',gap:'6px',flexWrap:'wrap'});
      button(actions,'edit',()=>editor(item));
      button(actions,item.status==='active'?'archive':'reactivate',()=>{p.updatePublicationDefinition(item.definitionId,item.version,item.configuration,item.status==='active'?'archived':'active');render();status('saved');});
      if(!s.releases.some(r=>r.definition.definitionId===item.definitionId))button(actions,'remove',()=>{if(root.confirm(t('removeConfirm'))){p.removePublicationDefinition(item.definitionId,item.version);selected=null;render();status('removed');}});
      if(item.status==='active'){
        const reportArea=append(block,'div');
        function showReport(report){reportArea.replaceChildren();bindings=bindings.filter(b=>b.node.isConnected);const values={radars:report.radarCount,revisions:report.revisionIds.length,blips:report.blipCount,standards:report.standardCount,iso:report.isoDocumentCount,assessments:report.assessmentCount};localized(reportArea,'p','counts',values);append(reportArea,'p',report.revisionIds.join(' · '));localized(reportArea,'p','digest');append(reportArea,'code',report.projectionDigest);localized(reportArea,'p','limits');localized(reportArea,'p','review');}
        async function prepared(){resetPreview();busy=true;status('busy');const result=await p.preparePublicationProjection(graph,item.definitionId,item.version);assertWorkspace();if(closed)throw Error('dialog closed');showReport(result.report);status('ready');return result;}
        button(actions,'prepare',prepared);
        button(actions,'export',async()=>{busy=true;status('busy');await p.downloadPublicationProjection(graph,item.definitionId,item.version);assertWorkspace();status('downloaded');});
        button(actions,'preview',async()=>{const result=await prepared();startPreview(root.__radarPublicationViewer.payload(result.catalog,result.report,item.configuration.presentation));});
        const templateAvailable=!!d.getElementById('radar-viewer-template');
        if(templateAvailable&&item.configuration.packaging.modes.includes('standalone')&&item.configuration.packaging.data==='embedded'){
          button(actions,'candidate',async()=>{const result=await prepared();const v=root.__radarPublicationViewer;const html=v.compose(v.template(),v.payload(result.catalog,result.report,item.configuration.presentation));const url=root.URL.createObjectURL(new root.Blob([html],{type:'text/html;charset=utf-8'}));try{const a=append(d.body,'a');a.href=url;a.download='radar-viewer-candidate-'+result.report.projectionDigest.slice(0,12)+'.html';a.click();a.remove();}finally{root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);}status('downloaded');});
          localized(block,'p','candidateHint');
        }else localized(block,'p',templateAvailable?'candidateMode':'candidateUnavailable');
      }
      localized(block,'h4','history');const releases=s.releases.filter(r=>r.definition.definitionId===item.definitionId);
      if(!releases.length)localized(block,'p','none');else for(const r of releases)localized(block,'p','historyItem',{id:r.releaseId,version:r.definition.version,mode:r.mode,date:r.createdAt});
    }
    function startPreview(payload){
      resetPreview();const frame=append(preview,'iframe');frame.title=t('preview');bindings.push({node:frame,update:()=>frame.title=t('preview')});frame.style.width='100%';frame.style.height='min(70vh,720px)';frame.style.border='1px solid #888';frame.setAttribute('sandbox','allow-scripts allow-same-origin');
      const closePreview=button(preview,'previewClose',()=>resetPreview());
      const v=root.__radarPublicationViewer,embedded=d.getElementById('radar-viewer-template'),origin=root.location.origin;
      let timer=null;
      const onMessage=event=>{
        if(event.source!==frame.contentWindow||event.origin!==origin&&!(embedded&&event.origin==='null'))return;
        if(event.data?.type==='radar-publication-preview-ready'&&!embedded){frame.contentWindow.postMessage({type:'radar-publication-preview-load',payload},origin);}
        if(event.data?.type==='radar-publication-preview-result'){root.clearTimeout(timer);const r=event.data.result;const expected=payload.catalog.radarRevisions.map(x=>x.revisionId);const valid=event.data.ok===true&&r?.profile==='viewer'&&r.projectionDigest===payload.projectionDigest&&JSON.stringify(r.revisionIds)===JSON.stringify(expected);status(valid?'previewReady':'previewError');}
      };
      root.addEventListener('message',onMessage);previewCleanup=()=>{root.removeEventListener('message',onMessage);root.clearTimeout(timer);frame.remove();closePreview.remove();};
      timer=root.setTimeout(()=>status('previewTimeout'),30000);
      if(embedded)frame.srcdoc=v.compose(v.template(),payload);else if(['http:','https:'].includes(root.location.protocol)){const url=new root.URL(root.location.href);url.search='?profile=viewer&publicationPreview=1';url.hash='';frame.src=url.href;}else{resetPreview();status('candidateUnavailable');}
    }
    function editor(item){
      resetPreview();body.replaceChildren();bindings=permanent.slice();editing=true;dirty=false;
      const c=item?clone(item.configuration):defaultConfiguration(),opts=options(p.build(graph)),controls={};
      localized(body,'h3',item?'edit':'new');const form=append(body,'form');Object.assign(form.style,{display:'grid',gap:'9px'});
      form.addEventListener('input',()=>dirty=true);form.addEventListener('change',()=>dirty=true);
      function field(key,tag,value,max){const wrap=append(form,'label');Object.assign(wrap.style,{display:'grid',gap:'4px'});localized(wrap,'span',key);const n=append(wrap,tag);n.name=key;n.value=value;if(max)n.maxLength=max;n.style.width='100%';controls[key]=n;return n;}
      function select(key,choices,value){const n=field(key,'select','');n.style.height='auto';for(const [id,label] of choices){const o=localized(n,'option',label);o.value=id;}n.value=value;return n;}
      function multi(key,choices,values){const wrap=append(form,'fieldset');localized(wrap,'legend',key);const inputs=[];const retained=choices.concat(values.filter(id=>!choices.some(o=>o.value===id)).map(value=>({value,label:value})));for(const opt of retained){const label=append(wrap,'label');label.style.display='block';const check=append(label,'input');check.type='checkbox';check.value=opt.value;check.checked=values.includes(opt.value);check.name=key;if(opt.key)localized(label,'span',opt.key);else append(label,'span',opt.label+' ('+opt.value+')');inputs.push(check);}controls[key]=inputs;return wrap;}
      function check(key,value){const label=append(form,'label');const n=append(label,'input');n.type='checkbox';n.checked=value;n.name=key;localized(label,'span',key);controls[key]=n;}
      field('name','input',c.name,120).required=true;field('description','textarea',c.description,4000);field('audience','input',c.audience.label,200).required=true;
      multi('audienceOrganizations',opts.organizations,c.audience.organizationIds);
      const selection=select('selection',[['explicit','explicit'],['allPublishedForRadars','dynamic']],c.scope.selection);
      const revisions=multi('revisions',opts.revisions,c.scope.revisionIds),radars=multi('radars',opts.radars,c.scope.radarIds);
      function showScope(){revisions.hidden=selection.value!=='explicit';radars.hidden=selection.value!=='allPublishedForRadars';}selection.addEventListener('change',showScope);showScope();
      multi('organizations',opts.organizations,c.scope.organizationIds);multi('portfolios',opts.portfolios,c.scope.portfolioIds);localized(form,'p','noFilter');
      field('titleField','input',c.presentation.title,200).required=true;select('language',[['fr','french'],['en','english']],c.presentation.language);
      check('references',c.presentation.references);check('iso',c.dataPolicy.isoDocument);check('assessments',c.dataPolicy.assessments);
      multi('modes',['standalone','bundled','modules'].map(value=>({value,key:value})),c.packaging.modes);select('data',[['embedded','embedded'],['external','external']],c.packaging.data);localized(form,'p','baseline');
      const actions=append(form,'div');const save=localized(actions,'button','save');save.type='submit';button(actions,'cancel',()=>render());
      form.addEventListener('submit',event=>{event.preventDefault();if(busy)return;void run(()=>{
        const val=k=>controls[k].value,selectedValues=k=>controls[k].filter(x=>x.checked).map(x=>x.value),checked=k=>controls[k].checked;
        const config=readConfiguration({name:val('name'),description:val('description'),audience:val('audience'),audienceOrganizations:selectedValues('audienceOrganizations'),selection:val('selection'),revisions:selectedValues('revisions'),radars:selectedValues('radars'),organizations:selectedValues('organizations'),portfolios:selectedValues('portfolios'),title:val('titleField'),language:val('language'),references:checked('references'),iso:checked('iso'),assessments:checked('assessments'),modes:selectedValues('modes'),data:val('data')});
        const result=item?p.updatePublicationDefinition(item.definitionId,item.version,config,item.status):p.createPublicationDefinition(config);selected=result.definitionId;render();status('saved');
      });});
    }
    dialog.addEventListener('cancel',event=>{if(busy||!guard())event.preventDefault();});
    dialog.addEventListener('close',()=>{closed=true;resetPreview();root.i18next.off('languageChanged',languageChanged);dialog.remove();},{once:true});
    root.i18next.on('languageChanged',languageChanged);d.body.appendChild(dialog);selected=state().definitions[0]?.definitionId||null;render();dialog.showModal();return dialog;
  }
  root.__radarPublicationUI=Object.freeze({open,defaultConfiguration,options,readConfiguration});
})(window);
