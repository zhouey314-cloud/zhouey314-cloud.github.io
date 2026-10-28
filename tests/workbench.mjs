import {chromium,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {serve,source,mkdir,writeFile,resolve,assert} from './support.mjs';
const site=await serve(),out=resolve(process.env.STUDIO_REPORT_DIR||'test-results/studio');await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),base:site.base,source:source(),scope:'Real Chromium/WebKit interaction and accessibility checks; synthetic retrieval fixtures, no model calls. Mobile is viewport emulation.',cases:[],failures:[]};
async function run(title,fn){const entry={title};try{await fn(entry);entry.status='PASS'}catch(e){entry.status='FAIL';entry.error=e.stack;report.failures.push(title)}report.cases.push(entry);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(entry.status,title,entry.error||'');}
try{for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();try{
 for(const width of [1440,390,320])await run(`${name} ${width}px workspace flows`,async entry=>{
  const c=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce',acceptDownloads:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(20000);
  try{
   await p.goto(site.base+'/workbench.html#rag');await p.waitForFunction(()=>document.querySelector('[data-answer]').dataset.state==='EXTRACTIVE');
   assert((await p.locator('[data-answer]').innerText()).includes('14 calendar days'),'real refund excerpt');assert(await p.locator('[data-source] mark').count()===1,'exact source highlight');
   await p.locator('[data-query="What is the support phone number?"]').click();assert(await p.locator('[data-answer]').getAttribute('data-state')==='NO_ANSWER','unsupported phone refusal');assert(await p.locator('[data-hits] button').count()===1,'related hit retained');
   await p.locator('[data-query="internal onboarding"]').click();assert(await p.locator('[data-hits] button').count()===0,'public scope excludes team');
   await p.locator('#scope').selectOption('team');assert(await p.locator('[data-hits] button').count()===1,'team example accessible');await p.locator('#scope').selectOption('public');assert(!(await p.locator('[data-documents]').innerText()).includes('Internal employee'),'no stale team document shown');
   await p.locator('.local-import summary').click();await p.locator('#local-document').setInputFiles({name:'local.txt',mimeType:'text/plain',buffer:Buffer.from('The support phone number is 555-0100.')});await p.locator('[data-query="What is the support phone number?"]').click();await p.waitForFunction(()=>document.querySelector('[data-answer]').textContent.includes('555-0100'));
   const waiting=p.waitForEvent('download');await p.locator('[data-export-rag]').click();const exported=await waiting;assert(exported.suggestedFilename()==='enyu-retrieval.json','download truthful result');
   await p.locator('[data-reset-docs]').click();assert(!(await p.locator('[data-documents]').innerText()).includes('local.txt'),'local data reset');
   await p.locator('#query').fill('');await p.locator('#query-form button[type=submit]').click();assert(await p.locator('[data-rag-status]').getAttribute('data-error')==='true','empty query validation');
   await p.locator('[data-query="What is the refund policy?"]').click();
   for(const tab of ['rag','relay','video']){
    await p.locator(`[data-workspace="${tab}"]`).click();if(tab==='relay')await p.waitForFunction(()=>document.querySelector('[data-relay-raw]').textContent.includes('declared_model_mismatch'));if(tab==='video')await p.waitForFunction(()=>document.querySelectorAll('.cue-button').length===9);
    const axe=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert(axe.violations.length===0,`${tab} axe: `+JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),tab+' no horizontal overflow');
    await p.evaluate(()=>{document.activeElement?.blur();scrollTo({top:0,behavior:'instant'});});if(width!==320)await p.screenshot({path:resolve(out,`${name}-${width}-${tab}.png`),fullPage:true});
   }
   await p.locator('[data-workspace=relay]').click();assert((await p.locator('[data-relay-summary]').innerText()).includes('mock-other'),'report source labels parsed');
   const before=await p.locator('[data-relay-raw]').textContent();await p.locator('#relay-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{oops')});await p.waitForFunction(()=>document.querySelector('[data-relay-status]').dataset.error==='true');assert(await p.locator('[data-relay-raw]').textContent()===before,'invalid import preserves current event');
   const event=JSON.parse(before);event.evidence.requested_model='<img src=x onerror=alert(1)>';await p.locator('#relay-file').setInputFiles({name:'event.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(event))});await p.waitForFunction(()=>document.querySelector('[data-report-source]').textContent.includes('event.json'));assert(await p.locator('[data-relay-summary] img').count()===0,'import is text, not HTML');await p.locator('[data-relay-reset]').click();await p.waitForFunction(()=>document.querySelector('[data-report-source]').textContent.includes('2026-10-23'));
   await p.locator('[data-workspace=video]').click();await p.locator('.film-timeline button').nth(3).click();await p.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-18)<1);await p.locator('#video-rate').selectOption('1.25');assert(await p.locator('video').evaluate(v=>v.playbackRate)===1.25,'actual playback speed');await p.locator('video').evaluate(v=>{v.muted=true;return v.play()});await p.waitForFunction(()=>document.querySelector('video').currentTime>18.3);await p.locator('[data-workspace=rag]').click();assert(await p.locator('video').evaluate(v=>v.paused),'tab exit pauses video');
   await p.locator('[data-workspace=rag]').focus();await p.keyboard.press('ArrowRight');assert(await p.locator('[data-workspace=relay]').evaluate(e=>e===document.activeElement&&e.getAttribute('aria-selected')==='true'),'keyboard tab navigation');await p.keyboard.press('End');assert(await p.locator('[data-workspace=video]').getAttribute('aria-selected')==='true','End selects video');
   await p.locator('#caption-search').fill('声音');assert(await p.locator('.cue-button').count()===2,'actual transcript search');await p.locator('#caption-search').fill('zzzz');assert((await p.locator('[data-transcript]').innerText()).includes('没有匹配'),'caption empty state');
   await p.goto(site.base+'/workbench.html?t=30#video');await p.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-30)<1);
   await p.goto(site.base+'/projects.html');await p.locator('#project-search').fill('RealyAudit');await p.waitForFunction(()=>[...document.querySelectorAll('[data-category]')].filter(e=>!e.hidden).length===1);assert((await p.locator('[data-category]:visible').innerText()).includes('RelayAudit'),'Fuse typo lookup');await p.locator('[data-filter=methods]').click();assert(await p.locator('[data-category]:visible').count()===0,'category and query combined');await p.locator('.archive-search button[type=reset]').click();assert(await p.locator('[data-category]:visible').count()===16,'reset all16');
   await p.locator('#project-search').fill('知识');assert(await p.locator('[data-category]:visible').count()>0,'Chinese search');await p.reload();assert(await p.locator('#project-search').inputValue()==='知识','search URL restores');
   assert(errors.length===0,errors.join('\n'));entry.browser=browser.version();entry.errors=errors;
  }finally{await c.close();}
 });
 await run(`${name} no JS and load failure`,async()=>{
  const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await c.newPage();await p.goto(site.base+'/workbench.html');assert(await p.locator('.wb-panel:visible').count()===3,'no JS all sections readable');assert(await p.locator('video').isVisible(),'native video remains');await c.close();
  const d=await browser.newContext({reducedMotion:'reduce'}),q=await d.newPage();await d.route('**/public/workbench/documents.json',r=>r.fulfill({status:503,body:'unavailable'}));await q.goto(site.base+'/workbench.html');await q.waitForFunction(()=>document.querySelector('[data-rag-status]').dataset.error==='true');assert(await q.locator('a[href="https://zhouey314-cloud.github.io/enterprise-rag-starter/"]').isVisible(),'failure keeps original route');await d.close();
 });
 }finally{await browser.close();}
}}finally{await site.close();report.status=report.failures.length?'FAIL':'PASS';await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(report.status,report.cases.length,'workbench groups');if(report.failures.length)process.exitCode=1;}
