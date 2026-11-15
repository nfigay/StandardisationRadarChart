/* A8.6 — verified bytes of a standalone publication. Creator only.
 * Public manifest deliberately excludes the authoring definition and source catalog.
 * No signature, no claim of delivery to disk or to a recipient.
 */
(function(root){
  'use strict';
  const fail=s=>{throw Error('Publication delivery: '+s);};
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const keys=(o,n)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===n.length&&n.every(k=>own(o,k));
  const encoder=new TextEncoder();
  const digestPattern=/^[a-f0-9]{64}$/;
  const commitPattern=/^[a-f0-9]{40}$/;
  const marker='<'+'!--RADAR-PUBLICATION-PAYLOAD-->';
  async function sha256(bytes){
    if(!root.crypto?.subtle)fail('WebCrypto unavailable');
    return Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  }
  async function artifact(path,bytes){return {path,bytes:bytes.byteLength,sha256:await sha256(bytes)};}
  function proof(){
    root.__radarApplicationProfile.require('publication.create');
    const n=root.document.getElementById('radar-viewer-template-proof');
    if(!n)fail('Viewer template provenance unavailable');
    return root.__radarPublicationViewer.decode(n.textContent);
  }
  function validateProof(value,standalone){
    if(!keys(value,['schemaVersion','codeCommit','templateSha256','templateBytes','modules'])||value.schemaVersion!==1||!commitPattern.test(value.codeCommit)||!digestPattern.test(value.templateSha256)||!Number.isSafeInteger(value.templateBytes)||value.templateBytes<1||!Array.isArray(value.modules)||!value.modules.length||value.modules.some(m=>typeof m!=='string'||!m||m.length>300)||new Set(value.modules).size!==value.modules.length)fail('invalid template provenance');
    if(standalone?.profile!=='creator'||standalone.sourceCommit!==value.codeCommit)fail('uncommitted or mismatched Creator provenance');
    return JSON.parse(JSON.stringify(value));
  }
  async function assemble({template,templateProof,standalone,payload,releaseId,createdAt}){
    root.__radarApplicationProfile.require('publication.create');
    const v=root.__radarPublicationViewer,integrity=root.__radarArtifactIntegrity;
    const info=validateProof(templateProof,standalone),data=v.validate(payload);
    if(!/^release_[a-f0-9-]{36}$/.test(releaseId)||typeof createdAt!=='string'||!Number.isFinite(Date.parse(createdAt))||new Date(createdAt).toISOString()!==createdAt)fail('invalid release identity');
    if(typeof template!=='string'||template.split(marker).length!==2)fail('invalid template');
    const templateBytes=encoder.encode(template);
    if(templateBytes.byteLength!==info.templateBytes||await sha256(templateBytes)!==info.templateSha256)fail('template byte integrity mismatch');
    if(await integrity.digest(data.catalog)!==data.projectionDigest)fail('projection digest mismatch');
    const html=v.compose(template,data),htmlBytes=encoder.encode(html);
    const tag='<script type="application/json" id="radar-publication-payload">'+v.encode(data)+'</'+'script>';
    if(html.split(tag).length!==2||html.replace(tag,marker)!==template)fail('Viewer composition mismatch');
    const embedded=v.decode(tag.slice(tag.indexOf('>')+1,tag.lastIndexOf('<')));
    if(integrity.canonical(embedded)!==integrity.canonical(data))fail('embedded payload mismatch');
    const htmlArtifact=await artifact('viewer.html',htmlBytes);
    const manifest={format:'StandardisationRadarChart-Publication',schemaVersion:1,releaseId,createdAt,mode:'standalone',codeCommit:info.codeCommit,templateSha256:info.templateSha256,projectionDigest:data.projectionDigest,revisionIds:data.catalog.radarRevisions.map(r=>r.revisionId),modules:info.modules,artifacts:[htmlArtifact]};
    const manifestBytes=encoder.encode(JSON.stringify(manifest,null,2)+'\n');
    const manifestArtifact=await artifact('manifest.json',manifestBytes);
    if(typeof root.JSZip!=='function')fail('ZIP library unavailable');
    const zip=new root.JSZip(),date=new Date(createdAt);
    zip.file('viewer.html',htmlBytes,{date});zip.file('manifest.json',manifestBytes,{date});
    const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
    const reread=await root.JSZip.loadAsync(bytes,{checkCRC32:true});
    if(JSON.stringify(Object.keys(reread.files).sort())!==JSON.stringify(['manifest.json','viewer.html']))fail('ZIP inventory mismatch');
    for(const a of [htmlArtifact,manifestArtifact]){
      const entry=await reread.file(a.path).async('uint8array');
      if(entry.byteLength!==a.bytes||await sha256(entry)!==a.sha256)fail('ZIP byte integrity mismatch');
    }
    const filename='radar-publication-'+releaseId.slice(8)+'.zip';
    const zipArtifact=await artifact(filename,bytes);
    return {filename,bytes,manifest,evidence:{codeCommit:info.codeCommit,modules:info.modules,artifacts:[htmlArtifact,manifestArtifact,zipArtifact],checks:['template-byte-sha256','native-projection-digest','exact-viewer-composition','embedded-payload-roundtrip','zip-inventory-crc-sha256']}};
  }
  function download(delivery){
    root.__radarApplicationProfile.require('publication.create');
    const url=root.URL.createObjectURL(delivery.blob);
    try{const a=root.document.createElement('a');a.href=url;a.download=delivery.filename;root.document.body.appendChild(a);try{a.click();}finally{a.remove();}}finally{root.setTimeout(()=>root.URL.revokeObjectURL(url),1000);}
  }
  root.__radarPublicationDelivery=Object.freeze({proof,assemble,download,sha256});
})(window);
