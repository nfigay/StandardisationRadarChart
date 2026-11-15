/* Local reference register. Standards are owned exclusively by catalog persistence.
 * Neither manual declaration nor a display label is evidence of SDO verification.
 * No network lookup, no second standards store, no automatic identity matching.
 */
(function(root){
 'use strict';
  // Register in the existing application i18next instance, never a second instance.
  var dict={
  "fr": {
    "title": "Références normatives",
    "caption": "Registre du catalogue JSON — cette déclaration manuelle ne vérifie pas les informations auprès des organismes.",
    "search": "Rechercher : désignation, organisme, titre…",
    "searchLabel": "Rechercher une référence",
    "none": "Sélection : aucune",
    "selection": "Sélection : {{value}}",
    "empty": "Aucune référence trouvée.",
    "declare": "Déclarer une référence locale non vérifiée",
    "name": "Titre déclaré",
    "issuer": "Organisme déclaré",
    "designation": "Désignation",
    "editionDesignation": "Édition (si connue)",
    "sourceName": "Source déclarée (facultative)",
    "sourceUrl": "URL source HTTPS (facultative)",
    "save": "Enregistrer la déclaration locale",
    "saved": "Référence locale enregistrée (non vérifiée) : {{id}}",
    "project": "Ajouter au radar actif",
    "close": "Fermer",
    "unknown": "Inconnue",
    "unverified": "Non vérifiée",
    "source-verified": "Vérifiée par la source",
    "required": "Renseignez le titre, l’organisme et la désignation.",
    "long": "Un champ dépasse 200 caractères.",
    "https": "L’URL source doit utiliser HTTPS.",
    "duplicate": "Cette référence existe déjà : sélectionnez la notice existante.",
    "uuid": "Générateur d’identifiants sécurisé indisponible.",
    "select": "Sélectionnez une référence.",
    "draft": "Sélectionnez un brouillon du catalogue.",
    "failed": "Opération impossible. Consultez la console pour les détails techniques."
  },
  "en": {
    "title": "Standard references",
    "caption": "JSON catalog register — this manual declaration does not verify information with standards organizations.",
    "search": "Search: designation, issuer, title…",
    "searchLabel": "Search references",
    "none": "Selection: none",
    "selection": "Selection: {{value}}",
    "empty": "No references found.",
    "declare": "Declare an unverified local reference",
    "name": "Declared title",
    "issuer": "Declared issuer",
    "designation": "Designation",
    "editionDesignation": "Edition (if known)",
    "sourceName": "Declared source (optional)",
    "sourceUrl": "HTTPS source URL (optional)",
    "save": "Save local declaration",
    "saved": "Local reference saved (unverified): {{id}}",
    "project": "Add to active radar",
    "close": "Close",
    "unknown": "Unknown",
    "unverified": "Unverified",
    "source-verified": "Source verified",
    "required": "Enter the title, issuer and designation.",
    "long": "A field exceeds 200 characters.",
    "https": "The source URL must use HTTPS.",
    "duplicate": "This reference already exists: select the existing record.",
    "uuid": "Secure ID generator unavailable.",
    "select": "Select a reference.",
    "draft": "Select a catalog draft.",
    "failed": "Operation failed. See the console for technical details."
  }
};
  Object.assign(dict.fr,{lifecycle:'Cycle de vie de la référence',impact:'Dépendances dans le catalogue et la session',unused:'Aucune dépendance détectée. La suppression est possible.',inUse:'Référence utilisée : aucune suppression ni modification de notice autorisée.',blip:'Blip',assessment:'Évaluation',other:'Autre lien métier',remove:'Supprimer la référence',confirmRemove:'Je confirme la suppression définitive de cette référence inutilisée.',removed:'Référence supprimée.',sources:'Comparer avec les sources / consulter les éditions',sourceHint:'Les notices publiées ne sont pas modifiées. Les autres éditions peuvent être intégrées séparément.',draftState:'Brouillon',publishedState:'Publiée',archivedState:'Archivée'});
  Object.assign(dict.en,{lifecycle:'Reference lifecycle',impact:'Dependencies in the catalog and session',unused:'No dependency detected. Removal is possible.',inUse:'Reference in use: removal and record changes are blocked.',blip:'Blip',assessment:'Assessment',other:'Other business link',remove:'Remove reference',confirmRemove:'I confirm permanent removal of this unused reference.',removed:'Reference removed.',sources:'Compare with sources / browse editions',sourceHint:'Published records are not changed. Other editions may be integrated separately.',draftState:'Draft',publishedState:'Published',archivedState:'Archived'});
  var registeredI18n=null;
  function t(key,options){
    var instance=root.i18next;
    if(instance?.addResourceBundle && registeredI18n!==instance){
      for(var language of ['fr','en'])instance.addResourceBundle(language,'translation',{menu:{standardRegister:dict[language]}},true,true);
      registeredI18n=instance;
    }
    var locale=String(instance?.resolvedLanguage||instance?.language||'fr').toLowerCase().split('-')[0];
    var fallback=(dict[locale]||dict.en)[key]||key;
    var full='menu.standardRegister.'+key;
    var value=instance?.t?.(full,{...options,defaultValue:fallback});
    if(value&&value!==full)return value;
    return fallback.replace(/\{\{(\w+)\}\}/g,(_,name)=>String(options?.[name]??''));
  }
 function fail(message){throw Error('Standard registry: '+message);}
 var errorKeys={'Catalog persistence: reference already declared; select the existing reference':'duplicate','reference already declared; select the existing reference':'duplicate','title, issuer and designation required':'required','field exceeds 200 characters':'long','source URL must use HTTPS':'https','secure UUID unavailable':'uuid','sélectionner une référence':'select','sélectionner une révision draft du catalogue':'draft'};
 function errorMessage(error){var key=errorKeys[String(error?.message||error).replace(/^Standard registry: /,'')];if(!key)root.console?.error?.('Standard registry rejected',error);return t(key||'failed');}
 function verification(value){return t(['unknown','unverified','source-verified'].includes(value)?value:'unknown');}
 function str(v){return typeof v==='string'&&!!v.trim();}
 function clean(v,max){return String(v||'').trim().slice(0,max);}
 function api(){
   var p=root.__radarCatalogPersistence;
   if(!p||typeof p.listReferenceRecords!=='function')fail('catalog persistence unavailable');
   return p;
 }
 function records(query,limit){
   var q=clean(query,200).toLocaleLowerCase();
   var n=Number.isInteger(limit)&&limit>0?Math.min(limit,100):50;
   return api().listReferenceRecords().filter(function(s){return (
    [s.standardId,s.name,s.issuer,s.designation,s.editionDesignation,s.sourceName,s.sourceUrl,s.origin,s.verification].join(' ').toLocaleLowerCase().includes(q)
   );}).slice(0,n);
 }
 function declare(fields){
   if(!fields || !str(fields.name) || !str(fields.issuer) || !str(fields.designation))
     fail('title, issuer and designation required');
   if([fields.name,fields.issuer,fields.designation].some(function(v){return v.trim().length>200;}))
     fail('field exceeds 200 characters');
   if(fields.sourceUrl && !/^https:\/\//i.test(fields.sourceUrl.trim()))
     fail('source URL must use HTTPS');
   var crypto=root.crypto;
   if(!crypto||typeof crypto.randomUUID!=='function')fail('secure UUID unavailable');
   // Always a local declaration, regardless of the declared issuer or source URL.
   return api().declareLocalReference({
     standardId:'standard_'+crypto.randomUUID(),
     name:fields.name.trim(),
     extensions:{referenceDeclaration:{
       designation:fields.designation.trim(),issuer:fields.issuer.trim(),
       editionDesignation:clean(fields.editionDesignation,100)||null,
       sourceName:clean(fields.sourceName,200)||'Manual entry',
       sourceUrl:clean(fields.sourceUrl,500)||null,
       verification:'unverified',origin:'manual',
       declaredAt:new Date().toISOString()
     }}
   });
 }
 function el(d,tag,text){var e=d.createElement(tag);if(text!=null)e.textContent=text;return e;}
 var activeClose=null;
 function close(){activeClose?.();}
 function open(graph,options={}){
   root.__radarApplicationProfile?.require('catalog.declareReference');
   var p=api();
   if(p.status().importedCatalogs!==1)fail('import one JSON catalog first');
   var d=root.document;if(!d)fail('document unavailable');
   if(d.getElementById('standard-reference-register'))return;
   var overlay=el(d,'div');overlay.id='standard-reference-register';
   Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'100002',background:'rgba(0,0,0,.56)',display:'grid',placeItems:'center'});
   var panel=el(d,'section');Object.assign(panel.style,{background:'#fff',color:'#222',borderRadius:'8px',padding:'18px',width:'min(680px,94vw)',maxHeight:'90vh',overflowY:'auto',boxSizing:'border-box',fontFamily:'Arial,sans-serif',fontSize:'14px'});
   var localeBindings=[];
   function bind(node,property,key){function update(){node[property]=t(key);}localeBindings.push(update);update();return node;}
   function translated(tag,key){return bind(el(d,tag),'textContent',key);}
   function closeRegister(){root.i18next?.off?.('languageChanged',refreshLanguage);overlay.remove();if(activeClose===closeRegister)activeClose=null;}
   activeClose=closeRegister;
   var declarationOnly=options.declaration===true;
   var heading=translated('h2',declarationOnly?'declare':'title');heading.style.margin='0 0 10px';panel.appendChild(heading);
   var caption=translated('p','caption');panel.appendChild(caption);
   var search=el(d,'input');search.type='search';bind(search,'placeholder','search');localeBindings.push(function(){search.setAttribute('aria-label',t('searchLabel'));});search.setAttribute('aria-label',t('searchLabel'));if(!declarationOnly)panel.appendChild(search);
   var results=el(d,'div');results.style.margin='12px 0';results.style.maxHeight='220px';results.style.overflowY='auto';if(!declarationOnly)panel.appendChild(results);
   var selected=el(d,'p',t('none'));if(!declarationOnly)panel.appendChild(selected);
   var picked=null,pickedRecord=null,lastSaved=null,lastError=null,projectError=null;
   function updateSelection(){
     var value=pickedRecord?(pickedRecord.designation||pickedRecord.name)+' — '+pickedRecord.name+' / '+verification(pickedRecord.verification):picked;
     selected.textContent=picked?t('selection',{value:value,interpolation:{escapeValue:false}}):t('none');
   }
   function projectMessage(error){return String(error?.message||'').startsWith('Catalog form: ')?root.__radarCatalogCreateForm.errorMessage(error):errorMessage(error);}
   function refreshLanguage(){localeBindings.forEach(function(update){update();});render();updateSelection();if(lastError)msg.textContent=errorMessage(lastError);else if(lastSaved)msg.textContent=t('saved',{id:lastSaved});if(projectError)projectMsg.textContent=projectMessage(projectError);}

   function render(){
     if(declarationOnly)return;
     results.replaceChildren();
     var found=records(search.value,50);
     if(!found.length)results.appendChild(el(d,'p',t('empty')));
     found.forEach(function(r){
       var btn=el(d,'button',(r.designation||r.name)+' — '+r.name+' ['+verification(r.verification)+']');btn.type='button';
       Object.assign(btn.style,{display:'block',width:'100%',textAlign:'left',padding:'7px',margin:'3px 0',whiteSpace:'normal',height:'auto'});
       btn.addEventListener('click',function(){picked=r.standardId;pickedRecord=r;updateSelection();});
       results.appendChild(btn);
     });
   }
   search.addEventListener('input',render);
   var details=el(d,'details');details.open=options.declaration===true;var summary=translated('summary','declare');details.appendChild(summary);
   var form=el(d,'form');Object.assign(form.style,{display:'grid',gap:'7px',padding:'8px 0'});
   function field(key,label,required){
     var wrap=el(d,'label');wrap.appendChild(translated('span',label));wrap.style.display='grid';
     var input=el(d,'input');input.type='text';input.name=key;input.maxLength=key==='sourceUrl'?500:key==='editionDesignation'?100:200;input.required=!!required;
     input.style.height='32px';input.style.boxSizing='border-box';wrap.appendChild(input);form.appendChild(wrap);return input;
   }
   var inputs={name:field('name','name',true),issuer:field('issuer','issuer',true),designation:field('designation','designation',true),editionDesignation:field('editionDesignation','editionDesignation',false),sourceName:field('sourceName','sourceName',false),sourceUrl:field('sourceUrl','sourceUrl',false)};
   var save=translated('button','save');save.type='submit';form.appendChild(save);
   var msg=el(d,'p');msg.setAttribute('role','alert');form.appendChild(msg);
   form.addEventListener('submit',function(ev){
     ev.preventDefault();if(activeClose!==closeRegister)return;var r;
     try{
       var values={};Object.keys(inputs).forEach(function(k){values[k]=inputs[k].value;});
       r=declare(values);
     }catch(e){lastSaved=null;lastError=e;msg.textContent=errorMessage(e);return;}
     picked=r.standardId;pickedRecord=null;lastSaved=r.standardId;lastError=null;msg.textContent=t('saved',{id:r.standardId});
     // The catalogue has committed successfully. UI refresh failures must not be reported as declaration failures.
     if(declarationOnly&&typeof options.onDeclared==='function'){
       try{options.onDeclared(r);closeRegister();}
       catch(e){root.console?.error?.('Reference declared; refresh failed',e);}
       return;
     }
     form.reset();render();updateSelection();
   });
   if(declarationOnly)panel.appendChild(form);else{details.appendChild(form);panel.appendChild(details);}
   var actions=el(d,'div');Object.assign(actions.style,{display:'flex',gap:'8px',marginTop:'14px'});
   var project=translated('button','project');project.type='button';
   var projectMsg=el(d,'span');projectMsg.setAttribute('role','status');
   project.addEventListener('click',function(){if(activeClose!==closeRegister)return;try{
     if(!picked)fail('sélectionner une référence');
     var group=root.__radarRevisionSession?.status?.().activeGroup;
     var r=root.__radarCatalogAdapter?.getRevision?.(group);
     if(!r||r.status!=='draft'||!p.ownsRevision(group,r.revisionId))fail('sélectionner une révision draft du catalogue');
     root.__radarCatalogCreateForm.open(graph,'existing',picked);closeRegister();
   }catch(e){projectError=e;projectMsg.textContent=projectMessage(e);}});
   var close=translated('button','close');close.type='button';close.addEventListener('click',closeRegister);
   if(!declarationOnly)actions.appendChild(project);actions.appendChild(close);panel.appendChild(actions);if(!declarationOnly)panel.appendChild(projectMsg);
   overlay.appendChild(panel);d.body.appendChild(overlay);render();root.i18next?.on?.('languageChanged',refreshLanguage);(declarationOnly?inputs.name:search).focus();return overlay;
 }
 function openLifecycle(graphProvider,id,options={}){
   root.__radarApplicationProfile?.require('catalog.declareReference');
   var p=api(),d=root.document,catalogId=p.status().catalogId;
   var initial=p.referenceImpact(graphProvider?.(),id),row=p.listReferenceRecords().find(r=>r.standardId===id);
   close();var dialog=el(d,'dialog');dialog.id='standard-reference-lifecycle';dialog.style.cssText='box-sizing:border-box;width:min(700px,96vw);max-height:90vh;overflow:auto;padding:18px;border:1px solid #aaa;border-radius:8px;background:white;color:#222;font:14px Arial,sans-serif';
   var heading=el(d,'h2'),name=el(d,'p',row.name+' — '+id),caption=el(d,'h3'),details=el(d,'ul'),message=el(d,'p'),hint=el(d,'p'),confirmLabel=el(d,'label'),confirm=el(d,'input'),confirmText=el(d,'span'),actions=el(d,'div'),remove=el(d,'button'),sources=el(d,'button'),cancel=el(d,'button'),feedback=el(d,'p');
   confirm.type='checkbox';confirm.dataset.lifecycleConfirm='true';confirmLabel.append(confirm,confirmText);remove.dataset.lifecycleRemove='true';sources.dataset.lifecycleSources='true';remove.type=sources.type=cancel.type='button';actions.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';actions.append(remove,sources,cancel);feedback.setAttribute('role','alert');dialog.append(heading,name,caption,details,message,hint,confirmLabel,actions,feedback);d.body.appendChild(dialog);
   var impact=initial;
   function dismiss(){root.i18next?.off?.('languageChanged',render);if(dialog.open)dialog.close();dialog.remove();if(activeClose===dismiss)activeClose=null;}
   function alive(){return activeClose===dismiss&&p.status().catalogId===catalogId;}
   function render(){heading.textContent=t('lifecycle');caption.textContent=t('impact');message.textContent=t(impact.unused?'unused':'inUse');hint.textContent=t('sourceHint');confirmText.textContent=t('confirmRemove');remove.textContent=t('remove');sources.textContent=t('sources');cancel.textContent=t('close');confirmLabel.hidden=!impact.unused;remove.disabled=!impact.unused||!confirm.checked;sources.hidden=!options.onSources;details.replaceChildren();for(var dep of impact.dependencies){var label=dep.kind==='blip'?[t('blip'),dep.label,dep.radarId,dep.revisionId,t(({draft:'draftState',published:'publishedState',archived:'archivedState'})[dep.status]||dep.status)].filter(Boolean).join(' · '):dep.kind==='assessment'?t('assessment')+' · '+dep.assessmentId:t('other')+' · '+dep.location;details.appendChild(el(d,'li',label));}}
   confirm.addEventListener('change',render);cancel.addEventListener('click',dismiss);dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
   remove.addEventListener('click',()=>{if(!alive()||!confirm.checked)return;try{p.removeUnusedReference(graphProvider?.(),id,impact.token);}catch(e){feedback.textContent=errorMessage(e);try{impact=p.referenceImpact(graphProvider?.(),id);confirm.checked=false;render();}catch(_){}return;}dismiss();options.onRemoved?.({standardId:id});});
   sources.addEventListener('click',()=>{if(!alive())return;dismiss();options.onSources?.(row);});
   activeClose=dismiss;root.i18next?.on?.('languageChanged',render);render();if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');cancel.focus();return dialog;
 }
 root.__radarStandardRegistry=Object.freeze({records:records,declare:declare,open:open,close:close,openLifecycle:openLifecycle});
})(window);
