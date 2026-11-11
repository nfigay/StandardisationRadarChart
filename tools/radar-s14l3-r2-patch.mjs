import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const targetFiles=['js/radar-standards-panel.js','js/radar-iso-sidebar-index.js'];
function replaceExact(current,oldText,newText,label){
  if(newText&&current.includes(newText))return current;
  const at=current.indexOf(oldText);
  if(!oldText||at<0||current.indexOf(oldText,at+1)!==-1)throw Error(label+': passage absent ou ambigu');
  return current.slice(0,at)+newText+current.slice(at+oldText.length);
}
function between(s,a,b){const start=s.indexOf(a),end=s.indexOf(b,start+a.length);if(start<0||end<0)throw Error('Bornes manquantes : '+a);return s.slice(start,end);}
export function patchContents(relative,current){
  if(!targetFiles.includes(relative))throw Error('Fichier inattendu : '+relative);
  const name=path.basename(relative);
  const old=fs.readFileSync(path.join(here,'..','tests','fixtures',name.replace('.js','-before-s14l3r2.js')),'utf8');
  const next=fs.readFileSync(path.join(here,'..','js',name),'utf8');
  if(current===next)return current;
  if(name==='radar-standards-panel.js'){
    current=replaceExact(current,
      between(old,'   const nodes=model.sidebar(navMode,language);','   sidebarMode=navMode;'),
      between(next,'   const nodes=model.sidebar(navMode,language);','   sidebarMode=navMode;'),'navigation sidebar');
    if(current.includes('     // S14-L3-R1: w2sidebar can re-render'))current=replaceExact(current,
      between(old,'     // S14-L3-R1: w2sidebar can re-render','   }else grid.render(target);'),
      '','suppression écouteurs œil');
    for(const [a,b] of [['"detail":"Détails"','"detail":"Détails","showStandards":"Afficher les normes"'],['"detail":"Details"','"detail":"Details","showStandards":"Show standards"']]){
      if(!current.includes(b))current=replaceExact(current,a,b,'internationalisation menu');
    }
  }else{
    const inserted=between(next,'   // Unique standard count','   function sidebar(mode,language=');
    if(!current.includes('   // Unique standard count'))current=replaceExact(current,"   function sidebar(mode,language='fr'){",inserted+"   function sidebar(mode,language='fr'){",'index des compteurs');
    const oldLine=old.split('\n').find(x=>x.includes('return {id:mode+'));
    const newLines=between(next,'       const isSc=','     }').trimEnd();
    if(!current.includes('       const isSc='))current=replaceExact(current,oldLine,newLines,'nœud sidebar');
  }
  if(current!==next){
    // Additional unrelated local changes are preserved. Verify all requested fragments.
    if(name==='radar-standards-panel.js'&&(!current.includes('onDblClick:openNodeDetails')||current.includes('data-iso-nav-eye')))throw Error('Panneau incomplet');
    if(name==='radar-iso-sidebar-index.js'&&!current.includes('count:totals[mode]'))throw Error('Compteurs absents');
  }
  return current;
}
