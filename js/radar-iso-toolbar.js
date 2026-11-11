/* S14-L4-R1: observable source commands; do not infer success from a click. */
(function (root) {
  'use strict';
  const KEY='isoSourceManager';
  const MESSAGES={
    fr:{manage:'Gérer les sources',heading:'Sources du catalogue ISO',state:'État du catalogue',activity:'Suivi des opérations',ready:'Aucune opération lancée.',started:'Commande lancée : {{name}}',returned:'Retour de l’application : {{message}}',silent:'Commande déclenchée ; aucun résultat confirmé. Consulter l’état du catalogue.',failed:'Échec de la commande : {{message}}',missing:'Commande indisponible dans ce déploiement',help:'« Charger catalogue ISO » utilise les fichiers déjà servis localement. « Importer JSONL » ouvre le sélecteur de fichiers.',unavailable:'Fenêtre w2ui indisponible',refresh:'Actualiser l’affichage',sync:'Charger les données ISO locales',distributedSync:'Synchroniser le catalogue distribué',changesLoad:'Charger le journal des évolutions',rssSync:'Actualiser les flux RSS locaux',import:'Importer un fichier JSONL',add:'Ajouter au radar'},
    en:{manage:'Manage sources',heading:'ISO catalogue sources',state:'Catalogue status',activity:'Operation log',ready:'No operation started.',started:'Command started: {{name}}',returned:'Application feedback: {{message}}',silent:'Command triggered; no result confirmed. Check catalogue status.',failed:'Command failed: {{message}}',missing:'Command unavailable in this deployment',help:'“Load local ISO data” reads files already served locally. “Import a JSONL file” opens the file picker.',unavailable:'w2ui dialog unavailable',refresh:'Refresh display',sync:'Load local ISO data',distributedSync:'Sync distributed catalogue',changesLoad:'Load change journal',rssSync:'Refresh local RSS feeds',import:'Import a JSONL file',add:'Add to radar'}
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
  function openManager(){
    if(typeof root.w2form!=='function'||!root.w2popup){if(state.status)state.status.textContent=tr('unavailable');return;}
    disconnect();
    try{root.w2ui?.isoSourceManagerForm?.destroy?.();}catch(_){}
    const existing=OPERATIONS.filter(op=>state.originals.has(op));
    root.w2popup.open({title:tr('heading'),width:800,height:530,
      body:'<div style="height:100%;display:flex;flex-direction:column;padding:12px;gap:10px;box-sizing:border-box">'+
        '<div id="iso-source-manager-form-container" style="flex:0 0 104px;min-height:0"></div>'+
        '<div id="iso-source-manager-help" style="font:13px Arial,sans-serif;color:#555"></div>'+
        '<div id="iso-source-manager-actions" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px"></div>'+
        '<div style="font:13px Arial,sans-serif;font-weight:bold" id="iso-source-manager-activity-label"></div>'+
        '<div role="status" aria-live="polite" id="iso-source-manager-activity" style="padding:9px;min-height:32px;overflow:auto;white-space:pre-wrap;border:1px solid #ccc;border-radius:4px;font:13px Arial,sans-serif"></div></div>',
      onOpen(event){event.onComplete=()=>{
        const d=root.document;
        const container=d.getElementById('iso-source-manager-form-container');
        const actions=d.getElementById('iso-source-manager-actions');
        const help=d.getElementById('iso-source-manager-help');
        const label=d.getElementById('iso-source-manager-activity-label');
        state.log=d.getElementById('iso-source-manager-activity');
        if(!container||!actions||!state.log)return;
        help.textContent=tr('help');label.textContent=tr('activity');setLog(tr('ready'));
        const form=new root.w2form({name:'isoSourceManagerForm',focus:-1,fields:[{field:'catalogueStatus',type:'textarea',html:{label:tr('state'),span:12,attr:'readonly style="width:96%;height:54px;white-space:pre-wrap"'}}],record:{catalogueStatus:statusText()},actions:{}});
        form.render(container);
        watchStatus(statusText());
        for(const op of existing){
          const button=d.createElement('button');button.type='button';button.className='w2ui-btn';button.textContent=tr(op);
          button.style.cssText='min-height:32px;white-space:normal;text-align:left;padding:6px 10px';
          button.addEventListener('click',()=>runOperation(op));actions.appendChild(button);
        }
      };},
      onClose(){disconnect();try{root.w2ui?.isoSourceManagerForm?.destroy?.();}catch(_){}}
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
