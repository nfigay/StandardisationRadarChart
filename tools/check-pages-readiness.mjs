import {existsSync, readFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
const argv=process.argv;
const arg=(name,fallback)=>argv.includes(name)?argv[argv.indexOf(name)+1]:fallback;
const repo=resolve(arg('--repo','.'));
const strict=argv.includes('--strict');
const out=resolve(arg('--out',join(repo,'.radarchart-build/pages')));
const report={operation:'S14-Z-PAGES-READINESS',output:out,errors:[],warnings:[],files:{}};
for(const f of ['radar.html','js/radar-s14-z-sources.js','js/radar-iso-windowed-db.js','lib/w2ui.min.js']){
 report.files[f]=existsSync(join(out,f)); if(!report.files[f])report.errors.push('Missing deployment file: '+f);
}
if(report.files['radar.html']){
 const html=readFileSync(join(out,'radar.html'),'utf8');
 if(!html.includes('radar-s14-z-sources.js'))report.errors.push('S14-Z script not referenced');
 if(!html.includes('/StandardisationRadarChart/'))report.errors.push('GitHub Pages base missing');
}
let config=null;
try{config=JSON.parse(readFileSync(join(out,'radar-catalog-config.json'),'utf8'));}catch(_){report.warnings.push('No catalog endpoint configuration in published artifact');}
if(config){
 report.catalogEndpoint=config.endpoint ?? null;
 if(!config.endpoint)report.warnings.push('ISO catalog endpoint is missing');
 if(config.endpoint && /^https?:\/\//i.test(config.endpoint) && !config.endpoint.startsWith('https://')) report.warnings.push('Public catalog endpoint should use HTTPS');
}
report.catalogFilesPublished=existsSync(join(out,'catalog-distribution','manifest.json'));
if(config && /^\.?\.?\/catalog-distribution\/?$/.test(config.endpoint) && !report.catalogFilesPublished)
 report.warnings.push('ISO catalog endpoint is local but catalog-distribution is absent from Pages artifact');
if(!report.catalogFilesPublished && !config?.endpoint?.startsWith('https://'))report.warnings.push('A new user will not be able to initialize ISO without a separately hosted HTTPS catalog');
if(strict){
 if(!existsSync(join(out,'ICS.csv'))) report.errors.push('ICS.csv is absent: publishing would remove the existing historical GitHub Pages ICS source');
 if(!config?.endpoint?.startsWith('https://') && !report.catalogFilesPublished) report.errors.push('No HTTPS catalog endpoint (and no published catalog) for first-time visitors');
}
report.ok=report.errors.length===0;
console.log(JSON.stringify(report,null,2));
process.exitCode=report.ok?0:1;
