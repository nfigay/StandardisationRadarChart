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
    "caption": "Registre du catalogue JSON local — aucune connexion ni vérification automatique auprès des SDO.",
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
    "uuid": "Générateur d’identifiants sécurisé indisponible.",
    "select": "Sélectionnez une référence.",
    "draft": "Sélectionnez un brouillon du catalogue.",
    "failed": "Opération impossible. Consultez la console pour les détails techniques."
  },
  "en": {
    "title": "Standard references",
    "caption": "Local JSON catalog register — no connection or automatic verification with SDOs.",
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
    "uuid": "Secure ID generator unavailable.",
    "select": "Select a reference.",
    "draft": "Select a catalog draft.",
    "failed": "Operation failed. See the console for technical details."
  }
};
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
 var errorKeys={'title, issuer and designation required':'required','field exceeds 200 characters':'long','source URL must use HTTPS':'https','secure UUID unavailable':'uuid','sélectionner une référence':'select','sélectionner une révision draft du catalogue':'draft'};
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
    [s.standardId,s.name,s.issuer,s.designation,s.sourceName,s.verification].join(' ').toLocaleLowerCase().includes(q)
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
 function open(graph){
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
   function closeRegister(){root.i18next?.off?.('languageChanged',refreshLanguage);overlay.remove();}
   var heading=translated('h2','title');heading.style.margin='0 0 10px';panel.appendChild(heading);
   var caption=translated('p','caption');panel.appendChild(caption);
   var search=el(d,'input');search.type='search';bind(search,'placeholder','search');localeBindings.push(function(){search.setAttribute('aria-label',t('searchLabel'));});search.setAttribute('aria-label',t('searchLabel'));panel.appendChild(search);
   var results=el(d,'div');results.style.margin='12px 0';results.style.maxHeight='220px';results.style.overflowY='auto';panel.appendChild(results);
   var selected=el(d,'p',t('none'));panel.appendChild(selected);
   var picked=null,pickedRecord=null,lastSaved=null,lastError=null,projectError=null;
   function updateSelection(){
     var value=pickedRecord?(pickedRecord.designation||pickedRecord.name)+' — '+pickedRecord.name+' / '+verification(pickedRecord.verification):picked;
     selected.textContent=picked?t('selection',{value:value,interpolation:{escapeValue:false}}):t('none');
   }
   function projectMessage(error){return String(error?.message||'').startsWith('Catalog form: ')?root.__radarCatalogCreateForm.errorMessage(error):errorMessage(error);}
   function refreshLanguage(){localeBindings.forEach(function(update){update();});render();updateSelection();if(lastError)msg.textContent=errorMessage(lastError);else if(lastSaved)msg.textContent=t('saved',{id:lastSaved});if(projectError)projectMsg.textContent=projectMessage(projectError);}

   function render(){
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
   var details=el(d,'details');var summary=translated('summary','declare');details.appendChild(summary);
   var form=el(d,'form');Object.assign(form.style,{display:'grid',gap:'7px',padding:'8px 0'});
   function field(key,label,required){
     var wrap=el(d,'label');wrap.appendChild(translated('span',label));wrap.style.display='grid';
     var input=el(d,'input');input.type='text';input.name=key;input.maxLength=key==='sourceUrl'?500:200;input.required=!!required;
     input.style.height='32px';input.style.boxSizing='border-box';wrap.appendChild(input);form.appendChild(wrap);return input;
   }
   var inputs={name:field('name','name',true),issuer:field('issuer','issuer',true),designation:field('designation','designation',true),editionDesignation:field('editionDesignation','editionDesignation',false),sourceName:field('sourceName','sourceName',false),sourceUrl:field('sourceUrl','sourceUrl',false)};
   var save=translated('button','save');save.type='submit';form.appendChild(save);
   var msg=el(d,'p');msg.setAttribute('role','alert');form.appendChild(msg);
   form.addEventListener('submit',function(ev){ev.preventDefault();try{
     var values={};Object.keys(inputs).forEach(function(k){values[k]=inputs[k].value;});
     var r=declare(values);picked=r.standardId;pickedRecord=null;lastSaved=r.standardId;lastError=null;msg.textContent=t('saved',{id:r.standardId});
     form.reset();render();updateSelection();
   }catch(e){lastSaved=null;lastError=e;msg.textContent=errorMessage(e);}});
   details.appendChild(form);panel.appendChild(details);
   var actions=el(d,'div');Object.assign(actions.style,{display:'flex',gap:'8px',marginTop:'14px'});
   var project=translated('button','project');project.type='button';
   var projectMsg=el(d,'span');projectMsg.setAttribute('role','status');
   project.addEventListener('click',function(){try{
     if(!picked)fail('sélectionner une référence');
     var group=root.__radarRevisionSession?.status?.().activeGroup;
     var r=root.__radarCatalogAdapter?.getRevision?.(group);
     if(!r||r.status!=='draft'||!p.ownsRevision(group,r.revisionId))fail('sélectionner une révision draft du catalogue');
     root.__radarCatalogCreateForm.open(graph,'existing',picked);closeRegister();
   }catch(e){projectError=e;projectMsg.textContent=projectMessage(e);}});
   var close=translated('button','close');close.type='button';close.addEventListener('click',closeRegister);
   actions.appendChild(project);actions.appendChild(close);panel.appendChild(actions);panel.appendChild(projectMsg);
   overlay.appendChild(panel);d.body.appendChild(overlay);render();root.i18next?.on?.('languageChanged',refreshLanguage);search.focus();return overlay;
 }
 root.__radarStandardRegistry=Object.freeze({records:records,declare:declare,open:open});
})(window);
