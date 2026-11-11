import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../js/radar-standards-panel.js',import.meta.url),'utf8');
test('offers three bounded window sizes',()=>{for(const n of [100,250,500])assert.match(panel,new RegExp('\\b'+n+'\\b'));assert.match(panel,/const WINDOW_SIZES=\[100,250,500\]/);});
test('uses selection as IndexedDB page limit',()=>{assert.match(panel,/limit:windowSize,after:windowHistory\[windowPosition\]/);});
test('first previous next preserve cursor windows',()=>{assert.match(panel,/windowPage\('first'\)/);assert.match(panel,/windowPage\('previous'\)/);assert.match(panel,/windowPage\('next'\)/);assert.match(panel,/direction==='first'/);});
test('controls remain bounded and non-windowed modes hide navigation',()=>{assert.match(panel,/WINDOW_SIZES\.includes\(size\)/);assert.match(panel,/data-iso-window-navigator/);assert.match(panel,/windowedActive&&\['ics','committees','iso-list'\]/);});
test('keeps ISO remote sync and ICS fallback',()=>{assert.match(panel,/__radarIsoCatalogClient\.sync/);assert.match(panel,/loadIcs\(true\)/);assert.match(panel,/readAll/);});
