/* S19-R74-R75-R13 — Persistent document colors without rebundling Tiptap.
 * The existing Tiptap Highlight mark and StarterKit extension are extended with
 * the SAME loaded @tiptap/core runtime (no duplicate ProseMirror instances).
 */
(function(root){
'use strict';
const tiptap=root.__radarTiptap;
const known=Array.isArray(tiptap?.extensions)?tiptap.extensions:[];
const Highlight=known.find(x=>x?.name==='highlight'&&x.type==='mark'&&typeof x.extend==='function'&&typeof x.configure==='function');
const StarterKit=tiptap?.StarterKit;
const HEX=/^#[0-9a-fA-F]{6}$/;
const color=value=>typeof value==='string'&&HEX.test(value)?value.toLowerCase():null;
if(!Highlight||typeof StarterKit?.extend!=='function'){
 console.error('S19-R13: incompatible Tiptap extension registry; styled editing disabled');
 return;
}
// Existing Highlight must be configured for multiple saved colors; the default
// configuration can otherwise discard attrs.color during JSON serialization.
const MultiHighlight=Highlight.configure({multicolor:true});
// A small, standard Tiptap textStyle mark, compatible with future native Color.
// Never inherit Highlight's shortcuts / input rules or its markup.
const TextColor=Highlight.extend({
 name:'textStyle',
 addOptions(){return {};},
 addAttributes(){return {
  color:{default:null,parseHTML:el=>color(el.style.color),
   renderHTML:attrs=>color(attrs.color)?{style:'color:'+color(attrs.color)}:{}}
 };},
 parseHTML(){return [{tag:'span[style]',getAttrs:el=>color(el.style.color)?{}:false}];},
 renderHTML({HTMLAttributes}){return ['span',HTMLAttributes,0];},
 addCommands(){return {
  setColor:value=>({chain})=>color(value)?chain().setMark('textStyle',{color:color(value)}).run():false,
  unsetColor:()=>({chain})=>chain().unsetMark('textStyle').run()
 };},
 addKeyboardShortcuts(){return {};},
 addInputRules(){return [];},
 addPasteRules(){return [];}
});
// Global attributes decorate the existing paragraph node and do not replace it.
const ParagraphBackground=StarterKit.extend({
 name:'s19ParagraphBackground',
 addExtensions(){return [];},
 addGlobalAttributes(){return [{types:['paragraph'],attributes:{
  backgroundColor:{default:null,parseHTML:el=>color(el.style.backgroundColor),
   renderHTML:attrs=>color(attrs.backgroundColor)?{style:'background-color:'+color(attrs.backgroundColor)}:{}}
 }}];}
});

// S19-R18 — Enable the standard Tiptap column resize plugin (same runtime).
// TableKit, when used, must be configured at its outer extension level.
let nativeTableResize = false;
const nativeTables = known.map(ext => {
 if(ext?.name==='table' && typeof ext.configure==='function'){
  nativeTableResize = true;
  return ext.configure({resizable:true,cellMinWidth:45,handleWidth:5,lastColumnResizable:true});
 }
 if(ext?.name==='tableKit' && typeof ext.configure==='function'){
  nativeTableResize = true;
  return ext.configure({table:{resizable:true,cellMinWidth:45,handleWidth:5,lastColumnResizable:true}});
 }
 return ext;
});
if(!nativeTableResize)console.warn('S19-R18: native Table or TableKit extension not found; table sizing fallback retained');

// S19-R16 — paragraph layout uses the already-loaded Tiptap runtime.
// It is intentionally independent of TextAlign to avoid a duplicate runtime
// or a new dependency in the deployed standalone application.
const S19Alignments=new Set(['left','center','right','justify']);
const s19Align=value=>S19Alignments.has(value)?value:null;
const s19Indent=value=>Number.isInteger(value)&&value>=0&&value<=6?value:0;
const LIST_STYLES=Object.freeze({bulletList:['disc','circle','square'],orderedList:['decimal','lower-alpha','upper-alpha','lower-roman','upper-roman']});
const validList=(type,value)=>LIST_STYLES[type]?.includes(value)?value:null;
const rowHeight=value=>Number.isInteger(value)&&value>=24&&value<=800?value:null;
// A cursor inside a table cell is still in a paragraph. Locate its parent list
// or table row rather than incorrectly applying an indent to a child paragraph.
function closestNode(selection,types){
 const pos=selection.$from;
 for(let depth=pos.depth;depth>0;depth--){
  if(types.includes(pos.node(depth).type.name))return {node:pos.node(depth),pos:pos.before(depth)};
 }
 return null;
}

const S19ParagraphLayout=StarterKit.extend({
 name:'s19ParagraphLayout',
 addExtensions(){return [];},
 addGlobalAttributes(){return [
 {types:['bulletList','orderedList'],attributes:{
  s19ListStyle:{default:null,parseHTML:el=>validList(el.tagName.toLowerCase()==='ol'?'orderedList':'bulletList',el.style.listStyleType),
   renderHTML:attrs=>attrs.s19ListStyle?{style:'list-style-type:'+attrs.s19ListStyle}:{}},
  s19Indent:{default:0,parseHTML:el=>{const v=el.style.marginLeft;return /^(?:0|24|48|72|96|120|144)px$/.test(v)?s19Indent(parseInt(v,10)/24):0},
   renderHTML:attrs=>s19Indent(attrs.s19Indent)?{style:'margin-left:'+(24*s19Indent(attrs.s19Indent))+'px'}:{}}
 }},
 {types:['tableRow'],attributes:{s19MinHeight:{default:null,parseHTML:el=>rowHeight(parseInt(el.style.minHeight,10)),
  renderHTML:attrs=>rowHeight(attrs.s19MinHeight)?{style:'height:'+attrs.s19MinHeight+'px;--s19-row-height:'+attrs.s19MinHeight+'px'}:{}}}},
 {types:['paragraph','heading'],attributes:{
  textAlign:{default:null,parseHTML:el=>s19Align(el.style.textAlign),
   renderHTML:attrs=>s19Align(attrs.textAlign)?{style:'text-align:'+s19Align(attrs.textAlign)}:{}},
  s19Indent:{default:0,parseHTML:el=>{
   const px=/^(?:0|24|48|72|96|120|144)px$/.test(el.style.marginLeft)?parseInt(el.style.marginLeft,10)/24:0;
   return s19Indent(px);
  },renderHTML:attrs=>s19Indent(attrs.s19Indent)?{style:'margin-left:'+(24*s19Indent(attrs.s19Indent))+'px'}:{}}
 }}];},
 addCommands(){
  const visitBlocks=(transaction,selection,apply)=>{
   const blocks=[];
   transaction.doc.nodesBetween(selection.from,selection.to,(node,pos)=>{
    if(node.type.name==='paragraph'||node.type.name==='heading')blocks.push({node,pos});
   });
   for(const {node,pos} of blocks){
    const next=apply(node.attrs);
    if(next)transaction.setNodeMarkup(pos,undefined,{...node.attrs,...next});
   }
   return blocks.length>0;
  };
  return {
   setS19ListStyle:value=>({tr,dispatch,state})=>{
    const list=closestNode(state.selection,['bulletList','orderedList']);
    if(!list||!validList(list.node.type.name,value))return false;
    if(dispatch)dispatch(tr.setNodeMarkup(list.pos,undefined,{...list.node.attrs,s19ListStyle:value}));
    return true;
   },
   setS19ColumnWidth:value=>({tr,dispatch,state})=>{
    if(!Number.isInteger(value)||value<45||value>2000)return false;
    const $from=state.selection.$from;
    let tableDepth=-1,cellDepth=-1;
    for(let depth=$from.depth;depth>0;depth--){
     const name=$from.node(depth).type.name;
     if(cellDepth<0&&(name==='tableCell'||name==='tableHeader'))cellDepth=depth;
     if(name==='table'){tableDepth=depth;break;}
    }
    if(tableDepth<0||cellDepth<0)return false;
    const table=$from.node(tableDepth),row=$from.node(tableDepth+1);
    const cellOffset=$from.before(cellDepth)-$from.start(tableDepth+1);
    let column=0;
    row.forEach((cell,offset)=>{if(offset<cellOffset)column+=Math.max(1,cell.attrs.colspan||1);});
    // Ensure ALL logical columns have explicit widths. Otherwise the table view
    // is free to stretch the unmeasured columns to 100% of the editor.
    const widths=[];let maxColumns=0;
    table.forEach(r=>{if(r.type.name!=='tableRow')return;let logical=0;
     r.forEach(cell=>{const span=Math.max(1,cell.attrs.colspan||1);
      for(let i=0;i<span;i++){
       const w=cell.attrs.colwidth?.[i];
       if(widths[logical+i]===undefined&&Number.isInteger(w)&&w>=45&&w<=2000)widths[logical+i]=w;
      }
      logical+=span;
     });
     maxColumns=Math.max(maxColumns,logical);
    });
    const count=Math.max(maxColumns,widths.length,column+1);
    for(let i=0;i<count;i++)if(!widths[i])widths[i]=140;
    widths[column]=value;
    const tablePos=$from.before(tableDepth),changes=[];
    table.forEach((r,rowOffset)=>{if(r.type.name!=='tableRow')return;let logical=0;
     r.forEach((cell,offset)=>{const span=Math.max(1,cell.attrs.colspan||1);
      changes.push({pos:tablePos+1+rowOffset+1+offset,
       attrs:{...cell.attrs,colwidth:widths.slice(logical,logical+span)}});
      logical+=span;
     });
    });
    if(!changes.length)return false;
    if(dispatch){for(const c of changes)tr.setNodeMarkup(c.pos,undefined,c.attrs);dispatch(tr);}
    return true;
   },
   setS19RowHeight:value=>({tr,dispatch,state})=>{
    const row=closestNode(state.selection,['tableRow']);
    if(!row||(value!==null&&!rowHeight(value)))return false;
    if(dispatch)dispatch(tr.setNodeMarkup(row.pos,undefined,{...row.node.attrs,s19MinHeight:value}));
    return true;
   },
   setS19Alignment:value=>({tr,dispatch,state})=>{
    if(!s19Align(value))return false;
    let changed=visitBlocks(tr,state.selection,()=>({textAlign:value==='left'?null:value}));
    if(!changed){const block=closestNode(state.selection,['paragraph','heading']);
     if(block){tr.setNodeMarkup(block.pos,undefined,{...block.node.attrs,textAlign:value==='left'?null:value});changed=true;}}
    if(changed&&dispatch)dispatch(tr);
    return changed;
   },
   adjustS19Indent:delta=>({tr,dispatch,state})=>{
    if(!Number.isInteger(delta))return false;
    const list=closestNode(state.selection,['bulletList','orderedList']);
    if(list){
     const old=s19Indent(list.node.attrs.s19Indent);
     const next=delta===-99?0:Math.min(6,Math.max(0,old+delta));
     if(dispatch)dispatch(tr.setNodeMarkup(list.pos,undefined,{...list.node.attrs,s19Indent:next}));
     return true;
    }
    const changed=visitBlocks(tr,state.selection,attrs=>({s19Indent:delta===-99?0:Math.min(6,Math.max(0,s19Indent(attrs.s19Indent)+delta))}));
    if(changed&&dispatch)dispatch(tr);
    return changed;
   }
  };
 }
});
root.__radarS19Formatting=Object.freeze({
 extensions:Object.freeze([...nativeTables.map(x=>{
  if(x===Highlight)return MultiHighlight;
  return x;
 }),TextColor,ParagraphBackground,S19ParagraphLayout]),
 safeColor:color,
 version:'S19-R18',
 nativeTableResize
});
})(window);
