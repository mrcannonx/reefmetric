// Serves no network mutations: local built-site controls only. Remote images are
// blocked here; the parent full-site audit separately checks image/network errors.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const liveRecord = process.argv.includes('--live-record');
const base = process.env.AUDIT_BASE || (liveRecord ? 'https://reefmetric.com' : 'http://127.0.0.1:4326');
const cases = [];
function add(tool, inputs, expected, output, kind='realistic') { cases.push({tool,inputs,expected,output,kind}); }
const invalid = 'Check';
for(const [inputs,expected] of [
 [{dGallons:'75',dParam:'alk',dCurrent:'7',dTarget:'9'},['107.1 mL','2 days']],
 [{dGallons:'40',dParam:'ca',dCurrent:'400',dTarget:'420'},['40.9 mL','50 ppm/day']],
 [{dGallons:'120',dParam:'mg',dCurrent:'1250',dTarget:'1300'},['227.1 mL','5 days','10 ppm/day']],
]) add('reef-dosing',inputs,expected,'#dose-out');
add('reef-dosing',{dGallons:'0'},[invalid],'#dose-out','edge');
for(const [inputs,expected] of [
 [{tvPreset:'custom',tvL:'30',tvW:'12',tvH:'12',tvGap:'0',tvSand:'0',tvRock:'0',tvSump:'0'},['18.7 gal']],
 [{tvPreset:'40b',tvGap:'1',tvSand:'1',tvRock:'30',tvSump:'5'},['42 gal']],
 [{tvPreset:'75',tvGap:'1',tvSand:'1.5',tvRock:'60',tvSump:'15'},['79.7 gal']],
]) add('tank-volume',inputs,expected,'#tv-summary');
add('tank-volume',{tvGap:'21'},['leave no display water'],'#tv-summary','edge');
for(const [g,b,r,w] of [['40','softlps','200','800'],['75','mixed','500','1,938'],['120','sps','840','5,160']]) add('flow',{flGallons:g,flBand:b,flReturn:r},[`~${w} GPH`],'#fl-summary');
add('flow',{flReturn:'-1'},[invalid],'#fl-summary','edge');
for(const [g,room,target,w] of [['75','68','78','380W'],['30','73','78','90W'],['120','60','78','1200W']]) add('heater',{htGallons:g,htRoom:room,htTarget:target},[w+' total'],'#ht-summary');
add('heater',{htRoom:''},[invalid],'#ht-summary','edge');
for(const [g,b] of [['30','light'],['75','medium'],['120','heavy']]) add('protein-skimmer',{sDisplayGallons:g,sBioload:b},[`${g} gallon`,b],'#sk-summary');
add('protein-skimmer',{sMaxPrice:'-10'},[invalid],'#sk-summary','edge');
for(const [g,t,h] of [['40','5','3'],['75','7','4.5'],['120','10','5']]) add('return-pump',{displayGallons:g,turnover:t,staticHeadFt:h},[`${(Number(g)*Number(t)).toLocaleString('en-US')} GPH`],'#summary');
add('return-pump',{staticHeadFt:'-1'},[invalid],'#summary','edge');
for(const [g,p,f,expected] of [['75','10','weekly','32'],['40','15','biweekly','13'],['120','20','monthly','24']]) add('salt-cost',{stGallons:g,stPct:p,stFreq:f},[`${expected} gallons`],'#salt-summary');
add('salt-cost',{stPct:'101'},[invalid],'#salt-summary','edge');
for(const [u,v,expected] of [['ppt','35','SG 1.0264'],['sg','1.0264','53.0 mS/cm'],['cond','53','35.0 ppt']]) add('salinity',{salUnit:u,salValue:v},[expected],'#sal-summary');
add('salinity',{salValue:''},[invalid],'#sal-summary','edge');
for(const [temp,sg] of [['77','1.0250'],['78','1.0251'],['82','1.0257']]) add('salinity',{tcSG:'1.025',tcTemp:temp},[`true SG is about ${sg}`],'#temp-summary');
add('salinity',{tcTemp:''},[invalid],'#temp-summary','edge');
for(const [current,target,g,pct] of [['40','10','75','75%'],['20','5','40','75%'],['0.2','0.05','120','75%']]) add('water-change',{wcCurrent:current,wcTarget:target,wcGallons:g},[pct],'#wc-summary');
add('water-change',{wcTarget:'0'},['Partial dilution never reaches exactly 0'],'#wc-results','edge');
for(const [g,m,c,pct] of [['40','standard','2','32%'],['75','standard','4','34%'],['120','heavy','8','32%']]) add('stocking',{stkGal:g,stkFilt:m,'[data-fish="Ocellaris Clownfish"]':c},[pct],'#stk-summary');
add('stocking',{'[data-fish="Ocellaris Clownfish"]':'-1'},[invalid],'#stk-summary','edge');
for(const [fixture,distance,expected] of [['1','12','1908 PAR'],['1','15','1185 PAR'],['1','21','330 PAR']]) add('reef-par',{parFixture:fixture,parDistance:distance},[expected],'#par-summary');
add('reef-par',{parFixture:'1',parDistance:'30'},['unknown'],'#par-summary','edge');
for(const [g,t,s,c,rate,expected] of [
 ['75','mid','yes','mixed','0.17',['143W','102.96 kWh','$17.50 electricity']],
 ['30','budget','no','softie','0.20',['69W','49.68 kWh','$9.94 electricity']],
 ['120','premium','yes','sps','0',['192W','138.24 kWh','$0.00 electricity']],
]) add('reef-build-cost',{cGallons:g,cTier:t,cSump:s,cCoral:c,cKwh:rate},expected,'#cost-totals');
add('reef-build-cost',{cKwh:''},['Enter at least'],'#cost-totals','edge');
for(const [w,h,d,r,expected] of [['100','24','30','0.17',['72.00 kWh','$12.24']],['150','8','30','0.2',['36.00 kWh','$7.20']],['50','24','31','0.3',['37.20 kWh','$11.16']]]) add('reef-build-cost',{eWatts:w,eHours:h,eDays:d,eRate:r},expected,'#electricity-result');
add('reef-build-cost',{eHours:'25'},['no more than 24'],'#electricity-result','edge');
if(liveRecord) {
  for(const item of cases.filter((c)=>c.tool==='reef-par')) {
    item.inputs = item.kind==='edge' ? {parHeight:'0',parDepth:'8'} : {parHeight: item.inputs.parDistance==='12'?'8':item.inputs.parDistance==='15'?'12':'18',parDepth:'8'};
    item.expected = []; // Local replacement is a source-coordinate explorer, not the old mount+depth predictor.
  }
  add('reef-dosing',{dGallons:'75',dParam:'ca',dCurrent:'400',dTarget:'420',dAdditive:'Red Sea Reef Foundation A (Calcium)'},[],'#dose-out','source-strength');
  add('reef-dosing',{dGallons:'75',dParam:'alk',dCurrent:'7',dTarget:'9',dAdditive:'Red Sea Reef Foundation B (Alkalinity)'},[],'#dose-out','source-strength');
}
const browser=await chromium.launch({headless:true});

