// Structural, idempotent, fail-closed patches: preserve unrelated project changes.
function once(text,oldValue,newValue,name){
 if(text.includes(newValue)&&!text.includes(oldValue))return text;
 const n=text.split(oldValue).length-1;if(n!==1)throw Error(name+': expected exactly one anchor, got '+n);
 return text.replace(oldValue,newValue);
}
export function patchCatalogUI(text){
 const start=text.indexOf('  function openRevisionPicker() {');
 const end=text.indexOf('  function openFile() {',start);
 if(start<0||end<0||end<=start)throw Error('revision picker boundaries missing');
 const old=text.slice(start,end);
 if(old.includes('root.__radarRevisionDialogs.openPicker('))return text;
 if(!old.includes("title.textContent='Sélectionner une révision / Select revision'")||!old.includes('root.__radarWorkspaceExplorer.activate(select.value)'))throw Error('unexpected picker implementation');
 const replacement=`  function openRevisionPicker() {\n    var groups=root.__radarCatalogAdapter?.status?.() || [];\n    if(!groups.length)error('no imported revision available');\n    if(!root.__radarWorkspaceExplorer?.activate)error('workspace selection unavailable');\n    if(!root.__radarRevisionDialogs?.openPicker)error('revision w2ui dialog unavailable');\n    return root.__radarRevisionDialogs.openPicker(groups,function(group){\n      root.__radarWorkspaceExplorer.activate(group);\n      var toolbar=root.w2ui?.toolbar,selected=toolbar?.get('item2');\n      var item=selected?.items?.find(function(i){return registry[i.id]===group;});\n      if(item){toolbar.set('item2',{selected:item.id});toolbar.refresh('item2');}\n    },function(group){return root.__radarCatalogAdapter.getRevision(group);});\n  }\n`;
 return text.slice(0,start)+replacement+text.slice(end);
}
export function patchRadar(text){
 if(!text.includes('<script src="./js/radar-revision-dialogs.js"></script>'))text=once(text,'<script src="./js/radar-catalog-ui.js"></script>', '<script src="./js/radar-revision-dialogs.js"></script>\n    <script src="./js/radar-catalog-ui.js"></script>','dialog script');
 const old=`                    const intent=action==='publish'?'publier cette révision et figer ses blips':'archiver cette révision publiée';\n                    if (!window.confirm('Confirmer : '+intent+' ? Enregistrer ensuite le catalogue JSON pour conserver ce changement.')) break;\n                    try {\n                        const result=window.__radarCatalogUI.transitionActiveRevision(action,w2ui.toolbar,cy);\n                        w2alert('Révision '+result.status+'. Sauvegarder le catalogue JSON pour conserver ce changement.');\n                    } catch(error) {\n                        console.error('Revision lifecycle rejected:',error);\n                        w2alert('Revision lifecycle rejected: '+error.message);\n                    }\n                    break;`;
 const replacement=`                    window.__radarRevisionDialogs.confirmLifecycle(action, () => {\n                        try {\n                            const result=window.__radarCatalogUI.transitionActiveRevision(action,w2ui.toolbar,cy);\n                            w2alert(window.__radarRevisionDialogs.t('remember'));\n                        } catch(error) {\n                            console.error('Revision lifecycle rejected:',error);\n                            w2alert(window.__radarRevisionDialogs.t('failed')+': '+error.message);\n                        }\n                    });\n                    break;`;
 text=once(text,old,replacement,'lifecycle confirm');
 const oldStatus=`                        w2alert(action==='publish'\n                            ? 'Publication possible uniquement depuis un brouillon (draft).'\n                            : 'Archivage possible uniquement depuis une révision publiée (published).');`;
 const newStatus=`                        w2alert(window.__radarRevisionDialogs.t(action==='publish' ? 'onlyDraft' : 'onlyPublished'));`;
 text=once(text,oldStatus,newStatus,'lifecycle invalid status');
 text=once(text,"w2alert('Sélectionner d’abord une révision du catalogue.');","w2alert(window.__radarRevisionDialogs.t('noRevision'));",'lifecycle no revision');
 text=once(text,"w2alert('Draft ' + result.action + ': ' + result.group);","w2alert(window.__radarRevisionDialogs.t(result.action==='created' ? 'draftCreated' : 'draftOpened'));",'draft message');
 text=once(text,"w2alert('Draft rejected: ' + error.message);","w2alert(window.__radarRevisionDialogs.t('draftFailure')+': '+error.message);",'draft error');
 return text;
}
