// npm run build && node scripts/serve-built.mjs; node scripts/audit-browser.mjs [origin] [label]
// Reads every rendered page; never submits email or sends analytics. JSON includes failures.
import { chromium } from 'playwright';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const origin = process.argv[2] || 'http://127.0.0.1:4326';
const label = process.argv[3] || 'local';
const dir = `evidence/${label}`;
await mkdir(dir, {recursive:true});
async function files(path) { let all=[]; for (const e of await readdir(path,{withFileTypes:true})) all.push(...(e.isDirectory()?await files(`${path}/${e.name}`):[`${path}/${e.name}`])); return all; }
const routes=(await files('dist')).filter(x=>x.endsWith('.html')&&!x.includes('/go/')).map(x=>x.endsWith('cheat-sheet-email.html')?'/cheat-sheet-email.html':x.slice(4).replace(/\/index.html$/,'/').replace(/\.html$/,''));
const browser=await chromium.launch({headless:true});
const report={origin,at:new Date().toISOString(),widths:[320,375,390,768,1440],pages:[],controls:{},blockedRequests:[],notes:['Email POST and analytics blocked deliberately; no emails or live writes. Browser measurements cover rendered DOM, not field Core Web Vitals.']};
const layoutProbe=()=>{
 const width=window.innerWidth;
 const textEdges=[];
 if(width===1440){
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const n=walker.currentNode, p=n.parentElement;
   if(!n.textContent.trim()||!p||p.closest('script,style,svg,[hidden],[aria-hidden="true"]'))continue;
   const s=getComputedStyle(p); if(s.visibility==='hidden'||s.display==='none')continue;
   const range=document.createRange();range.selectNodeContents(n);
   for(const r of range.getClientRects())if(r.width&&r.height&&(r.left<24-0.5||r.right>width-24+0.5))textEdges.push({text:n.textContent.trim().slice(0,85),left:r.left,right:r.right});
  }
 }
 return {innerWidth:width,viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,textEdges,fonts:document.fonts.status,bodyFont:getComputedStyle(document.body).fontFamily,css:document.styleSheets.length};
};
let cursor=0;
async function worker(){
 const context=await browser.newContext();
 await context.route('**/*',async route=>{
  const req=route.request();
  if(!['GET','HEAD'].includes(req.method())||/cloudflareinsights\.com/.test(req.url())){report.blockedRequests.push({url:req.url(),method:req.method()});await route.fulfill({status:204,body:''});}
  else await route.continue();
 });
 const page=await context.newPage();
 while(cursor<routes.length){
  const path=routes[cursor++], row={path,widths:[],console:[],pageErrors:[],httpErrors:[],images:[]};
  page.removeAllListeners('console');page.removeAllListeners('pageerror');page.removeAllListeners('response');
  page.on('console',m=>{if(m.type()==='error')row.console.push(m.text());});
  page.on('pageerror',e=>row.pageErrors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)row.httpErrors.push({url:r.url(),status:r.status()});});
  try{
   await page.setViewportSize({width:390,height:900});
   const response=await page.goto(origin+path,{waitUntil:'load',timeout:45000}); row.status=response.status();row.finalURL=page.url();
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('img').evaluateAll(async images=>{await Promise.all(images.map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
   for(const width of report.widths){
    await page.setViewportSize({width,height:900});
    const state=await page.evaluate(layoutProbe);state.width=width;
    if(width===390||width===1440){
     await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
     const axe=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};});
     state.axe=axe;
     if(process.env.SCREENSHOTS==='1')await page.screenshot({path:`${dir}/${path==='/'?'home':path.slice(1).replaceAll('/','--')}-${width}.png`,fullPage:true});
    }
    row.widths.push(state);
   }
   row.images=await page.locator('img').evaluateAll(images=>images.map(i=>({src:i.currentSrc||i.src,width:i.width,height:i.height,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,loading:i.loading,complete:i.complete})));
   row.resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize,transfer:r.transferSize,duration:Math.round(r.duration)})));
  }catch(e){row.error=e.message;}
  report.pages.push(row);await writeFile(`${dir}/browser-audit.json`,JSON.stringify(report,null,2));console.log(`${label} ${path}: ${row.error||'checked'}`);
 }
 await context.close();
}
await Promise.all([worker(),worker(),worker()]);
const control=await browser.newPage({viewport:{width:390,height:900}});
await control.goto(origin+'/');
await control.evaluate(()=>{const d=document.createElement('div');d.id='overflow-positive-control';d.style.cssText='width:700px;height:20px;background:red';d.textContent='Deliberately too wide';document.body.append(d);});
const fail=await control.evaluate(layoutProbe);report.controls.overflow={expected:'FAIL',detected:fail.overflow,measurement:fail};
await control.goto(origin+'/this-page-must-not-exist-20261025');
report.controls.notFound={expected:404,status:(await control.request.get(origin+'/this-page-must-not-exist-20261025')).status()};
await browser.close();
report.summary={pages:report.pages.length,pageErrors:report.pages.filter(p=>p.error||p.pageErrors.length).length,consoleErrors:report.pages.flatMap(p=>p.console.map(message=>({path:p.path,message}))),httpErrors:report.pages.flatMap(p=>p.httpErrors.map(error=>({path:p.path,...error}))),brokenImages:report.pages.flatMap(p=>p.images.filter(i=>!i.naturalWidth).map(i=>({path:p.path,src:i.src}))),overflow:report.pages.flatMap(p=>p.widths.filter(w=>w.overflow).map(w=>({path:p.path,width:w.width}))),textEdges:report.pages.flatMap(p=>p.widths.filter(w=>w.textEdges.length).map(w=>({path:p.path,width:w.width,count:w.textEdges.length}))),axe:report.pages.flatMap(p=>p.widths.filter(w=>w.axe?.violations.length).map(w=>({path:p.path,width:w.width,ids:w.axe.violations.map(v=>v.id)})))};
await writeFile(`${dir}/browser-audit.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));
if(!fail.overflow||report.controls.notFound.status!==404||report.summary.pageErrors||report.summary.consoleErrors.length||report.summary.httpErrors.length||report.summary.brokenImages.length||report.summary.overflow.length||report.summary.textEdges.length||report.summary.axe.length)process.exitCode=1;