const results=[];
for(const item of cases){
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const response=await page.goto(`${base}/tools/${item.tool}-calculator`,{waitUntil:'load'});
  assert.equal(response.status(),200);
  const baseline = await page.locator(item.output).textContent();
  const originalInputs = {};
  for(const id of Object.keys(item.inputs)) originalInputs[id] = await page.locator(id.startsWith('[')?id:'#'+id).inputValue();
  for(const [id,value] of Object.entries(item.inputs)){
   const target=page.locator(id.startsWith('[')?id:'#'+id);
   if(await target.evaluate(e=>e.tagName==='SELECT')) await target.selectOption(id==='dAdditive'?{label:value}:value); else await target.fill(value);
   if(liveRecord && id==='dParam') {
     await page.locator('#dAdditive').selectOption({label: value==='alk'?'BRS 2-Part Liquid Soda Ash (Alk)':value==='ca'?'BRS 2-Part Liquid Calcium Chloride':'Red Sea Reef Foundation C (Magnesium)'});
   }
  }
  if(liveRecord) {
    results.push({...item,actual:await page.locator(item.output).innerText(),observed:true,comparisonToLocalFixedOutput:item.expected,consoleErrors:errors});
    await context.close();
    continue;
  }
  for(const expected of item.expected) await page.waitForFunction(({selector,text})=>document.querySelector(selector)?.textContent.includes(text),{selector:item.output,text:expected},{timeout:3000});
  const actual=await page.locator(item.output).innerText();
  assert.equal(errors.length,0,errors.join('; '));
  let recovered = null;
  if(item.kind === 'edge') {
    for(const [id,value] of Object.entries(originalInputs)) {
      const target=page.locator(id.startsWith('[')?id:'#'+id);
      if(await target.evaluate(e=>e.tagName==='SELECT')) await target.selectOption(value); else await target.fill(value);
    }
    await page.waitForFunction(({selector,text})=>document.querySelector(selector)?.textContent===text,{selector:item.output,text:baseline},{timeout:3000});
    assert.equal(await page.locator('input[aria-invalid="true"]').count(),0,'Valid recovery must clear stale invalid-input accessibility state');
    recovered = true;
  }
  results.push({...item,actual,pass:true,recovered,consoleErrors:errors});
 }catch(e){results.push({...item,actual:await page.locator(item.output).innerText().catch(()=>''),pass:false,error:e.message,consoleErrors:errors});}
 await context.close();
}
if (!liveRecord) {
// The plan must survive a real reload; corrupt/blocked storage must not kill it.
const persistenceContext=await browser.newContext({viewport:{width:390,height:844}});
await persistenceContext.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
const savedPage=await persistenceContext.newPage();
try {
 await savedPage.goto(`${base}/tools/stocking-calculator`,{waitUntil:'load'});
 await savedPage.locator('#stkGal').fill('75');
 await savedPage.locator('[data-fish="Ocellaris Clownfish"]').fill('2');
 await savedPage.reload({waitUntil:'load'});
 assert.equal(await savedPage.locator('#stkGal').inputValue(),'75');
 assert.equal(await savedPage.locator('[data-fish="Ocellaris Clownfish"]').inputValue(),'2');
 assert.match(await savedPage.locator('#stk-save-state').innerText(),/restored/);
 results.push({tool:'stocking',kind:'reload',pass:true,actual:'75 gallons and 2 clownfish restored after reload'});
 await savedPage.evaluate(()=>localStorage.setItem('reefmetric.stocking-plan.v1','{bad-json'));
 await savedPage.reload({waitUntil:'load'});
 assert.match(await savedPage.locator('#stk-save-state').innerText(),/could not be read/);
 await savedPage.locator('[data-fish="Ocellaris Clownfish"]').fill('1');
 assert.match(await savedPage.locator('#stk-summary').innerText(),/1 fish/);
 results.push({tool:'stocking',kind:'corrupt-storage',pass:true,actual:'Corrupt plan reported; calculation and saving recovered on edit'});
 await savedPage.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked by test');}}));
 await savedPage.reload({waitUntil:'load'});
 await savedPage.locator('[data-fish="Ocellaris Clownfish"]').fill('2');
 assert.match(await savedPage.locator('#stk-save-state').innerText(),/unavailable/);
 assert.match(await savedPage.locator('#stk-summary').innerText(),/2 fish/);
 results.push({tool:'stocking',kind:'blocked-storage',pass:true,actual:'Blocked storage reported; calculation still works'});
} catch(e) { results.push({tool:'stocking',kind:'persistence',pass:false,error:e.message}); }
await persistenceContext.close();
}
await browser.close();mkdirSync('evidence',{recursive:true});
writeFileSync(liveRecord?'evidence/calculator-live-observations.json':'evidence/calculator-ui-audit.json',JSON.stringify({measuredAt:new Date().toISOString(),base,browser:'isolated Playwright Chromium',scope:liveRecord?'Live calculator page controls, 390px viewport. Observations only; expected local-fixed output is recorded for comparison, not treated as a live pass. External images blocked.':'Real built page controls, 390px viewport; remote image requests blocked; full rendering/axe/network checks are separate.',results},null,2)+'\n');
const failed=results.filter(r=>liveRecord?!r.observed:!r.pass);console.log(JSON.stringify(liveRecord?{observations:results.length,readFailures:failed.length}:{cases:results.length,passed:results.length-failed.length,failed:failed.map(({tool,inputs,actual,error})=>({tool,inputs,actual,error}))},null,2));
if(failed.length)process.exitCode=1;
