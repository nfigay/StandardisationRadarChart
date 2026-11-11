/* S14-Y: bounded, declarative boolean query evaluator. Classic script, no eval. */
(function(root){
 'use strict';
 const FIELDS=new Set(['all','reference','title','titleEn','description','ics','committee','stage']);
 const COMPARISONS=new Set(['contains','equals','prefix']);
 const OPERATORS=new Set(['AND','OR']);
 const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
 const flatten=v=>v==null?[]:Array.isArray(v)?v.flatMap(flatten):typeof v==='object'?Object.values(v).flatMap(flatten):[String(v)];
 function values(item,field){
   const titleI18n=item.titleI18n||{},scopeI18n=item.scopeI18n||{};
   const fields={
     reference:[item.reference],
     title:[titleI18n.fr,item.title],
     titleEn:[titleI18n.en,item.titleEn],
     description:[item.scope,scopeI18n.fr,scopeI18n.en,item.description],
     ics:[item.icsCodes],
     committee:[item.ownerCommittee],
     stage:[item.currentStage,item.stage]
   };
   if(field==='all')return Object.values(fields).flatMap(flatten);
   return flatten(fields[field]);
 }
 function validate(tree){
   let count=0;
   function walk(node,depth){
     if(!node||typeof node!=='object'||Array.isArray(node))throw Error('Invalid advanced query node');
     if(++count>128||depth>12)throw Error('Advanced query too complex');
     if(Array.isArray(node.children)){
       if(!OPERATORS.has(node.operator)||!node.children.length)throw Error('Invalid boolean group');
       if(typeof node.negated!=='boolean')throw Error('Invalid negation flag');
       node.children.forEach(child=>walk(child,depth+1));
     }else{
       if(!FIELDS.has(node.field)||!COMPARISONS.has(node.comparison))throw Error('Invalid advanced condition');
       if(typeof node.value!=='string'||!node.value.trim()||node.value.length>512)throw Error('Invalid search term');
     }
   }
   walk(tree,0);return tree;
 }
 function matches(item,tree){
   if(!tree)return true;
   // Validation is done once per query, in page(), not for every row.
   function evalNode(node){
     if(Array.isArray(node.children)){
       const result=node.operator==='AND'?node.children.every(evalNode):node.children.some(evalNode);
       return node.negated?!result:result;
     }
     const wanted=normalize(node.value);
     return values(item,node.field).some(raw=>{
       const text=normalize(raw);
       return node.comparison==='equals'?text===wanted:node.comparison==='prefix'?text.startsWith(wanted):text.includes(wanted);
     });
   }
   return evalNode(tree);
 }
 // Pure structural editing: immutable AST update, no evaluation and no browser dependency.
 function edit(tree,action){
   const copy=JSON.parse(JSON.stringify(tree));
   const find=(node,id,parent=null)=>{
     if(node.id===id)return {node,parent};
     for(const child of node.children||[]){const match=find(child,id,node);if(match)return match;}
     return null;
   };
   const found=find(copy,action.id);
   if(!found)throw Error('Unknown query node');
   const {node,parent}=found;
   const makeCondition=()=>({id:action.nextId,field:'all',comparison:'contains',value:''});
   const makeGroup=()=>({id:action.nextId,operator:'AND',negated:false,children:[{...makeCondition(),id:action.nextId+1}]});
   switch(action.type){
     case 'addCondition':
       if(!Array.isArray(node.children))throw Error('Target must be a group');
       node.children.push(makeCondition());break;
     case 'addGroup':
       if(!Array.isArray(node.children))throw Error('Target must be a group');
       node.children.push(makeGroup());break;
     case 'addSiblingCondition':
       if(!parent)throw Error('Root cannot have a sibling');
       parent.children.splice(parent.children.indexOf(node)+1,
         0,makeCondition());
       break;
     case 'moveUp':
     case 'moveDown':{
       if(!parent)throw Error('Root cannot be moved');
       const index=parent.children.indexOf(node);
       const target=index+(action.type==='moveUp'?-1:1);
       if(target<0||target>=parent.children.length)
         throw Error('Query node already at boundary');
       parent.children.splice(index,1);
       parent.children.splice(target,0,node);
       break;
     }
     case 'addSiblingGroup':
       if(!parent)throw Error('Root cannot have a sibling');
       parent.children.splice(parent.children.indexOf(node)+1,0,makeGroup());break;
     case 'wrap':
       if(!parent)throw Error('Cannot wrap root');
       parent.children.splice(parent.children.indexOf(node),1,{id:action.nextId,operator:'AND',negated:false,children:[node]});break;
     case 'unwrap':
       if(!parent||!Array.isArray(node.children))throw Error('Only non-root groups can be dissolved');
       parent.children.splice(parent.children.indexOf(node),1,...node.children);break;
     case 'remove':
       if(!parent)throw Error('Root cannot be removed');
       parent.children.splice(parent.children.indexOf(node),1);break;
     default:throw Error('Unknown edit action');
   }
   return copy;
 }
 root.__radarIsoAdvancedQuery=Object.freeze({validate,matches,normalize,values,edit});
 if(typeof module!=='undefined'&&module.exports)module.exports=root.__radarIsoAdvancedQuery;
})(typeof window!=='undefined'?window:globalThis);
