(function(root){
'use strict';
// S19-A4-R7-R3: strategic dossiers live in the active catalog revision, not in a separate library.
const SECTIONS=[['abstract','abstract'],['businessJustification','businessJustification'],['businessBenefits','businessBenefits'],['stakeholders','stakeholders'],['activities','activities'],['actionPlan','actionPlan'],['adoptionStatement','adoptionStatement'],['recommendation','recommendation'],['supportingMaterial','supportingMaterial']];
const I18N={
 fr:{properties:'Propriétés',dossier:'Dossier stratégique',view:'Visualisation',edit:'Création / Édition',full:'Pleine page',restore:'Réduire',actions:'Actions',import:'Importer JSON',create:'Créer un dossier',export:'Exporter la bibliothèque JSON',section:'Rubrique',none:'Aucun dossier associé à cette révision. Créez-le dans le brouillon du radar.',unlinked:'Aucun dossier associé au standard de cette révision',createPrompt:'Créer un dossier intégré au brouillon du radar ?',dossierId:'Dossier',missingEditor:'Module Tiptap indisponible.',importEmpty:'Aucun dossier reconnu',importFailed:'Import refusé',imported:'dossier(s) importé(s) dans cette session.',draftHint:'',bold:'Gras',italic:'Italique',list:'Liste',undo:'Annuler',abstract:'Résumé',businessJustification:'Justification métier',businessBenefits:'Bénéfices métier',stakeholders:'Parties prenantes et gouvernance',activities:'Activités et livrables',actionPlan:"Plan d’action",adoptionStatement:"Déclaration d’adoption",recommendation:'Recommandation',supportingMaterial:'Références et documentation'},
 en:{properties:'Properties',dossier:'Strategic dossier',view:'Preview',edit:'Create / Edit',full:'Full screen',restore:'Restore',actions:'Actions',import:'Import JSON',create:'Create dossier',export:'Export library JSON',section:'Section',none:'No dossier in this revision. Create one in the radar draft.',unlinked:'No dossier linked to this standard in this revision',createPrompt:'Create a dossier in the active radar draft?',dossierId:'Dossier',missingEditor:'Tiptap editor unavailable.',importEmpty:'No compatible dossier found',importFailed:'Import failed',imported:'dossier(s) imported in this session.',draftHint:'',bold:'Bold',italic:'Italic',list:'List',undo:'Undo',abstract:'Abstract',businessJustification:'Business justification',businessBenefits:'Business benefits',stakeholders:'Stakeholders and governance',activities:'Activities and deliverables',actionPlan:'Action plan',adoptionStatement:'Adoption statement',recommendation:'Recommendation',supportingMaterial:'References and supporting material'}
};
function registerTranslations(){const inst=root.i18next;if(!inst?.addResourceBundle)return;for(const lang of ['fr','en'])inst.addResourceBundle(lang,'translation',{s19Rationale:I18N[lang]},true,true);}
function t(key){const inst=root.i18next;const lang=String(inst?.resolvedLanguage||inst?.language||'fr').split('-')[0];const fallback=(I18N[lang]||I18N.fr)[key]||I18N.fr[key]||key;return inst?.t?inst.t('s19Rationale.'+key,{defaultValue:fallback}):fallback;}
registerTranslations();
const COMMANDS=[['bold','B','toggleBold'],['italic','I','toggleItalic'],['underline','U','toggleUnderline'],['strike','S','toggleStrike'],['highlight','▧','toggleHighlight'],['heading1','H1','toggleHeading',{level:1}],['heading','H2','toggleHeading',{level:2}],['heading3','H3','toggleHeading',{level:3}],['heading4','H4','toggleHeading',{level:4}],['paragraph','¶','setParagraph'],['bulletList','☷','toggleBulletList'],['orderedList','1.','toggleOrderedList'],['taskList','☑','toggleTaskList'],['blockquote','❝','toggleBlockquote'],['inlineCode','{ }','toggleCode'],['codeBlock','Code','toggleCodeBlock'],['hardBreak','↵','setHardBreak'],['clearFormat','Tx','clearFormat'],['horizontalRule','―','setHorizontalRule'],['link','URL','link'],['unlink','−URL','unsetLink'],['table','Table','insertTable',{rows:3,cols:3,withHeaderRow:true}],['addRow','+↕','addRowAfter'],['addColumn','+↔','addColumnAfter'],['deleteRow','−↕','deleteRow'],['deleteColumn','−↔','deleteColumn'],['deleteTable','−Table','deleteTable'],['undo','↶','undo'],['redo','↷','redo']];
const LABELS={fr:['Gras','Italique','Souligné','Barré','Surligner','Titre 1','Titre 2','Titre 3','Titre 4','Paragraphe','Liste à puces','Liste numérotée','Liste de tâches','Citation','Code en ligne','Bloc de code','Saut de ligne','Effacer la mise en forme','Séparateur','Lien web','Supprimer le lien','Insérer un tableau','Ajouter une ligne','Ajouter une colonne','Supprimer la ligne','Supprimer la colonne','Supprimer le tableau','Annuler','Rétablir'],en:['Bold','Italic','Underline','Strike','Highlight','Heading 1','Heading 2','Heading 3','Heading 4','Paragraph','Bullet list','Numbered list','Task list','Quote','Inline code','Code block','Hard break','Clear formatting','Divider','Web link','Remove link','Insert table','Add row','Add column','Delete row','Delete column','Delete table','Undo','Redo']};
// S19-R15: W2UI toolbar Color Buttons, based on the native color/text-color item types.
// W2UI owns the picker UI; no custom popup or color palette.
const S19_NATIVE_COLOR_ITEMS=Object.freeze({
 textColor:{kind:'text',type:'text-color',initial:'263648',fr:'Couleur du texte',en:'Text color'},
 highlightColor:{kind:'highlight',type:'color',initial:'FFF2A8',fr:'Surlignage',en:'Highlight'},
 paragraphColor:{kind:'paragraph',type:'color',initial:'F1F5F9',fr:'Fond du paragraphe',en:'Paragraph background'}
});
function s19PickerHex(raw){
 if(raw===null||raw===''||raw==='transparent')return null;
 if(typeof raw!=='string')return undefined;
 const trimmed=raw.trim();
 return /^#?[0-9a-fA-F]{6}$/.test(trimmed)?'#'+trimmed.replace(/^#/,'').toLowerCase():undefined;
}
function s19CaptureSelection(){
 if(editor?.state?.selection)s19ColorSelection={from:editor.state.selection.from,to:editor.state.selection.to};
}
function s19ApplyColor(kind,color){
 if(!editor||!target()?.editable)return false;
 const chain=editor.chain().focus();
 if(s19ColorSelection&&Number.isSafeInteger(s19ColorSelection.from)&&Number.isSafeInteger(s19ColorSelection.to)){
  const limit=editor.state.doc.content.size;
  if(s19ColorSelection.from<=limit&&s19ColorSelection.to<=limit)chain.setTextSelection(s19ColorSelection);
 }
 if(kind==='text')return color?chain.setColor(color).run():chain.unsetColor().run();
 if(kind==='highlight')return color?chain.setHighlight({color}).run():chain.unsetHighlight().run();
 if(kind==='paragraph')return chain.updateAttributes('paragraph',{backgroundColor:color}).run();
 return false;
}
function s19HandleNativeColor(event,action){
 const item=S19_NATIVE_COLOR_ITEMS[action];
 if(!item)return false;
 // In W2UI v2 a color selection is emitted as click with detail.color.
 // A simple click to open the dropdown must never modify the document.
 const detail=event?.detail||{};
 const raw=detail.color??event?.color;
 if(raw===undefined)return true;
 const color=s19PickerHex(raw);
 if(color===undefined){console.warn('S19: invalid W2UI color ignored');return true;}
 s19ApplyColor(item.kind,color);
 return true;
}
const lang=()=>String(root.i18next?.resolvedLanguage||root.i18next?.language||'fr').startsWith('en')?'en':'fr';
const tr=(fr,en)=>lang()==='en'?en:fr;
function navigateReference(attrs){
 const ctx=target(), hit=root.__radarRationaleRenderer?.resolveReference(attrs,ctx?.rev);
 const graph=currentNode?.cy?.(), node=hit&&graph?.getElementById(hit.blipId);
 if(!hit||!node?.length||node.data('working_group')!==ctx.group||node.data('radarchart')?.standardId!==hit.standardId||node.data('radarchart')?.revisionId!==ctx.rev.revisionId||!node.visible()){
  root.alert(tr('Référence indisponible dans le radar actif.','Reference unavailable in the active radar.'));return false;
 }
 if(expanded)byId('s19-full').click();
 // DOM-only marker: no graph data, classes, selection, camera or geometry mutation.
 document.querySelector('.s19-navigation-marker')?.remove();
 const marker=document.createElement('div');marker.className='s19-navigation-marker';document.body.appendChild(marker);
 const started=Date.now();
 function tick(){if(!marker.isConnected)return;if(Date.now()-started>2400||!node.visible()||node.removed()||root.__radarRevisionSession?.status?.().activeGroup!==ctx.group){marker.remove();return;}
 const box=graph.container().getBoundingClientRect(),pos=node.renderedPosition();
 marker.style.left=(box.left+pos.x)+'px';marker.style.top=(box.top+pos.y)+'px';marker.style.width=Math.max(30,node.renderedWidth()+14)+'px';marker.style.height=Math.max(30,node.renderedHeight()+14)+'px';root.requestAnimationFrame(tick);}
 tick();return true;
}

const GROUPS=[{id:'text',fr:'Texte',en:'Text',commands:['bold','italic','underline','strike','highlight','inlineCode','clearFormat','link','unlink']},{id:'paragraph',fr:'Paragraphes',en:'Paragraphs',commands:['paragraph','heading1','heading','heading3','heading4','bulletList','orderedList','taskList','blockquote','codeBlock','hardBreak','horizontalRule']},{id:'table',fr:'Tableau',en:'Table',commands:['table','addRow','addColumn','deleteRow','deleteColumn','deleteTable']},{id:'history',fr:'Historique',en:'History',commands:['undo','redo']}];
const REFLABELS={blip:['Blip','Blip'],standard:['Standard','Standard'],radar:['Radar','Radar'],revision:['Révision','Revision'],organization:['Organisation','Organization'],dossier:['Dossier','Dossier'],source:['Source documentaire','Documentary source'],url:['Lien externe','External link']};
function labelType(type){return (REFLABELS[type]||[type,type])[lang()==='en'?1:0];}
function makeButton(id,text){const b=document.createElement('button');b.type='button';b.dataset.action=id;b.textContent=text;return b;}
// Compact, accessible editor controls; advanced actions remain discoverable in native menus.
const PRIMARY=['bold','italic','heading','strike','bulletList','orderedList','taskList','blockquote','codeBlock','table','link','undo','redo'];
const ICONS={bold:'B',italic:'I',heading:'Tᵀ',strike:'S̶',bulletList:'☷',orderedList:'1≡',taskList:'☑',blockquote:'❞',codeBlock:'〈〉',table:'▦',link:'🔗',undo:'↶',redo:'↷'};
// R16-R1: W2UI menu items use their documented "icon" property.
// W2UI does not ship text-alignment pictograms, so supply local SVG-backed
// icon classes rather than borrowing an unverified third-party icon font.
function s19InstallParagraphMenuIcons(){
 const id='s19-paragraph-menu-icons';
 if(document.getElementById(id))return;
 const lines={
  left:[[2,20],[2,13],[2,20],[2,14]],
  center:[[2,20],[5,17],[2,20],[5,17]],
  right:[[2,20],[9,20],[2,20],[8,20]],
  justify:[[2,20],[2,20],[2,20],[2,20]]
 };
 const css=[];
 for(const [name,coords] of Object.entries(lines)){
  const paths=coords.map(([x1,x2],i)=>'<path d="M'+x1+' '+(4+i*5)+' H'+x2+'"/>').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="#43556d" stroke-width="1.8" stroke-linecap="round">'+paths+'</svg>';
  css.push('.s19-w2ui-align-'+name+'{background-image:url("data:image/svg+xml,'+encodeURIComponent(svg)+'") !important}');
 }
 for(const [name,arrow] of Object.entries({increase:'M2 11h7m-3-3 3 3-3 3',decrease:'M9 11H2m3-3-3 3 3 3',reset:'M2 11h7m-3-3-3 3 3 3'})){
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" fill="none" stroke="#43556d" stroke-width="1.8" stroke-linecap="round"><path d="'+arrow+'"/><path d="M12 4h8M12 9h8M12 14h8M12 19h8"/></svg>';
  css.push('.s19-w2ui-indent-'+name+'{background-image:url("data:image/svg+xml,'+encodeURIComponent(svg)+'") !important}');
 }
 const style=document.createElement('style');style.id=id;
 style.textContent='.s19-w2ui-align-left,.s19-w2ui-align-center,.s19-w2ui-align-right,.s19-w2ui-align-justify,.s19-w2ui-indent-increase,.s19-w2ui-indent-decrease,.s19-w2ui-indent-reset{display:inline-block !important;min-width:22px !important;width:22px !important;height:22px !important;background-repeat:no-repeat !important;background-position:center !important;background-size:20px 20px !important}\n'+css.join('\n');
 document.head.appendChild(style);
}
function s19EditorItems(){
 const label=id=>{const i=COMMANDS.findIndex(c=>c[0]===id);return i<0?id:LABELS[lang()][i];};
 const item=id=>({id,text:label(id)});
 const submenu=(id,fr,en,commands)=>({id,text:tr(fr,en),items:commands.map(item)});
 return [
  {type:'menu',id:'styles',text:tr('Styles','Styles'),items:[
   ...['paragraph','heading1','heading','heading3','heading4','blockquote'].map(item),
   submenu('codeStyles','Code','Code',['inlineCode','codeBlock'])
  ]},
  {type:'menu',id:'text',text:tr('Texte','Text'),items:['bold','italic','underline','strike','clearFormat'].map(item)},
 // Color items use the exact W2UI toolbar types demonstrated in Toolbar / Color Buttons.
 // No text captions on the color swatches: tooltips carry their accessible purpose.
  {type:'break',id:'colorsStart'},
  ...Object.entries(S19_NATIVE_COLOR_ITEMS).map(([id,spec])=>({
   type:spec.type,id,color:spec.initial,
   tooltip:tr(spec.fr,spec.en),
   overlay:{advanced:true,transparent:false}
  })),
  {type:'menu',id:'resetColors',text:tr('Réinitialiser','Reset'),items:[
   {id:'clearTextColor',text:tr('Couleur du texte','Text color')},
   {id:'clearHighlightColor',text:tr('Surlignage','Highlight')},
   {id:'clearParagraphColor',text:tr('Fond du paragraphe','Paragraph background')}
  ]},
  {type:'break',id:'colorsEnd'},
  {type:'menu',id:'paragraphLayout',text:tr('Paragraphe','Paragraph'),items:[
   {id:'alignment',text:tr('Alignement','Alignment'),items:[
    {id:'alignLeft',text:tr('Gauche','Left'),tooltip:tr('Aligner à gauche','Align left'),icon:'s19-w2ui-align-left'},
    {id:'alignCenter',text:tr('Centré','Center'),tooltip:tr('Centrer','Center'),icon:'s19-w2ui-align-center'},
    {id:'alignRight',text:tr('Droite','Right'),tooltip:tr('Aligner à droite','Align right'),icon:'s19-w2ui-align-right'},
    {id:'alignJustify',text:tr('Justifié','Justified'),tooltip:tr('Justifier','Justify'),icon:'s19-w2ui-align-justify'}
   ]},
   {id:'indentIncrease',text:tr('Augmenter le retrait','Increase indent'),icon:'s19-w2ui-indent-increase'},
   {id:'indentDecrease',text:tr('Diminuer le retrait','Decrease indent'),icon:'s19-w2ui-indent-decrease'},
   {id:'indentReset',text:tr('Supprimer le retrait','Remove indent'),icon:'s19-w2ui-indent-reset'}
  ]},
  {type:'menu',id:'lists',text:tr('Listes','Lists'),items:[
   ...['bulletList','orderedList','taskList'].map(item),
   {id:'bulletStyle',text:tr('Symboles des puces','Bullet symbols'),items:[
    {id:'listDisc',text:tr('Disque plein •','Filled circle •')},
    {id:'listCircle',text:tr('Cercle vide ◦','Open circle ◦')},
    {id:'listSquare',text:tr('Carré ▪','Square ▪')}
   ]},
   {id:'numberStyle',text:tr('Type de numérotation','Numbering style'),items:[
    {id:'listDecimal',text:'1, 2, 3'},
    {id:'listLowerAlpha',text:'a, b, c'},
    {id:'listUpperAlpha',text:'A, B, C'},
    {id:'listLowerRoman',text:'i, ii, iii'},
    {id:'listUpperRoman',text:'I, II, III'}
   ]}
  ]},
  {type:'menu',id:'tableMenu',text:tr('Tableau','Table'),items:[
   item('table'),
   {id:'rows',text:tr('Lignes','Rows'),items:[item('addRow'),item('deleteRow'),{id:'setRowHeight',text:tr('Hauteur de ligne…','Row height…')},{id:'resetRowHeight',text:tr('Hauteur automatique','Automatic height')}]},
   {id:'columns',text:tr('Colonnes','Columns'),items:[item('addColumn'),item('deleteColumn'),{id:'setColumnWidth',text:tr('Largeur de colonne…','Column width…')}]},
   item('deleteTable')
  ]},
  {type:'menu',id:'insert',text:tr('Insérer','Insert'),items:['link','unlink','horizontalRule','hardBreak'].map(item)},
  {type:'button',id:'undo',text:'↶',tooltip:label('undo')},
  {type:'button',id:'redo',text:'↷',tooltip:label('redo')}
 ];
}
function s19ApplyLayout(action){
 if(!editor||!target()?.editable)return false;
 const map={alignLeft:'left',alignCenter:'center',alignRight:'right',alignJustify:'justify'};
 const supported=['indentIncrease','indentDecrease','indentReset'];
 if(!Object.hasOwn(map,action)&&!supported.includes(action))return false;
 const chain=editor.chain().focus();
 // W2UI can take focus before the action is dispatched. Restore the saved
 // ProseMirror selection, as we already do for native color controls.
 if(s19ColorSelection&&Number.isSafeInteger(s19ColorSelection.from)&&Number.isSafeInteger(s19ColorSelection.to)){
  const limit=editor.state.doc.content.size;
  if(s19ColorSelection.from<=limit&&s19ColorSelection.to<=limit)chain.setTextSelection(s19ColorSelection);
 }
 if(Object.hasOwn(map,action))return chain.setS19Alignment(map[action]).run();
 return chain.adjustS19Indent(action==='indentIncrease'?1:action==='indentDecrease'?-1:-99).run();
}
const S19_LIST_ACTIONS=Object.freeze({listDisc:'disc',listCircle:'circle',listSquare:'square',listDecimal:'decimal',listLowerAlpha:'lower-alpha',listUpperAlpha:'upper-alpha',listLowerRoman:'lower-roman',listUpperRoman:'upper-roman'});
function s19ApplyListStyle(action){
 if(!editor||!target()?.editable||!Object.hasOwn(S19_LIST_ACTIONS,action))return false;
 const chain=editor.chain().focus();
 if(s19ColorSelection){const limit=editor.state.doc.content.size;
  if(s19ColorSelection.from<=limit&&s19ColorSelection.to<=limit)chain.setTextSelection(s19ColorSelection);}
 return chain.setS19ListStyle(S19_LIST_ACTIONS[action]).run();
}
function s19ApplyTableDimension(action){
 if(!editor||!target()?.editable)return false;
 // Focus is restored after the prompt; preserve the original cell selection.
 const selection=s19ColorSelection||{from:editor.state.selection.from,to:editor.state.selection.to};
 let size=null;
 if(action!=='resetRowHeight'){
  const column=action==='setColumnWidth';
  const raw=root.prompt(column?tr('Largeur de colonne en pixels (45–2000)','Column width in pixels (45–2000)'):
   tr('Hauteur minimale de ligne en pixels (24–800)','Minimum row height in pixels (24–800)'),column?'160':'48');
  if(raw===null)return false;
  const trimmed=String(raw).trim();
  if(!/^\d{1,4}$/.test(trimmed))return false;
  size=Number(trimmed);
  if(column?(size<45||size>2000):(size<24||size>800))return false;
 }
 const chain=editor.chain().focus();const max=editor.state.doc.content.size;
 if(selection.from>=0&&selection.to<=max)chain.setTextSelection(selection);
 return action==='setColumnWidth'?chain.setS19ColumnWidth(size).run():chain.setS19RowHeight(size).run();
}
function s19RunEditorAction(action){
 if(!editor||!target()?.editable)return;
 if(Object.hasOwn(S19_LIST_ACTIONS,action)){s19ApplyListStyle(action);return;}
 if(['setColumnWidth','setRowHeight','resetRowHeight'].includes(action)){s19ApplyTableDimension(action);return;}
 if(['alignLeft','alignCenter','alignRight','alignJustify','indentIncrease','indentDecrease','indentReset'].includes(action)){s19ApplyLayout(action);return;}
 if(['clearTextColor','clearHighlightColor','clearParagraphColor'].includes(action)){
  if(action==='clearTextColor')s19ApplyColor('text',null);
  else if(action==='clearHighlightColor')s19ApplyColor('highlight',null);
  else s19ApplyColor('paragraph',null);
  return;
 }
 const command=COMMANDS.find(c=>c[0]===action);if(!command)return;
 const chain=editor.chain().focus();
 if(action==='link'){
  const href=root.prompt(tr('Adresse HTTPS ou HTTP','HTTPS or HTTP address'),editor.getAttributes('link').href||'https://');
  if(href&&/^https?:\/\/[^\s<>"']+$/i.test(href))chain.extendMarkRange('link').setLink({href}).run();
  return;
 }
 if(action==='clearFormat'){chain.unsetAllMarks().clearNodes().run();return;}
 const fn=chain[command[2]];
 if(typeof fn==='function')fn.call(chain,...(command[3]?[command[3]]:[])).run();
}
function setupRibbon(){
 const host=byId('s19-editor-tools');if(!host)return;
 if(editorRibbon){editorRibbon.destroy();editorRibbon=null;}
 host.replaceChildren();
 s19InstallParagraphMenuIcons();
 host.addEventListener('pointerdown',s19CaptureSelection,{capture:true});
 // Reuse the same W2UI toolbar technology as the standards panel.
 if(typeof root.w2toolbar==='function'){
  try{
   editorRibbon=new root.w2toolbar({name:'s19DocumentRibbon',items:s19EditorItems(),onClick(event){
    // W2UI sends menu ids in the form "parent:child" (also for nested menus).
    const path=String(event.target||event.detail?.target||'');
    const candidate=String(event.subItem?.id||event.detail?.subItem?.id||path.split(':').pop());
    if(s19HandleNativeColor(event,candidate))return;
    const recognized=COMMANDS.some(c=>c[0]===candidate)||['clearTextColor','clearHighlightColor','clearParagraphColor','alignLeft','alignCenter','alignRight','alignJustify','indentIncrease','indentDecrease','indentReset'].includes(candidate)||Object.hasOwn(S19_LIST_ACTIONS,candidate)||['setColumnWidth','setRowHeight','resetRowHeight'].includes(candidate);
    if(recognized)s19RunEditorAction(candidate);
   }});
   editorRibbon.render(host);
   host.classList.add('s19-w2ui-ribbon');
   return;
  }catch(error){console.warn('S19 W2UI ribbon fallback',error);editorRibbon?.destroy?.();editorRibbon=null;}
 }
 // Fail safely if the running host has an older W2UI build; color pickers require native W2UI.
 host.classList.remove('s19-w2ui-ribbon');
 const groups=s19EditorItems();
 for(const group of groups){

  if(group.type==='break'||group.type==='color'||group.type==='text-color')continue;
  if(group.type==='button'){const b=makeButton(group.id,group.text);b.title=group.tooltip;host.appendChild(b);continue;}
  const details=document.createElement('details');details.className='s19-advanced-commands';
  const sum=document.createElement('summary');sum.textContent=group.text;details.appendChild(sum);
  const box=document.createElement('div');box.className='s19-advanced-menu';
  const traverse=items=>{for(const x of items){if(x.items){const heading=document.createElement('strong');heading.textContent=x.text;box.appendChild(heading);traverse(x.items);}else{const b=makeButton(x.id,x.text||x.tooltip||x.id);b.className='s19-menu-command';if(x.style&&/^color:#[0-9a-f]{6}$/i.test(x.style))b.style.color=x.style.slice(6);box.appendChild(b);}}};
  traverse(group.items);details.appendChild(box);host.appendChild(details);
 }
}

function referenceOptions(){const ctx=target(),doc=current(),revision=ctx?.rev;if(!revision)return [];const out=[];const add=x=>{if(x.id&&x.label&&!out.some(y=>y.type===x.type&&y.id===x.id&&y.standardId===x.standardId))out.push(x);};
 for(const b of revision.blips||[]){add({type:'blip',id:b.blipId,standardId:b.standardId,label:b.label||b.standardId});add({type:'standard',id:b.standardId,label:b.standardId});}
 return out;}
function notifyReference(text){const host=byId('s19-reference-notice');if(host)host.textContent=text;}
function navigateRelated(link){const ctx=target(),doc=current(),links=root.__radarRationaleLinks;
 // Cross-revision links are resolved by the authoritative loaded-workspace explorer,
 // not by the current document revision (which only describes the authoring context).
 if(['radar','revision','organization'].includes(link?.type)){
  let ref;try{ref=links?.validate(link);}catch(error){notifyReference(error.message);return false;}
  const navigation=root.__radarWorkspaceExplorer?.navigateRelatedObject?.(ref);
  if(navigation?.ok){notifyReference(tr('Objet sélectionné dans le catalogue.','Object selected in the catalog.'));return true;}
  const message=navigation?.reason==='organization-selected-radar-ambiguous'?
   tr('Organisation sélectionnée ; plusieurs radars disponibles, choisissez une révision.','Organization selected; several radars are available, choose a revision.'):
   navigation?.reason==='ambiguous-revision'?
   tr('Plusieurs révisions possibles : sélection exacte impossible.','Multiple revisions available: exact selection is not possible.'):
   tr('Objet non accessible dans le catalogue chargé.','Object unavailable in the loaded catalog.');
  notifyReference(message);return false;
 }
 const found=links?.resolve(link,ctx?.rev,doc);if(!found){notifyReference(tr('Référence indisponible dans le contexte actuel.','Reference unavailable in the current context.'));return false;}
 if(found.type==='blip')return navigateReference({blipId:found.id,standardId:found.standardId});
 if(found.type==='url'){root.open(found.id,'_blank','noopener,noreferrer');return true;}
 if(found.type==='dossier'){notifyReference(tr('Dossier affiché dans ce panneau.','Dossier displayed in this panel.'));return true;}
 if(found.type==='standard'&&root.__radarStandardsPanel?.openReferences){root.__radarStandardsPanel.openReferences();notifyReference(tr('Registre ouvert, mais la norme n’a pas été sélectionnée.','Registry opened, but the standard was not selected.'));return false;}
 notifyReference(tr('Objet reconnu, mais aucune commande de navigation exacte n’est disponible.','Object recognized, but no exact navigation command is available.'));return false;}
function renderRelated(){const host=byId('s19-related');if(!host)return;host.hidden=false;host.replaceChildren();const doc=current(),links=root.__radarRationaleLinks;const title=addText(host,'h3',tr('Références associées','Related references'));title.className='s19-related-title';if(!doc)return;
 const editable=target()?.editable&&mode==='edit';const items=(links?.list(doc)||[]).map((entry,index)=>({entry,index})).filter(x=>links.TYPES.includes(x.entry.type));
 if(editable){const disclosure=document.createElement('details');disclosure.className='s19-related-add';const toggle=document.createElement('summary');toggle.textContent=tr('Ajouter une référence','Add a reference');disclosure.appendChild(toggle);const form=document.createElement('div');form.className='s19-related-form';const type=document.createElement('select');type.setAttribute('aria-label',tr('Type d’objet','Object type'));for(const key of links.TYPES){const o=document.createElement('option');o.value=key;o.textContent=labelType(key);type.appendChild(o);}
 const search=document.createElement('input');search.type='search';search.placeholder=tr('Rechercher un objet','Search objects');search.setAttribute('aria-label',search.placeholder);const select=document.createElement('select');select.setAttribute('aria-label',tr('Objet du catalogue','Catalog object'));const manual=document.createElement('input');manual.placeholder=tr('URL ou identifiant de source','URL or source identifier');manual.setAttribute('aria-label',manual.placeholder);const caption=document.createElement('input');caption.placeholder=tr('Libellé','Label');caption.setAttribute('aria-label',caption.placeholder);
 const provider=document.createElement('input');provider.placeholder=tr('Source (ISO, W3C, OMG, IETF…)','Provider (ISO, W3C, OMG, IETF…)');provider.setAttribute('aria-label',provider.placeholder);
 const populate=()=>{const typeValue=type.value;select.replaceChildren();for(const obj of referenceOptions().filter(x=>x.type===typeValue&&(!search.value||normalize(x.label+' '+x.id).includes(normalize(search.value))))){const o=document.createElement('option');o.value=JSON.stringify(obj);o.textContent=obj.label;select.appendChild(o);}const typed=typeValue==='url'||typeValue==='source';select.hidden=typed;search.hidden=typed;manual.hidden=!typed;caption.hidden=!typed;provider.hidden=typeValue!=='source';};type.onchange=populate;search.oninput=populate;populate();
 const add=makeButton('addReference',tr('Ajouter la référence','Add reference'));add.onclick=()=>{try{const obj=type.value==='url'||type.value==='source'?{type:type.value,id:manual.value.trim(),label:caption.value.trim(),...(type.value==='source'?{provider:provider.value.trim()}:{})}:JSON.parse(select.value);const updated=links.add(current(),obj);write(updated,true);renderRelated();}catch(e){notifyReference(e.message);}};
 form.append(type,search,select,manual,caption,provider,add);disclosure.appendChild(form);host.appendChild(disclosure);}
 const list=document.createElement('ul');list.className='s19-related-list';items.forEach(({entry,index:i})=>{const li=document.createElement('li');const open=makeButton('navigateRelated',entry.label);open.className='s19-related-link';open.title=labelType(entry.type)+' · '+entry.id;open.onclick=()=>navigateRelated(entry);const meta=addText(li,'small',labelType(entry.type));li.insertBefore(open,meta);if(editable){const del=makeButton('removeReference',tr('Supprimer','Remove'));del.onclick=()=>{if(!root.confirm(tr('Supprimer cette référence ?','Remove this reference?')))return;try{write(links.remove(current(),i),true);renderRelated();}catch(e){notifyReference(e.message);}};li.appendChild(del);}list.appendChild(li);});host.appendChild(list);if(!items.length)addText(host,'p',tr('Aucune référence associée.','No related references.'));
 const status=document.createElement('p');status.id='s19-reference-notice';status.setAttribute('role','status');host.appendChild(status);
}

function updateCommands(){const host=byId('s19-editor-tools');if(!host)return;for(const [i,[id]] of COMMANDS.entries()){const b=host.querySelector('[data-action="'+id+'"]');if(b){b.title=LABELS[lang()][i];b.setAttribute('aria-label',b.title);b.classList.toggle('s19-command-active',!!editor?.isActive?.(id));}}}
const EMPTY=()=>({type:'doc',content:[{type:'paragraph'}]});
const byId=id=>document.getElementById(id);

let editorRibbon=null;
let s19ColorSelection=null;
let currentNode=null,currentId=null,currentSection='businessJustification',mode='view',tab='properties',editor=null,expanded=false,mounted=false,tabs=null,toolbar=null,languageBound=false;
// R19: one live dossier shell, moved between the right pane and a root W2UI layout.
let s19FullscreenLayout=null,s19FullscreenHost=null,s19OriginalParent=null,s19OriginalNext=null;
// R22: the graph's selected node is authoritative, independently of which
// W2UI tab currently has focus. Keep one subscription per Cytoscape core.
let s19SelectionGraph=null;
let s19PropertiesForm=null;
let s19RenderedPropertiesNodeId=null;
let s19PreferredPropertiesTab='Blip';
// R29: enforce the editing lock in Cytoscape itself. A panel-level guard
// alone runs after Cytoscape has already changed :selected.
let s19SelectionLockedNodes=[];
let s19SelectionLockGraph=null;
function s19SetSelectionLock(enabled){
 const graph=currentNode?.cy?.();
 if(!enabled||!graph||graph!==s19SelectionLockGraph){
  for(const node of s19SelectionLockedNodes){
   // Restore ONLY nodes whose selectability we changed, and only if still live.
   if(!node?.removed?.())node.selectify?.();
  }
  s19SelectionLockedNodes=[];s19SelectionLockGraph=null;
 }
 if(!enabled||!graph)return;
 if(s19SelectionLockGraph===graph)return;
 s19SelectionLockGraph=graph;
 for(const node of graph.nodes?.()||[]){
  if(node.id?.()===currentNode.id?.())continue;
  if(!node.data?.('radarchart')?.standardId)continue;
  if(node.selectable?.()===true){node.unselectify?.();s19SelectionLockedNodes.push(node);}
 }
 // Keep the blip being edited selected, independently of Cytoscape's tap order.
 if(currentNode.selectable?.()&&!currentNode.selected?.())currentNode.select?.();
}
function s19PropertiesTab(form){
 const active=form?.tabs?.active||root.w2ui?.blipForm?.tabs?.active;
 return ['Blip','Context','Extra'].includes(active)?active:'Blip';
}
function s19RestorePropertiesTab(form,preferred){
 if(!form?.tabs||!preferred||!form.tabs.tabs?.some?.(item=>item.id===preferred))return;
 // W2UI tabs.click() emits a synthetic click and expects an event object.
 // Set the active page before the new form is rendered, without a click.
 form.tabs.active=preferred;
}
// R27: W2UI property forms are only rendered when their host is visible.
// The dossier panel is a separate view and must not construct a hidden w2form.
function s19RenderPropertiesForm(candidate){
 if(tab!=='properties'||!currentNode?.isNode?.())return false;
 const host=byId('s19-property-form');
 if(!host||byId('s19-body-properties')?.hidden)return false;
 const id=currentNode.id();
 if(s19PropertiesForm&&s19RenderedPropertiesNodeId===id&&host.querySelector('#form'))return true;
 const form=candidate||root.generateFormFromCytoscapeElement?.(currentNode);
 if(!form?.render)return false;
 host.replaceChildren();const dest=document.createElement('div');dest.id='form';host.appendChild(dest);
 // Do not pre-select tabs: w2form.render() internally invokes tabs.click()
 // and the installed W2UI variant throws if an active tab is forced early.
 form.focus=-1;
 try{form.render('#form');}
 catch(error){
  s19RenderedPropertiesNodeId=null;
  // Keep a diagnosable failure, not a false current-form cache.
  throw error;
 }
 s19PropertiesForm=form;s19RenderedPropertiesNodeId=id;
 // Restore the tab only after the widget has finished its own render cycle.
 s19RestorePropertiesTab(form,s19PreferredPropertiesTab);
 form.tabs?.refresh?.();
 return true;
}
function s19SelectedNode(event){
 const node=event?.target;
 if(!node?.isNode?.()||!node.data('radarchart')?.standardId||!node.visible?.())return;
 if(currentNode?.id?.()===node.id()&&currentNode?.cy?.()===node.cy())return;
 // S19-R25: the form is built lazily by showNode, after save validation.
 showNode(node);
}
// R23-R1: a tap must refresh the dossier even when the graph's selection
// remains unchanged (e.g. an already-selected node or a different select mode).
// showNode de-duplicates tap/select for the same node and retains the active tab.
function s19BindGraphSelection(graph){
 if(!graph||graph===s19SelectionGraph)return;
 if(s19SelectionGraph?.off){
  s19SelectionGraph.off('select','node',s19SelectedNode);
  s19SelectionGraph.off('tap','node',s19SelectedNode);
 }
 s19SelectionGraph=graph;
 graph.on?.('select','node',s19SelectedNode);
 graph.on?.('tap','node',s19SelectedNode);
}
function s19FullscreenLabel(){return current()?.standard?.designation||currentNode?.data('label')||t('dossier');}
function s19FullscreenButton(){const btn=byId('s19-full');if(!btn)return;btn.hidden=expanded;btn.style.display=expanded?'none':'';btn.title=t('full');btn.setAttribute('aria-label',btn.title);btn.textContent='⛶';}
function s19ResizeFullscreen(){if(!expanded)return;s19FullscreenLayout?.resize?.();root.w2ui?.mainLayout?.resize?.();}
function s19CloseFullscreen(){
 if(!expanded)return;
 const shell=byId('s19-shell');
 // Move the live editor BEFORE destroying the layout which owns the container.
 if(shell&&s19OriginalParent?.isConnected){
  if(s19OriginalNext?.parentNode===s19OriginalParent)s19OriginalParent.insertBefore(shell,s19OriginalNext);
  else s19OriginalParent.appendChild(shell);
 }
 s19FullscreenLayout?.destroy?.();s19FullscreenLayout=null;
 s19FullscreenHost?.remove();s19FullscreenHost=null;
 s19OriginalParent=null;s19OriginalNext=null;
 expanded=false;s19FullscreenButton();
 root.removeEventListener('resize',s19ResizeFullscreen);
 root.removeEventListener('keydown',s19FullscreenEscape,true);
 root.w2ui?.mainLayout?.resize?.();
}
function s19FullscreenEscape(event){if(expanded&&event.key==='Escape'&&!event.defaultPrevented){event.preventDefault();s19CloseFullscreen();}}
function s19OpenFullscreen(){
 if(expanded)return;
 s19PreviewStyle(); // Fluid-width constraints apply to editing and preview alike.
 if(!root.w2layout)throw Error('W2UI layout unavailable');
 const shell=byId('s19-shell');if(!shell)throw Error('Dossier shell unavailable');
 s19OriginalParent=shell.parentNode;s19OriginalNext=shell.nextSibling;
 const host=document.createElement('div');host.id='s19-document-fullscreen-root';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label',t('dossier'));document.body.appendChild(host);
 s19FullscreenHost=host;
 try{
  const layout=new root.w2layout({name:'s19DocumentFullscreenLayout',padding:0,panels:[
   {type:'top',size:49,resizable:false,overflow:'hidden',html:'<div class="s19-fullscreen-header"><strong id="s19-fullscreen-title"></strong><button id="s19-fullscreen-exit" class="w2ui-btn" type="button"></button></div>'},
   {type:'main',overflow:'hidden',html:'<div id="s19-fullscreen-document-host"></div>'}
  ]});
  s19FullscreenLayout=layout;layout.render(host);
  const target=document.getElementById('s19-fullscreen-document-host');
  if(!target)throw Error('W2UI document main panel not mounted');
  target.appendChild(shell);
  expanded=true;
  const title=byId('s19-fullscreen-title');if(title)title.textContent=t('dossier')+' · '+s19FullscreenLabel();
  const exit=byId('s19-fullscreen-exit');if(exit){exit.textContent=t('restore');exit.onclick=s19CloseFullscreen;}
  s19FullscreenButton();
  root.addEventListener('resize',s19ResizeFullscreen);
  root.addEventListener('keydown',s19FullscreenEscape,true);
  layout.resize?.();
 }catch(error){
  if(s19OriginalParent&&shell){if(s19OriginalNext?.parentNode===s19OriginalParent)s19OriginalParent.insertBefore(shell,s19OriginalNext);else s19OriginalParent.appendChild(shell);}
  s19FullscreenLayout?.destroy?.();s19FullscreenLayout=null;
  host.remove();s19FullscreenHost=null;s19OriginalParent=null;s19OriginalNext=null;
  expanded=false;throw error;
 }
}
function s19ToggleFullscreen(){try{if(expanded)s19CloseFullscreen();else s19OpenFullscreen();}catch(error){console.error('S19 fullscreen layout',error);root.alert?.(error.message);}}
const clone=x=>JSON.parse(JSON.stringify(x));
const viewer=()=>root.__radarApplicationProfile?.viewer===true||root.__radarCatalogUI?.isReadOnly?.()===true;
const normalize=s=>String(s??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
function target(){
 const group=root.__radarRevisionSession?.status?.().activeGroup;
 const rev=group&&root.__radarCatalogAdapter?.getRevision?.(group);
 const standardId=currentNode?.data('radarchart')?.standardId||null;
 if(!rev||!standardId||!rev.blips?.some(b=>b.blipId===currentNode?.id()&&b.standardId===standardId))return null;
 const owns=root.__radarCatalogPersistence?.ownsRevision?.(group,rev.revisionId)===true;
 return {group,rev,standardId,owns,editable:owns&&rev.status==='draft'&&!viewer()};
}
function blank(node){
 const ctx=target();if(!ctx?.editable)throw Error('Select a draft revision belonging to the active catalog');
 const label=node?.data('label')||ctx.standardId;
 return {schemaVersion:'s19-rationale-poc-v1',rationaleId:'s19:'+encodeURIComponent(ctx.standardId)+':'+encodeURIComponent(ctx.rev.ownerOrganizationId),organization:{id:ctx.rev.ownerOrganizationId,name:ctx.rev.ownerOrganizationId,mission:''},standard:{id:ctx.standardId,designation:label,title:label},radarContext:{radarId:ctx.rev.radarId,revisionId:ctx.rev.revisionId,ring:node.data('ring')||'',quadrant:node.data('quadrant')||''},governance:{status:'draft',owner:'',reviewer:'',approvedAt:null},sections:Object.fromEntries(SECTIONS.map(([k])=>[k,EMPTY()]))};
}
function match(){const ctx=target();if(!ctx)return null;return root.__radarRationaleRevision?.list(ctx.rev).find(x=>x.standard.id===ctx.standardId&&x.organization.id===ctx.rev.ownerOrganizationId)||null;}
function current(){const doc=match();return doc&&(!currentId||currentId===doc.rationaleId)?doc:null;}
let saveError='';
function write(record,replace){
 const ctx=target();if(!ctx?.editable)throw Error('Active catalog draft required');
 // Check both stores before writing; the persistence store is authoritative for export.
 const api=root.__radarRationaleRevision;
 api.put(ctx.rev,record,{draft:true,replace});
 root.__radarCatalogPersistence.setDraftRationale(ctx.group,ctx.rev.revisionId,record,replace);
 root.__radarCatalogAdapter.setDraftRationale(ctx.group,ctx.rev.revisionId,record,replace);
 currentId=record.rationaleId;saveError='';
}
function saveEditor(){
 if(!editor||!currentId||mode!=='edit')return;
 const m=current();if(!m)return;
 m.sections[currentSection]=clone(editor.getJSON());
 try{write(m,true);}catch(e){saveError=e.message;const el=byId('s19-selected');if(el)el.textContent='Erreur de sauvegarde : '+saveError;}
}
function killEditor(){saveEditor();if(editor){editor.destroy();editor=null;}s19ColorSelection=null;}
function addText(parent,tag,value){const el=document.createElement(tag);el.textContent=String(value??'');parent.appendChild(el);return el;}
function richNode(data){
 const type=data?.type;const types={doc:'div',paragraph:'p',heading:'h2',bulletList:'ul',orderedList:'ol',listItem:'li',blockquote:'blockquote',hardBreak:'br',horizontalRule:'hr',codeBlock:'pre',text:'span'};
 const el=document.createElement(types[type]||'span');
 if(type==='heading'&&Number(data.attrs?.level)===3){const h=document.createElement('h3');for(const child of data.content||[])h.appendChild(richNode(child));return h;}
 if(type==='text'){
  el.textContent=data.text||'';
  for(const mark of data.marks||[]){if(mark.type==='bold')el.style.fontWeight='bold';if(mark.type==='italic')el.style.fontStyle='italic';if(mark.type==='strike')el.style.textDecoration='line-through';}
  const link=(data.marks||[]).find(x=>x.type==='link');
  if(link&&/^https?:\/\//i.test(link.attrs?.href||'')){const a=document.createElement('a');a.href=link.attrs.href;a.target='_blank';a.rel='noopener noreferrer';a.appendChild(el);return a;}
 }
 for(const child of data.content||[])el.appendChild(richNode(child));return el;
}
// S19-R31: preserve the shared HTML renderer's visual semantics while rebuilding inert DOM.
// All source HTML is parsed offline. Only allowlisted nodes, attributes and CSS survive.
const S19_PREVIEW_TAGS=new Set(['MAIN','HEADER','FOOTER','ARTICLE','SECTION','DIV','H1','H2','H3','H4','H5','H6','P','SPAN','STRONG','EM','U','S','MARK','SUB','SUP','CODE','PRE','UL','OL','LI','BLOCKQUOTE','BR','HR','A','TABLE','CAPTION','COLGROUP','COL','THEAD','TBODY','TFOOT','TR','TH','TD','BUTTON']);
const S19_PREVIEW_CSS=new Set(['color','background','background-color','font','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align','text-decoration','text-decoration-color','text-decoration-line','text-decoration-style','text-transform','text-indent','vertical-align','white-space','overflow-wrap','word-break','width','min-width','max-width','height','min-height','max-height','table-layout','border-collapse','border-spacing','border','border-top','border-right','border-bottom','border-left','border-color','border-width','border-style','border-radius','padding','padding-top','padding-right','padding-bottom','padding-left','margin','margin-top','margin-right','margin-bottom','margin-left','padding-inline-start','display','flex','flex-grow','flex-shrink','flex-basis','align-items','gap','overflow-x','tab-size','cursor','list-style-type','list-style-position','break-before','break-after','break-inside','page-break-before','page-break-after','page-break-inside']);
function s19SafeCssValue(value){
 const v=String(value||'').trim();
 return v.length>0&&v.length<=300&&!/[;{}\\<>@]/.test(v)&&!/(?:url\s*\(|expression\s*\(|var\s*\(|image-set\s*\(|(?:java|vb)script\s*:|data\s*:|!important)/i.test(v);
}
function s19SafeDeclarations(style){
 const result=[];
 if(!style)return result;
 for(let i=0;i<style.length;i++){
  const property=style.item(i)?.toLowerCase();const value=style.getPropertyValue(property);
  if(S19_PREVIEW_CSS.has(property)&&s19SafeCssValue(value))result.push([property,value]);
 }
 return result;
}
function s19SafePreviewNode(source,doc){
 if(source.nodeType===3)return doc.createTextNode(source.nodeValue||'');
 if(source.nodeType!==1||!S19_PREVIEW_TAGS.has(source.tagName))return null;
 const out=doc.createElement(source.tagName.toLowerCase());
 // Formatting from Tiptap and the shared HTML renderer, including cell widths/heights.
 for(const [property,value] of s19SafeDeclarations(source.style))out.style.setProperty(property,value);
 for(const key of ['colspan','rowspan']){
  if(['TD','TH'].includes(source.tagName)){
   const n=Number(source.getAttribute(key));if(Number.isInteger(n)&&n>=1&&n<=100)out.setAttribute(key,String(n));
  }
 }
 if(['UL','OL'].includes(source.tagName)){
  const indent=source.getAttribute('data-s19-indent');
  if(/^[1-6]$/.test(indent||''))out.setAttribute('data-s19-indent',indent);
  if(source.tagName==='OL'){const start=Number(source.getAttribute('start'));if(Number.isInteger(start)&&start>=1&&start<=10000)out.setAttribute('start',String(start));}
 }
 if(source.tagName==='A'){
  const href=source.getAttribute('href')||'';
  if(/^https?:\/\/[^\s<>"']+$/i.test(href)){
   out.setAttribute('href',href);out.setAttribute('target','_blank');out.setAttribute('rel','noopener noreferrer');
  }
 }
 // Preserve harmless renderer / Tiptap class hooks, but never IDs or event handlers.
 const safeClasses=Array.from(source.classList||[]).filter(c=>/^[a-z][a-z0-9_-]{0,48}$/i.test(c)).slice(0,12);
 if(safeClasses.length)out.className=safeClasses.join(' ');
 if(source.tagName==='BUTTON'){
  const allowed=['s19-reference','s19-related-ref'];
  const type=allowed.find(c=>source.classList.contains(c));
  if(!type)return null;
  out.className=type;
  for(const key of ['blipId','standardId','relatedType','relatedId']){
   const attr='data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
   const value=source.getAttribute(attr);
   if(value!==null&&value.length<=512)out.setAttribute(attr,value);
  }
 }
 for(const child of source.childNodes){const safe=s19SafePreviewNode(child,doc);if(safe)out.appendChild(safe);}
 return out;
}
function s19ScopedRendererCss(parsed){
 const safe=[];
 // Read stylesheet rules through the browser CSS parser; reject at-rules and unsafe declarations.
 if(typeof root.CSSStyleSheet!=='function')return '';
 for(const tag of parsed.head.querySelectorAll('style')){
  let sheet;
  try{sheet=new root.CSSStyleSheet();sheet.replaceSync(tag.textContent||'');}catch(_){continue;}
  for(const rule of sheet.cssRules){
   if(rule.type!==1||!rule.selectorText||!rule.style)continue;
   const declarations=s19SafeDeclarations(rule.style);
   if(!declarations.length)continue;
   const selectors=rule.selectorText.split(',').map(s=>s.trim()).filter(s=>/^[a-z0-9.#_:\[\]="'() >+~*-]+$/i.test(s)&&!/:has\s*\(/i.test(s));
   for(const selector of selectors){
    const onTable=/(?:^|[\s>+~])table(?:[.#:\[][a-z0-9_-]+)*$/i.test(selector);
    // The shared HTML renderer may impose percentage table widths and fixed layout.
    // It must never override the editor's explicit per-column pixel geometry.
    const allowed=onTable?declarations.filter(([name])=>!['width','min-width','max-width','table-layout'].includes(name)):declarations;
    if(!allowed.length)continue;
    const scoped=/^(?:html|body|:root)$/i.test(selector)?'.s19-preview-document':
     '.s19-preview-document '+selector.replace(/^(?:(?:html|body|:root)\s+)+/i,'');
    safe.push(scoped+'{'+allowed.map(([k,v])=>k+':'+v).join(';')+'}');
   }
  }
 }
 return safe.join('\n');
}
// S19-R33: a table with pixel-defined Tiptap col widths keeps its *intrinsic* size,
// even when the hosting Workspace or fullscreen viewport changes. Other tables retain
// the renderer's normal intrinsic layout; never invent widths for unspecified columns.
function s19RestorePixelTableWidths(host){
 for(const table of host.querySelectorAll('table')){
  const colgroup=table.querySelector(':scope > colgroup');
  if(!colgroup)continue;
  const cols=Array.from(colgroup.children).filter(el=>el.tagName==='COL');
  if(!cols.length)continue;
  const values=cols.map(col=>{
   const raw=col.style.width||col.getAttribute('width')||'';
   const match=/^([0-9]+(?:\.[0-9]+)?)px$/i.exec(raw.trim());
   return match?Number(match[1]):NaN;
  });
  if(values.some(value=>!Number.isFinite(value)||value<=0))continue;
  const total=values.reduce((sum,value)=>sum+value,0);
  const px=total+'px';
  table.style.setProperty('width',px);
  table.style.setProperty('min-width',px);
  table.style.setProperty('max-width','none');
  table.style.setProperty('table-layout','fixed');
 }
}
function s19WorkspacePreview(record,renderer){
 const html=renderer.renderDocument(record,{lang:root.i18next?.resolvedLanguage||root.i18next?.language||'fr',includeRelated:false});
 if(typeof html!=='string'||!html.includes('</head>')||/<\s*script\b/i.test(html))throw Error('Unexpected dossier preview HTML');
 const parsed=new DOMParser().parseFromString(html,'text/html');
 if(parsed.querySelector('parsererror'))throw Error('Invalid dossier preview HTML');
 const main=parsed.body.querySelector('main');
 if(!main)throw Error('Missing dossier preview main');
 const host=document.createElement('div');host.className='s19-preview-document';
 const safe=s19SafePreviewNode(main,document);
 if(!safe)throw Error('Unsafe dossier preview');
 s19RestorePixelTableWidths(safe);
 // Renderer CSS is parsed and scoped, not copied as executable document content.
 let style=document.getElementById('s19-preview-renderer-css');
 if(!style){style=document.createElement('style');style.id='s19-preview-renderer-css';document.head.appendChild(style);}
 style.textContent=s19ScopedRendererCss(parsed);
 host.appendChild(safe);
 host.addEventListener('click',event=>{
  const button=event.target.closest?.('button.s19-reference');
  if(button)navigateReference({blipId:button.dataset.blipId,standardId:button.dataset.standardId});
  const related=event.target.closest?.('button.s19-related-ref');
  if(related){const entry=root.__radarRationaleLinks?.list(current())?.find(x=>x.type===related.dataset.relatedType&&x.id===related.dataset.relatedId);if(entry)navigateRelated(entry);}
 });
 return host;
}
function s19PreviewStyle(){
 if(document.getElementById('s19-dom-preview-style'))return;
 const style=document.createElement('style');style.id='s19-dom-preview-style';
 style.textContent='#s19-content:has(.s19-preview-document){padding:0;border:0;min-height:0}'
  +'.s19-preview-document{display:block;box-sizing:border-box;width:100%;min-height:580px;height:65vh;overflow:auto;border:1px solid #dce1e8;border-radius:5px;background:#fff;color:#253044;font:15px/1.65 system-ui,Arial,sans-serif}'
  +'#s19-shell.s19-fullscreen .s19-preview-document{height:calc(100vh - 155px);min-height:500px}'
  +'#s19-shell .s19-preview-document main{box-sizing:border-box;max-width:none;width:100%;margin:0;padding:12px 16px 40px}'
  +'#s19-document-fullscreen-root #s19-shell #s19-body-rationale{max-width:none;width:100%;margin:0;padding:12px 16px 32px}'
  +'#s19-shell.s19-fullscreen #s19-body-rationale{max-width:none;width:100%;margin:0;padding:12px 16px 32px}'
  +'.s19-preview-document .s19-table-wrap{max-width:100%;overflow-x:auto}'
  +'.s19-preview-document table{border-collapse:collapse}'
  +'.s19-preview-document td,.s19-preview-document th{vertical-align:top}'
  +'.s19-preview-document .meta{color:#667085;margin:6px 0 28px}';
 document.head.appendChild(style);
}
function renderSection(){
 killEditor();const area=byId('s19-content');if(!area)return;area.replaceChildren();const doc=current();
 if(!doc){addText(area,'p',t('none'));return;}
 if(mode!=='edit'||!target()?.editable){
  const renderer=root.__radarRationaleRenderer;
  if(!renderer?.renderDocument){addText(area,'p',t('missingEditor'));return;}
  try{s19PreviewStyle();area.appendChild(s19WorkspacePreview(doc,renderer));}
  catch(error){console.error('S19: preview refused',error);addText(area,'p',tr('Prévisualisation indisponible : contenu non conforme.','Preview unavailable: invalid content.'));}
  renderRelated();return;
 }
 const value=doc.sections?.[currentSection]||EMPTY();
 if(!root.__radarTiptap?.Editor||!root.__radarS19Formatting?.extensions){addText(area,'p',tr('Module Tiptap ou couleurs S19 indisponible : édition protégée.','Tiptap or S19 color extension unavailable: editing disabled safely.'));return;}
 const host=document.createElement('div');host.className='s19-editor';area.appendChild(host);
 try{editor=new root.__radarTiptap.Editor({element:host,extensions:root.__radarS19Formatting.extensions,enableContentCheck:true,content:clone(value),onUpdate:()=>saveEditor(),onContentError:({error})=>{throw error;}});}catch(error){host.replaceChildren();addText(host,'p',tr('Document incompatible : édition bloquée pour préserver le contenu.','Incompatible document: editing blocked to preserve content.'));console.error(error);editor=null;}renderRelated();
}
function updateSections(){
 const select=byId('s19-sections');if(!select)return;const previous=select.value||currentSection;select.replaceChildren();
 for(const [key,name] of SECTIONS){const opt=document.createElement('option');opt.value=key;opt.textContent=t(name);select.appendChild(opt);}
 select.value=SECTIONS.some(([k])=>k===previous)?previous:'businessJustification';currentSection=select.value;
 select.setAttribute('aria-label',t('section'));byId('s19-section-label').textContent=t('section');
}
function updateToolbar(){
 // Always-visible controls in the W2UI-hosted dossier tab; W2UI tabs remain the app navigation.
 const host=byId('s19-toolbar');if(!host)return;host.replaceChildren();
 const make=(label,handler,disabled=false)=>{const b=document.createElement('button');b.type='button';b.className='w2ui-btn s19-command';b.textContent=label;b.disabled=disabled;b.onclick=handler;return b;};
 const readOnly=viewer();
 const allowed=target()?.editable===true;
 const edit=readOnly?null:make(t('edit'),()=>{if(viewer()||!target()?.editable||!current())return;killEditor();mode='edit';s19SetSelectionLock(true);refresh();},!allowed||!current());
 const view=make(t('view'),()=>{killEditor();mode='view';s19SetSelectionLock(false);refresh();});
 edit?.classList.toggle('s19-active',mode==='edit'&&allowed);
 view.classList.toggle('s19-active',mode!=='edit'||!allowed);
 const modes=document.createElement('div');modes.className='s19-mode-switch';if(edit)modes.appendChild(edit);modes.appendChild(view);host.appendChild(modes);
 if(!viewer()){
   const create=make(t('create'),()=>{
     if(current()||!target()?.editable)return;
     try{const m=blank(currentNode);write(m,false);mode='edit';s19SetSelectionLock(true);refresh();}
     catch(e){root.alert(e.message);}
   },!allowed||!!current());
   host.appendChild(create);
 }

}
function refresh(){
 if(!mounted||!byId('s19-shell'))return;
 // Lock/unlock selection as soon as the editing mode changes.
 s19SetSelectionLock(mode==='edit');
 byId('s19-body-properties').hidden=tab!=='properties';byId('s19-body-rationale').hidden=tab!=='rationale';
 const selected=current();byId('s19-title').textContent=selected?.standard?.designation||currentNode?.data('label')||'';
 if(expanded){const title=byId('s19-fullscreen-title');if(title)title.textContent=t('dossier')+' · '+s19FullscreenLabel();}
 byId('s19-selected').textContent=selected?`${t('dossierId')} : ${selected.rationaleId}`:t('unlinked');
 byId('s19-editor-tools').hidden=!target()?.editable||mode!=='edit';
 byId('s19-section-container').hidden=!target()?.editable||mode!=='edit';s19FullscreenButton();

 updateSections();updateToolbar();updateCommands();renderSection();
 // R24: W2UI tab changes may resize the radar viewport; keep its Cytoscape
 // hit canvas and SVG camera in sync on the next rendered frame.
 root.__radarInputSync?.request?.('s19-tab-refresh');
}
function updateLanguage(){
 if(!mounted||!byId('s19-shell'))return;
 // Never destroy the Tiptap editor or reset the selected blip when language changes.
 setupRibbon();
 const active=document.activeElement;
 updateCommands();
 if(tabs){tabs.set('properties',{text:t('properties')});tabs.set('rationale',{text:t('dossier')});tabs.refresh();}
 s19FullscreenButton();
 if(expanded){const title=byId('s19-fullscreen-title');if(title)title.textContent=t('dossier')+' · '+s19FullscreenLabel();const exit=byId('s19-fullscreen-exit');if(exit)exit.textContent=t('restore');}
 byId('s19-selected').textContent=current()?`${t('dossierId')} : ${current().rationaleId}`:t('unlinked');
 updateSections();updateToolbar();
 if(mode!=='edit'||!current())renderSection();else renderRelated();if(active?.id==='s19-sections')byId('s19-sections').focus();
}
function mount(){
 if(mounted&&byId('s19-shell'))return;
 if(expanded)s19CloseFullscreen();
 if(editorRibbon){editorRibbon.destroy();editorRibbon=null;}if(tabs){tabs.destroy();tabs=null;}if(toolbar){toolbar.destroy();toolbar=null;}
 mounted=true;
 root.w2ui.mainLayout.html('right',`<div id="s19-shell"><div id="s19-tabs"></div><div id="s19-body-properties"><div id="s19-property-form"></div></div><div id="s19-body-rationale" hidden><div class="s19-document-head"><strong id="s19-title"></strong><button id="s19-full" type="button" title="" aria-label="">⛶</button></div><p id="s19-selected"></p><div id="s19-toolbar"></div><div id="s19-section-container"><label id="s19-section-label" for="s19-sections"></label><select id="s19-sections" class="w2ui-input"></select></div><div id="s19-editor-tools" class="s19-editor-tools" hidden></div><div id="s19-content"></div><section id="s19-related" class="s19-related"></section></div></div>`);
 tabs=new root.w2tabs({name:'s19RationaleTabs',tabs:[{id:'properties',text:t('properties')},{id:'rationale',text:t('dossier')}],active:tab,onClick(event){killEditor();tab=event.target;refresh();if(tab==='properties')s19RenderPropertiesForm();}});
 tabs.render(byId('s19-tabs'));setupRibbon();
 byId('s19-sections').onchange=e=>{killEditor();currentSection=e.target.value;renderSection();};
 byId('s19-full').onclick=s19ToggleFullscreen;
 byId('s19-editor-tools').addEventListener('mousedown',event=>{if(event.target.closest('button'))event.preventDefault();});
 byId('s19-editor-tools').onclick=event=>{const action=event.target.closest('button')?.dataset?.action;if(action)s19RunEditorAction(action);};

 if(!languageBound&&root.i18next?.on){root.i18next.on('languageChanged',updateLanguage);languageBound=true;}
}
function showNode(node,form){
 if(!root.w2ui?.mainLayout||!root.w2tabs||!node?.isNode?.())return false;
 s19BindGraphSelection(node.cy?.());
 // Both tap and select may fire for one click. Preserve the live editor when
 // the same node is selected again; do not destroy its cursor or W2UI tab.
 if(currentNode?.id?.()===node.id()&&currentNode?.cy?.()===node.cy()&&byId('s19-shell'))return true;
 // R28: editing is an explicit selection lock. Never change blip, persist,
 // or implicitly leave edition on a graph click. The user must first choose
 // Visualisation using the dossier toolbar.
 const priorPropertiesTab=s19PropertiesTab(s19PropertiesForm);
 if(mode==='edit'){
  // Cytoscape may already have switched :selected before this callback.
  // Restore the previous graph selection without changing the dossier/editor.
  if(node.selected?.())node.unselect?.();
  if(currentNode?.isNode?.()&&!currentNode.selected?.())currentNode.select?.();
  const notice=byId('s19-selected');
  if(notice)notice.textContent=tr('Édition en cours : revenir en Visualisation avant de sélectionner un autre blip.','Editing: switch to View before selecting another blip.');
  return false;
 }
 mode='view';
 s19SetSelectionLock(false);
 killEditor();currentId=null;
 currentNode=node;mount();const found=match();currentId=found?.rationaleId||null;
 // Preserve Context/Extra even when the dossier is currently visible.
 s19PreferredPropertiesTab=priorPropertiesTab;
 // Do not render a hidden property form during dossier navigation.
 // Its previous content is stale until the properties tab becomes visible.
 s19RenderedPropertiesNodeId=null;
 // Keep the top-level tab, but always show the new dossier in preview mode.
 refresh();
 if(tab==='properties')s19RenderPropertiesForm(form);
 return true;
}
root.__radarRationalePanel=Object.freeze({showNode,renderPreview:(record,lang)=>root.__radarRationaleRenderer?.renderDocument(record,{lang})});
})(window);
