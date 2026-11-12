/* Phase 10G-C1.1: JSON artifact envelope and integrity, browser-native WebCrypto.
 * Hash scope: artifact (manifest + data). Proof is excluded, including its digest.
 * Algorithm label is explicitly sorted-json-v1, NOT RFC 8785.
 * SHA-256 is integrity evidence, NOT proof of authorship or signature.
 */
(function(root) {
  'use strict';
  function fail(s) { throw Error('Artifact integrity: '+s); }
  function validObject(x) { return x && typeof x==='object' && !Array.isArray(x); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function canonical(x) {
    if(x===null)return 'null';
    if(typeof x==='string'||typeof x==='boolean')return JSON.stringify(x);
    if(typeof x==='number') {
      if(!Number.isFinite(x))fail('non-finite number');
      return JSON.stringify(x);
    }
    if(Array.isArray(x))return '['+x.map(canonical).join(',')+']';
    if(validObject(x)) {
      return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
    }
    fail('unsupported value');
  }
  async function digest(x) {
    if(!root.crypto?.subtle)fail('WebCrypto SHA-256 unavailable');
    var input=new TextEncoder().encode(canonical(x));
    var bytes=new Uint8Array(await root.crypto.subtle.digest('SHA-256',input));
    return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  }
  function isEnvelope(x) { return validObject(x)&&Object.prototype.hasOwnProperty.call(x,'artifact'); }
  function validateManifest(m) {
    if(!validObject(m)||m.format!=='StandardisationRadarChart'||m.schemaVersion!=='1.0.0'||
       typeof m.catalogId!=='string'||!m.catalogId.trim()||
       typeof m.artifactId!=='string'||!m.artifactId.trim()||
       !validObject(m.origin)||!validObject(m.lineage))fail('invalid business manifest');
  }
  async function inspect(json) {
    if(!isEnvelope(json)) {
      if(!validObject(json)||json.schemaVersion!=='1.0.0')fail('unsupported legacy catalog');
      return {catalog:clone(json),manifest:null,legacy:true,digest:null};
    }
    if(Object.keys(json).some(k=>k!=='artifact'&&k!=='proof'))fail('unexpected envelope fields');
    if(!validObject(json.artifact)||!validObject(json.artifact.data))fail('invalid artifact data');
    validateManifest(json.artifact.manifest);
    var p=json.proof;
    if(!validObject(p)||p.digestAlgorithm!=='SHA-256'||p.canonicalization!=='sorted-json-v1'||
       !/^[a-f0-9]{64}$/.test(p.digest||''))fail('unsupported or missing proof');
    if(p.signature!==null && p.signature!==undefined)fail('digital signatures not supported yet');
    var actual=await digest(json.artifact);
    if(actual!==p.digest)fail('SHA-256 mismatch; artifact rejected');
    if(json.artifact.data.schemaVersion!=='1.0.0')fail('catalog schema incompatible');
    return {catalog:clone(json.artifact.data),manifest:clone(json.artifact.manifest),legacy:false,digest:actual};
  }
  async function wrap(catalog,manifest) {
    validateManifest(manifest);
    var artifact={manifest:clone(manifest),data:clone(catalog)};
    return {artifact:artifact,proof:{canonicalization:'sorted-json-v1',digestAlgorithm:'SHA-256',digest:await digest(artifact),signature:null}};
  }
  root.__radarArtifactIntegrity=Object.freeze({canonical:canonical,digest:digest,inspect:inspect,wrap:wrap,isEnvelope:isEnvelope});
})(window);
