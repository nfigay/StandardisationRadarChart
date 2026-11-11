import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
function init(lang='fr'){
 let sidebar;
 class Sidebar{
  constructor(){this.nodes=[];this.selected=null;sidebar=this;}
  add(nodes){this.nodes=nodes;}
  get(id){const traverse=nodes=>{for(const n of nodes){if(n.id===id)return n;const sub=traverse(n.nodes||[]);if(sub)return sub;}return null;};return traverse(this.nodes);}
  refresh(){} select(id){this.selected=id;}
 }
 const source={revisionId:'historical-rev',radarId:'radar-1',title:'airbus',version:'0.1.0-draft-local-draft-local',status:'draft',ownerOrganizationId:'org'};
 const root={w2sidebar:Sidebar,i18next:{language:lang},__radarCatalogAdapter:{getRevision:()=>source},__radarCatalogPersistence:{getRadarName:()=> 'Radar renommé',getRevisionLabel:()=> 'r10'}};
 root.window=root;vm.runInNewContext(code('js/radar-workspace-explorer.js'),root);
 root.__radarWorkspaceExplorer.initialize({mount:{addEventListener(){}},graph:()=>({}),select(){}});
 root.__radarWorkspaceExplorer.addCatalog({title:'Catalogue',organizations:[{organizationId:'org',name:'Organisation'}],radarRevisions:[source]},{revisions:[{group:'CATALOG_REVISION_0'}]});
 return {root,sidebar,source};
}
test('radar name is shown once at parent and manual revision label r10 is preserved',()=>{
 const {sidebar}=init();
 const source=sidebar.nodes[0];const org=source.nodes[0];const radar=org.nodes[0];const rev=radar.nodes[0];
 assert.equal(radar.text,'Radar renommé');
 assert.equal(rev.text,'r10 — 0.1.0 — Brouillon');
 assert.ok(!rev.text.includes('airbus'));
 assert.equal(rev.workspaceGroup,'CATALOG_REVISION_0');
});
test('statuses are translated when language changes without mutating revision',()=>{
 const {root,sidebar,source}=init();
 root.i18next.language='en';root.__radarWorkspaceExplorer.refresh();
 assert.equal(sidebar.nodes[0].nodes[0].nodes[0].nodes[0].text,'r10 — 0.1.0 — Draft');
 assert.equal(source.version,'0.1.0-draft-local-draft-local');
 source.status='published';root.i18next.language='fr';root.__radarWorkspaceExplorer.refresh();
 assert.match(sidebar.nodes[0].nodes[0].nodes[0].nodes[0].text,/Publiée$/);
});
test('new draft version strips repeated technical suffix but historical versions remain unchanged',()=>{
 assert.match(code('js/radar-catalog-ui.js'),/replace\(\/\(\?:-draft-local\)\+\$\/g,''\)\+'-draft-local'/);
 assert.match(code('js/radar-catalog-persistence.js'),/replace\(\/\(\?:-draft-local\)\+\$\/g,''\)\+'-draft-local'/);
});
test('language change refreshes explorer and toolbar',()=>{
 const html=code('radar.html');assert.match(html,/window\.__radarWorkspaceExplorer\?\.refresh\?\.\(\)/);
 assert.match(html,/window\.__radarCatalogUI\?\.refreshRadarLabels\?\.\(\)/);
});
