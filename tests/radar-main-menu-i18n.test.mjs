import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../radar.html',import.meta.url),'utf8');
const keys=["publishcatalogrevision","archivecatalogrevision","selectcatalogrevision","standardregistry","createcatalogblip","createstandardblip"];
const resourcesText=source.match(/const resources = (\{[\s\S]*?\});\s*\n\s*(?:function|let|var|const|i18next)/);
// Extract the object exactly; nested forms are preserved in the JS source.
const start=source.indexOf('const resources = ');
assert.ok(start>=0);
const opening=source.indexOf('{',start);
let depth=0,close=-1,quoted=null,escape=false;
for(let i=opening;i<source.length;i++){
 const c=source[i];
 if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quoted)quoted=null;continue;}
 if(c==='"'||c==="'"||c==='\u0060'){quoted=c;continue;}
 if(c==='{')depth++;
 if(c==='}'){depth--;if(depth===0){close=i;break;}}
}
const resources=runInNewContext('('+source.slice(opening,close+1)+')');
for(const language of ['fr','en']){
 test('translations '+language,()=>{
  for(const key of keys){const label=resources[language].translation.menu[key];assert.equal(typeof label,'string',key);assert.ok(label.length>5);assert.ok(!label.includes(' / '),label)}
 });
}
test('menu items always use i18next keys',()=>{
 for(const key of keys)assert.match(source,new RegExp("\\{id:'"+key+"',text:i18next\\.t\\('menu\\."+key+"'\\)\\}"));
});
test('translations refresh existing nested menus on language change',()=>{
 assert.match(source,/i18next\.changeLanguage\(lang,\s*\(\) => \{\s*updateToolbarTranslations\(\)/);
 assert.match(source,/function updateToolbarTranslations\(\) \{/);
 assert.match(source,/mainMenu\.refresh\(\)/);
});
test('revision routes and read-only guards preserved',()=>{
 for(const key of ['publishcatalogrevision','archivecatalogrevision','createdraft','selectcatalogrevision'])assert.ok(source.includes("case 'radartools:"+key+"'"),key);
 assert.ok(source.includes('readonlyMenuAllowed'));
});
