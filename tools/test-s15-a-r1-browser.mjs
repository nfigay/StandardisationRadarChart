// Real Chromium DOM/W2UI regression in an isolated, disposable profile.
// No server already running, no npm dependencies, no personal catalogue.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const report={operation:'S15-A-R1-BROWSER',startedAt:new Date().toISOString(),scope:'Real DOM, W2UI, i18next and native reference services; isolated fixture, no ISO acquisition or full application startup',profiles:[],errors:[],ok:false};
let server,chrome,ws,dir,seq=0;const pending=new Map();
const assert=(v,m)=>{if(!v)throw Error(m);return v;};
async function wait(fn,ms=20000){const end=Date.now()+ms;let last;while(Date.now()<end){try{const v=await fn();if(v)return v;}catch(e){last=e;}await delay(100);}throw Error('Timeout: '+(last?.message||'condition not reached'));}
function cdp(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},10000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const x=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(x.exceptionDetails)throw Error(x.exceptionDetails.exception?.description||x.exceptionDetails.text);return x.result.value;}
try{
 const documents=path.join(os.homedir(),'Documents');fs.mkdirSync(documents,{recursive:true});dir=fs.mkdtempSync(path.join(documents,'S15-A-R1-browser-'));
 const bin=process.env.S15_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';assert(fs.existsSync(bin),'Google Chrome not found: '+bin);
 const fixture='/tests/radar-s15-a-r1-browser.html';
 server=http.createServer((req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(!(name===fixture||name==='/radar.html'||/^\/(?:lib|js|css)\/[\w.\/-]+$/.test(name)))throw Error('not served');const file=path.resolve(repo,'.'+name);if(!file.startsWith(repo+path.sep))throw Error('invalid path');const data=fs.readFileSync(file);const ext=path.extname(file);res.writeHead(200,{'Content-Type':ext==='.js'?'text/javascript':ext==='.css'?'text/css':'text/html','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 const profile=path.join(dir,'profile'),log=fs.openSync(path.join(dir,'chrome.log'),'w');
 chrome=spawn(bin,['--headless=new','--disable-gpu','--no-proxy-server','--disable-background-networking','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1600,1000',...(process.env.S15_CHROME_NO_SANDBOX==='1'?['--no-sandbox']:[]),'about:blank'],{stdio:['ignore',log,log]});fs.closeSync(log);let launchError;chrome.on('error',e=>{launchError=e;});
 const port=await wait(()=>{if(launchError)throw launchError;const p=path.join(profile,'DevToolsActivePort');return fs.existsSync(p)&&fs.readFileSync(p,'utf8').split('\n')[0];});
 const target=await wait(async()=>{const a=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();return a.find(x=>x.type==='page');});
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')(report.runtimeErrors??=[]).push(m.params.exceptionDetails); if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}});
 await cdp('Page.enable');await cdp('Runtime.enable');
 for(const mode of ['creator','viewer']){
   const url=`http://127.0.0.1:${server.address().port}${fixture}?profile=${mode}`;
   const navigation=await cdp('Page.navigate',{url});report.navigation=navigation;assert(!navigation.errorText,navigation.errorText);
   const result=await wait(async()=>{const state=await evaluate(`({href:location.href,ready:document.readyState,finished:document.body?.dataset.finished,text:document.getElementById('result')?.textContent,body:document.body?.innerText?.slice(0,300)})`);report.lastState=state;return state.href===url&&state.finished==='true'?JSON.parse(state.text):null;});
   report.profiles.push({mode,...result});
   const shot=await cdp('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,mode+'.png'),Buffer.from(shot.data,'base64'));
   assert(result.ok,mode+': '+result.errors.join('; '));
 }
 report.ok=true;
}catch(e){report.errors.push(e.stack||e.message);}finally{
 if(ws)ws.close();if(chrome)chrome.kill();if(server)server.close();
 for(const p of pending.values())clearTimeout(p.timer);
 report.finishedAt=new Date().toISOString();report.operationOk=report.ok;
 try{if(!dir){dir=fs.mkdtempSync(path.join(os.tmpdir(),'S15-A-R1-browser-'));}report.reportPath=path.join(dir,'S15-A-R1-BROWSER.json');report.clipboard={ok:true};let json=JSON.stringify(report,null,2);fs.writeFileSync(report.reportPath,json);const cp=spawnSync('pbcopy',[],{input:json,encoding:'utf8'});if(cp.status!==0){report.clipboard={ok:false,error:cp.error?.message||cp.stderr||'pbcopy failed'};if(!process.env.S15_R1_ALLOW_NO_CLIPBOARD)report.ok=false;json=JSON.stringify(report,null,2);fs.writeFileSync(report.reportPath,json);}console.log(json);}catch(e){report.ok=false;report.errors.push(e.message);console.log(JSON.stringify(report,null,2));}
 process.exitCode=report.ok?0:1;
}
