/* S14-K-R1: revision dialogs; presentation only, no lifecycle mutation. */
(function(root){
 'use strict';
 const dict={
  fr:{select:'Sélectionner une révision',revision:'Révision',choose:'Choisir une révision',show:'Afficher la révision',cancel:'Annuler',draft:'Brouillon',published:'Publiée',archived:'Archivée',noVersion:'Sans version',confirmPublish:'Publier cette révision ? Les blips seront figés.',confirmArchive:'Archiver cette révision publiée ? Elle restera consultable et exportable.',confirmDraft:'Créer ou ouvrir une révision de travail ?',remember:'Exportez ensuite le catalogue JSON pour conserver le changement.',missing:'Sélectionnez une révision.',failed:'Opération impossible',onlyDraft:'La publication est possible uniquement depuis un brouillon.',onlyPublished:'L’archivage est possible uniquement depuis une révision publiée.',draftCreated:'Révision de travail créée',draftOpened:'Révision de travail ouverte',draftFailure:'Création de la révision refusée',noRevision:'Sélectionnez d’abord une révision du catalogue.'},
  en:{select:'Select revision',revision:'Revision',choose:'Choose a revision',show:'Show revision',cancel:'Cancel',draft:'Draft',published:'Published',archived:'Archived',noVersion:'No version',confirmPublish:'Publish this revision? Its blips will be frozen.',confirmArchive:'Archive this published revision? It will remain viewable and exportable.',confirmDraft:'Create or open a working draft?',remember:'Export the JSON catalog afterwards to preserve the change.',missing:'Select a revision.',failed:'Operation failed',onlyDraft:'Only a draft revision can be published.',onlyPublished:'Only a published revision can be archived.',draftCreated:'Working draft created',draftOpened:'Working draft opened',draftFailure:'Draft creation rejected',noRevision:'Select a catalog revision first.'}
 };
 let registeredI18n=null;
 function t(key){
  const instance=root.i18next;
  if(instance?.addResourceBundle && registeredI18n!==instance){
   for(const language of ['fr','en'])instance.addResourceBundle(language,'translation',{menu:{revisionDialogs:dict[language]}},true,true);
   registeredI18n=instance;
  }
  const language=String(instance?.resolvedLanguage||instance?.language||'fr').toLowerCase().split('-')[0];
  const fallback=(dict[language]||dict.en)[key]||key;
  const full='menu.revisionDialogs.'+key;
  const value=instance?.t?.(full,{defaultValue:fallback});
  return !value||value===full?fallback:value;
 }
 function revisionName(revision,index){
  const named=root.__radarCatalogPersistence?.getRevisionLabel?.(revision.revisionId);
  return named || (Number.isInteger(index)&&index>=0?'r'+(index+1):revision.revisionId);
 }

 function label(revision,index){
  const name=revisionName(revision,index);
  const v=revision.version||revision.semanticVersion||'';
  const version=String(v).replace(/(?:-draft-local|:draft:local)+$/g,'');
  return [name,version||null,t(revision.status)].filter(Boolean).join(' — ');
 }
 function showMessage(message){if(typeof root.w2alert==='function')root.w2alert(message);else root.alert?.(message);}
 function openPicker(groups,activate,resolve){
  if(!Array.isArray(groups)||!groups.length)throw Error(t('missing'));
  if(typeof root.w2form!=='function'||!root.w2popup?.open)throw Error('w2form / w2popup unavailable');
  const entries=groups.map((group,i)=>({group,revision:resolve(group),index:i})).filter(v=>v.revision);
  if(!entries.length)throw Error(t('missing'));
  const options=entries.map(entry=>({id:entry.group,text:label(entry.revision,entry.index)}));
  const active=root.__radarRevisionSession?.status?.().activeGroup;
  let form=null;
  const name='radarRevisionSelectionForm';
  function cleanup(){if(form){try{form.destroy();}catch(_){}form=null;}}
  function submit(){try{
   const selected=form?.record?.revisionGroup;
   const group=typeof selected==='string'?selected:selected?.id;
   if(!entries.some(v=>v.group===group))throw Error(t('missing'));
   activate(group);root.w2popup.close();
  }catch(e){showMessage(t('failed')+': '+e.message);}}
  root.w2popup.open({title:t('select'),width:560,height:265,modal:true,
   body:'<div id="radar-revision-picker-w2form" style="padding:10px;height:100%;box-sizing:border-box"></div>',
   actions:{[t('cancel')]:()=>root.w2popup.close(),[t('show')]:()=>submit()},
   onOpen(event){event.onComplete=()=>{
    const panel=root.document.getElementById('radar-revision-picker-w2form');if(!panel)return;
    form=new root.w2form({name:name,focus:-1,style:'border:0;background:transparent',
     fields:[{field:'revisionGroup',type:'list',required:true,html:{label:t('revision'),span:4,attr:'style="width:100%;height:32px;min-height:32px"'},options:{items:options}}],
     record:{revisionGroup:options.find(v=>v.id===active)||options[0]},actions:{}});
    form.render(panel);
   };},onClose(event){event.onComplete=cleanup;}
  });
 }
 function confirmLifecycle(action,callback){
  const message=t(action==='publish'?'confirmPublish':'confirmArchive')+' '+t('remember');
  if(typeof root.w2confirm==='function'){
   const promise=root.w2confirm(message);
   if(promise&&typeof promise.yes==='function'){promise.yes(callback);return;}
  }
  if(root.confirm?.(message))callback();
 }
 root.__radarRevisionDialogs=Object.freeze({t,label,revisionName,openPicker,confirmLifecycle});
})(window);
