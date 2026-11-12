/* S14-L4-R1: observable source commands; do not infer success from a click. */
(function (root) {
  'use strict';
  const KEY='isoSourceManager';
  const MESSAGES={
    fr:{manage:'Gérer les sources',heading:'Sources du catalogue ISO',state:'État du catalogue',activity:'Suivi des opérations',ready:'Aucune opération lancée.',started:'Commande lancée : {{name}}',returned:'Retour de l’application : {{message}}',silent:'Commande déclenchée ; aucun résultat confirmé. Consulter l’état du catalogue.',failed:'Échec de la commande : {{message}}',missing:'Commande indisponible dans ce déploiement',help:'Le catalogue ISO distribué est installé automatiquement. « Synchroniser le catalogue distribué » vérifie les mises à jour. Les imports JSONL, fichiers ISO locaux, flux RSS et journaux d’évolutions sont des opérations distinctes et facultatives.',unavailable:'Fenêtre w2ui indisponible',refresh:'Actualiser l’affichage',sync:'Charger les données ISO locales',distributedSync:'Synchroniser le catalogue distribué',changesLoad:'Charger le journal des évolutions',rssSync:'Actualiser les flux RSS locaux',import:'Importer un fichier JSONL',add:'Ajouter au radar'},
    en:{manage:'Manage sources',heading:'ISO catalogue sources',state:'Catalogue status',activity:'Operation log',ready:'No operation started.',started:'Command started: {{name}}',returned:'Application feedback: {{message}}',silent:'Command triggered; no result confirmed. Check catalogue status.',failed:'Command failed: {{message}}',missing:'Command unavailable in this deployment',help:'The distributed ISO catalogue installs automatically. “Sync distributed catalogue” checks for updates. JSONL imports, local ISO files, RSS feeds, and change journals are separate optional operations.',unavailable:'w2ui dialog unavailable',refresh:'Refresh display',sync:'Load local ISO data',distributedSync:'Sync distributed catalogue',changesLoad:'Load change journal',rssSync:'Refresh local RSS feeds',import:'Import a JSONL file',add:'Add to radar'}
  };
  const OPERATIONS=['refresh','sync','distributedSync','changesLoad','rssSync','import'];
  const previous=root.__radarStandardsPanel;
  if(!previous?.initialize||previous.__sourceManagerInstalled)return;
  const state={bar:null,originals:new Map(),manage:null,add:null,status:null,mode:'ics',log:null,snapshot:null,observer:null};
  function lang(){return String(root.i18next?.resolvedLanguage||root.i18next?.language||'fr').split('-')[0];}
  function tr(key,values={}){const fallback=(MESSAGES[lang()]||MESSAGES.fr)[key]||MESSAGES.fr[key]||key;const t=root.i18next?.t?.('isoSourceManager.'+key,{defaultValue:fallback,...values})||fallback;const text=t==='isoSourceManager.'+key?fallback:t;return String(text).replace(/\{\{\s*(\w+)\s*\}\}/g,(_,name)=>String(values[name]??''));}
  function registerTranslations(){for(const l of ['fr','en'])root.i18next?.addResourceBundle?.(l,'translation',{[KEY]:MESSAGES[l]},true,true);}
  function updateVisible(){if(state.manage){state.manage.textContent=tr('manage');state.manage.title=tr('manage');}if(state.add)state.add.style.display=state.mode==='references'?'':'none';}
  function disconnect(){state.observer?.disconnect();state.observer=null;state.log=null;state.snapshot=null;}
  function setLog(text){if(state.log){state.log.textContent=text;state.log.setAttribute('data-iso-operation-status',text);}}
  function statusText(){return String(state.status?.textContent||'').trim();}
  function sourceStatus(){
    const startup=root.__radarIsoStartup;
    const count=Number(root.__radarIsoWindowedCount||0);
    const labels={
      ready:'Catalogue installé',
      existing:'Catalogue conservé',
      running:'Installation en cours',
      failed:'Installation échouée'
    };
    const label=labels[startup?.status]||'État à vérifier';
    return label+
      (startup?.release?' · '+startup.release:'')+
      (count>0?' · '+count.toLocaleString('fr-FR')+
        ' notices ISO':'')+
      (startup?.status==='failed'&&startup.message
        ?' · '+startup.message:'');
  }
  function watchStatus(initial){
    state.snapshot=initial;
    if(typeof root.MutationObserver!=='function'||!state.status)return;
    state.observer=new root.MutationObserver(()=>{
      const current=statusText();
      if(current&&current!==state.snapshot){state.snapshot=current;setLog(tr('returned',{message:current}));}
    });
    state.observer.observe(state.status,{childList:true,characterData:true,subtree:true});
  }
  function runOperation(op){
    const original=state.originals.get(op);
    if(!original){setLog(tr('missing'));return;}
    const before=statusText();
    setLog(tr('started',{name:tr(op)}));
    try{
      // Dispatch synchronously inside the real user gesture (required for file pickers).
      original.click();
      const after=statusText();
      if(after&&after!==before){state.snapshot=after;setLog(tr('returned',{message:after}));}
      // Do not claim success without feedback from the original command.
      // The popup stays open, so errors/status remain visible to the operator.
    }catch(error){setLog(tr('failed',{message:error?.message||String(error)}));}
  }

  // S14.2-B: explanatory illustrations, separate from actual operations.
  const SOURCE_GUIDES={
    fr:{
      refresh:['Actualiser l’affichage',
        'Relit les informations déjà disponibles pour actualiser la vue.',
        ['Données disponibles','Lecture','Vue du catalogue'],
        'N’installe pas une nouvelle distribution.'],
      sync:['Charger les données ISO locales',
        'Charge des fichiers ISO locaux si le déploiement en propose.',
        ['Fichiers locaux','Chargement','Catalogue consultable'],
        'Cette source est facultative.'],
      distributedSync:['Synchroniser le catalogue distribué',
        'Vérifie et installe les données de référence ISO publiées.',
        ['Fichiers publiés','Synchronisation','Catalogue local'],
        'Peut actualiser la génération ISO du navigateur ; ne modifie pas les blips.'],
      changesLoad:['Charger le journal des évolutions',
        'Consulte les différences de métadonnées entre publications ISO.',
        ['Publications ISO','Journal','Évolutions affichées'],
        'Le journal est facultatif.'],
      rssSync:['Actualiser les flux RSS locaux',
        'Charge les actualités RSS lorsque leur source locale est configurée.',
        ['Flux RSS','Cache des actualités','Actualités affichées'],
        'Les actualités sont distinctes du catalogue ISO.'],
      import:['Importer un fichier JSONL',
        'Ouvre le sélecteur de fichiers pour importer des notices ISO.',
        ['Fichier choisi','Import JSONL','Notices locales'],
        'Vérifiez la provenance du fichier avant de l’importer.']
    },
    en:{
      refresh:['Refresh display',
        'Re-reads available information to refresh the catalogue view.',
        ['Available data','Read','Catalogue view'],
        'Does not install a new distribution.'],
      sync:['Load local ISO data',
        'Loads local ISO files when provided by this deployment.',
        ['Local files','Load','Catalogue view'],
        'This source is optional.'],
      distributedSync:['Sync distributed catalogue',
        'Checks and installs published ISO reference data.',
        ['Published files','Synchronize','Local catalogue'],
        'May update the browser ISO generation; does not modify blips.'],
      changesLoad:['Load change journal',
        'Reads metadata changes between published ISO releases.',
        ['ISO releases','Change journal','Displayed changes'],
        'The journal is optional.'],
      rssSync:['Refresh local RSS feeds',
        'Loads RSS news when local sources are configured.',
        ['RSS feeds','News cache','Displayed news'],
        'News is separate from the ISO catalogue.'],
      import:['Import JSONL file',
        'Opens a file chooser to import ISO records.',
        ['Chosen file','JSONL import','Local records'],
        'Check the provenance of the file before importing.']
    }
  };

  function sourceGuideDiagram(doc,nodes){
    const ns='http://www.w3.org/2000/svg';
    const svg=doc.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 600 126');
    svg.setAttribute('role','img');
    svg.setAttribute('aria-label',nodes.join(' → '));
    svg.style.cssText='width:100%;height:auto;max-height:145px';

    function add(tag,attrs,text){
      const el=doc.createElementNS(ns,tag);
      for(const [key,value] of Object.entries(attrs))
        el.setAttribute(key,String(value));
      if(text!==undefined)el.textContent=text;
      svg.appendChild(el);
    }

    nodes.forEach((label,index)=>{
      const x=4+index*202;
      add('rect',{x,y:20,width:180,height:82,rx:10,
        fill:'#e8f0fa',stroke:'#6985a3','stroke-width':1.5});
      const words=label.split(' ');
      const split=Math.ceil(words.length/2);
      const first=words.slice(0,split).join(' ');
      const second=words.slice(split).join(' ');
      add('text',{x:x+90,y:second?55:66,
        'text-anchor':'middle','font-size':13,fill:'#213b59'},first);
      if(second)add('text',{x:x+90,y:75,
        'text-anchor':'middle','font-size':13,fill:'#213b59'},second);
      if(index<2){
        const a=x+184;
        add('path',{d:'M'+a+' 61 h12 m-5 -5 l5 5 -5 5',
          fill:'none',stroke:'#456b94','stroke-width':2});
      }
    });
    return svg;
  }

  function renderSourceGuide(op){
    const doc=root.document;
    const target=doc.getElementById('iso-source-manager-guide');
    if(!target ||
       typeof target.replaceChildren!=='function' ||
       typeof doc.createElementNS!=='function')return;
    const entry=(SOURCE_GUIDES[lang()]||SOURCE_GUIDES.fr)[op];
    if(!entry)return;
    const [title,description,steps,effect]=entry;

    target.replaceChildren();
    const h=doc.createElement('h3');
    h.textContent=title;
    h.style.cssText='font-size:16px;margin:0 0 9px';
    const p=doc.createElement('p');
    p.textContent=description;
    p.style.cssText='line-height:1.5;margin:0 0 8px';
    const result=doc.createElement('p');
    result.textContent=effect;
    result.style.cssText=
      'line-height:1.5;margin:8px 0 0;padding:8px;border-left:3px solid #6985a3';
    const info=doc.createElement('button');
    info.type='button';
    info.className='w2ui-btn';
    info.textContent='?';
    info.title=lang()==='en'?
      'Explain the selected action':'Expliquer l’action sélectionnée';
    info.setAttribute('aria-label',info.title);
    info.addEventListener('click',()=>renderSourceGuide(op));
    target.append(h,info,p,sourceGuideDiagram(doc,steps),result);
  }

  function renderDataGuide(){
    const doc=root.document;
    const target=doc.getElementById('iso-source-manager-data-guide');
    if(!target ||
       typeof target.replaceChildren!=='function' ||
       typeof doc.createElementNS!=='function')return;
    const english=lang()==='en';
    const entries=english?[
      ['Source','Origin of the information.'],
      ['Dataset','A coherent collection of data.'],
      ['Distribution','Published files used to transfer a dataset.'],
      ['Datastore','The place where application data is kept.'],
      ['Browser storage','Local IndexedDB, not the published files.'],
      ['Radar data','Blips, selections, groups and revisions.']
    ]:[
      ['Source','Origine des informations.'],
      ['Dataset','Ensemble cohérent de données.'],
      ['Distribution','Fichiers publiés permettant de transférer un dataset.'],
      ['Datastore','Espace dans lequel des données sont conservées.'],
      ['Stockage du navigateur','IndexedDB local, distinct des fichiers publiés.'],
      ['Données des radars','Blips, sélections, groupes et révisions.']
    ];

    const details=doc.createElement('details');
    details.style.cssText='padding:9px;border:1px solid #ccc;border-radius:6px';
    const summary=doc.createElement('summary');
    summary.textContent=english?'Understand the data':'Comprendre les données';
    summary.style.cssText='cursor:pointer;font-weight:600';
    details.appendChild(summary);

    const body=doc.createElement('div');
    body.style.cssText='padding-top:9px;line-height:1.5';
    body.appendChild(sourceGuideDiagram(doc,english?
      ['Published files','Browser storage','ISO catalogue']:
      ['Fichiers publiés','Stockage local','Catalogue ISO']));

    for(const [term,description] of entries){
      const p=doc.createElement('p');
      p.style.cssText='margin:5px 0';
      const strong=doc.createElement('strong');
      strong.textContent=term+' : ';
      p.append(strong,doc.createTextNode(description));
      body.appendChild(p);
    }
    details.appendChild(body);
    target.replaceChildren(details);
  }

  function openManager(){
    if(typeof root.w2form!=='function'||!root.w2popup){
      if(state.status)state.status.textContent=tr('unavailable');
      return;
    }
    disconnect();
    try{root.w2ui?.isoSourceManagerForm?.destroy?.();}catch(_){}
    const existing=OPERATIONS.filter(op=>state.originals.has(op));
    root.w2popup.open({
      title:tr('heading'),width:960,height:650,
      body:'<div style="height:100%;display:flex;flex-direction:column;padding:12px;gap:10px;box-sizing:border-box">'+
        '<div id="iso-source-manager-form-container" style="flex:0 0 104px;min-height:0"></div>'+
        '<div id="iso-source-manager-help" style="font:13px Arial,sans-serif;color:#555"></div>'+
        '<div style="flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px">'+
          '<div id="iso-source-manager-actions" style="display:grid;grid-template-columns:1fr;align-content:start;gap:8px"></div>'+
          '<section id="iso-source-manager-guide" role="region" aria-label="Aide visuelle du catalogue ISO" style="padding:12px;min-width:0;border:1px solid #bccbd9;border-radius:8px;background:#f7f9fc;color:#24364b"></section>'+
        '</div>'+
        '<div id="iso-source-manager-data-guide"></div>'+
        '<div style="font:13px Arial,sans-serif;font-weight:bold" id="iso-source-manager-activity-label"></div>'+
        '<div role="status" aria-live="polite" id="iso-source-manager-activity" style="padding:9px;min-height:32px;max-height:90px;overflow:auto;white-space:pre-wrap;border:1px solid #ccc;border-radius:4px;font:13px Arial,sans-serif"></div></div>',
      onOpen(event){
        event.onComplete=()=>{
          const d=root.document;
          const container=d.getElementById('iso-source-manager-form-container');
          const actions=d.getElementById('iso-source-manager-actions');
          const help=d.getElementById('iso-source-manager-help');
          const label=d.getElementById('iso-source-manager-activity-label');
          state.log=d.getElementById('iso-source-manager-activity');
          if(!container||!actions||!state.log)return;
          if(help)help.textContent=tr('help');
          if(label)label.textContent=tr('activity');
          setLog(tr('ready'));

          const form=new root.w2form({
            name:'isoSourceManagerForm',focus:-1,
            fields:[{
              field:'catalogueStatus',type:'textarea',
              html:{label:tr('state'),span:12,
                attr:'readonly style="width:96%;height:54px;white-space:pre-wrap"'}
            }],
            record:{catalogueStatus:sourceStatus()},
            actions:{}
          });
          form.render(container);
          watchStatus(statusText());

          for(const op of existing){
            const button=d.createElement('button');
            button.type='button';
            button.className='w2ui-btn';
            button.textContent=tr(op);
            button.style.cssText=
              'flex:1;min-height:36px;white-space:normal;text-align:left;padding:6px 10px';
            button.addEventListener('mouseenter',()=>renderSourceGuide(op));
            button.addEventListener('focus',()=>renderSourceGuide(op));
            button.addEventListener('click',()=>runOperation(op));

            // Preserve the historical direct-child actions contract.
            // Hover and keyboard focus only update the visual guide.
            actions.appendChild(button);
          }

          renderSourceGuide(existing.includes('distributedSync')?
            'distributedSync':existing[0]);
          renderDataGuide();
        };
      },
      onClose(){
        disconnect();
        try{root.w2ui?.isoSourceManagerForm?.destroy?.();}catch(_){}
      }
    });
  }
  let languageBound=false;
  function bindLanguage(){if(languageBound||!root.i18next?.on)return;root.i18next.on('languageChanged',()=>{registerTranslations();updateVisible();});languageBound=true;}
  function decorate(node){
    registerTranslations();bindLanguage();
    const bar=node?.querySelector?.('[data-catalog-mode]')?.parentElement;
    if(!bar||bar.dataset.isoSourceManagerReady==='1')return;
    state.bar=bar;state.status=node.querySelector?.('[role="status"]');
    for(const op of OPERATIONS){const button=Array.from(bar.querySelectorAll('button')).find(b=>b.dataset?.isoTranslation===op);if(!button)continue;state.originals.set(op,button);button.style.display='none';button.setAttribute('aria-hidden','true');button.tabIndex=-1;}
    state.add=Array.from(bar.querySelectorAll('button')).find(b=>b.dataset?.isoTranslation==='add')||null;
    const manage=root.document.createElement('button');state.manage=manage;manage.type='button';manage.dataset.isoManageSources='true';manage.className='w2ui-btn';manage.addEventListener('click',openManager);
    const search=bar.querySelector('input[type="search"]');if(search?.nextSibling)bar.insertBefore(manage,search.nextSibling);else bar.appendChild(manage);
    bar.addEventListener('click',event=>{const btn=event.target?.closest?.('[data-catalog-mode]');if(!btn)return;state.mode=btn.dataset.catalogMode;updateVisible();});
    bar.dataset.isoSourceManagerReady='1';updateVisible();
  }
  root.__radarStandardsPanel=Object.freeze({...previous,__sourceManagerInstalled:true,initialize(...args){const result=previous.initialize.apply(previous,args);if(result!==false)decorate(args[0]);return result;}});
  registerTranslations();
  root.__radarIsoToolbar=Object.freeze({operations:OPERATIONS.slice(),labels:MESSAGES});
})(window);
