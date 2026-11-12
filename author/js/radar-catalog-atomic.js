/* S14-K — Atomic activation of two verified ISO datasets.
 * Parse and normalize before opening a write transaction. A single IndexedDB
 * transaction owns BOTH datasets and their sync metadata; no partial activation.
 */
(function (root) {
  'use strict';
  const DB_NAME = 'standardisation-radar-iso-cache';
  const TYPES = ['deliverables', 'committees'];
  const SOURCES = {deliverables:'iso_deliverables_metadata', committees:'iso_technical_committees'};

  async function parse(type, blob, normalize, onProgress) {
    if (!TYPES.includes(type) || typeof blob?.text !== 'function') throw Error('Fichier ISO invalide');
    const records = [], ids = new Set();
    // Each dataset is validated before opening a write transaction. Supports
    // Blob.stream in modern browsers to reduce transient text allocations.
    async function* lines() {
      if (typeof blob.stream === 'function' && typeof TextDecoder !== 'undefined') {
        const reader = blob.stream().getReader(), decoder = new TextDecoder();
        let partial = '';
        try {
          for (;;) {
            const {done,value} = await reader.read();
            if (done) break;
            partial += decoder.decode(value, {stream:true});
            let at;
            while ((at = partial.indexOf('\n')) !== -1) {
              yield partial.slice(0, at).replace(/\r$/, '');
              partial = partial.slice(at+1);
            }
          }
          partial += decoder.decode();
          if (partial.trim()) yield partial;
        } finally { reader.releaseLock(); }
      } else {
        for (const line of (await blob.text()).split(/\r?\n/)) yield line;
      }
    }
    let lineNo = 0;
    for await (const line of lines()) {
      lineNo++;
      if (!line.trim()) continue;
      let raw;
      try { raw = JSON.parse(line); } catch (_) { throw Error(`${type}: JSONL invalide ligne ${lineNo}`); }
      const record = normalize(type, raw);
      if (!record?.id || ids.has(String(record.id))) throw Error(`${type}: identifiant invalide ou dupliqué ligne ${lineNo}`);
      ids.add(String(record.id));
      records.push(record);
      if (records.length % 5000 === 0) onProgress?.(`${type}: ${records.length} validés`);
    }
    if (!records.length) throw Error(`${type}: jeu de données vide`);
    return records;
  }

  function openDB() {
    return new Promise((resolve, reject) => {
      if (!root.indexedDB) return reject(Error('IndexedDB indisponible'));
      const req = root.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of TYPES) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, {keyPath:'id'});
            store.createIndex('reference', 'reference', {unique:false});
          }
        }
        if (!db.objectStoreNames.contains('sync')) db.createObjectStore('sync', {keyPath:'type'});
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || Error('Ouverture IndexedDB impossible'));
    });
  }

  function activate(db, groups, release) {
    return new Promise((resolve, reject) => {
      let tx;
      try { tx = db.transaction(['deliverables','committees','sync'], 'readwrite'); }
      catch (e) { reject(e); return; }
      tx.oncomplete = () => resolve({release, results:TYPES.map(type => ({type, count:groups[type].length}))});
      tx.onabort = () => reject(tx.error || Error('Activation atomique annulée'));
      tx.onerror = () => {}; // onabort supplies the canonical failure
      try {
        for (const type of TYPES) {
          const store = tx.objectStore(type);
          store.clear();
          for (const record of groups[type]) store.put(record);
        }
        const sync = tx.objectStore('sync');
        for (const type of TYPES) sync.put({
          type, source:SOURCES[type], count:groups[type].length,
          updatedAt:new Date().toISOString(), release, filename:'distributed:'+release
        });
      } catch (e) { try { tx.abort(); } catch (_) {} reject(e); }
    });
  }

  let active = false;
  async function importPair(blobs, options={}) {
    if (active) throw Error('Synchronisation ISO déjà en cours');
    active = true;
    let db;
    try {
      const iso = root.__radarIsoOpenData;
      if (typeof iso?.normalize !== 'function') throw Error('Normaliseur ISO indisponible');
      const groups = {};
      for (const type of TYPES) {
        options.onProgress?.('Validation '+type);
        groups[type] = await parse(type, blobs[type], iso.normalize, options.onProgress);
        if (options.expectedRecords?.[type] != null && groups[type].length !== options.expectedRecords[type]) {
          throw Error(`${type}: nombre d'enregistrements inattendu`);
        }
      }
      options.onProgress?.('Activation atomique ISO');
      db = await openDB();
      return await activate(db, groups, options.release || 'non-versionne');
    } finally { db?.close(); active = false; }
  }
  root.__radarCatalogAtomic = Object.freeze({importPair});
})(window);
