// Integration checks supplement the business regressions in workbench,
// collaboration and experience. Run against the real static output, not a SPA.
import {chromium, webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {serve, source, root, resolve, mkdir, writeFile, assert} from './support.mjs';
import {choose, choiceValue} from './controls.mjs';

assert(root.endsWith('/dist'), 'Run SITE_DIR=dist npm run test:astryx after npm run build');
const site = await serve();
const out = resolve(process.env.ASTRYX_REPORT_DIR || 'test-results/astryx');
await mkdir(out, {recursive:true});
const report = {at:new Date().toISOString(), source:source(), base:site.base,
  scope:'Local production files; Chromium/WebKit, emulated touch/viewports. Not physical iPhone or field performance. No external form/model requests.',
  cases:[], failures:[]};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function run(title, fn) {
  const entry = {title};
  try {await fn(entry);entry.status='PASS';}
  catch(error) {entry.status='FAIL';entry.error=error.stack;report.failures.push({title,error:error.message});}
  report.cases.push(entry);
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(entry.status,title,entry.error||'');
}
function observe(page) {
  const issues={errors:[],http:[],requests:[]};
  page.on('pageerror',e=>issues.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')issues.errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)issues.http.push({url:r.url(),status:r.status()});});
  page.on('request',r=>issues.requests.push({url:r.url(),method:r.method(),type:r.resourceType(),range:r.headers().range||null,document:r.frame().url()}));
  return issues;
}
async function geometry(page) {
  const value=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  assert(value.document<=value.viewport+1, 'No horizontal page overflow');
  return value;
}
async function clean(issues) {
  assert(!issues.errors.length&&!issues.http.length,JSON.stringify(issues));
  assert(issues.requests.every(r=>new URL(r.url).origin===site.base), 'No third party runtime/CDN or imported-data requests');
}

try {
  await run('Static allowlist, existing assets, source evidence and real SSR',async entry=>{
    const fixture=JSON.parse(await readFile(fileURLToPath(new URL('./astryx-compatibility.json',import.meta.url))));
    const manifest=JSON.parse(await readFile(resolve(root,'asset-manifest.json')));
    assert(manifest.base==='/'&&manifest.static===true,'Root-domain static hosting contract');
    const walk=async dir=>(await Promise.all((await readdir(resolve(root,dir),{withFileTypes:true})).map(async e=>e.isDirectory()?walk(dir?dir+'/'+e.name:e.name):[dir?dir+'/'+e.name:e.name]))).flat();
    const actual=(await walk('')).sort(),expected=[...manifest.files.map(f=>f.path),'asset-manifest.json'].sort();
    assert(JSON.stringify(actual)===JSON.stringify(expected),'No unlisted files in the publication directory');
    for(const file of manifest.files) {
      assert(!/(^|\/)(?:\.git|\.env(?:\..*)?|node_modules|\.cache|src|content|tests|test-results|astryx-20261109)(\/|$)|\.(?:log|map)$/.test(file.path),'Unsafe build file: '+file.path);
      const bytes=await readFile(resolve(root,file.path));
      assert(bytes.length===file.bytes&&sha(bytes)===file.sha256,'Artifact manifest integrity: '+file.path);
    }
    for(const asset of fixture.unchanged_assets)assert(sha(await readFile(resolve(root,asset.path)))===asset.sha256,'Original evidence changed: '+asset.path);
    for(const url of [...fixture.asset_urls,...fixture.routes]) {
      const response=await fetch(site.base+url);assert(response.status===200,'Legacy static URL: '+url);
    }
    for(const [path,text] of [['/','恩宇'],['/projects.html','RelayAudit'],['/resume.html','需求'],['/collaborate.html','知识检索'],['/cases/rag.html','来源']]) {
      const html=await(await fetch(site.base+path)).text();
      assert(html.includes(text)&&/<h1\b/.test(html),'Initial HTML readable: '+path);
      assert(!/中原工学院|广播电视编导专业/.test(html),'Public identity preference: '+path);
    }
    const home=await(await fetch(site.base+'/')).text();
    assert(/class="astryx-button\b/.test(home)&&home.includes('data-astryx-theme="enyu-garden"')&&home.includes('href="#selected-projects"'),'Real server-rendered Astryx primary action');
    entry.files=actual.length;entry.routes=fixture.routes.length;entry.preservedAssets=fixture.unchanged_assets.length;
    entry.core=manifest.ui.core;entry.manifest='dist/asset-manifest.json';
  });

  for(const [name,engine] of Object.entries({chromium,webkit})) {
    const browser=await engine.launch();
    try {
      for(const width of [375,390,430,768,1024,1440])await run(`${name} ${width}px: responsive controls and accessible results`,async entry=>{
        const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<768,reducedMotion:'reduce',locale:'zh-CN'});
        const page=await context.newPage(),issues=observe(page);page.setDefaultTimeout(15000);
        try {
          const layouts=[];
          await page.goto(site.base+'/projects.html?category=tools&q=RelayAudit#building-now');
          await page.waitForFunction(()=>document.querySelector('#project-search').value==='RelayAudit');
          assert(await page.locator('[data-category]:visible').count()===1,'URL category + query restored');
          layouts.push(await geometry(page));
          await page.locator('.archive-search button[type=reset]').click();
          await page.waitForFunction(()=>document.querySelectorAll('[data-category]:not([hidden])').length===16);
          assert(new URL(page.url()).hash==='#building-now','Filtering retains the existing fragment');
          await page.goto(site.base+'/collaborate.html?topic=media#brief');
          await page.locator('[data-inquiry-form]').waitFor({state:'visible'});
          assert(await choiceValue(page,'#inquiry-topic','topic')==='media','Real Selector query selection');
          const choice=page.locator('#inquiry-topic');
          await choice.focus();await page.keyboard.press('Enter');
          await page.waitForFunction(()=>document.querySelector('#inquiry-topic').getAttribute('aria-expanded')==='true');
          assert(await page.locator('[role=option]').count()===5,'Available service directions');
          await page.keyboard.press('Escape');
          await page.waitForFunction(()=>document.querySelector('#inquiry-topic').getAttribute('aria-expanded')==='false');
          assert(await choice.evaluate(e=>e===document.activeElement),'Selector Escape returns focus');
          await choose(page,'#inquiry-topic','api');
          assert(await choiceValue(page,'#inquiry-topic','topic')==='api','Accessible real popup selection');
          await page.locator('#inquiry-problem').fill('需要排查接口超时，保留可复查的请求记录。');
          await page.locator('button[type=submit]').click();
          await page.waitForFunction(()=>document.activeElement?.id==='inquiry-output-title');
          assert((await page.locator('#inquiry-draft').inputValue()).includes('接口'),'Actual output uses the supplied problem');
          layouts.push(await geometry(page));
          const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
          assert(!axe.violations.length,JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));
          const targets=await page.locator('.garden-button:visible').evaluateAll(list=>list.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
          assert(targets.every(t=>t.w>=44&&t.h>=44),'Visible component buttons have 44px touch targets');
          if([390,1440].includes(width))await page.screenshot({path:resolve(out,`${name}-${width}-brief.png`)});
          await clean(issues);entry.layouts=layouts;entry.browser=browser.version();entry.axeViolations=0;
        } finally {await context.close();}
      });

      await run(`${name}: on-demand modules, media, and input-to-paint sample`,async entry=>{
        let context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
        let page=await context.newPage(),issues=observe(page);
        try {
          await page.goto(site.base+'/');await page.waitForLoadState('networkidle');
          assert(!issues.requests.some(r=>/\/chunks\//.test(r.url)),'Home reading path does not download React/Astryx interaction chunks');
          const readingStart=issues.requests.length;
          await page.goto(site.base+'/cases/rag.html');await page.waitForLoadState('networkidle');
          const readingRequests=issues.requests.slice(readingStart);
          assert(!readingRequests.some(r=>/\/chunks\/|\/public\/ui\/astryx-.*\.css/.test(r.url)),'Case reading defers React and component CSS until image-preview intent');
          assert(!readingRequests.some(r=>['fetch','xhr'].includes(r.type)),'No runtime server for case reading');
          entry.readingMediaRequests=issues.requests.filter(r=>/\.mp4(?:\?|$)/.test(r.url));
          await clean(issues);
          // A cold workspace visit must not inherit another document's native
          // media requests or cache. Keep its no-preload gate independent.
          await context.close();
          context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
          page=await context.newPage();issues=observe(page);
          await page.goto(site.base+'/workbench.html#rag');
          await page.waitForFunction(()=>document.querySelector('[data-answer]').dataset.state==='EXTRACTIVE');
          entry.workspaceMediaRequests=issues.requests.filter(r=>/\.mp4(?:\?|$)/.test(r.url));
          assert(entry.workspaceMediaRequests.length===0,'RAG does not preload the movie: '+JSON.stringify(entry.workspaceMediaRequests));
          await page.locator('[data-workspace=video]').click();
          await page.waitForFunction(()=>document.querySelectorAll('.cue-button').length===9);
          assert(!issues.requests.some(r=>/\.mp4(?:\?|$)/.test(r.url)),'Opening video workspace does not fetch movie bytes');
          await page.locator('.film-timeline button').nth(4).click();
          await page.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-24)<.5);
          assert(issues.requests.some(r=>/\.mp4(?:\?|$)/.test(r.url)),'Explicit seek loads real media');
          await page.locator('[data-workspace=rag]').click();
          const timings=[];
          for(let i=0;i<5;i++) {
            const elapsed=await page.locator('[data-query="What is the refund policy?"]').evaluate(button=>new Promise(resolve=>{const start=performance.now();button.click();requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(performance.now()-start)));}));
            timings.push(Math.round(elapsed*10)/10);
          }
          await clean(issues);entry.browser=browser.version();entry.clickToSecondAnimationFrameMs=timings;
          entry.measurement='Five local synthetic button clicks + two rAF; no CPU/network throttle. Lab sample, not INP.';
        } finally {await context.close();}
      });

      await run(`${name}: missing interaction module preserves content and original image link`,async entry=>{
        const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
        const page=await context.newPage();
        await context.route('**/public/ui/bootstrap-*.js',route=>route.abort('failed'));
        try {
          await page.goto(site.base+'/projects.html');
          assert(await page.locator('[data-category]:visible').count()===16,'Static project archive survives module failure');
          const original=page.locator('[data-preview]').first();
          assert((await original.getAttribute('href'))?.startsWith('/public/'),'Screenshot has a real original-image URL');
          await page.goto(site.base+'/collaborate.html#brief');
          assert(await page.locator('[data-inquiry-fallback]').isVisible(),'Direct-contact fallback survives module failure');
          assert(await page.locator('.collaborate-qr svg').isVisible(),'Approved QR remains visible');
          assert(await page.locator('[data-inquiry-form]').isHidden(),'No misleading inert form');
          await page.goto(site.base+'/workbench.html#video');
          assert(await page.locator('video[controls]').isVisible(),'Native media remains operable');
          assert(await page.locator('a[download][href$=".vtt"]').isVisible(),'Original captions remain downloadable');
          await page.locator('video').scrollIntoViewIfNeeded();
          await page.locator('video').evaluate(v=>{v.muted=true;});
          await page.locator('[data-start-video]').focus();await page.keyboard.press('Enter');
          await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
          assert(await page.locator('video').evaluate(v=>v===document.activeElement),'Playback intent transfers keyboard focus to the native player');
          await page.locator('[data-workspace=rag]').click();
          assert(await page.locator('video').evaluate(v=>v.paused),'Native tab controller pauses video even without React');
          entry.expectedFailure='Controlled module abort; static fallback checked separately from normal zero-error checks';
        } finally {await context.close();}
      });
    } finally {await browser.close();}
  }
} finally {
  await site.close();report.status=report.failures.length?'FAIL':'PASS';
  await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,cases:report.cases.length,failures:report.failures}));
  if(report.failures.length)process.exitCode=1;
}
