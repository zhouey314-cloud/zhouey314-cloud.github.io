// Design-independent regressions: content, navigation, media and graceful enhancement.
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {serve,source,mkdir,writeFile,resolve,root,images,frames,assert} from './support.mjs';
const site=await serve(),out=resolve(process.env.EXPERIENCE_REPORT_DIR||'test-results/experience');await mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),base_url:site.base,source:source(),scope:'Actual Chromium/WebKit. Simulated viewports and touch, not physical iPhone/Safari acceptance. Zoom is an equivalent 720×450 CSS reflow at DPR2, not browser-toolbar zoom. No field INP claim.',layouts:[],interactions:[],failures:[]};
async function save(){await writeFile(resolve(out,'experience-report.json'),JSON.stringify(report,null,2))}
async function run(name,fn){console.log(name);try{await fn()}catch(e){report.failures.push({name,error:e.stack});await save()}}
async function portraitPixels(page,selector,inspector){
 const png=await page.locator(selector).screenshot();
 // Read the captured pixels, rather than treating img.complete as a painted image.
 // Only the screenshot is decoded here; the page's image/loading state is untouched.
 const deviation=await inspector.evaluate(async encoded=>{
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,64,64);bitmap.close();
  const pixels=ctx.getImageData(0,0,64,64).data;let sum=0,square=0;
  for(let i=0;i<pixels.length;i+=4){const y=(pixels[i]+pixels[i+1]+pixels[i+2])/3;sum+=y;square+=y*y}
  const n=pixels.length/4;return Math.sqrt(Math.max(0,square/n-(sum/n)**2));
 },png.toString('base64'));
 assert(deviation>20,'actual portrait screenshot contains the photo, not a blank frame');return deviation;
}
try{
 for(const [engineName,engine] of Object.entries({chromium,webkit})){
  const browser=await engine.launch();
  try{
   for(const [label,viewport] of Object.entries({desktop:{width:1600,height:880},tablet:{width:768,height:1024},mobile:{width:390,height:844},narrow:{width:320,height:844},zoom200:{width:720,height:450}})){
    await run(`${engineName}/${label}: layout, evidence and interactions`,async()=>{
     const context=await browser.newContext({viewport,deviceScaleFactor:label==='zoom200'?2:1,reducedMotion:'reduce',hasTouch:['mobile','narrow'].includes(label),locale:'zh-CN'});
     const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[],resources=[];
     page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)resources.push({url:r.url(),status:r.status()})});
     try{
      await page.goto(site.base,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
      if(['desktop','mobile','tablet'].includes(label))await page.screenshot({path:resolve(out,`${engineName}-${label}-home.png`)});
      const geometry=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,projects:[...document.querySelectorAll('#work article[data-project]')].map(el=>({id:el.dataset.project,top:Math.round(el.getBoundingClientRect().top+scrollY),visible:!!el.getClientRects().length})),coreVisible:[...document.querySelectorAll('h1,#contact a[href^="mailto:"]')].every(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'),forestState:document.querySelector('[data-forest]').dataset.sceneState,frames:document.querySelectorAll('[data-forest] iframe').length}));
      assert(geometry.documentWidth<=geometry.width+1,'horizontal overflow');assert(geometry.coreVisible&&geometry.projects.length===3&&geometry.projects.every(p=>p.visible),'complete identity, projects and contacts');assert(geometry.frames===0,'reduced motion must not allocate WebGL');
      await images(page);await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await frames(page);
      if(['desktop','mobile'].includes(label))await page.screenshot({path:resolve(out,`${engineName}-${label}-full.png`),fullPage:true});
      report.layouts.push({engine:engineName,version:browser.version(),label,viewport,...geometry,errors,resources});
      const preview=page.locator('#work [data-preview]').first();await preview.scrollIntoViewIfNeeded();await preview.focus();await page.keyboard.press('Enter');const dialog=page.locator('[data-viewer]');await dialog.waitFor({state:'visible'});
      assert(await dialog.evaluate(el=>el.open&&el.contains(document.activeElement)&&!!document.getElementById(el.getAttribute('aria-labelledby')).textContent.trim()),'dialog opens with title and focus');
      await page.keyboard.press('Shift+Tab');assert(await dialog.evaluate(el=>el.contains(document.activeElement)),'dialog contains keyboard focus');
      assert(await dialog.locator('[data-viewer-original]').getAttribute('href')!==await dialog.locator('[data-viewer-case]').getAttribute('href'),'original image and case are distinct');
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert(await preview.evaluate(el=>el===document.activeElement),'Esc restores opener focus');
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(Error('test denial'))}}));await page.locator('[data-copy-email]').click();await page.waitForFunction(()=>document.querySelector('[data-copy-feedback]').textContent.trim());assert((await page.locator('[data-copy-feedback]').textContent()).trim(),'clipboard failure feedback');assert(await page.locator('#contact a[href^="mailto:"]').first().getAttribute('href')==='mailto:zhouey314@gmail.com','mailto survives clipboard failure');
      await page.goto(site.base,{waitUntil:'load'});await page.locator('.hero-thought a[href="#work"]').click();await frames(page);assert(new URL(page.url()).hash==='#work','native work anchor');const anchorTop=await page.locator('#work').evaluate(e=>e.getBoundingClientRect().top);assert(anchorTop>=70,'sticky navigation does not cover work heading');
      if(viewport.width<=760){const menu=page.locator('.menu-toggle');await menu.focus();await page.keyboard.press('Enter');assert(await menu.getAttribute('aria-expanded')==='true','keyboard opens menu');await page.keyboard.press('Escape');assert(await menu.getAttribute('aria-expanded')==='false'&&await menu.evaluate(e=>e===document.activeElement),'Esc closes menu and returns focus');if(['mobile','narrow'].includes(label))await menu.tap();else await menu.click()}
      await page.locator('.site-nav a[href="#contact"]').click();await frames(page);assert(new URL(page.url()).hash==='#contact','contact navigation');assert(await page.locator('.menu-toggle').getAttribute('aria-expanded')==='false','mobile link closes menu');await page.goBack();assert(new URL(page.url()).hash==='#work','browser Back preserves work fragment');await page.goForward();assert(new URL(page.url()).hash==='#contact','browser Forward preserves contact fragment');
      report.interactions.push({engine:engineName,label,dialog:true,clipboardFailure:true,hashHistory:true,keyboardMenu:viewport.width<=760,touchMenu:['mobile','narrow'].includes(label),workAnchorTop:anchorTop});
      assert(errors.length===0&&resources.length===0,'no unexpected browser or resource errors');
     }finally{await context.close()}
    });
   }
   for(const [label,settings] of Object.entries({nojs:{javaScriptEnabled:false},scriptFailure:{}}))await run(`${engineName}/${label}: static garden and complete content`,async()=>{
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference',...settings});if(label==='scriptFailure')await context.route('**/forest.js',r=>r.abort('failed'));const page=await context.newPage();try{await page.goto(site.base,{waitUntil:'networkidle'});assert(await page.locator('h1').isVisible()&&await page.locator('#work article[data-project]').count()===3&&await page.locator('#contact a[href^="mailto:"]').count()>0,'core content remains');assert(await page.locator('[data-forest] iframe').count()===0,'no partial renderer after disabled/failed enhancement');const poster=page.locator('.forest-poster img');assert(await poster.evaluate(i=>i.complete&&i.naturalWidth>0),'actual forest render fallback loads');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'fallback no overflow');await page.screenshot({path:resolve(out,`${engineName}-${label}-home.png`)});report.layouts.push({engine:engineName,label,staticFallback:true,completeContent:true})}finally{await context.close()}
   });
   await run(`${engineName}: legacy fragments and downloadable resume`,async()=>{
    const context=await browser.newContext({reducedMotion:'reduce',acceptDownloads:true});const page=await context.newPage();try{
     for(const path of ['/projects.html#geo-title','/projects.html#building-now','/#story-material','/#story-citation','/#story-refusal']){await page.goto(site.base+path,{waitUntil:'load'});const id=new URL(page.url()).hash.slice(1);assert(await page.locator('[id="'+id+'"]').count()===1,'preserved deep link '+path)}
     await page.goto(site.base+'/',{waitUntil:'load'});const [download]=await Promise.all([page.waitForEvent('download'),page.locator('a[download][href$=".pdf"]').click()]);await download.saveAs(resolve(out,engineName+'-resume.pdf'));const bytes=await readFile(resolve(out,engineName+'-resume.pdf')),original=await readFile(resolve(root,'public/ethan-zhou-resume.pdf'));assert(bytes.subarray(0,5).toString()==='%PDF-'&&bytes.subarray(-1024).includes(Buffer.from('%%EOF'))&&bytes.equals(original),'downloaded PDF is valid and byte-identical');report.interactions.push({engine:engineName,legacyFragments:true,pdf:{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}});
    }finally{await context.close()}
   });
   await run(`${engineName}: cold image anchors and primary action`,async()=>{
    const checks=[];
    const inspector=await browser.newPage();
    try{
    for(const [label,width,javaScriptEnabled] of [['desktop',1600,true],['mobile',390,true],['nojs',390,false]]){
     for(const fragment of ['about','contact']){
      const context=await browser.newContext({viewport:{width,height:1000},javaScriptEnabled,reducedMotion:'reduce'}),page=await context.newPage();
      page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);
      try{
       await page.goto(site.base+'/#'+fragment,{waitUntil:'load'});
       let portraitPaint=null;
       // Do not call decode(), mutate loading, or scroll through other sections:
       // this protects the direct-link visit that the old full-page checks missed.
       if(fragment==='about'){
        await page.waitForFunction(()=>{const i=document.querySelector('.about-portrait img');return i.complete&&i.naturalWidth>0},{},{timeout:10000});
        assert(await page.locator('.about-portrait img').isVisible(),'direct about visit paints the portrait');
        portraitPaint={about:await portraitPixels(page,'.about-portrait img',inspector)};
       }else{
        const qr=page.locator('.garden-qr svg');assert(await qr.isVisible(),'contact code is present without an external image request');
        const box=await qr.boundingBox();assert(box.width>=140&&Math.abs(box.width-box.height)<1,'contact code has a readable square scan area');
        assert(await page.locator('.garden-qr>a').getAttribute('href')==='https://u.wechat.com/MJNJhDRZFiAFKD09uKIRGvM?s=3','contact code still links to the approved WeChat account');
        await qr.scrollIntoViewIfNeeded();
       }
       await page.screenshot({path:resolve(out,`${engineName}-${label}-direct-${fragment}.png`)});
       if(fragment==='about'){
        await page.goto(site.base,{waitUntil:'load'});
        await page.waitForFunction(()=>{const i=document.querySelector('.hero-portrait img');return i.complete&&i.naturalWidth>0},{},{timeout:10000});
        if(javaScriptEnabled)await frames(page);
        await page.screenshot({path:resolve(out,`${engineName}-${label}-direct-home.png`)});
        portraitPaint.home=await portraitPixels(page,'.hero-portrait img',inspector);
        const action=page.locator('.portrait-hero-actions .metal-button');
        const size=await action.evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,font:parseFloat(getComputedStyle(el).fontSize)}));
        assert(size.width>=220&&size.height>=64&&size.font>=17,'primary capability action remains prominent');
        await action.focus();await page.keyboard.press('Enter');await page.waitForURL('**/#work',{timeout:10000});
       }
       checks.push({label,fragment,javaScriptEnabled,portraitPaint});
      }finally{await context.close()}
     }
    }
    report.interactions.push({engine:engineName,coldImageAnchors:checks,prominentPrimaryAction:true});
    }finally{await inspector.close()}
   });
   await run(`${engineName}: project window and continuous case reading`,async()=>{
    const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();
    try{
     await page.goto(site.base,{waitUntil:'load'});
     // macOS WebKit intentionally does not focus buttons on pointer click.
     // Check keyboard focus through keyboard activation; test pointer selection separately.
     const relay=page.locator('[data-hero-select="relay"]');await relay.focus();await page.keyboard.press('Enter');
     assert(await relay.getAttribute('aria-pressed')==='true'&&await page.locator('[data-hero-select][aria-pressed="true"]').count()===1,'one selected project');
     assert(await page.locator('[data-hero-stage] a').first().getAttribute('href')==='/cases/relay-audit.html','selected preview leads to real Relay case');
     assert(await relay.evaluate(e=>e===document.activeElement),'switch retains button focus');
     await page.keyboard.press('End');assert(await page.locator('[data-hero-select="video"]').getAttribute('aria-pressed')==='true','End selects last project');
     await page.keyboard.press('Home');assert(await page.locator('[data-hero-select="rag"]').getAttribute('aria-pressed')==='true','Home selects first project');
     await page.keyboard.press('ArrowRight');assert(await relay.getAttribute('aria-pressed')==='true','arrow keys move and select');
     assert(await page.locator('[data-hero-stage]').evaluate(e=>e.getAnimations().length===0),'reduced motion has no project-switch animation');
     await page.locator('[data-hero-select="video"]').click();assert(await page.locator('[data-hero-select="video"]').getAttribute('aria-pressed')==='true','pointer selects project');await page.locator('[data-hero-stage] .hero-project-image').click();await page.waitForURL('**/cases/video.html');
     const limits=page.locator('.case-toc a[href="#limits"]');await limits.click();
     await page.waitForFunction(()=>document.querySelector('.case-toc a[aria-current]')?.hash==='#limits');
     const toc=await page.locator('.case-toc').boundingBox();assert(toc.y>=80&&toc.y<200,'desktop reading guide remains visible while reading');
     assert((await page.locator('[data-case-percent]').textContent())!=='0%','reading progress follows scroll');
     await page.locator('.next-case').click();await page.waitForURL('**/cases/thought-to-x.html');assert(await page.locator('h1').isVisible(),'next case is a real distinct page');
     report.interactions.push({engine:engineName,projectWindow:{mouse:true,keyboard:true,realCaseLink:true,reducedMotion:true},caseReading:{activeChapter:true,stickyGuide:true,progress:true,nextCase:true}});
    }finally{await context.close()}
   });
  }finally{await browser.close()}
 }
}finally{await site.close();report.status=report.failures.length?'FAIL':'PASS';await save()}
console.log(JSON.stringify({status:report.status,layouts:report.layouts.length,interactions:report.interactions.length,failures:report.failures}));process.exitCode=report.failures.length?1:0;
