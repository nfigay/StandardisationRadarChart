/* S14-J: Read-only catalogue change journals published by the operator.
 * Untrusted text is rendered by w2grid as text; this module never edits blips.
 */
(function(root){'use strict';
 const hex=/^[a-f0-9]{64}$/i;
 function urlBase(value){const u=new URL(value,root.location?.href||'http://localhost/');if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('URL de catalogue invalide');return u.href.endsWith('/')?u.href:u.href+'/';}
 function safePath(s){if(typeof s!=='string'||!s||s.startsWith('/')||s.includes('\\')||/[:?#]/.test(s)||s.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Chemin de journal invalide');return s;}
 async function fetchJson(url){const response=await fetch(url,{cache:'no-store',credentials:'omit'});if(!response.ok)throw Error('Journal HTTP '+response.status);return response.json();}
 async function hash(buf){if(!root.crypto?.subtle)throw Error('WebCrypto requis');const out=await root.crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(out)].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function load(endpoint,selector){const base=urlBase(endpoint),index=await fetchJson(new URL('changes/index.json',base));if(index.schemaVersion!==1||index.catalogId!=='iso'||!Array.isArray(index.journals))throw Error('Index des évolutions incompatible');
  const item=selector?index.journals.find(x=>x.from===selector.from&&x.to===selector.to):index.journals.at(-1);if(!item)return {journals:index.journals,journal:null};
  if(!hex.test(item.sha256)||!Number.isSafeInteger(item.bytes)||item.bytes<1||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(item.from)||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(item.to))throw Error('Descripteur de journal invalide');
  const path=safePath(item.path),address=new URL('changes/'+path,base);if(address.origin!==new URL(base).origin)throw Error('Origine du journal invalide');
  const res=await fetch(address,{cache:'no-store',credentials:'omit'});if(!res.ok)throw Error('Journal HTTP '+res.status);const bytes=await res.arrayBuffer();if(bytes.byteLength!==item.bytes||await hash(bytes)!==item.sha256)throw Error('Intégrité du journal invalide');
  const journal=JSON.parse(new TextDecoder().decode(bytes));if(journal.schemaVersion!==1||journal.catalogId!=='iso'||journal.from!==item.from||journal.to!==item.to||!Array.isArray(journal.changes))throw Error('Journal incompatible');return {journals:index.journals,journal};
 }
 root.__radarCatalogChanges=Object.freeze({load});
})(window);
