// Targeted fail-closed patches. Never replace entire application files.
export function patchRadar(source){
 if(source.includes('src="./js/radar-catalog-atomic.js"')) return source;
 const anchor='<script src="./js/radar-catalog-distribution.js"></script>';
 if(source.split(anchor).length!==2)throw Error('Ancrage S14-I absent ou ambigu dans radar.html');
 return source.replace(anchor,'<script src="./js/radar-catalog-atomic.js"></script>\n    <script src="./js/radar-catalog-followed.js"></script>\n    '+anchor);
}
export function patchDistribution(source){
 if(source.includes('/* S14-K atomic sync */'))return source;
 const initial="const sync=await iso.syncInfo();const results=[];";
 const legacy="for(const {entry,blob} of blobs){onProgress?.('Import '+entry.id);const result=await iso.importJsonLines(entry.id,blob,n=>onProgress?.(entry.id+' : '+n));results.push(result);}";
 if(source.split(initial).length!==2||source.split(legacy).length!==2)throw Error('Ancrage import S14-I absent ou ambigu');
 let out=source.replace(initial,"const results=[]; /* S14-K atomic sync */");
 out=out.replace(legacy,`const atomic=root.__radarCatalogAtomic;
  if(typeof atomic?.importPair!=='function')throw Error('Import atomique S14-K indisponible');
  const pair=Object.fromEntries(blobs.map(x=>[x.entry.id,x.blob]));
  const expectedRecords=Object.fromEntries(blobs.map(x=>[x.entry.id,x.entry.records]));
  const activation=await atomic.importPair(pair,{release:manifest.release,expectedRecords,onProgress});
  results.push(...activation.results);`);
 return out;
}
