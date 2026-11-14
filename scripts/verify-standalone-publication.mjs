// A8.6 static byte verification of actual built Creator and Viewer.
// Runs the same browser assembly against the built template, but does not
// pretend to exercise browser UI, record a release, or prove offline usage.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {assertPagesProvenance} from './pages-build-provenance.mjs';
const [directory,example]=process.argv.slice(2);assert.ok(directory&&example,'Expected output directory and synthetic catalog');
const repo=process.cwd(),commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assertPagesProvenance(repo,commit);
const dir=resolve(directory),creator=readFileSync(join(dir,'standardization-radar-creator.html'),'utf8'),viewer=readFileSync(join(dir,'standardization-radar-viewer.html'),'utf8');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
function tag(html,id){const matches=[...html.matchAll(new RegExp('<script type="application/json" id="'+id+'">([A-Za-z0-9+/=]+)</script>','g'))];assert.equal(matches.length,1,'Expected one '+id);return Buffer.from(matches[0][1],'base64');}
const template=tag(creator,'radar-viewer-template'),proof=JSON.parse(tag(creator,'radar-viewer-template-proof').toString('utf8'));
assert.equal(template.toString('utf8'),viewer);assert.equal(proof.codeCommit,commit);assert.equal(proof.templateSha256,sha(template));assert.equal(proof.templateBytes,template.length);
assert.ok(proof.modules.includes('js/radar-publication-viewer.js'));assert.ok(!proof.modules.includes('lib/jszip.min.js'));assert.ok(!proof.modules.includes('js/radar-publication-delivery.js'));
assert.ok(creator.includes('root.__radarPublicationDelivery=Object.freeze'));assert.ok(!viewer.includes('root.__radarPublicationDelivery=Object.freeze'));assert.ok(creator.includes('JSZip v3.7.1'));assert.ok(!viewer.includes('JSZip v3.7.1'));
for(const [profile,html] of [['creator',creator],['viewer',viewer]]){
  assert.ok(html.includes('sourceCommit:'+JSON.stringify(commit)),'Missing actual commit in '+profile);
  const resources=JSON.parse(html.match(/const resources=(\{[^\r\n]*\});/)[1]);
  assert.equal(Object.keys(resources).some(k=>k.startsWith('catalog-distribution/')),profile==='creator');
}
const module={exports:{}};
vm.runInNewContext(readFileSync('lib/jszip.min.js','utf8'),{module,exports:module.exports,Buffer,Uint8Array,ArrayBuffer,TextEncoder,TextDecoder,setTimeout,clearTimeout,setImmediate,console});
const root={btoa,atob,crypto:{subtle:webcrypto.subtle},JSZip:module.exports,__radarApplicationProfile:{require(c){assert.equal(c,'publication.create');}}};
const context=vm.createContext({window:root,TextEncoder,TextDecoder,Uint8Array});
for(const name of ['radar-publication-model','radar-publication-projection','radar-artifact-integrity','radar-publication-viewer','radar-publication-delivery'])vm.runInContext(readFileSync('js/'+name+'.js','utf8'),context,{filename:name+'.js'});
const source=JSON.parse(readFileSync(example,'utf8')),definition=root.__radarPublicationModel.state(source).definitions[0];
const projection=root.__radarPublicationProjection.project(source,definition.configuration);assert.equal(root.__radarPublicationProjection.verify(source,definition.configuration,projection.catalog),true);
const projectionDigest=await root.__radarArtifactIntegrity.digest(projection.catalog),payload=root.__radarPublicationViewer.payload(projection.catalog,{projectionDigest},definition.configuration.presentation);
const result=await root.__radarPublicationDelivery.assemble({template:viewer,templateProof:proof,standalone:{profile:'creator',sourceCommit:commit},payload,releaseId:'release_00000000-0000-4000-8000-000000000000',createdAt:'2026-11-14T08:00:00.000Z'});
assert.equal(result.manifest.projectionDigest,projectionDigest);assert.equal(JSON.stringify(result.manifest.revisionIds),JSON.stringify(['rev-1','rev-3']));assert.equal(projection.report.isoDocumentCount,1);
assert.equal(result.evidence.artifacts[2].sha256,sha(result.bytes));assert.equal(result.evidence.artifacts[2].bytes,result.bytes.byteLength);assert.equal(result.evidence.artifacts.length,3);
console.log(JSON.stringify({operation:'A86-BUILT-ARTIFACT-VERIFICATION',codeCommit:commit,templateSha256:proof.templateSha256,templateBytes:proof.templateBytes,entryScriptCount:proof.modules.length,projectionDigest,revisionIds:result.manifest.revisionIds,isoDocumentCount:projection.report.isoDocumentCount,artifacts:result.evidence.artifacts,checks:result.evidence.checks,syntheticAssemblyOnly:true,releaseRecorded:false,browserRecipeRequired:true,ok:true},null,2));
