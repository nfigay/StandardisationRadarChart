/* Local reference register. Standards are owned exclusively by catalog persistence.
 * Neither manual declaration nor a display label is evidence of SDO verification.
 * No network lookup, no second standards store, no automatic identity matching.
 */
(function(root){
 'use strict';
 function fail(message){throw Error('Standard registry: '+message);}
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
   var heading=el(d,'h2','Références normatives / Standard references');heading.style.margin='0 0 10px';panel.appendChild(heading);
   var caption=el(d,'p','Registre du catalogue JSON local — aucune connexion ni vérification automatique auprès des SDO.');panel.appendChild(caption);
   var search=el(d,'input');search.type='search';search.placeholder='Rechercher : désignation, organisme, titre…';search.setAttribute('aria-label','Rechercher une référence');panel.appendChild(search);
   var results=el(d,'div');results.style.margin='12px 0';results.style.maxHeight='220px';results.style.overflowY='auto';panel.appendChild(results);
   var selected=el(d,'p','Sélection : aucune');panel.appendChild(selected);
   var picked=null;
   function render(){
     results.replaceChildren();
     var found=records(search.value,50);
     if(!found.length)results.appendChild(el(d,'p','Aucune référence trouvée.'));
     found.forEach(function(r){
       var btn=el(d,'button',(r.designation||r.name)+' — '+r.name+' ['+(r.verification||'unknown')+']');btn.type='button';
       Object.assign(btn.style,{display:'block',width:'100%',textAlign:'left',padding:'7px',margin:'3px 0',whiteSpace:'normal',height:'auto'});
       btn.addEventListener('click',function(){picked=r.standardId;selected.textContent='Sélection : '+(r.designation||r.name)+' — '+r.name+' / '+r.verification;});
       results.appendChild(btn);
     });
   }
   search.addEventListener('input',render);
   var details=el(d,'details');var summary=el(d,'summary','Déclarer une référence locale non vérifiée');details.appendChild(summary);
   var form=el(d,'form');Object.assign(form.style,{display:'grid',gap:'7px',padding:'8px 0'});
   function field(key,label,required){
     var wrap=el(d,'label',label);wrap.style.display='grid';
     var input=el(d,'input');input.type='text';input.name=key;input.maxLength=key==='sourceUrl'?500:200;input.required=!!required;
     input.style.height='32px';input.style.boxSizing='border-box';wrap.appendChild(input);form.appendChild(wrap);return input;
   }
   var inputs={name:field('name','Titre (déclaré) / Title',true),issuer:field('issuer','Organisme déclaré / Issuer',true),designation:field('designation','Désignation / Designation',true),editionDesignation:field('editionDesignation','Édition (si connue)',false),sourceName:field('sourceName','Source déclarée (facultative)',false),sourceUrl:field('sourceUrl','URL source HTTPS (facultative)',false)};
   var save=el(d,'button','Enregistrer la déclaration locale');save.type='submit';form.appendChild(save);
   var msg=el(d,'p');msg.setAttribute('role','alert');form.appendChild(msg);
   form.addEventListener('submit',function(ev){ev.preventDefault();try{
     var values={};Object.keys(inputs).forEach(function(k){values[k]=inputs[k].value;});
     var r=declare(values);picked=r.standardId;msg.textContent='Référence locale enregistrée (non vérifiée) : '+r.standardId;
     form.reset();render();selected.textContent='Sélection : '+r.standardId;
   }catch(e){msg.textContent=e.message;}});
   details.appendChild(form);panel.appendChild(details);
   var actions=el(d,'div');Object.assign(actions.style,{display:'flex',gap:'8px',marginTop:'14px'});
   var project=el(d,'button','Ajouter au radar actif');project.type='button';
   var projectMsg=el(d,'span');projectMsg.setAttribute('role','status');
   project.addEventListener('click',function(){try{
     if(!picked)fail('sélectionner une référence');
     var group=root.__radarRevisionSession?.status?.().activeGroup;
     var r=root.__radarCatalogAdapter?.getRevision?.(group);
     if(!r||r.status!=='draft'||!p.ownsRevision(group,r.revisionId))fail('sélectionner une révision draft du catalogue');
     overlay.remove();root.__radarCatalogCreateForm.open(graph,'existing',picked);
   }catch(e){projectMsg.textContent=e.message;}});
   var close=el(d,'button','Fermer');close.type='button';close.addEventListener('click',function(){overlay.remove();});
   actions.appendChild(project);actions.appendChild(close);panel.appendChild(actions);panel.appendChild(projectMsg);
   overlay.appendChild(panel);d.body.appendChild(overlay);render();search.focus();return overlay;
 }
 root.__radarStandardRegistry=Object.freeze({records:records,declare:declare,open:open});
})(window);
