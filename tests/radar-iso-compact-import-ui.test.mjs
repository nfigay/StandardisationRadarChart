import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
test('Dataset is determined by currently selected ISO catalog view',()=>{
 assert.match(src,/pendingDataset=mode==='committees'\?'committees':'deliverables'/);
 assert.match(src,/iso\.importJsonLines\(dataset,chosen/);
});
test('No oversized ISO source select appears in lower toolbar',()=>{
 assert.match(src,/windowSizeSelect=d\.createElement\('select'\)/);assert.match(src,/sortSelect=d\.createElement\('select'\)/);assert.doesNotMatch(src,/sourceSelect=d\.createElement\('select'\)/);
 assert.match(src,/importButton\.dataset\.isoImport='true'/);
 assert.match(src,/file\.style\.display='none'/);
});
test('Import is unavailable in local references view',()=>{
 assert.match(src,/if\(mode==='references'\)return;/);
 assert.match(src,/importBtn\.disabled=mode==='references'/);
});
test('Empty committees explicitly explain how to populate view',()=>{
 assert.match(src,/mode==='committees'&&isoCommittees\.length===0/);assert.match(src,/Aucun comité TC\/SC en cache/);
 assert.match(src,/iso_technical_committees/);
});
