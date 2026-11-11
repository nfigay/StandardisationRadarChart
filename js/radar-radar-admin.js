/* S14-K-R3: administrative radar names independent of immutable revisions. */
(function(root){
 'use strict';
 const dict={
  fr:{rename:'Renommer le radar',renameRevision:'Nommer la révision',radar:'Nom du radar',revision:'Libellé de la révision',save:'Enregistrer',cancel:'Annuler',empty:'Le nom ne peut pas être vide.',long:'Le nom ne doit pas dépasser 120 caractères.',missing:'Sélectionnez une révision du radar.',export:'Exportez le catalogue JSON pour conserver le nom.',failed:'Renommage impossible'},
  en:{rename:'Rename radar',renameRevision:'Name revision',radar:'Radar name',revision:'Revision label',save:'Save',cancel:'Cancel',empty:'Name cannot be empty.',long:'Name must not exceed 120 characters.',missing:'Select a radar revision.',export:'Export the JSON catalog to preserve the name.',failed:'Unable to rename radar'}
 };
 const t=key=>(dict[String(root.i18next?.language||'fr').startsWith('fr')?'fr':'en'][key]||key);
 function open(kind){
  const isRevision=kind==='revision';
  const group=root.__radarRevisionSession?.status?.().activeGroup;
  const revision=root.__radarCatalogAdapter?.getRevision?.(group);
  const persistence=root.__radarCatalogPersistence;
  if(!revision||!persistence?.renameRadar||!persistence?.renameRevisionLabel)throw Error(t('missing'));
  if(!root.w2popup?.open||typeof root.w2form!=='function')throw Error('w2popup / w2form unavailable');
  const radarId=revision.radarId;
  const initial=isRevision?(persistence.getRevisionLabel(revision.revisionId)||revision.title||''):(persistence.getRadarName(radarId)||revision.title||'');
  let form=null;
  const formName='radarRenameForm';
  function cleanup(){if(form){try{form.destroy();}catch(_){ }form=null;}}
  function close(){root.w2popup.close();}
  function submit(){
   const value=String(form?.record?.radarName||'').trim();
   if(!value){root.w2alert?.(t('empty'));return;}
   if(value.length>120){root.w2alert?.(t('long'));return;}
   try{
    if(isRevision)persistence.renameRevisionLabel(revision.revisionId,value);else persistence.renameRadar(radarId,value);
    root.__radarWorkspaceExplorer?.refresh?.();
    root.__radarCatalogUI?.refreshRadarLabels?.();
    close();root.w2alert?.(t('export'));
   }catch(e){root.w2alert?.(t('failed')+': '+e.message);}
  }
  root.w2popup.open({title:t(isRevision?'renameRevision':'rename'),width:540,height:270,modal:true,
   body:'<div id="radar-rename-w2form" style="height:100%;padding:10px;box-sizing:border-box"></div>',
   actions:{[t('cancel')]:()=>close(),[t('save')]:()=>submit()},
   onOpen(event){event.onComplete=()=>{
    const box=root.document.getElementById('radar-rename-w2form');if(!box)return;
    form=new root.w2form({name:formName,focus:-1,style:'border:0;background:transparent',
     fields:[{field:'radarName',type:'text',required:true,html:{label:t(isRevision?'revision':'radar'),span:4,attr:'maxlength="120" style="width:100%;height:32px"'}}],record:{radarName:initial},actions:{}});
    form.render(box);
   };},onClose(event){event.onComplete=cleanup;}
  });
 }
 root.__radarRadarAdmin=Object.freeze({open,t});
})(window);
